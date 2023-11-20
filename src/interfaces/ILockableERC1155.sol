// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC1155} from "@openzeppelin/contracts/interfaces/IERC1155.sol";

interface ILockableERC1155 is IERC1155 {
    event TokensLocked(address indexed account, uint256 indexed id, uint256 value);
    event TokensUnlocked(address indexed account, uint256 indexed id, uint256 value);

    function lock(address account, uint256 id, uint256 amount) external;

    function unlock(address account, uint256 id, uint256 amount) external;

    function unlockedBalanceOf(address account, uint256 id) external view returns (uint256);
}
