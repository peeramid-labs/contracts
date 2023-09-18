// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {IERC1155} from "@openzeppelin/contracts/interfaces/IERC1155.sol";

interface IRankToken is IERC1155 {
    event RankingInstanceUpdated(address indexed newRankingInstance);
    event TokensLocked(address indexed account, uint256 indexed id, uint256 value);
    event TokensUnlocked(address indexed account, uint256 indexed id, uint256 value);
    event LevelUp(address indexed account, uint256 id);

    function mint(address to, uint256 amount, uint256 poolId, bytes memory data) external;

    function batchMint(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external;

    function levelUp(address to, uint256 id, bytes memory data) external;

    function updateRankingInstance(address newRankingInstance) external;

    function getRankingInstance() external view returns (address);

    function findNewRank(address account, uint256 oldRank) external view returns (uint256);

    function getAccountRank(address account) external view returns (uint256);

    function unlockFromInstance(address account, uint256 id, uint256 amount) external;

    function lockInInstance(address account, uint256 id, uint256 amount) external;

    function balanceOfUnlocked(address account, uint256 id) external view returns (uint256);
}
