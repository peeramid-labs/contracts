// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ILockableERC1155} from "./ILockableERC1155.sol";

interface IRankToken is ILockableERC1155 {
    event RankingInstanceUpdated(address indexed newRankingInstance);

    event LevelUp(address indexed account, uint256 id);

    function mint(address to, uint256 amount, uint256 poolId, bytes memory data) external;

    function batchMint(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external;

    function levelUp(address to, uint256 id, bytes memory data) external;

    /**
     * @dev Updates the address of the ranking instance contract.
     * @param newRankingInstance The new address of the ranking instance contract.
     */
    function updateRankingInstance(address newRankingInstance) external;

    function getRankingInstance() external view returns (address);

    function findNewRank(address account, uint256 oldRank) external view returns (uint256);

    function getAccountRank(address account) external view returns (uint256);
}
