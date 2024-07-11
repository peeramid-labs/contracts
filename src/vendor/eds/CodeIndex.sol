// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./interfaces/ICodeIndex.sol";
contract CodeIndex is ICodeIndex {
    mapping(bytes32 => address) private index;

    function register(address container) external {
        address etalon = index[container.codehash];
        if (etalon != address(0)) {
            revert alreadyExists(container.codehash, etalon);
        }
        index[container.codehash] = container;
        emit Indexed(container, container.codehash);
    }

    function get(bytes32 id) external view returns (address) {
        return index[id];
    }
}
