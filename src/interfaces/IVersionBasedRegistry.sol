pragma solidity ^0.8.0;

interface IVersionBasedRegistry {
    /// @notice The struct describing the tag of a version obtained by a release and build number as `RELEASE.BUILD`.
    /// @param release The release number.
    /// @param build The build number
    /// @dev Releases mark incompatible changes (e.g., the plugin interface, storage layout, or incompatible behavior) whereas builds mark compatible changes (e.g., patches and compatible feature additions).
    struct Tag {
        uint8 release;
        uint16 build;
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

    /// @notice Registers a contract with a specific version.
    /// @param contractAddress The address of the contract to register.
    /// @param version The version of the contract.
    function register(address contractAddress, Version calldata version) external;

    /// @notice Queries whether a contract is registered and under which version.
    /// @param contractAddress The address of the contract to query.
    /// @return version The version of the registered contract.
    function getVersion(address contractAddress) external view returns (Version memory version);
}
