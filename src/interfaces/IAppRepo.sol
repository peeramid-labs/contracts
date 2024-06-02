// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.8;

/// @title IAppRepo
/// @author Peersky
/// @notice The interface required for an app repository.
/// @notice This is a modified source from Aragon X, where interface names have been changed by replacing "plugin" with "app".
interface IAppRepo {
    /// @notice Updates the metadata for release with content `@fromHex(_releaseMetadata)`.
    /// @param _release The release number.
    /// @param _releaseMetadata The release metadata URI.
    function updateReleaseMetadata(uint8 _release, bytes calldata _releaseMetadata) external;

    /// @notice Creates a new app version as the latest build for an existing release number or the first build for a new release number for the provided `AppSetup` contract address and metadata.
    /// @param _release The release number.
    /// @param _appSetupAddress The address of the app setup contract.
    /// @param _buildMetadata The build metadata URI.
    /// @param _releaseMetadata The release metadata URI.
    function createVersion(
        uint8 _release,
        address _appSetupAddress,
        bytes calldata _buildMetadata,
        bytes calldata _releaseMetadata
    ) external;

    /// @notice Emitted if the same app setup exists in previous releases.
    /// @param release The release number.
    /// @param build The build number.
    /// @param appSetup The address of the app setup contract.
    /// @param buildMetadata The build metadata URI.
    event VersionCreated(uint8 release, uint16 build, address indexed appSetup, bytes buildMetadata);

    /// @notice Emitted when a release's metadata was updated.
    /// @param release The release number.
    /// @param releaseMetadata The release metadata URI.
    event ReleaseMetadataUpdated(uint8 release, bytes releaseMetadata);
}
