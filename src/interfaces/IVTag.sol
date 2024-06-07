// SPDX-License-Identifier: AGPL-3.0-or-later
/// @notice This is a modified source from Aragon X, where interfaces were generalized to be more generic and reusable.
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
