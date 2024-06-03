// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.8;

/// @title IRepo
/// @author Peersky
/// @notice The interface required for a repository.
/// @notice This is a modified source from Aragon X, where interface names have been changed by generalising "plugin" in to source code address".

interface IRepository {
    /// @notice Updates the metadata for release with content `@fromHex(_releaseMetadata)`.
    /// @param _release The release number.
    /// @param _releaseMetadata The release metadata URI.
    function updateReleaseMetadata(uint8 _release, bytes calldata _releaseMetadata) external;

    /// @notice Creates a new version as the latest build for an existing release number or the first build for a new release number for the provided `Setup` contract address and metadata.
    /// @param _release The release number.
    /// @param _source The address of the source code.
    /// @param _buildMetadata The build metadata URI.
    /// @param _releaseMetadata The release metadata URI.
    function createVersion(
        uint8 _release,
        address _source,
        bytes calldata _buildMetadata,
        bytes calldata _releaseMetadata
    ) external;

    /// @notice Emitted if the same setup exists in previous releases.
    /// @param release The release number.
    /// @param build The build number.
    /// @param source The address of the source code.
    /// @param buildMetadata The build metadata URI.
    event VersionCreated(uint8 release, uint16 build, address indexed source, bytes buildMetadata);

    /// @notice Emitted when a release's metadata was updated.
    /// @param release The release number.
    /// @param releaseMetadata The release metadata URI.
    event ReleaseMetadataUpdated(uint8 release, bytes releaseMetadata);
}
