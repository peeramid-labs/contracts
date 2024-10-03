// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@peeramid-labs/eds/src/abstracts/Distributor.sol";
import "@openzeppelin/contracts/access/extensions/AccessControlDefaultAdminRules.sol";

/**
 * @title PeeramidLabsDistributor
 * @notice This contract is a distributor for Peeramid Labs.
 * It is designed to handle the distribution logic specific to Peeramid Labs.
 * The contract leverages access control mechanisms to ensure that only authorized
 * users can perform certain actions.
 * @author Peeramid Labs, 2024
 */
contract PeeramidLabsDistributor is Distributor, AccessControlDefaultAdminRules {
    constructor(address defaultAdmin) Distributor() AccessControlDefaultAdminRules(3 days, defaultAdmin) {}

    /**
     * @notice Adds a new distribution with the given identifier and initializer address.
     * @dev This function can only be called by an account with the `DEFAULT_ADMIN_ROLE`.
     * @param id The unique identifier for the distribution.     * @param initializer The address that initializes the distribution.
     */
    function addDistribution(bytes32 id, address initializer) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _addDistribution(id, initializer);
    }

    /**
     * @notice Instantiates a new contract with the given identifier and arguments.
     * @param id The unique identifier for the contract to be instantiated.
     * @param args The calldata arguments required for the instantiation process.
     * @return srcs An array of instantiated infrastructure
     * @return name The name of the instantiated distribution.
     * @return version The version number of the instantiated distribution.
     */
    function instantiate(
        bytes32 id,
        bytes calldata args
    ) external returns (address[] memory srcs, bytes32 name, uint256 version) {
        return _instantiate(id, args);
    }

    /**
     * @notice Removes a distribution entry identified by the given ID.
     * @dev This function can only be called by an account with the `DEFAULT_ADMIN_ROLE`.
     * @param id The unique identifier of the distribution entry to be removed.
     */
    function removeDistribution(bytes32 id) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _removeDistribution(id);
    }

    /**
     *
     * This function checks if the contract implements the interface defined by ERC165
     *
     * @param interfaceId The interface identifier, as specified in ERC-165.
     * @return `true` if the contract implements `interfaceId` and
     * `interfaceId` is not 0xffffffff, `false` otherwise.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(AccessControlDefaultAdminRules, Distributor) returns (bool) {
        return
            AccessControlDefaultAdminRules.supportsInterface(interfaceId) || Distributor.supportsInterface(interfaceId);
    }

    function changeVersion(
        bytes32 distributionId,
        LibSemver.VersionRequirement memory newRequirement
    ) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        super._changeVersion(distributionId, newRequirement);
    }

    // @inheritdoc IDistributor
    function addDistribution(
        IRepository repository,
        address initializer,
        LibSemver.VersionRequirement memory requirement
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        super._addDistribution(address(repository), initializer, requirement);
    }
}
