// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRepository} from "./IRepository.sol";
import {Tag, Version, VersionControl, Envelope} from "./IVTag.sol";
import {Distribution} from "./IDistributor.sol";

interface IInstallationTarget {
    /**
     * @dev Event emitted when installed instance is upgraded to a new minor version.
     * @param instance The address of the instance.
     * @param oldMinor The old minor version.
     * @param newMinor The new minor version.
     * @param build The build number.
     * @param metadata The metadata associated with the upgrade.
     */
    event UpgradedMinor(
        address indexed instance,
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
}
