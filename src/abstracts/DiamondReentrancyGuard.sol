// SPDX-License-Identifier: Apache-2.0

/**
 * Author: @Peersky https://github.com/peersky
 * Adapted this diamond reentrancy guard from:

 * Authors: Moonstream Engineering (engineering@moonstream.to)
 * GitHub: https://github.com/bugout-dev/dao
 */

pragma solidity ^0.8.0;
import "../libraries/LibReentrancyGuard.sol";

abstract contract DiamondReentrancyGuard {
    modifier nonReentrant() {
        LibReentrancyGuard.ReentrancyGuardStruct
            storage rgs = LibReentrancyGuard.reentrancyGuardStorage();
        require(!rgs._entered, "REG: You shall not pass!");
        rgs._entered = true;
        _;
        rgs._entered = false;
    }
}