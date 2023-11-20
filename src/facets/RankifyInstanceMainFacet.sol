// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {IRankifyInstanceCommons} from "../interfaces/IRankifyInstanceCommons.sol";

import {IERC1155Receiver} from "../interfaces/IERC1155Receiver.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IRankToken} from "../interfaces/IRankToken.sol";
import "../abstracts/DiamondReentrancyGuard.sol";
import {LibRankify} from "../libraries/LibRankify.sol";
import {LibCoinVending} from "../libraries/LibCoinVending.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../abstracts/draft-EIP712Diamond.sol";

import "hardhat/console.sol";

contract RankifyInstanceMainFacet is IRankifyInstanceCommons, IERC1155Receiver, DiamondReentrancyGuard, IERC721Receiver, EIP712 {
    using LibTBG for LibTBG.GameInstance;
    using LibTBG for uint256;
    using LibTBG for LibTBG.GameSettings;
    using LibRankify for uint256;

    function checkSignature(bytes memory message, bytes memory signature, address account) private view returns (bool) {
        bytes32 typedHash = _hashTypedDataV4(keccak256(message));
        return SignatureChecker.isValidSignatureNow(account, typedHash, signature);
    }

    function _isValidSignature(
        bytes memory message,
        bytes memory signature,
        address account
    ) private view returns (bool) {
        return checkSignature(message, signature, account);
    }

    function RInstanceStorage() internal pure returns (RInstanceSettings storage bog) {
        bytes32 position = LibTBG.getDataStorage();
        assembly {
            bog.slot := position
        }
    }

    function createGame(address gameMaster, uint256 gameId, uint256 gameRank) public nonReentrant {
        gameId.newGame(gameMaster, gameRank, msg.sender);
        LibCoinVending.ConfigPosition memory emptyConfig;
        LibCoinVending.configure(bytes32(gameId), emptyConfig);
        emit gameCreated(gameId, gameMaster, msg.sender, gameRank);
    }

    function createGame(address gameMaster, uint256 gameId, uint256 gameRank, address[] memory additionalRanks) public {
        createGame(gameMaster, gameId, gameRank);
        RInstance storage game = gameId.getGameStorage();
        if (additionalRanks.length != 0) {
            for (uint256 i = 0; i < additionalRanks.length; i++) {
                IRankToken additonalRank = IRankToken(additionalRanks[i]);
                require(additonalRank.supportsInterface(type(IRankToken).interfaceId), "must support rank interface");
                require(additonalRank.getRankingInstance() == address(this), "must be rankingInstance");
                additonalRank.mint(address(this), 1, gameRank + 1, "");
                additonalRank.mint(address(this), 3, gameRank, "");
            }
            game.additionalRanks = additionalRanks;
        }
    }

    function createGame(address gameMaster, uint256 gameRank) public {
        LibRankify.enforceIsInitialized();
        RInstanceSettings storage settings = RInstanceStorage();
        createGame(gameMaster, settings.numGames + 1, gameRank);
    }

    function onPlayerQuit(uint256 gameId, address player) private {
        LibCoinVending.refund(bytes32(gameId), player);
        emit PlayerLeft(gameId, player);
    }

    function cancelGame(uint256 gameId) public nonReentrant {
        gameId.enforceIsGameCreator(msg.sender);
        gameId.cancelGame(onPlayerQuit, LibDiamond.contractOwner());
        emit GameClosed(gameId);
    }

    function leaveGame(uint256 gameId) public nonReentrant {
        gameId.quitGame(msg.sender, true, onPlayerQuit);
    }

    function openRegistration(uint256 gameId) public {
        gameId.enforceIsGameCreator(msg.sender);
        gameId.enforceIsPreRegistrationStage();
        gameId.openRegistration();
        emit RegistrationOpen(gameId);
    }

    function joinGame(uint256 gameId) public payable nonReentrant {
        gameId.joinGame(msg.sender);
        LibCoinVending.fund(bytes32(gameId));
        emit PlayerJoined(gameId, msg.sender);
    }

    function startGame(uint256 gameId) public {
        gameId.enforceGameExists();
        gameId.startGame();
        emit GameStarted(gameId);
    }

    function onERC1155Received(
        address operator,
        address,
        uint256,
        uint256,
        bytes calldata
    ) public view override returns (bytes4) {
        LibRankify.enforceIsInitialized();
        if (operator == address(this)) {
            return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
        }
        return bytes4("");
    }

    function onERC1155BatchReceived(
        address operator,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external view override returns (bytes4) {
        LibRankify.enforceIsInitialized();
        if (operator == address(this)) {
            return bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"));
        }
        return bytes4("");
    }

    function onERC721Received(
        address operator,
        address,
        uint256,
        bytes calldata
    ) external view override returns (bytes4) {
        LibRankify.enforceIsInitialized();
        if (operator == address(this)) {
            return IERC721Receiver.onERC721Received.selector;
        }
        return bytes4("");
    }

    function getContractState() public view returns (RInstanceState memory) {
        RInstanceSettings storage settings = RInstanceStorage();
        LibTBG.GameSettings memory tbgSettings = LibTBG.getGameSettings();
        return (RInstanceState({BestOfState: settings, TBGSEttings: tbgSettings}));
    }

    function getTurn(uint256 gameId) public view returns (uint256) {
        return gameId.getTurn();
    }

    function getGM(uint256 gameId) public view returns (address) {
        return gameId.getGM();
    }

    function getScores(uint256 gameId) public view returns (address[] memory, uint256[] memory) {
        return gameId.getScores();
    }

    function isOvertime(uint256 gameId) public view returns (bool) {
        return gameId.isOvertime();
    }

    function isGameOver(uint256 gameId) public view returns (bool) {
        return gameId.isGameOver();
    }

    function getPlayersGame(address player) public view returns (uint256) {
        return LibTBG.getPlayersGame(player);
    }

    function isLastTurn(uint256 gameId) public view returns (bool) {
        return gameId.isLastTurn();
    }

    function isRegistrationOpen(uint256 gameId) public view returns (bool) {
        return gameId.isRegistrationOpen();
    }

    function gameCreator(uint256 gameId) public view returns (address) {
        return gameId.getGameStorage().createdBy;
    }

    function getGameRank(uint256 gameId) public view returns (uint256) {
        return gameId.getGameStorage().rank;
    }

    function getPlayers(uint256 gameId) public view returns (address[] memory) {
        return gameId.getPlayers();
    }

    function canStartGame(uint256 gameId) public view returns (bool) {
        return gameId.canStart();
    }

    function canEndTurn(uint256 gameId) public view returns (bool)
    {
        return gameId.canEndTurnEarly();
    }

}
