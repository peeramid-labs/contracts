// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {IRankifyInstanceCommons} from "../interfaces/IRankifyInstanceCommons.sol";

import "../abstracts/draft-EIP712Diamond.sol";
import "../vendor/libraries/LibDiamond.sol";
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

    function setGamePrice(uint256 newPrice) external {
        LibDiamond.enforceIsContractOwner();
        IRankifyInstanceCommons.RInstanceSettings storage _RInstance = RInstanceStorage();
        _RInstance.gamePrice = newPrice;
    }

    function setJoinGamePrice(uint256 newPrice) external {
        LibDiamond.enforceIsContractOwner();
        IRankifyInstanceCommons.RInstanceSettings storage _RInstance = RInstanceStorage();
        _RInstance.joinGamePrice = newPrice;
    }

    function setRankTokenAddress(address newRankToken) external {
        LibDiamond.enforceIsContractOwner();
        if (newRankToken == address(0)) {
            require(false, 'zerovalue'); //revert ZeroValue();
        }
        if (!ERC165Checker.supportsInterface(newRankToken, type(IERC1155).interfaceId)) {
            require(false, 'wrongaddress'); //revert WrongAddress();
        }

        IRankifyInstanceCommons.RInstanceSettings storage _RInstance = RInstanceStorage();
        _RInstance.rankTokenAddress = newRankToken;
    }

    function setTimePerTurn(uint256 newTimePerTurn) external {
        LibDiamond.enforceIsContractOwner();
        if (newTimePerTurn == 0) {
            require(false, 'zerovalue'); // revert ZeroValue();
        }
        LibTBG.TBGStorageStruct storage tbg = LibTBG.TBGStorage();
        tbg.settings.timePerTurn = newTimePerTurn;
    }

    function setMaxPlayersSize(uint256 newMaxPlayersSize) external {
        LibDiamond.enforceIsContractOwner();
        LibTBG.TBGStorageStruct storage tbg = LibTBG.TBGStorage();
        if (newMaxPlayersSize < tbg.settings.minPlayersSize) {
            require(false, 'outofbonds'); // revert OutOfBounds();
        }
        tbg.settings.maxPlayersSize = newMaxPlayersSize;
    }

    function setMinPlayersSize(uint256 newMinPlayersSize) external {
        LibDiamond.enforceIsContractOwner();
        LibTBG.TBGStorageStruct storage tbg = LibTBG.TBGStorage();
        if (newMinPlayersSize > tbg.settings.maxPlayersSize) {
             require(false, 'outofbonds'); // revert OutOfBounds();
        }
        tbg.settings.minPlayersSize = newMinPlayersSize;
    }

    function setTimeToJoin(uint256 newTimeToJoin) external {
        LibDiamond.enforceIsContractOwner();
        if (newTimeToJoin == 0) {
             require(false, 'ZeroValue'); //revert ZeroValue();
        }
        LibTBG.TBGStorageStruct storage tbg = LibTBG.TBGStorage();
        tbg.settings.timeToJoin = newTimeToJoin;
    }

    function setMaxTurns(uint256 newMaxTurns) external {
        LibDiamond.enforceIsContractOwner();
        if (newMaxTurns == 0) {
            require(false, 'ZeroValue'); // revert ZeroValue();
        }
        LibTBG.TBGStorageStruct storage tbg = LibTBG.TBGStorage();
        tbg.settings.maxTurns = newMaxTurns;
    }
}
