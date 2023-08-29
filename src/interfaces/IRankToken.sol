// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IRankToken {
    function mint(address to, uint256 amount, uint256 poolId, bytes memory data) external;
    function batchMint(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external;
}