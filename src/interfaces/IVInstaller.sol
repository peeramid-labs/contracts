// SPDX-License-Identifier: MIT

/**
 * @title IRepositoryInstaller
 * @dev Interface for managing the installation and instantiation of repositories.
 */
pragma solidity ^0.8.20;

import {IRepository} from "./IRepository.sol";
import {Tag, Version, VersionControl, Envelope} from "./IVTag.sol";

/**
 * @title IVInstaller
 * @author Peersky
 * @notice Interface for managing the installation and instantiation of repositories.
 * @dev Distinguishing
 */
interface IVInstaller {
    /**
     * @dev Enum defining the types of installation for repositories.
     * - Cloneable: The repository is cloneable.
     * - Constructable: The repository is constructable.
     */
    enum InstallationTypes {
        Cloneable,
        Constructable
    }

    /**
     * @dev Struct defining the installation plan for a repository.
     * @param requiredSource The source of the repository required for installation.
     * @param initializerFnSelectors The function selectors for the initializers to call after installation.
     */
    struct Distribution {
        VersionControl requiredSource;
        bytes4[] initializerFnSelectors;
        InstallationTypes installationType;
    }

    /**
     * @dev Error thrown when a repository is not added to the installer.
     */
    error NotDistributing(IRepository repository);

    /**
     * @dev Error thrown when the version does not match the requirement for a repository.
     */
    error VersionOutOfBounds(address repository, Tag version, Tag requiredTag);

    /**
     * @dev Event emitted when the installer for repository is updated.
     * @param repository The address of the repository.
     * @param oldInstaller The old version requirement for the repository.
     * @param newInstaller The new version requirement for the repository.
     */
    event DistributionChanged(IRepository indexed repository, Distribution oldInstaller, Distribution newInstaller);

    /**
     * @dev Event emitted when a repository is added to the installer.
     * @param repository The address of the repository.
     * @param adder The address of the account that added the repository.
     * @param requirement The version requirement for the repository.
     * @param metadata The metadata associated with the repository.
     */
    event DistributionCreated(
        IRepository indexed repository,
        address indexed adder,
        VersionControl requirement,
        bytes32 metadata
    );

    /**
     * @dev Event emitted when a repository is removed from the installer.
     * @param repository The address of the repository.
     */
    event DistributionRemoved(IRepository indexed repository);

    /**
     * @dev Event emitted when a new instance is instantiated from a distribution.
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
     * @dev Event emitted when distribution is upgraded to a new minor version.
     * @param repository The address of the repository.
     * @param oldMinor The old minor version.
     * @param newMinor The new minor version.
     * @param build The build number.
     * @param metadata The metadata associated with the upgrade.
     */
    event UpgradedMinor(
        IRepository indexed repository,
        uint16 indexed oldMinor,
        uint16 indexed newMinor,
        uint8 build,
        bytes metadata
    );

    /**
     * @dev Event emitted when source repository is upgraded to a new major version.
     * @param repository The address of the repository.
     * @param oldMajor The old major version.
     * @param newMajor The new major version.
     * @param build The build number.
     * @param metadata The metadata associated with the upgrade.
     */
    event UpgradedMajor(
        IRepository indexed repository,
        uint8 indexed oldMajor,
        uint8 indexed newMajor,
        uint16 build,
        bytes metadata
    );

    /**
     * @dev Adds new source repository to the installer.
     * @param config The configuration for the source repository.
     * @param metadata The metadata associated with the source repository.
     */
    function addDistribution(Distribution memory config, bytes32 metadata) external;

    /**
     * @dev Removes a repository from the installer.
     * @param repository The address of the repository.
     */
    function removeSource(IRepository repository) external;

    /**
     * @dev Installs a new instance from the latest version of a repository.
     * @param installationData The payload for the installation.
     * @param version The version of the repository to install.
     */
    function installNewExact(Envelope memory installationData, Tag memory version) external returns (address);

    /**
     * @dev Installs a new instance from the latest version of a repository.
     * @param installationData The payload for the installation.
     */
    function installNewLatest(Envelope memory installationData) external returns (address);

    /**
     * @dev Upgrades versioned source new requirements.
     * @param newConfig The new configuration for the source repository.
     * @param migrationContract The address of the migration contract.
     * @param migrationData The data for the migration contract.
     */
    function upgradeDistribution(
        Distribution memory newConfig,
        address migrationContract,
        bytes calldata migrationData
    ) external returns (address[] memory instances);

    /**
     * @dev Gets all instances created by installer for a specific repository source
     * @param repository The address of the repository.
     * @return An array of addresses representing the instances.
     */
    function getInstances(IRepository repository) external view returns (address[] memory);

    /**
     * @dev Gets all instances created by installer for a specific repository source
     * @param sources The version control for the repository.
     * @return An array of addresses representing the instances.
     */
    function getInstancesByVersion(VersionControl memory sources) external view returns (address[] memory);

    /**
     * @dev Gets all distributions added to the installer.
     * @return An array of addresses representing the repositories.
     */
    function getDistributions() external view returns (Distribution[] memory);

    /**
     * @dev Gets the repository associated with a specific instance.
     * @param instance The address of the instance.
     * @return The address of the repository.
     */
    function getDistributor(IRepository instance) external view returns (Distribution memory);

    /**
     * @dev Gets the version of a specific instance.
     * @param instance The address of the instance.
     * @return The version of the instance.
     */
    function getVersion(address instance) external view returns (Tag memory);

    /**
     * @dev Gets the installation plan for a specific repository.
     * @param repository The address of the repository.
     * @return The installation plan for the repository.
     */
    function getDistribution(IRepository repository) external view returns (Distribution memory);
}
