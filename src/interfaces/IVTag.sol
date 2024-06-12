// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.0;

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
    address source;
    bytes buildMetadata;
}

/**
 * @dev Enum defining the types of version requirements for repositories.
 * - All: Matches any version.
 * - MajorVersion: Matches any version with the same major version number.
 * - ExactVersion: Matches the exact version specified.
 */
enum VersionRequirementTypes {
    All, // *
    MajorVersion, // ^1.0
    ExactVersion // =1.0
}

/**
 * @dev Struct defining a version requirement for a repository.
 * @param requirementType The type of version requirement.
 * @param baseVersion The base version to match against.
 * @param VersionRequirementTypes type of requirement counted from baseVersion Tag
 */
struct VersionControl {
    address source;
    Tag baseVersion;
    VersionRequirementTypes requirementType;
}

/**
 * @dev Struct defining the envelope for the installation of a new instance.
 * @param destination The address of the destination contract.
 * @param data The data to be sent to the destination contract.
 */
struct Envelope {
    address destination;
    bytes[] data;
}
