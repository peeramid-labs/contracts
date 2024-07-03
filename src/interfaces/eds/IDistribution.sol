// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRepository, Tag, Version} from "./IRepository.sol";

/**
 * @title IDistribution
 * @notice Interface for the Distributon contract.
 * @notice The Distributon contract is responsible for serving package information on groups of source code from version controlled repositories.
 * @notice NB: Distributed sources MUST implement IRepository
 * @author Peersky
 */
interface IDistribution {
    error InvalidVersion(address repository, VersionRequirement requirement);

    /**
     * @notice Retrieves the distribution ID.
     * @dev Distribution Id is calculated as keccak256(abi.encodePacked(requiredSources[].codeHash, initializerFnSelectors))
     * @return The distribution ID.
     *
     */
    function getDistributionId() external view returns (bytes32);

    /**
     * @dev Retrieves the distribution.
     * @return The distribution.
     */
    function getDistribution() external view returns (Distribution memory);
}

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
    // Other types: TBD. Thinking to replace this with a bitmasks
}

/**
 * @dev Struct defining a version requirement for a repository.
 * @param baseVersion The base version to match against.
 * @param requirementType type of requirement counted from baseVersion Tag
 */
struct VersionRequirement {
    Tag baseVersion;
    VersionRequirementTypes requirementType;
}

/**
 * @dev Struct defining a distribution of a repository.
 * @param requiredSources The required sources for the distribution.
 * @param initializerFnSelectors The selectors for the initializer functions to call on the distribution.
 */
struct Distribution {
    VersionRequirement[] requiredSources;
    bytes4[][] initializerFnSelectors;
}
