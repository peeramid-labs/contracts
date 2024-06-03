// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.8;

import {IRepository} from "./IRepository.sol";

/// @title PluginRepoFactory
/// @author Peersky
/// @notice This Interface creates `IRepository contract` proxies and registers them on a `IVersionBasedRegistry` contract.
/// @notice This is a modified source from Aragon X, where interface names have been changed by generalising "plugin" in to source code address".

interface IVRepoFactory {
    /// @notice Creates a plugin repository proxy pointing to the `pluginRepoBase` implementation and registers it in the Aragon plugin registry.
    /// @param _subdomain The plugin repository subdomain.
    /// @param _initialOwner The plugin maintainer address.
    function createRepo(string calldata _subdomain, address _initialOwner) external returns (IRepository);

    /// @notice Creates and registers a `PluginRepo` with an ENS subdomain and publishes an initial version `1.1`.
    /// @param _subdomain The plugin repository subdomain.
    /// @param _pluginSetup The plugin factory contract associated with the plugin version.
    /// @param _maintainer The maintainer of the plugin repo. This address has permission to update metadata, upgrade the repo logic, and manage the repo permissions.
    /// @param _releaseMetadata The release metadata URI.
    /// @param _buildMetadata The build metadata URI.
    /// @dev After the creation of the `PluginRepo` and release of the first version by the factory, ownership is transferred to the `_maintainer` address.
    function createRepoWithFirstVersion(
        string calldata _subdomain,
        address _pluginSetup,
        address _maintainer,
        bytes memory _releaseMetadata,
        bytes memory _buildMetadata
    ) external returns (IRepository repository);
}
