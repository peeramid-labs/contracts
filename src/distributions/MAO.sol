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
// import "@aragon/osx/framework/plugin/repo/IPluginRepo.sol";
// import "@aragon/osx/framework/dao/DAOFactory.sol";
import "@peeramid-labs/eds/src/interfaces/IDistribution.sol";
import {IPluginSetup} from "@aragon/osx/framework/plugin/setup/IPluginSetup.sol";
import "@peeramid-labs/eds/src/libraries/LibSemver.sol";
import "../tokens/MAOGovernanceERC20.sol";
// import {MajorityVotingBase} from "@aragon/osx/plugins/governance/majority-voting/MajorityVotingBase.sol";
// import "@aragon/osx/framework/plugin/setup/PluginSetupProcessorHelpers.sol";

/// @notice The struct describing the tag of a version obtained by a release and build number as `RELEASE.BUILD`.
/// @param release The release number.
/// @param build The build number
/// @dev Releases can include a storage layout or the addition of new functions. Builds include logic changes or updates of the UI.
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

/// @notice The struct describing a plugin version (release and build).
/// @param tag The version tag.
/// @param pluginSetup The setup contract associated with this version.
/// @param buildMetadata The build metadata URI.
struct Version {
    Tag tag;
    address pluginSetup;
    bytes buildMetadata;
}

/// @title IPluginRepo
/// @author Aragon Association - 2022-2023
/// @notice The interface required for a plugin repository.
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

interface  ITokenVotingSetup {
    function governanceERC20Base() external view returns (address);
}

contract MAODistribution is IDistribution, CodeIndexer {
    using Clones for address;
    IPluginRepo immutable tokenVotingPluginRepo;
    IDAOFactory immutable daoFactory;
    address immutable trustedForwarder;
    bytes32 immutable distributionName;
    uint256 immutable distributionVersion;

    function stringToSelector(string memory signature) private pure returns (bytes4) {
        return bytes4(keccak256(bytes(signature)));
    }

    constructor(
        address _tokenVotingPluginRepo,
        address _daoFactory,
        address _trustedForwarder,
        bytes32 _distributionName,
        LibSemver.Version memory _distributionVersion
    ) {
        tokenVotingPluginRepo = IPluginRepo(_tokenVotingPluginRepo);
        daoFactory = IDAOFactory(_daoFactory);
        trustedForwarder = _trustedForwarder;
        distributionName = _distributionName;
        distributionVersion = LibSemver.toUint256(_distributionVersion);
    }

    struct TokenSettings {
        address addr;
        string name;
        string symbol;
    }

    struct DistributorArguments {
        string daoURI;
        string subdomain;
        bytes metadata;
        string tokenName;
        string tokenSymbol;
    }

    function instantiate(bytes memory data) public override returns (address[] memory instances, bytes32, uint256) {
        (DistributorArguments memory args, string memory tokenName, string memory tokenSymbol ) = abi.decode(
            data,
            (DistributorArguments, string, string)
        );
        IDAOFactory.DAOSettings memory daoSettings = IDAOFactory.DAOSettings(
            trustedForwarder,
            args.daoURI,
            args.subdomain,
            args.metadata
        );
        VotingSettings memory votingSettings = VotingSettings(VotingMode.Standard, 6666666, 5**6 , 86400, 1);
        MintSettings memory mintSettings = MintSettings(new address[](1), new uint256[](1));
        mintSettings.receivers[0] = address(this);
        mintSettings.amounts[0] = type(uint256).max;

        ITokenVotingSetup tokenVotingSetup = ITokenVotingSetup(tokenVotingPluginRepo.getLatestVersion(tokenVotingPluginRepo.latestRelease()).pluginSetup);
                    // Clone a `GovernanceERC20`.
            address token = tokenVotingSetup.governanceERC20Base().clone();

        TokenSettings memory tokenSettings = TokenSettings(address(0), tokenName, tokenSymbol);

        // IPluginSetup.PreparedSetupData memory tokenSetupData = IPluginSetup.PreparedSetupData();

        IDAOFactory.PluginSettings memory tokenVotingPluginSetup = IDAOFactory.PluginSettings(
            IDAOFactory.PluginSetupRef(
                tokenVotingPluginRepo.getLatestVersion(tokenVotingPluginRepo.latestRelease()).tag,
                tokenVotingPluginRepo
            ),
            abi.encode(votingSettings, tokenSettings, mintSettings)
        );


        IDAOFactory.PluginSettings[] memory pluginSettings = new IDAOFactory.PluginSettings[](1);
        pluginSettings[0] = tokenVotingPluginSetup;
        address createdDao = daoFactory.createDao(daoSettings, pluginSettings);

        MAOGovernanceERC20(token).initialize(
                IDAO(createdDao),
                tokenSettings.name,
                tokenSettings.symbol,
                mintSettings
            );

        address[] memory returnValue = new address[](1);
        returnValue[0] = createdDao;


        return (returnValue, distributionName, distributionVersion);
    }

    function getMetadata() public pure virtual override returns (string memory) {
        return "";
    }

    function get() external view returns (address[] memory sources, bytes32 , uint256 ) {

        address[] memory srcs = new address[](3);
        srcs[0] = address(tokenVotingPluginRepo);
        srcs[1] = address(daoFactory);
        srcs[3] = address(trustedForwarder);
        return (srcs, distributionName, distributionVersion);
    }
}
