// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import "@peeramid-labs/eds/src/interfaces/IDistribution.sol";
import "@peeramid-labs/eds/src/libraries/LibSemver.sol";
import {DistributableGovernanceERC20, MintSettings, IDAO} from "../tokens/DistributableGovernanceERC20.sol";
import {IERC7746} from "@peeramid-labs/eds/src/interfaces/IERC7746.sol";
import {SimpleAccessManager} from "@peeramid-labs/eds/src/managers/SimpleAccessManager.sol";
import {IDistributor} from "@peeramid-labs/eds/src/interfaces/IDistributor.sol";
import {RankToken} from "../tokens/RankToken.sol";
import "../initializers/RankifyInstanceInit.sol";
import {ERC165Checker} from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@peeramid-labs/eds/src/abstracts/CodeIndexer.sol";

import {TokenSettings, Tag, VotingMode, VotingSettings, Version, IPluginRepo, IDAOFactory} from "../vendor/aragon/interfaces.sol";

/**
 * @title MAODistribution
 * @dev This contract implements the IDistribution and CodeIndexer interfaces. It uses the Clones library for address cloning.
 *
 * @notice The contract is responsible for creating and managing DAOs and ACID distributions.
 * @author Peeramid Labs, 2024
 */
contract MAODistribution is IDistribution, CodeIndexer {
    struct UserACIDSettings {
        uint256 timePerTurn;
        uint256 maxPlayersSize;
        uint256 minPlayersSize;
        uint256 timeToJoin;
        uint256 maxTurns;
        uint256 voteCredits;
        uint256 gamePrice;
        address paymentToken;
        uint256 joinGamePrice;
        string metadata;
        string rankTokenURI;
        string RankTokenContractURI;
    }

    struct OSxDistributionArguments {
        string daoURI;
        string subdomain;
        bytes metadata;
        string tokenName;
        string tokenSymbol;
    }

    struct DistributorArguments {
        OSxDistributionArguments DAOSEttings;
        UserACIDSettings ACIDSettings;
    }

    using Clones for address;
    IPluginRepo immutable _tokenVotingPluginRepo;
    IDAOFactory immutable _daoFactory;
    address immutable _trustedForwarder;
    bytes32 immutable _distributionName;
    uint256 immutable _distributionVersion;
    address immutable _rankTokenBase;
    IDistribution immutable _ACIDDistributionBase;
    address immutable _governanceERC20Base;
    address immutable _accessManagerBase;

    function stringToSelector(string memory signature) private pure returns (bytes4) {
        return bytes4(keccak256(bytes(signature)));
    }

    /**
     * @notice Initializes the contract with the provided parameters and performs necessary checks.
     * @dev - retrieves contract addresses from a contract index using the provided identifiers.
     * - checks if the access manager supports the ERC7746 interface.
     * - EIP712 compatible name/version can be extracted with use of LibSemver
     *
     *
     * WARNING: _trustedForwarder functionality hasn't been yet reviewed nor implemented for ACID distribution and if set will affect only OSx DAO setup.
     *
     * @param tokenVotingPluginRepo Address of the token voting plugin repository.
     * @param daoFactory Address of the Aragons DAO factory.
     * @param trustedForwarder Address of the trusted forwarder.
     * @param rankTokenCodeId Identifier for the rank token code.
     * @param ACIDDIistributionId Identifier for the ACID distribution.
     * @param accessManagerId Identifier for the access manager.
     * @param governanceERC20BaseId Identifier for the governance ERC20 base.
     * @param distributionName Name of the distribution.
     * @param distributionVersion Version of the distribution as a `LibSemver.Version` struct.
     */
    constructor(
        address tokenVotingPluginRepo,
        address daoFactory,
        address trustedForwarder,
        bytes32 rankTokenCodeId,
        bytes32 ACIDDIistributionId,
        bytes32 accessManagerId,
        bytes32 governanceERC20BaseId,
        bytes32 distributionName,
        LibSemver.Version memory distributionVersion
    ) {
        _governanceERC20Base = getContractsIndex().get(governanceERC20BaseId);
        _tokenVotingPluginRepo = IPluginRepo(tokenVotingPluginRepo);
        _daoFactory = IDAOFactory(daoFactory);
        _trustedForwarder = trustedForwarder;
        _distributionName = distributionName;
        _distributionVersion = LibSemver.toUint256(distributionVersion);
        _rankTokenBase = getContractsIndex().get(rankTokenCodeId);
        if (_rankTokenBase == address(0)) {
            revert("Rank token base not found");
        }
        _ACIDDistributionBase = IDistribution(getContractsIndex().get(ACIDDIistributionId));
        if (address(_ACIDDistributionBase) == address(0)) {
            revert("ACID distribution base not found");
        }

        _accessManagerBase = getContractsIndex().get(accessManagerId);
        if (_accessManagerBase == address(0)) {
            revert("Access manager base not found");
        }
        require(
            ERC165Checker.supportsInterface(_accessManagerBase, type(IERC7746).interfaceId),
            "Access manager does not support IERC7746"
        );
    }

    function createOSxDAO(
        OSxDistributionArguments memory args
    ) internal returns (address[] memory instances, bytes32, uint256) {
        MintSettings memory mintSettings = MintSettings(new address[](1), new uint256[](1));
        mintSettings.receivers[0] = address(this);
        mintSettings.amounts[0] = 0;
        address token = _governanceERC20Base.clone();
        TokenSettings memory tokenSettings = TokenSettings(token, args.tokenName, args.tokenSymbol);
        VotingSettings memory votingSettings = VotingSettings({
            votingMode: VotingMode.Standard,
            supportThreshold: 666666,
            minParticipation: 10 ** 4,
            minDuration: 86400,
            minProposerVotingPower: 1
        });

        IDAOFactory.DAOSettings memory daoSettings = IDAOFactory.DAOSettings(
            _trustedForwarder,
            args.daoURI,
            args.subdomain,
            args.metadata
        );

        IDAOFactory.PluginSettings memory tokenVotingPluginSetup = IDAOFactory.PluginSettings(
            IDAOFactory.PluginSetupRef(
                _tokenVotingPluginRepo.getLatestVersion(_tokenVotingPluginRepo.latestRelease()).tag,
                _tokenVotingPluginRepo
            ),
            abi.encode(votingSettings, tokenSettings, mintSettings)
        );

        IDAOFactory.PluginSettings[] memory pluginSettings = new IDAOFactory.PluginSettings[](1);
        pluginSettings[0] = tokenVotingPluginSetup;
        address createdDao = _daoFactory.createDao(daoSettings, pluginSettings);

        SimpleAccessManager.SimpleAccessManagerInitializer[]
            memory govTokenAccessSettings = new SimpleAccessManager.SimpleAccessManagerInitializer[](1);
        govTokenAccessSettings[0].selector = DistributableGovernanceERC20.mint.selector;
        govTokenAccessSettings[0].dissallowedAddresses = new address[](1);
        govTokenAccessSettings[0].dissallowedAddresses[0] = createdDao;
        govTokenAccessSettings[0].distributionComponentsOnly = true;

        SimpleAccessManager govTokenAccessManager = SimpleAccessManager(_accessManagerBase.clone());

        govTokenAccessManager.initialize(govTokenAccessSettings, tokenSettings.addr, IDistributor(msg.sender)); // msg.sender must be IDistributor or it will revert
        DistributableGovernanceERC20(tokenSettings.addr).initialize(
            IDAO(createdDao),
            tokenSettings.name,
            tokenSettings.symbol,
            mintSettings,
            address(govTokenAccessManager)
        );

        address[] memory returnValue = new address[](3);
        returnValue[0] = createdDao;
        returnValue[1] = token;
        returnValue[2] = address(govTokenAccessManager);

        return (returnValue, "OSxDistribution", 1);
    }

    function createACID(
        UserACIDSettings memory args,
        address dao
    ) internal returns (address[] memory instances, bytes32, uint256) {
        address rankToken = _rankTokenBase.clone();

        bytes4[] memory rankTokenSelectors = new bytes4[](6);
        rankTokenSelectors[0] = RankToken.mint.selector;
        rankTokenSelectors[1] = RankToken.lock.selector;
        rankTokenSelectors[2] = RankToken.unlock.selector;
        rankTokenSelectors[3] = RankToken.batchMint.selector;
        rankTokenSelectors[4] = RankToken.setURI.selector;
        rankTokenSelectors[5] = RankToken.setContractURI.selector;

        SimpleAccessManager.SimpleAccessManagerInitializer[]
            memory RankTokenAccessSettings = new SimpleAccessManager.SimpleAccessManagerInitializer[](6);

        RankTokenAccessSettings[0].selector = RankToken.mint.selector;
        RankTokenAccessSettings[0].dissallowedAddresses = new address[](1);
        RankTokenAccessSettings[0].dissallowedAddresses[0] = dao;
        RankTokenAccessSettings[0].distributionComponentsOnly = true;

        RankTokenAccessSettings[1].selector = RankToken.lock.selector;
        RankTokenAccessSettings[1].dissallowedAddresses = new address[](1);
        RankTokenAccessSettings[1].dissallowedAddresses[0] = dao;
        RankTokenAccessSettings[1].distributionComponentsOnly = true;

        RankTokenAccessSettings[2].selector = RankToken.unlock.selector;
        RankTokenAccessSettings[2].dissallowedAddresses = new address[](1);
        RankTokenAccessSettings[2].dissallowedAddresses[0] = dao;
        RankTokenAccessSettings[2].distributionComponentsOnly = true;

        RankTokenAccessSettings[3].selector = RankToken.batchMint.selector;
        RankTokenAccessSettings[3].dissallowedAddresses = new address[](1);
        RankTokenAccessSettings[3].dissallowedAddresses[0] = dao;
        RankTokenAccessSettings[3].distributionComponentsOnly = true;

        RankTokenAccessSettings[4].selector = RankToken.setURI.selector;
        RankTokenAccessSettings[4].distributionComponentsOnly = true;

        RankTokenAccessSettings[5].selector = RankToken.setContractURI.selector;
        RankTokenAccessSettings[5].distributionComponentsOnly = true;

        SimpleAccessManager rankTokenAccessManager = SimpleAccessManager(_accessManagerBase.clone());

        rankTokenAccessManager.initialize(RankTokenAccessSettings, rankToken, IDistributor(msg.sender)); // msg.sender must be IDistributor or it will revert

        RankToken(rankToken).initialize(args.rankTokenURI, args.RankTokenContractURI, address(rankTokenAccessManager));
        (
            address[] memory ACIDDistrAddresses,
            bytes32 ACIDDistributionname,
            uint256 ACIDDistributionVersion
        ) = _ACIDDistributionBase.instantiate(abi.encode(dao, rankToken, args.metadata));

        RankifyInstanceInit.contractInitializer memory ACIDInit = RankifyInstanceInit.contractInitializer({
            timePerTurn: args.timePerTurn,
            maxPlayersSize: args.maxPlayersSize,
            minPlayersSize: args.minPlayersSize,
            rewardToken: rankToken,
            timeToJoin: args.timeToJoin,
            gamePrice: args.gamePrice,
            joinGamePrice: args.joinGamePrice,
            maxTurns: args.maxTurns,
            numWinners: 1,
            voteCredits: args.voteCredits,
            paymentToken: args.paymentToken
        });

        RankifyInstanceInit(ACIDDistrAddresses[0]).init(
            string(abi.encodePacked(ACIDDistributionname)),
            LibSemver.toString(LibSemver.parse(ACIDDistributionVersion)),
            ACIDInit
        );
        address[] memory returnValue = new address[](ACIDDistrAddresses.length + 2);
        for (uint256 i; i < ACIDDistrAddresses.length; i++) {
            returnValue[i] = ACIDDistrAddresses[i];
        }
        returnValue[ACIDDistrAddresses.length] = address(rankTokenAccessManager);
        returnValue[ACIDDistrAddresses.length + 1] = rankToken;

        return (returnValue, ACIDDistributionname, ACIDDistributionVersion);
    }



    /**
     * @notice Instantiates a new instance with the provided data.
     * @param data The initialization data for the new instance, typeof {DistributorArguments}.
     * @return instances An array of addresses representing the new instances.
     * @return distributionName A bytes32 value representing the name of the distribution.
     * @return distributionVersion A uint256 value representing the version of the distribution.
     * @dev `instances` array contents: DAO, GovernanceToken, Gov Token AccessManager, ACID Diamond, 8x ACID Diamond facets, RankTokenAccessManager, RankToken
     */
    function instantiate(bytes memory data) public override returns (address[] memory instances, bytes32 distributionName, uint256 distributionVersion) {
        DistributorArguments memory args = abi.decode(data, (DistributorArguments));

        (address[] memory DAOInstances, , ) = createOSxDAO(args.DAOSEttings);
        (address[] memory ACIDInstances, , ) = createACID(args.ACIDSettings, DAOInstances[0]);

        address[] memory returnValue = new address[](DAOInstances.length + ACIDInstances.length);

        for (uint256 i; i < DAOInstances.length; i++) {
            returnValue[i] = DAOInstances[i];
        }
        for (uint256 i; i < ACIDInstances.length; i++) {
            returnValue[DAOInstances.length + i] = ACIDInstances[i];
        }
        return (returnValue, _distributionName, _distributionVersion);
    }

    function getMetadata() public pure virtual override returns (string memory) {
        return "";
    }

    function get() external view returns (address[] memory sources, bytes32, uint256) {
        address[] memory srcs = new address[](8);
        srcs[0] = address(_tokenVotingPluginRepo);
        srcs[1] = address(_daoFactory);
        srcs[2] = address(_trustedForwarder);
        srcs[3] = address(_rankTokenBase);
        srcs[4] = address(_ACIDDistributionBase);
        srcs[6] = address(_governanceERC20Base);
        srcs[7] = address(_accessManagerBase);
        return (srcs, _distributionName, _distributionVersion);
    }

    /**
     * @notice Returns the schema of the distribution.
     * @dev This is only needed to ensure `DistributorArguments` are provided in ABI, as it would be internal otherwise.
     * @return DistributorArguments The schema of the distribution.
     */
    function distributionSchema() external pure returns (DistributorArguments memory) {
        return
            DistributorArguments({
                DAOSEttings: OSxDistributionArguments("", "", "", "", ""),
                ACIDSettings: UserACIDSettings(0, 0, 0, 0, 0, 0, 0, address(0), 0, "", "", "")
            });
    }
}
