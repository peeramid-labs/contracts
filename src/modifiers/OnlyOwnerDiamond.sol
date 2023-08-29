// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "../vendor/libraries/LibDiamond.sol";

// import "./interfaces/IERC173.sol";

contract OnlyOwnerDiamond {
    modifier onlyOwner() {
        LibDiamond.enforceIsContractOwner();
        _;
    }
}
