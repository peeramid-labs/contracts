// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRepository, Tag, Version} from "./IRepository.sol";
import {Distribution, VersionRequirement} from "./IDistribution.sol";

/**
 * @title IVSourceController
 * @notice Interface for the VSourceController contract.
 * @notice The VSourceController contract is responsible for managing the distribution of source code from version controlled repositories.
 * @notice It is intended to be a source of authority for entity which want to enable
 * @dev: Distributed sources MUST implement IRepository
 * @author Peersky
 */
/**
 * @title IVSourceController
 * @dev Interface for the Source Controller contract.
 */
interface ISourceController {
    /**
     * @dev Emitted when a repository is added to the Source Controller.
     * @param repository The address of the repository.
     * @param versionRequired The version requirement for the repository.
     */
    event RepositoryAdded(IRepository indexed repository, VersionRequirement versionRequired);

    /**
     * @dev Emitted when the version requirement is set for a repository.
     * @param repository The address of the repository.
     * @param versionRequired The new version requirement for the repository.
     */
    event VersionRequirementSet(IRepository indexed repository, VersionRequirement versionRequired);

    /**
     * @dev Returns an array of distributors.
     * @return An array of distributor addresses.
     */
    function getDistributors() external view returns (address[] memory);

    /**
     * @dev Checks if an address is a distributor.
     * @param distributor The address to check.
     * @return A boolean indicating whether the address is a distributor.
     */
    function isDistributor(address distributor) external view returns (bool);

    /**
     * @dev Sets the version requirement for a repository.
     * @param repository The address of the repository.
     * @param versionRequired The version requirement for the repository.
     */
    function setVersionRequirement(IRepository repository, VersionRequirement memory versionRequired) external;

    /**
     * @dev Gets the version requirement for a repository.
     * @param repository The address of the repository.
     * @return The version requirement for the repository.
     */
    function getVersionRequired(IRepository repository) external view returns (VersionRequirement memory);

    /**
     * @dev Adds a distributor for a repository.
     * @param repository The address of the repository.
     * @param versionRequired The version requirement for the repository.
     */
    function addDistributor(IRepository repository, VersionRequirement memory versionRequired) external;

    /**
     * @dev Removes a distributor for a repository.
     * @param repository The address of the repository.
     */
    function removeDistributor(IRepository repository) external;

    /**
     * @dev Adds multiple distributors for multiple repositories.
     * @param repositories An array of repository addresses.
     * @param requirements An array of version requirements for the repositories.
     */
    function addBatchDistributors(IRepository[] memory repositories, VersionRequirement[] memory requirements) external;

    /**
     * @dev Removes multiple distributors for multiple repositories.
     * @param repositories An array of repository addresses.
     */
    function removeBatchDistributors(IRepository[] memory repositories) external;

    /**
     * @dev Sets multiple version requirements for multiple repositories.
     * @param repositories An array of repository addresses.
     * @param requirements An array of version requirements for the repositories.
     */
    function setBatchVersionRequirements(
        IRepository[] memory repositories,
        VersionRequirement[] memory requirements
    ) external;
}
