// SPDX-License-Identifier: MIT

/**
 * @title IRepositoryInstaller
 * @dev Interface for managing the installation and instantiation of repositories.
 */
pragma solidity ^0.8.20;

import {IRepository} from "./IRepository.sol";
import {Tag, Version} from "./IVTag.sol";

interface IVInstaller {
    /**
     * @dev Error thrown when a repository is not added to the installer.
     */
    error RepositoryIsNotAdded(address repository);

    /**
     * @dev Error thrown when the version does not match the requirement for a repository.
     */
    error VersionDoesNotMatchRequirement(Tag version, VersionRequirement requirement);

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
     */
    struct VersionRequirement {
        VersionRequirementTypes requirementType;
        Tag baseVersion;
    }

    /**
     * @dev Event emitted when the version requirement for a repository is updated.
     * @param repository The address of the repository.
     * @param newRequirement The new version requirement for the repository.
     */
    event RepositoryRequirementUpdated(IRepository indexed repository, VersionRequirement newRequirement);

    /**
     * @dev Event emitted when a repository is added to the installer.
     * @param repository The address of the repository.
     * @param requirement The version requirement for the repository.
     */
    event RepositoryAdded(IRepository indexed repository, VersionRequirement requirement);

    /**
     * @dev Event emitted when a repository is removed from the installer.
     * @param repository The address of the repository.
     */
    event RepositoryRemoved(IRepository indexed repository);

    /**
     * @dev Event emitted when a new instance is instantiated from a repository.
     * @param newInstance The address of the new instance.
     * @param repository The address of the repository.
     * @param instantiator The address of the account that instantiated the instance.
     * @param version The version of the repository used for instantiation.
     * @param metadata The metadata associated with the instance.
     */
    event Instantiated(
        address indexed newInstance,
        IRepository indexed repository,
        address indexed instantiator,
        Tag version,
        bytes metadata
    );

    /**
     * @dev Event emitted when an instance is upgraded to a new version of a repository.
     * @param instance The address of the instance.
     * @param repository The address of the repository.
     * @param upgrader The address of the account that upgraded the instance.
     * @param version The version of the repository used for the upgrade.
     * @param metadata The metadata associated with the upgrade.
     */
    event Upgraded(
        address indexed instance,
        IRepository indexed repository,
        address indexed upgrader,
        Tag version,
        bytes metadata
    );

    /**
     * @dev Adds a repository to the installer with the specified version requirement.
     * @param repository The address of the repository.
     * @param baseVersion The version requirement for the repository.
     */
    function addRepository(address repository, VersionRequirement memory baseVersion) external;

    /**
     * @dev Removes a repository from the installer.
     * @param repository The address of the repository.
     */
    function removeRepository(address repository) external;

    /**
     * @dev Instantiates a new instance from a repository with the specified version.
     * @param repository The address of the repository.
     * @param version The version of the repository to use for instantiation.
     * @param data The call data passed to initialize the instance.
     * @return The address of the newly instantiated instance.
     */
    function instantiate(address repository, Tag memory version, bytes calldata data) external returns (address);

    /**
     * @dev Instantiates a new instance from the latest version of a repository.
     * @param repository The address of the repository.
     * @param data The call data passed to initialize the instance.
     * @return The address of the newly instantiated instance.
     */
    function instantiateLatest(address repository, bytes calldata data) external returns (address);

    /**
     * @dev Upgrades an instance to the specified version of a repository.
     * @param instance The address of the instance.
     * @param data The call data passed to initialize the instance.
     * @param version The version of the repository to upgrade to.
     */
    function upgrade(address instance, Tag memory version, bytes calldata data) external;

    /**
     * @dev Upgrades an instance to the latest version of a repository.
     * @param instance The address of the instance.
     * @param data The call data passed to initialize the instance.
     */
    function upgradeToLatest(address instance, bytes calldata data) external;

    /**
     * @dev Gets all instances that have been instantiated from a repository.
     * @param repository The address of the repository.
     * @param data The call data passed to initialize the instance.
     * @return An array of addresses representing the instances.
     */
    function getInstances(address repository, bytes calldata data) external view returns (address[] memory);

    /**
     * @dev Gets all repositories added to the installer.
     * @return An array of addresses representing the repositories.
     */
    function getRepositories() external view returns (address[] memory);

    /**
     * @dev Gets the repository associated with a specific instance.
     * @param instance The address of the instance.
     * @return The address of the repository.
     */
    function getRepository(address instance) external view returns (address);

    /**
     * @dev Gets the version of a specific instance.
     * @param instance The address of the instance.
     * @return The version of the instance.
     */
    function getVersion(address instance) external view returns (Tag memory);

    /**
     * @dev Gets the version requirement for a specific instance.
     * @param instance The address of the instance.
     * @return The version requirement for the instance.
     */
    function getVersionRequirement(address instance) external view returns (VersionRequirement memory);
}
