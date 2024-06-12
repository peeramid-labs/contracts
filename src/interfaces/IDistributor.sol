// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.20;

// import {IRepository} from "./IRepository.sol";
// import {Tag, Version, VersionControl, Envelope} from "./IVTag.sol";

// /**
//  * @title IDistributor
//  * @author Peersky
//  * @notice Interface for managing the distribution of repositories.
//  */
// interface IDistributor {
//     /**
//      * @dev Error thrown when a repository is not added to the installer.
//      */
//     error NotDistributing(IRepository repository);

//     /**
//      * @dev Error thrown when the version does not match the requirement for a repository.
//      */
//     error VersionOutOfBounds(address repository, Tag version, Tag requiredTag);

//     /**
//      * @dev Error thrown when the instance is deprecated.
//      */
//     error VersionDeprecated(address instance, address source, Tag oldVersion, VersionControl vcs);

//     /**
//      * @dev Event emitted when the installer for repository is updated.
//      * @param repository The address of the repository.
//      * @param oldInstaller The old version requirement for the repository.
//      * @param newInstaller The new version requirement for the repository.
//      */
//     event DistributionChanged(IRepository indexed repository, Distribution oldInstaller, Distribution newInstaller);

//     /**
//      * @dev Event emitted when a repository is added to the installer.
//      * @param repository The address of the repository.
//      * @param adder The address of the account that added the repository.
//      * @param requirement The version requirement for the repository.
//      * @param metadata The metadata associated with the repository.
//      */
//     event DistributionCreated(
//         IRepository indexed repository,
//         address indexed adder,
//         VersionControl requirement,
//         bytes32 metadata
//     );

//     /**
//      * @dev Event emitted when a repository is removed from the installer.
//      * @param repository The address of the repository.
//      */
//     event DistributionRemoved(IRepository indexed repository);

//     /**
//      * @dev Adds new source repository to the installer.
//      * @param config The configuration for the source repository.
//      * @param metadata The metadata associated with the source repository.
//      */
//     function addDistribution(Distribution memory config, bytes32 metadata) external;

//     /**
//      * @dev Removes a repository from the installer.
//      * @param repository The address of the repository.
//      */
//     function removeDistribution(IRepository repository) external;

//     /**
//      * @dev Upgrades versioned source new requirements.
//      * @param newConfig The new configuration for the source repository.
//      * @param migrationContract The address of the migration contract.
//      * @param migrationData The data for the migration contract.
//      */
//     function upgradeDistribution(
//         Distribution memory newConfig,
//         address migrationContract,
//         bytes calldata migrationData
//     ) external returns (address[] memory instances);

//     /**
//      * @dev Gets all distributions added to the installer.
//      * @return An array of addresses representing the repositories.
//      */
//     function getDistributions() external view returns (Distribution[] memory);

//     /**
//      * @dev Gets the installation plan for a specific repository.
//      * @param repository The address of the repository.
//      * @return The installation plan for the repository.
//      */
//     function getDistribution(IRepository repository) external view returns (Distribution memory);
// }

// /**
//  * @dev Enum defining the types of installation for repositories.
//  * - Cloneable: The repository is cloneable.
//  * - Constructable: The repository is constructable.
//  */
// enum DistributionTypes {
//     Cloneable,
//     Constructable
// }

// /**
//  * @dev Struct defining the installation plan for a repository.
//  * @param requiredSource The source of the repository required for installation.
//  * @param initializerFnSelectors The function selectors for the initializers to call after installation.
//  */
// struct Distribution {
//     VersionControl requiredSource;
//     bytes4[] initializerFnSelectors;
//     DistributionTypes installationType;
// }
