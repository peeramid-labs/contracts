// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@peeramid-labs/eds/src/abstracts/Distributor.sol";
import "@openzeppelin/contracts/access/extensions/AccessControlDefaultAdminRules.sol";

contract PeeramidLabsDistributor is Distributor, AccessControlDefaultAdminRules {
    constructor(address defaultAdmin) Distributor() AccessControlDefaultAdminRules(3 days, defaultAdmin) {}

    function addDistribution(bytes32 id, address initializer) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _addDistribution(id, initializer);
    }

    function instantiate(bytes32 id, bytes calldata args) external returns (address[] memory srcs, bytes32 name, uint256 version) {
        return _instantiate(id, args);
    }

    function removeDistribution(bytes32 id) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _removeDistribution(id);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControlDefaultAdminRules, Distributor) returns (bool) {
        return AccessControlDefaultAdminRules.supportsInterface(interfaceId) || Distributor.supportsInterface(interfaceId);
    }
}
