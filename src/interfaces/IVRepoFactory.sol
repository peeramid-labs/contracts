// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.8;

import {IRepository} from "./IRepository.sol";

/// @title IVRepoFactory
/// @author Peersky
/// @notice This Interface creates `IRepository contract` proxies and registers them on a `IVersionBasedRegistry` contract.
/// @notice This is a modified source from Aragon X, where interface names have been changed by generalising "plugin" in to source code address".
/// @notice this implies that Repository anymore will not be aware of source code implementation and initialization selectors must be passed. 

interface IVRepoFactory {
    /**
     * @dev Emitted when a new repository is created.
     * @param repo The address of the newly created repository.
     * @param proxy The address of the proxy contract associated with the repository.
     */
    event RepoCreated(IRepository repo, address proxy);

    /// @notice Creates a repository proxy pointing to the implementation of IRepository
    /// @param _subdomain The repository subdomain.
    /// @param _initialOwner The maintainer address.
    function createRepo(string calldata _subdomain, address _initialOwner) external returns (IRepository);

    /// @notice Creates and registers a Repository with an ENS subdomain and publishes an initial version `1.1`.
    /// @param _subdomain The repository subdomain.
    /// @param _source contract associated with the version.
    /// @param _maintainer The maintainer of the repo. This address has permission to update metadata, upgrade the repo logic, and manage the repo permissions.
    /// @param _releaseMetadata The release metadata URI.
    /// @param _buildMetadata The build metadata URI.
    /// @dev After the creation of the and release of the first version by the factory, ownership is transferred to the `_maintainer` address.
    function createRepoWithFirstVersion(
        string calldata _subdomain,
        address _source,
        address _maintainer,
        bytes memory _releaseMetadata,
        bytes memory _buildMetadata
    ) external returns (IRepository repository);
}
