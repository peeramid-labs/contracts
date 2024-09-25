// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./InitializedDiamondDistribution.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import "../vendor/diamond/facets/DiamondLoupeFacet.sol";
import "../facets/EIP712InspectorFacet.sol";
import "../vendor/diamond/facets/OwnershipFacet.sol";
import "../facets/RankifyInstanceMainFacet.sol";
import "../facets/RankifyInstanceRequirementsFacet.sol";
import "../facets/RankifyInstanceGameMastersFacet.sol";
import "../facets/RankifyInstanceGameOwnersFacet.sol";
import "../vendor/diamond/interfaces/IDiamondCut.sol";
import "../vendor/diamond/interfaces/IDiamondLoupe.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@peeramid-labs/eds/src/interfaces/IDistribution.sol";
import {IPluginSetup} from "@aragon/osx/framework/plugin/setup/IPluginSetup.sol";
import "@peeramid-labs/eds/src/libraries/LibSemver.sol";
import {DistributableGovernanceERC20, MintSettings, IDAO} from "../tokens/DistributableGovernanceERC20.sol";
import "hardhat/console.sol";
import {IERC7746} from "@peeramid-labs/eds/src/interfaces/IERC7746.sol";
import {SimpleAccessManager} from "@peeramid-labs/eds/src/managers/SimpleAccessManager.sol";
import {IDistributor} from "@peeramid-labs/eds/src/interfaces/IDistributor.sol";
import {RankToken} from "../tokens/RankToken.sol";
import "../initializers/RankifyInstanceInit.sol";
import {ERC165Checker} from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "hardhat/console.sol";

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

    struct TokenSettings {
        address addr;
        string name;
        string symbol;
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

struct Tag {
    uint8 release;
    uint16 build;
}

enum VotingMode {
    Standard,
    EarlyExecution,
    VoteReplacement
}

struct VotingSettings {
    VotingMode votingMode;
    uint32 supportThreshold;
    uint32 minParticipation;
    uint64 minDuration;
    uint256 minProposerVotingPower;
}

struct Version {
    Tag tag;
    address pluginSetup;
    bytes buildMetadata;
}

interface IPluginRepo {
    /// @notice Updates the metadata for release with content `@fromHex(_releaseMetadata)`.
    /// @param _release The release number.
    /// @param _releaseMetadata The release metadata URI.
    function updateReleaseMetadata(uint8 _release, bytes calldata _releaseMetadata) external;

    /// @notice Creates a new plugin version as the latest build for an existing release number or the first build for a new release number for the provided `PluginSetup` contract address and metadata.
    /// @param _release The release number.
    /// @param _pluginSetupAddress The address of the plugin setup contract.
    /// @param _buildMetadata The build metadata URI.
    /// @param _releaseMetadata The release metadata URI.
    function createVersion(
        uint8 _release,
        address _pluginSetupAddress,
        bytes calldata _buildMetadata,
        bytes calldata _releaseMetadata
    ) external;

    function latestRelease() external view returns (uint8);
    function getLatestVersion(uint8 _release) external view returns (Version memory);
}

interface IDAOFactory {
    struct PluginSetupRef {
        Tag versionTag;
        IPluginRepo pluginSetupRepo;
    }

    /// @notice The container for the DAO settings to be set during the DAO initialization.
    /// @param trustedForwarder The address of the trusted forwarder required for meta transactions.
    /// @param daoURI The DAO uri used with [EIP-4824](https://eips.ethereum.org/EIPS/eip-4824).
    /// @param subdomain The ENS subdomain to be registered for the DAO contract.
    /// @param metadata The metadata of the DAO.
    struct DAOSettings {
        address trustedForwarder;
        string daoURI;
        string subdomain;
        bytes metadata;
    }

    /// @notice The container with the information required to install a plugin on the DAO.
    /// @param pluginSetupRef The `PluginSetupRepo` address of the plugin and the version tag.
    /// @param data The bytes-encoded data containing the input parameters for the installation as specified in the plugin's build metadata JSON file.
    struct PluginSettings {
        PluginSetupRef pluginSetupRef;
        bytes data;
    }

    function createDao(
        DAOSettings memory daoSettings,
        PluginSettings[] memory pluginSettings
    ) external returns (address);
}

interface ITokenVotingSetup {
    function governanceERC20Base() external view returns (address);
}

contract MAODistribution is IDistribution, CodeIndexer {
    using Clones for address;
    IPluginRepo immutable tokenVotingPluginRepo;
    IDAOFactory immutable daoFactory;
    address immutable trustedForwarder;
    bytes32 immutable distributionName;
    uint256 immutable distributionVersion;
    address immutable rankTokenBase;
    IDistribution immutable ACIDDistributionBase;
    address immutable governanceERC20Base;
    address immutable accessManagerBase;

    function stringToSelector(string memory signature) private pure returns (bytes4) {
        return bytes4(keccak256(bytes(signature)));
    }

    constructor(
        address _tokenVotingPluginRepo,
        address _daoFactory,
        address _trustedForwarder,
        bytes32 _rankTokenCodeId,
        bytes32 _ACIDDIistributionId,
        bytes32 accessManagerId,
        bytes32 _governanceERC20BaseId,
        bytes32 _distributionName,
        LibSemver.Version memory _distributionVersion
    ) {
        console.log("MAODistribution.constructor");
        governanceERC20Base = getContractsIndex().get(_governanceERC20BaseId);
        tokenVotingPluginRepo = IPluginRepo(_tokenVotingPluginRepo);
        daoFactory = IDAOFactory(_daoFactory);
        trustedForwarder = _trustedForwarder;
        distributionName = _distributionName;
        distributionVersion = LibSemver.toUint256(_distributionVersion);
        rankTokenBase = getContractsIndex().get(_rankTokenCodeId);
        console.log("MAODistribution.rankTokenBase", rankTokenBase);
        if (rankTokenBase == address(0)) {
            revert("Rank token base not found");
        }
        ACIDDistributionBase = IDistribution(getContractsIndex().get(_ACIDDIistributionId));
        if (address(ACIDDistributionBase) == address(0)) {
            revert("ACID distribution base not found");
        }

        accessManagerBase = getContractsIndex().get(accessManagerId);
        if (accessManagerBase == address(0)) {
            revert("Access manager base not found");
        }
        require(
            ERC165Checker.supportsInterface(accessManagerBase, type(IERC7746).interfaceId),
            "Access manager does not support IERC7746"
        );
    }



    function createOSxDAO(
        OSxDistributionArguments memory args
    ) internal returns (address[] memory instances, bytes32, uint256) {
        MintSettings memory mintSettings = MintSettings(new address[](1), new uint256[](1));
        mintSettings.receivers[0] = address(this);
        mintSettings.amounts[0] = 0;
        address token = governanceERC20Base.clone();
        console.log("token", token);
        TokenSettings memory tokenSettings = TokenSettings(token, args.tokenName, args.tokenSymbol);
        VotingSettings memory votingSettings = VotingSettings({
            votingMode: VotingMode.Standard,
            supportThreshold: 666666,
            minParticipation: 10 ** 4,
            minDuration: 86400,
            minProposerVotingPower: 1
        });

        IDAOFactory.DAOSettings memory daoSettings = IDAOFactory.DAOSettings(
            trustedForwarder,
            args.daoURI,
            args.subdomain,
            args.metadata
        );
        console.log("daoSettings.trustedForwarder", daoSettings.trustedForwarder);
        console.log("daoSettings.daoURI", daoSettings.daoURI);
        console.log("daoSettings.subdomain", daoSettings.subdomain);
        console.logBytes(daoSettings.metadata);

        IDAOFactory.PluginSettings memory tokenVotingPluginSetup = IDAOFactory.PluginSettings(
            IDAOFactory.PluginSetupRef(
                tokenVotingPluginRepo.getLatestVersion(tokenVotingPluginRepo.latestRelease()).tag,
                tokenVotingPluginRepo
            ),
            abi.encode(votingSettings, tokenSettings, mintSettings)
        );
        console.log(
            "tokenVotingPluginSetup.pluginSetupRef.versionTag.release",
            tokenVotingPluginSetup.pluginSetupRef.versionTag.release
        );

        IDAOFactory.PluginSettings[] memory pluginSettings = new IDAOFactory.PluginSettings[](1);
        pluginSettings[0] = tokenVotingPluginSetup;
        address createdDao = daoFactory.createDao(daoSettings, pluginSettings);
        console.log("createdDao", createdDao);

        SimpleAccessManager.SimpleAccessManagerInitializer[]
            memory govTokenAccessSettings = new SimpleAccessManager.SimpleAccessManagerInitializer[](1);
        govTokenAccessSettings[0].selector = DistributableGovernanceERC20.mint.selector;
        govTokenAccessSettings[0].dissallowedAddresses = new address[](1);
        govTokenAccessSettings[0].dissallowedAddresses[0] = createdDao;
        govTokenAccessSettings[0].distributionComponentsOnly = true;

        SimpleAccessManager govTokenAccessManager = SimpleAccessManager(accessManagerBase.clone());
        console.log("govTokenAccessManager initialized");

        govTokenAccessManager.initialize(govTokenAccessSettings, tokenSettings.addr, IDistributor(msg.sender)); // msg.sender must be IDistributor or it will revert
        DistributableGovernanceERC20(tokenSettings.addr).initialize(
            IDAO(createdDao),
            tokenSettings.name,
            tokenSettings.symbol,
            mintSettings,
            address(govTokenAccessManager)
        );
        console.log("DistributableGovernanceERC20 initialized");

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
        address rankToken = rankTokenBase.clone();

        // address[] memory returnValue = new address[](1);

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

        SimpleAccessManager rankTokenAccessManager = SimpleAccessManager(accessManagerBase.clone());

        rankTokenAccessManager.initialize(RankTokenAccessSettings, rankToken, IDistributor(msg.sender)); // msg.sender must be IDistributor or it will revert

        RankToken(rankToken).initialize(args.rankTokenURI, args.RankTokenContractURI, address(rankTokenAccessManager));
        // console.log(ACIDDistrAddresses.length);
        (
            address[] memory ACIDDistrAddresses,
            bytes32 ACIDDistributionname,
            uint256 ACIDDistributionVersion
        ) = ACIDDistributionBase.instantiate(abi.encode(dao, rankToken, args.metadata));
     console.log("debugga");




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
        console.log("ACID initialized");
        address[] memory returnValue = new address[](ACIDDistrAddresses.length + 1);
        for (uint256 i; i < ACIDDistrAddresses.length; i++) {
            returnValue[i] = ACIDDistrAddresses[i];
        }
        returnValue[ACIDDistrAddresses.length] = address(rankTokenAccessManager);

        return (returnValue, ACIDDistributionname, ACIDDistributionVersion);
    }

    // DistributorArguments args;

    function instantiate(bytes memory data) public override returns (address[] memory instances, bytes32, uint256) {
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
        return (returnValue, distributionName, distributionVersion);
    }

    function getMetadata() public pure virtual override returns (string memory) {
        return "";
    }

    function get() external view returns (address[] memory sources, bytes32, uint256) {
        address[] memory srcs = new address[](3);
        srcs[0] = address(tokenVotingPluginRepo);
        srcs[1] = address(daoFactory);
        srcs[3] = address(trustedForwarder);
        return (srcs, distributionName, distributionVersion);
    }

    function distributionSchema () external pure returns (DistributorArguments memory) {
        return DistributorArguments({
            DAOSEttings: OSxDistributionArguments("", "", "", "", ""),
            ACIDSettings: UserACIDSettings(0, 0, 0, 0, 0, 0, 0, address(0), 0, "", "", "")
        });
    }
}
