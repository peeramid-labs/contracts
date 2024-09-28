// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// This is a copy of interfaces and structs from @aragon/osx package
// This had to be done to accomodate difference in solidity version requirements

struct TokenSettings {
    address addr;
    string name;
    string symbol;
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
