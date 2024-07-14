// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {IRankifyInstanceCommons} from "../interfaces/IRankifyInstanceCommons.sol";

import "../abstracts/draft-EIP712Diamond.sol";
import "../vendor/diamond/libraries/LibDiamond.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {ERC165Checker} from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

error ZeroValue();
error WrongAddress();
error OutOfBounds();

contract RankifyInstanceGameOwnersFacet {
    using LibTBG for LibTBG.GameInstance;
    using LibTBG for uint256;
    using LibTBG for LibTBG.GameSettings;

    function RInstanceStorage() internal pure returns (IRankifyInstanceCommons.RInstanceSettings storage bog) {
        bytes32 position = LibTBG.getDataStorage();
        assembly {
            bog.slot := position
        }
    }

    /**
     * @dev Sets the game price. `newPrice` is the new game price.
     *
     * Modifies:
     *
     * - Sets the game price to `newPrice`.
     *
     * Requirements:
     *
     * - The caller must be the contract owner.
     */
    function setGamePrice(uint256 newPrice) external {
        LibDiamond.enforceIsContractOwner();
        IRankifyInstanceCommons.RInstanceSettings storage _RInstance = RInstanceStorage();
        _RInstance.gamePrice = newPrice;
    }

    /**
     * @dev Sets the join game price. `newPrice` is the new join game price.
     *
     * Modifies:
     *
     * - Sets the join game price to `newPrice`.
     *
     * Requirements:
     *
     * - The caller must be the contract owner.
     */
    function setJoinGamePrice(uint256 newPrice) external {
        LibDiamond.enforceIsContractOwner();
        IRankifyInstanceCommons.RInstanceSettings storage _RInstance = RInstanceStorage();
        _RInstance.joinGamePrice = newPrice;
    }

    /**
     * @dev Sets the rank token address. `newRankToken` is the new rank token address.
     *
     * Modifies:
     *
     * - Sets the rank token address to `newRankToken`.
     *
     * Requirements:
     *
     * - The caller must be the contract owner.
     * - `newRankToken` must not be the zero address.
     * - `newRankToken` must support the ERC1155 interface.
     */
    function setRankTokenAddress(address newRankToken) external {
        LibDiamond.enforceIsContractOwner();
        if (newRankToken == address(0)) {
            require(false, "zerovalue"); //revert ZeroValue();
        }
        if (!ERC165Checker.supportsInterface(newRankToken, type(IERC1155).interfaceId)) {
            require(false, "wrongaddress"); //revert WrongAddress();
        }

        IRankifyInstanceCommons.RInstanceSettings storage _RInstance = RInstanceStorage();
        _RInstance.rankTokenAddress = newRankToken;
    }

    /**
     * @dev Sets the time per turn. `newTimePerTurn` is the new time per turn.
     *
     * Modifies:
     *
     * - Sets the time per turn to `newTimePerTurn`.
     *
     * Requirements:
     *
     * - The caller must be the contract owner.
     */
    function setTimePerTurn(uint256 newTimePerTurn) external {
        LibDiamond.enforceIsContractOwner();
        if (newTimePerTurn == 0) {
            require(false, "zerovalue"); // revert ZeroValue();
        }
        LibTBG.TBGStorageStruct storage tbg = LibTBG.TBGStorage();
        tbg.settings.timePerTurn = newTimePerTurn;
    }

    /**
     * @dev Sets the maximum number of players in a game. `newMaxPlayersSize` is the new maximum number of players.
     *
     * Modifies:
     *
     * - Sets the maximum number of players to `newMaxPlayersSize`.
     *
     * Requirements:
     *
     * - The caller must be the contract owner.
     * - `newMaxPlayersSize` must be greater than or equal to the minimum number of players.
     */
    function setMaxPlayersSize(uint256 newMaxPlayersSize) external {
        LibDiamond.enforceIsContractOwner();
        LibTBG.TBGStorageStruct storage tbg = LibTBG.TBGStorage();
        if (newMaxPlayersSize < tbg.settings.minPlayersSize) {
            require(false, "outofbonds"); // revert OutOfBounds();
        }
        tbg.settings.maxPlayersSize = newMaxPlayersSize;
    }

    /**
     * @dev Sets the minimum number of players in a game. `newMinPlayersSize` is the new minimum number of players.
     *
     * Modifies:
     *
     * - Sets the minimum number of players to `newMinPlayersSize`.
     *
     * Requirements:
     *
     * - The caller must be the contract owner.
     * - `newMinPlayersSize` must be less than or equal to the maximum number of players.
     */
    function setMinPlayersSize(uint256 newMinPlayersSize) external {
        LibDiamond.enforceIsContractOwner();
        LibTBG.TBGStorageStruct storage tbg = LibTBG.TBGStorage();
        if (newMinPlayersSize > tbg.settings.maxPlayersSize) {
            require(false, "outofbonds"); // revert OutOfBounds();
        }
        tbg.settings.minPlayersSize = newMinPlayersSize;
    }

    /**
     * @dev Sets the time to join a game. `newTimeToJoin` is the new time to join.
     *
     * Modifies:
     *
     * - Sets the time to join to `newTimeToJoin`.
     *
     * Requirements:
     *
     * - The caller must be the contract owner.
     * - `newTimeToJoin` must not be zero.
     */
    function setTimeToJoin(uint256 newTimeToJoin) external {
        LibDiamond.enforceIsContractOwner();
        if (newTimeToJoin == 0) {
            require(false, "ZeroValue"); //revert ZeroValue();
        }
        LibTBG.TBGStorageStruct storage tbg = LibTBG.TBGStorage();
        tbg.settings.timeToJoin = newTimeToJoin;
    }

    /**
     * @dev Sets the maximum number of turns in a game. `newMaxTurns` is the new maximum number of turns.
     *
     * Modifies:
     *
     * - Sets the maximum number of turns to `newMaxTurns`.
     *
     * Requirements:
     *
     * - The caller must be the contract owner.
     * - `newMaxTurns` must not be zero.
     */
    function setMaxTurns(uint256 newMaxTurns) external {
        LibDiamond.enforceIsContractOwner();
        if (newMaxTurns == 0) {
            require(false, "ZeroValue"); // revert ZeroValue();
        }
        LibTBG.TBGStorageStruct storage tbg = LibTBG.TBGStorage();
        tbg.settings.maxTurns = newMaxTurns;
    }
}
