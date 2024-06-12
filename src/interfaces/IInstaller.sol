// SPDX-License-Identifier: MIT
import {Distribution} from "./IDistributor.sol";
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
interface IInstaller {
    /**
     * @dev Event emitted when a new instance is instantiated from a distribution.
     * @param newInstance The address of the new instance.
     * @param repository The address of the repository.
     * @param instantiator The address of the account that instantiated the instance.
     * @param version The version of the repository used for instantiation.
     * @param metadata The metadata associated with the instance.
     */
    event Installed(
        address indexed newInstance,
        IRepository indexed repository,
        address indexed instantiator,
        Tag version,
        bytes metadata
    );

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

    function uninstall(address instance) external;
}
