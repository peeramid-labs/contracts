// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {IRankifyInstance} from "../interfaces/IRankifyInstance.sol";

import {IERC1155Receiver} from "../interfaces/IERC1155Receiver.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "../abstracts/DiamondReentrancyGuard.sol";
import {LibRankify} from "../libraries/LibRankify.sol";
import {LibCoinVending} from "../libraries/LibCoinVending.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../abstracts/draft-EIP712Diamond.sol";
import "hardhat/console.sol";
import { IErrors } from "../interfaces/IErrors.sol";

contract RankifyInstanceMainFacet is
    IRankifyInstance,
    IERC1155Receiver,
    DiamondReentrancyGuard,
    IERC721Receiver,
    EIP712,
    IErrors
{
    using LibTBG for LibTBG.Instance;
    using LibTBG for uint256;
    using LibTBG for LibTBG.Settings;
    using LibRankify for uint256;


    /**
     * @dev Creates a new game with the provided game master, game ID, and game rank. Optionally, additional ranks can be provided. `gameMaster` is the address of the game master. `gameId` is the ID of the new game. `gameRank` is the rank of the new game. `additionalRanks` is the array of additional ranks.
     *
     * emits a _GameCreated_ event.
     *
     * Requirements:
     *  There are some game price requirments that must be met under gameId.newGame function that are set during the contract initialization and refer to the contract maintainer benefits.
     *
     * Modifies:
     *
     * - Calls the `newGame` function with `gameMaster`, `gameRank`, and `msg.sender`.
     * - Configures the coin vending with `gameId` and an empty configuration.
     * - If `additionalRanks` is not empty, mints rank tokens for each additional rank and sets the additional ranks of the game with `gameId` to `additionalRanks`.
     */
    function createGame(LibRankify.NewGameParams memory params) private nonReentrant {
        LibRankify.newGame(params);
        LibCoinVending.ConfigPosition memory emptyConfig;
        LibCoinVending.configure(bytes32(params.gameId), emptyConfig);
        emit gameCreated(params.gameId, params.gameMaster, msg.sender, params.gameRank);
    }

    function createGame(IRankifyInstance.NewGameParamsInput memory params) public {
        LibRankify.enforceIsInitialized();
        LibRankify.InstanceState storage settings = LibRankify.instanceState();
        LibRankify.NewGameParams memory newGameParams = LibRankify.NewGameParams({
            gameId: settings.numGames + 1,
            gameRank: params.gameRank,
            creator: msg.sender,
            minPlayerCnt: params.minPlayerCnt,
            maxPlayerCnt: params.maxPlayerCnt,
            gameMaster: params.gameMaster,
            nTurns: params.nTurns,
            voteCredits: params.voteCredits,
            minGameTime: params.minGameTime,
            timePerTurn: params.timePerTurn,
            timeToJoin: params.timeToJoin
        });

        createGame(newGameParams);
    }

    /**
     * @dev Handles a player quitting a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player.
     *
     * emits a _PlayerLeft_ event.
     *
     * Modifies:
     *
     * - Refunds the coins for `player` in the game with `gameId`.
     */
    function onPlayerQuit(uint256 gameId, address player) private {
        LibCoinVending.refund(bytes32(gameId), player);
        emit PlayerLeft(gameId, player);
    }

    /**
     * @dev Cancels a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Modifies:
     *
     * - Calls the `enforceIsGameCreator` function with `msg.sender`.
     *
     * Requirements:
     *
     * - The caller must be the game creator of the game with `gameId`.
     * - Game must not be started.
     */
    function cancelGame(uint256 gameId) public nonReentrant {
        gameId.enforceIsGameCreator(msg.sender);
        gameId.cancelGame(onPlayerQuit);
        emit GameClosed(gameId);
    }

    /**
     * @dev Allows a player to leave a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Modifies:
     *
     * - Calls the `quitGame` function with `msg.sender`, `true`, and `onPlayerQuit`.
     *
     * Requirements:
     *
     * - The caller must be a player in the game with `gameId`.
     * - Game must not be started.
     */
    function leaveGame(uint256 gameId) public nonReentrant {
        gameId.quitGame(msg.sender, true, onPlayerQuit);
    }

    /**
     * @dev Opens registration for a game with the provided game ID. `gameId` is the ID of the game.
     *
     * emits a _RegistrationOpen_ event.
     *
     * Modifies:
     *
     * - Calls the `enforceIsGameCreator` function with `msg.sender`.
     * - Calls the `enforceIsPreRegistrationStage` function.
     * - Calls the `openRegistration` function.
     *
     * Requirements:
     *
     * - The caller must be the game creator of the game with `gameId`.
     * - The game with `gameId` must be in the pre-registration stage.
     */
    function openRegistration(uint256 gameId) public {
        gameId.enforceGameExists();
        gameId.enforceIsGameCreator(msg.sender);
        gameId.enforceIsPreRegistrationStage();
        gameId.openRegistration();
        emit RegistrationOpen(gameId);
    }

    /**
     * @dev Allows a player to join a game with the provided game ID. `gameId` is the ID of the game.
     *
     * emits a _PlayerJoined_ event.
     *
     * Modifies:
     *
     * - Calls the `joinGame` function with `msg.sender`.
     * - Calls the `fund` function with `bytes32(gameId)`.
     *
     * Requirements:
     *
     * - The caller must not be a player in the game with `gameId`.
     * - Game phase must be registration.
     * - Caller must be able to fulfill funding requirements.
     */
    function joinGame(uint256 gameId) public payable nonReentrant {
        gameId.joinGame(msg.sender);
        LibCoinVending.fund(bytes32(gameId));
        emit PlayerJoined(gameId, msg.sender);
    }

    /**
     * @dev Starts a game with the provided game ID early. `gameId` is the ID of the game.
     *
     * emits a _GameStarted_ event.
     *
     * Modifies:
     *
     * - Calls the `enforceGameExists` function.
     * - Calls the `startGameEarly` function.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     */
    function startGame(uint256 gameId) public {
        gameId.enforceGameExists();
        gameId.startGameEarly();
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

    function getContractState() public pure returns (LibRankify.InstanceState memory) {
        LibRankify.InstanceState memory state = LibRankify.instanceState();
        return state;
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
        return gameId.getGameState().createdBy;
    }

    function getGameRank(uint256 gameId) public view returns (uint256) {
        return gameId.getGameState().rank;
    }

    function getPlayers(uint256 gameId) public view returns (address[] memory) {
        return gameId.getPlayers();
    }

    function canStartGame(uint256 gameId) public view returns (bool) {
        return gameId.canStartEarly();
    }

    function canEndTurn(uint256 gameId) public view returns (bool) {
        return gameId.canEndTurnEarly();
    }

    function isPlayerTurnComplete(uint256 gameId, address player) public view returns (bool) {
        return gameId.isPlayerTurnComplete(player);
    }

    function getPlayerVotedArray(uint256 gameId) public view returns (bool[] memory) {
        LibRankify.GameState storage game = gameId.getGameState();
        address[] memory players = gameId.getPlayers();
        bool[] memory playerVoted = new bool[](players.length);
        for (uint256 i = 0; i < players.length; ++i) {
            playerVoted[i] = game.playerVoted[players[i]];
        }
        return playerVoted;
    }

    function getPlayersMoved(uint256 gameId) public view returns (bool[] memory, uint256) {
        LibTBG.State storage game = gameId._getState();
        address[] memory players = gameId.getPlayers();
        bool[] memory playersMoved = new bool[](players.length);
        for (uint256 i = 0; i < players.length; ++i) {
            playersMoved[i] = game.madeMove[players[i]];
        }
        return (playersMoved, game.numPlayersMadeMove);
    }
}
