// SPDX-License-Identifier: AGPL-3.0-or-later
import {Tag, Version} from "./IVTag.sol";
pragma solidity ^0.8.8;

/// @title IRepository
/// @author Peersky
/// @notice The interface required for a repository.
/// @notice This is a modified source from Aragon X, where interface names have been changed by generalising "plugin" in to source code address".
/// @notice Implication of this is that this contract will not be aware of any setup code as opposed in original Aragon implementation which relied on having IPluginSetup requirements
/// @notice This means that it is thought to be consumed by a factory contract, that will act as "Installer" and use reposiories for solo purpose of code lookup.
/// @notice I think this is a good change as it makes the interface more generic and reusable for any kind of contract code, not just OSx specific.
/// @notice TBD - I think that major release versions should include migration contract and call signatures, but this would breaking interfaces reliant on "Tag" structure.

interface IRepository {
    /// @notice Thrown if a version does not exist.
    /// @param versionHash The tag hash.
    error VersionHashDoesNotExist(bytes32 versionHash);

    /// @notice Thrown if a release number is zero.
    error ReleaseZeroNotAllowed();

    /// @notice Thrown if a release number is incremented by more than one.
    /// @param latestRelease The latest release number.
    /// @param newRelease The new release number.
    error InvalidReleaseIncrement(uint8 latestRelease, uint8 newRelease);

    /// @notice Thrown if the same contract exists already in a previous releases.
    /// @param release The release number of the already existing source.
    /// @param build The build number of the already existing source.
    /// @param source The  contract address.
    error AlreadyInPreviousRelease(uint8 release, uint16 build, address source);

    /// @notice Thrown if the metadata URI is empty.
    error EmptyReleaseMetadata();

    /// @notice Thrown if release does not exist.
    error ReleaseDoesNotExist();

    /// @notice Updates the metadata for release with content `@fromHex(releaseMetadata)`.
    /// @param release The release number.
    /// @param releaseMetadata The release metadata URI.
    function updateReleaseMetadata(uint8 release, bytes calldata releaseMetadata) external;

    /// @notice Creates a new version as the latest build for an existing release number or the first build for a new release number for the provided `source` contract address and metadata.
    /// @param release The release number.
    /// @param source The address of the source code.
    /// @param buildMetadata The build metadata URI.
    /// @param releaseMetadata The release metadata URI.
    function createVersion(
        uint8 release,
        address source,
        bytes calldata buildMetadata,
        bytes calldata releaseMetadata
    ) external;

    /// @notice Emitted if the same source exists in previous releases.
    /// @param release The release number.
    /// @param build The build number.
    /// @param source The address of the source code.
    /// @param buildMetadata The build metadata URI.
    event VersionCreated(uint8 release, uint16 build, address indexed source, bytes buildMetadata);

    /// @notice Emitted when a release's metadata was updated.
    /// @param release The release number.
    /// @param releaseMetadata The release metadata URI.
    event ReleaseMetadataUpdated(uint8 release, bytes releaseMetadata);

    /// @notice Gets the total number of builds for a given release number.
    /// @param release The release number.
    /// @return The number of builds of this release.
    function buildCount(uint8 release) external view returns (uint256);

    /// @notice Returns the version for a tag hash.
    /// @param tagHash The tag hash.
    /// @return The version associated with a tag hash.
    function getVersion(bytes32 tagHash) external view returns (Version memory);

    /// @notice Returns the version associated with a tag.
    /// @param tag The version tag.
    /// @return The version associated with the tag.
    function getVersion(Tag calldata tag) external view returns (Version memory);

    /// @notice Returns the latest version for a given source.
    /// @param source The source address
    /// @return The latest version associated with the source.
    function getLatestVersion(address source) external view returns (Version memory);

    /// @notice Returns the latest version for a given release number.
    /// @param release The release number.
    /// @return The latest version of this release.
    function getLatestVersion(uint8 release) external view returns (Version memory);

    /// @notice Returns the latest version for a given release number.
    /// @return The latest version of this repository.
    function latestRelease() external view returns (uint8);
}
