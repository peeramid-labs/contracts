// SPDX-License-Identifier: MIT
pragma solidity =0.8.28;

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
import "hardhat/console.sol";
import {TokenSettings, VotingMode, VotingSettings, IPluginRepo, IDAOFactory} from "../vendor/aragon/interfaces.sol";

/**
 * @title MAODistribution
 * @dev This contract implements the IDistribution and CodeIndexer interfaces. It uses the Clones library for address cloning.
 *
 * @notice The contract is responsible for creating and managing DAOs and Rankify distributions.
 * @author Peeramid Labs, 2024
 */
contract MAODistribution is IDistribution, CodeIndexer {
    struct UserRankifySettings {
        uint256 principalCost;
        uint96 principalTimeConstant;
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
        UserRankifySettings RankifySettings;
    }

    using Clones for address;
    IPluginRepo private immutable _tokenVotingPluginRepo;
    IDAOFactory private immutable _daoFactory;
    address private immutable _trustedForwarder;
    bytes32 private immutable _distributionName;
    uint256 private immutable _distributionVersion;
    address private immutable _rankTokenBase;
    IDistribution private immutable _RankifyDistributionBase;
    address private immutable _governanceERC20Base;
    address private immutable _accessManagerBase;
    address private immutable _paymentToken;
    address private immutable _beneficiary;

    /**
     * @notice Initializes the contract with the provided parameters and performs necessary checks.
     * @dev - retrieves contract addresses from a contract index using the provided identifiers.
     * - checks if the access manager supports the ERC7746 interface.
     * - EIP712 compatible name/version can be extracted with use of LibSemver
     *
     *
     * WARNING: _trustedForwarder functionality hasn't been yet reviewed nor implemented for Rankify distribution and if set will affect only OSx DAO setup.
     *
     * @param tokenVotingPluginRepo Address of the token voting plugin repository.
     * @param daoFactory Address of the Aragons DAO factory.
     * @param trustedForwarder Address of the trusted forwarder.
     * @param rankTokenCodeId Identifier for the rank token code.
     * @param RankifyDIistributionId Identifier for the Rankify distribution.
     * @param accessManagerId Identifier for the access manager.
     * @param governanceERC20BaseId Identifier for the governance ERC20 base.
     * @param distributionName Name of the distribution.
     * @param distributionVersion Version of the distribution as a `LibSemver.Version` struct.
     */
    constructor(
        address tokenVotingPluginRepo,
        address daoFactory,
        address trustedForwarder,
        address paymentToken,
        address beneficiary,
        bytes32 rankTokenCodeId,
        bytes32 RankifyDIistributionId,
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

        if (beneficiary == address(0)) {
            revert("Beneficiary not found");
        }
        _beneficiary = beneficiary;
        if (paymentToken == address(0)) {
            revert("Payment token not found");
        }
        _paymentToken = paymentToken;
        if (_rankTokenBase == address(0)) {
            revert("Rank token base not found");
        }
        _RankifyDistributionBase = IDistribution(getContractsIndex().get(RankifyDIistributionId));
        if (address(_RankifyDistributionBase) == address(0)) {
            revert("Rankify distribution base not found");
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
        govTokenAccessSettings[0].disallowedAddresses = new address[](1);
        govTokenAccessSettings[0].disallowedAddresses[0] = createdDao;
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

    function createRankify(
        UserRankifySettings memory args,
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
        SimpleAccessManager rankTokenAccessManager = SimpleAccessManager(_accessManagerBase.clone());

        SimpleAccessManager.SimpleAccessManagerInitializer[]
            memory RankTokenAccessSettings = new SimpleAccessManager.SimpleAccessManagerInitializer[](6);

        RankTokenAccessSettings[0].selector = RankToken.mint.selector;
        RankTokenAccessSettings[0].disallowedAddresses = new address[](1);
        RankTokenAccessSettings[0].disallowedAddresses[0] = dao;
        RankTokenAccessSettings[0].distributionComponentsOnly = true;

        RankTokenAccessSettings[1].selector = RankToken.lock.selector;
        RankTokenAccessSettings[1].disallowedAddresses = new address[](1);
        RankTokenAccessSettings[1].disallowedAddresses[0] = dao;
        RankTokenAccessSettings[1].distributionComponentsOnly = true;

        RankTokenAccessSettings[2].selector = RankToken.unlock.selector;
        RankTokenAccessSettings[2].disallowedAddresses = new address[](1);
        RankTokenAccessSettings[2].disallowedAddresses[0] = dao;
        RankTokenAccessSettings[2].distributionComponentsOnly = true;

        RankTokenAccessSettings[3].selector = RankToken.batchMint.selector;
        RankTokenAccessSettings[3].disallowedAddresses = new address[](1);
        RankTokenAccessSettings[3].disallowedAddresses[0] = dao;
        RankTokenAccessSettings[3].distributionComponentsOnly = true;

        RankTokenAccessSettings[4].selector = RankToken.setURI.selector;
        RankTokenAccessSettings[4].distributionComponentsOnly = true;

        RankTokenAccessSettings[5].selector = RankToken.setContractURI.selector;
        RankTokenAccessSettings[5].distributionComponentsOnly = true;

        rankTokenAccessManager.initialize(RankTokenAccessSettings, rankToken, IDistributor(msg.sender)); // msg.sender must be IDistributor or it will revert
        RankToken(rankToken).initialize(args.rankTokenURI, args.RankTokenContractURI, address(rankTokenAccessManager));

        (
            address[] memory RankifyDistrAddresses,
            bytes32 RankifyDistributionName,
            uint256 RankifyDistributionVersion
        ) = _RankifyDistributionBase.instantiate(abi.encode(dao, rankToken, args.metadata));

        RankifyInstanceInit.contractInitializer memory RankifyInit = RankifyInstanceInit.contractInitializer({
            rewardToken: rankToken,
            principalCost: args.principalCost,
            principalTimeConstant: args.principalTimeConstant,
            paymentToken: _paymentToken,
            beneficiary: _beneficiary
        });

        RankifyInstanceInit(RankifyDistrAddresses[0]).init(
            string(abi.encodePacked(RankifyDistributionName)),
            LibSemver.toString(LibSemver.parse(RankifyDistributionVersion)),
            RankifyInit
        );
        address[] memory returnValue = new address[](RankifyDistrAddresses.length + 2);
        for (uint256 i; i < RankifyDistrAddresses.length; ++i) {
            returnValue[i] = RankifyDistrAddresses[i];
        }
        returnValue[RankifyDistrAddresses.length] = address(rankTokenAccessManager);
        returnValue[RankifyDistrAddresses.length + 1] = rankToken;

        return (returnValue, RankifyDistributionName, RankifyDistributionVersion);
    }

    /**
     * @notice Instantiates a new instance with the provided data.
     * @param data The initialization data for the new instance, typeof {DistributorArguments}.
     * @return instances An array of addresses representing the new instances.
     * @return distributionName A bytes32 value representing the name of the distribution.
     * @return distributionVersion A uint256 value representing the version of the distribution.
     * @dev `instances` array contents: DAO, GovernanceToken, Gov Token AccessManager, Rankify Diamond, 8x Rankify Diamond facets, RankTokenAccessManager, RankToken
     */
    function instantiate(
        bytes memory data
    ) public override returns (address[] memory instances, bytes32 distributionName, uint256 distributionVersion) {
        DistributorArguments memory args = abi.decode(data, (DistributorArguments));

        (address[] memory DAOInstances, , ) = createOSxDAO(args.DAOSEttings);
        (address[] memory RankifyInstances, , ) = createRankify(args.RankifySettings, DAOInstances[0]);

        address[] memory returnValue = new address[](DAOInstances.length + RankifyInstances.length);

        for (uint256 i; i < DAOInstances.length; ++i) {
            returnValue[i] = DAOInstances[i];
        }
        for (uint256 i; i < RankifyInstances.length; ++i) {
            returnValue[DAOInstances.length + i] = RankifyInstances[i];
        }
        return (returnValue, _distributionName, _distributionVersion);
    }

    function contractURI() public pure virtual override returns (string memory) {
        return "";
    }

    function get() external view returns (address[] memory sources, bytes32, uint256) {
        address[] memory srcs = new address[](8);
        srcs[0] = address(_tokenVotingPluginRepo);
        srcs[1] = address(_daoFactory);
        srcs[2] = address(_trustedForwarder);
        srcs[3] = address(_rankTokenBase);
        srcs[4] = address(_RankifyDistributionBase);
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
                RankifySettings: UserRankifySettings(0, 0, "", "", "")
            });
    }
}
