// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";
// import {EnumerableMap} from "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {LibArray} from "../libraries/LibArray.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title LibTBG
 * @dev Library for managing turn-based games.
 * It is designed to be used as a base library for games, and provides the following functionality:
 * - setting game settings such as time per turn, max players, min players, etc as well as perform score and leaderboard tracking
 *
 * Limitations:
 * - It is assumed there is only one game per player
 * - It is assumed there is only on game master per game
 *
 * ***WARNING*** Some limitations:
 * - This library is still under development and its interfaces may change.
 * - getting game data (which has own storage assigement and can be encapsulated from library) however there is no storage slot collision checks in place
 *
 */
library LibTBG {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct GameSettings {
        uint256 timePerTurn;
        uint256 maxPlayersSize;
        uint256 minPlayersSize;
        uint256 timeToJoin;
        uint256 maxTurns;
        uint256 numWinners;
        uint256 voteCredits;
    }

    struct GameInstance {
        address gameMaster;
        uint256 currentTurn;
        uint256 turnStartedAt;
        uint256 registrationOpenAt;
        bool hasStarted;
        bool hasEnded;
        EnumerableSet.AddressSet players;
        mapping(address => bool) madeMove;
        uint256 numPlayersMadeMove;
        mapping(address => uint256) score;
        bytes32 implemenationStoragePointer;
        bool isOvertime;
        address[] leaderboard;
    }

    struct TBGStorageStruct {
        GameSettings settings;
        mapping(uint256 => GameInstance) games;
        mapping(address => uint256) playerInGame;
        uint256 totalGamesCreated;
    }

    bytes32 constant TBG_STORAGE_POSITION = keccak256("turnbasedgame.storage.position");
    bytes32 constant IMPLEMENTATION_STORAGE_POSITION = keccak256("implementation.turnbasedgame.storage.position");

    function TBGStorage() internal pure returns (TBGStorageStruct storage es) {
        bytes32 position = TBG_STORAGE_POSITION;
        assembly {
            es.slot := position
        }
    }

    function _getGame(uint256 gameId) internal view returns (GameInstance storage) {
        TBGStorageStruct storage tbg = TBGStorage();
        return tbg.games[gameId];
    }

    /**
     * @dev Initializes the game with the provided settings. `settings` is the settings for the game.
     *
     * Requirements:
     *
     * - `settings.timePerTurn` must not be zero.
     * - `settings.maxPlayersSize` must not be zero.
     * - `settings.minPlayersSize` must be at least 2.
     * - `settings.maxTurns` must not be zero.
     * - `settings.numWinners` must not be zero and must be less than `settings.minPlayersSize`.
     * - `settings.timeToJoin` must not be zero.
     * - `settings.maxPlayersSize` must not be less than `settings.minPlayersSize`.
     * Modifies:
     *
     * - Sets the settings of the game to `settings`.
     */
    function init(GameSettings memory settings) internal {
        TBGStorageStruct storage tbg = TBGStorage();
        if (settings.timePerTurn == 0) require(false, "settings.timePerTurn"); //  revert invalidConfiguration('timePerTurn');
        if (settings.maxPlayersSize == 0) require(false, "settings.maxPlayersSize"); // revert invalidConfiguration('maxPlayersSize');
        if (settings.minPlayersSize < 2) require(false, "settings.minPlayersSize"); //revert invalidConfiguration('minPlayersSize');
        if (settings.maxTurns == 0) require(false, "settings.maxTurns"); //revert invalidConfiguration('maxTurns');
        if (settings.numWinners == 0 || settings.numWinners >= settings.minPlayersSize) require(false, "numWinners"); //revert invalidConfiguration('numWinners');
        if (settings.timeToJoin == 0) require(false, "timeToJoin"); // revert invalidConfiguration('timeToJoin');
        if (settings.maxPlayersSize < settings.minPlayersSize) require(false, "maxPlayersSize"); //revert invalidConfiguration('maxPlayersSize');

        tbg.settings = settings;
    }

    /**
     * @dev Creates a new game with the provided game ID and game master. `gameId` is the ID of the game. `gm` is the address of the game master.
     *
     * Requirements:
     *
     * - The game with `gameId` must not already exist.
     * - `gm` must not be the zero address.
     * - `gameId` must not be zero.
     * - The game master of the game with `gameId` must be the zero address.
     *
     * Modifies:
     *
     * - Sets the game master of the game with `gameId` to `gm`.
     * - Increments the total number of games created.
     */
    function createGame(uint256 gameId, address gm) internal {
        TBGStorageStruct storage tbg = TBGStorage();
        require(!gameExists(gameId), "createGame->Already exists");
        require(gm != address(0), "createGame->GM");
        require(gameId != 0, "createGame->gameId");
        require(tbg.games[gameId].gameMaster == address(0), "createGame->gameId");
        tbg.games[gameId].gameMaster = gm;
        tbg.totalGamesCreated += 1;

        //totalGamesCreated ensures nonce-like behaviur:
        //even if game would get deleted and re-created with same name, data storage would be different
        tbg.games[gameId].implemenationStoragePointer = keccak256(
            abi.encode(gameId, tbg.totalGamesCreated, TBG_STORAGE_POSITION)
        );
    }

    /**
     * @dev Deletes a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     *
     * Modifies:
     *
     * - Sets the game master, current turn, hasEnded, hasStarted,
     *   implementationStoragePointer, isOvertime, leaderboard, numPlayersMadeMove,
     *   players, registrationOpenAt, and turnStartedAt of the game with `gameId`
     *   to their initial values.
     * - Sets the score and madeMove of each player in the game with `gameId`
     *   to their initial values.
     */
    function deleteGame(uint256 gameId) internal {
        TBGStorageStruct storage tbg = TBGStorage();
        GameInstance storage _game = _getGame(gameId);
        address[] memory players = _game.players.values();
        for (uint256 i = 0; i < players.length; i++) {
            tbg.games[gameId].score[players[i]] = 0;
            tbg.games[gameId].madeMove[players[i]] = false;
        }
        delete tbg.games[gameId].gameMaster;
        delete tbg.games[gameId].currentTurn;
        delete tbg.games[gameId].hasEnded;
        delete tbg.games[gameId].hasStarted;
        delete tbg.games[gameId].implemenationStoragePointer;
        delete tbg.games[gameId].isOvertime;
        delete tbg.games[gameId].leaderboard;
        delete tbg.games[gameId].numPlayersMadeMove;
        delete tbg.games[gameId].players;
        delete tbg.games[gameId].registrationOpenAt;
        delete tbg.games[gameId].turnStartedAt;
    }

    /**
     * @dev Checks if a game with the provided game ID can be joined. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - A boolean indicating whether the game can be joined.
     */
    function canBeJoined(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        if (_game.hasStarted || _game.registrationOpenAt == 0) return false;
        return true;
    }

    /**
     * @dev Adds a player to a game with the provided game ID. `gameId` is the ID of the game. `participant` is the address of the player.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     * - `participant` must not already be in a game.
     * - The number of players in the game with `gameId` must be less than the maximum number of players.
     * - The game with `gameId` must be joinable.
     *
     * Modifies:
     *
     * - Adds `participant` to the players of the game with `gameId`.
     * - Sets the madeMove of `participant` in the game with `gameId` to false.
     * - Sets the game of `participant` to `gameId`.
     */
    function addPlayer(uint256 gameId, address participant) internal {
        TBGStorageStruct storage tbg = TBGStorage();
        require(gameExists(gameId), "addPlayer->invalid game");

        require(tbg.playerInGame[participant] == 0, "addPlayer->Player in game");
        GameInstance storage _game = _getGame(gameId);
        require(_game.players.length() < tbg.settings.maxPlayersSize, "addPlayer->party full");

        require(canBeJoined(gameId), "addPlayer->cant join now");
        _game.players.add(participant);
        _game.madeMove[participant] = false;
        tbg.playerInGame[participant] = gameId;
    }

    /**
     * @dev Checks if a player is in a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player.
     *
     * Returns:
     *
     * - A boolean indicating whether the player is in the game.
     */
    function isPlayerInGame(uint256 gameId, address player) internal view returns (bool) {
        TBGStorageStruct storage tbg = TBGStorage();
        return tbg.playerInGame[player] == gameId ? true : false;
    }

    /**
     * @dev Removes a player from a game with the provided game ID. `gameId` is the ID of the game. `participant` is the address of the player.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     * - `participant` must be in the game with `gameId`.
     * - The game with `gameId` must not have started or must have ended.
     *
     * Modifies:
     *
     * - Sets the game of `participant` to 0.
     * - Removes `participant` from the players of the game with `gameId`.
     */
    function removePlayer(uint256 gameId, address participant) internal {
        TBGStorageStruct storage tbg = TBGStorage();
        GameInstance storage _game = _getGame(gameId);
        require(gameExists(gameId), "game does not exist");
        require(tbg.playerInGame[participant] == gameId, "Not in the game");
        require(_game.hasStarted == false || _game.hasEnded == true, "Cannot leave once started");
        tbg.playerInGame[participant] = 0;
        _game.players.remove(participant);
    }

    /**
     * @dev Checks if the current turn in a game with the provided game ID has timed out. `gameId` is the ID of the game.
     *
     * Requirements:
     *
     * - `gameId` must not be zero.
     * - The game with `gameId` must have started.
     *
     * Returns:
     *
     * - A boolean indicating whether the current turn has timed out.
     */
    function isTurnTimedOut(uint256 gameId) internal view returns (bool) {
        TBGStorageStruct storage tbg = TBGStorage();
        GameInstance storage _game = _getGame(gameId);
        assert(gameId != 0);
        assert(_game.hasStarted == true);
        if (block.timestamp <= tbg.settings.timePerTurn + _game.turnStartedAt) return false;
        return true;
    }

    /**
     * @dev Checks if a game with the provided game ID exists. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - A boolean indicating whether the game exists.
     */
    function gameExists(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        if (_game.gameMaster != address(0)) return true;
        return false;
    }

    /**
     * @dev Enforces that a game with the provided game ID has started. `gameId` is the ID of the game.
     *
     * Requirements:
     *
     * - `gameId` must not be zero.
     * - The game with `gameId` must have started.
     */
    function enforceHasStarted(uint256 gameId) internal view {
        GameInstance storage _game = _getGame(gameId);
        assert(gameId != 0);
        require(_game.hasStarted, "Game has not yet started");
    }

    /**
     * @dev Enforces that a game with the provided game ID has started. `gameId` is the ID of the game.
     *
     * Requirements:
     *
     * - `gameId` must not be zero.
     * - The game with `gameId` must have started.
     *
     */
    function canEndTurn(uint256 gameId) internal view returns (bool) {
        bool turnTimedOut = isTurnTimedOut(gameId);
        GameInstance storage _game = _getGame(gameId);
        if (!_game.hasStarted || isGameOver(gameId)) return false;
        if (turnTimedOut) return true;
        return false;
    }

    /**
     * @dev Checks if the current turn in a game with the provided game ID can end early. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - A boolean indicating whether the current turn can end early.
     */
    function canEndTurnEarly(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        bool everyoneMadeMove = (_game.numPlayersMadeMove) == _game.players.length() ? true : false;
        if (!_game.hasStarted || isGameOver(gameId)) return false;
        if (everyoneMadeMove || canEndTurn(gameId)) return true;
        return false;
    }

    /**
     * @dev Modifier that requires the current turn in a game with the provided game ID to be able to end. `gameId` is the ID of the game.
     *
     * Requirements:
     *
     * - The current turn in the game with `gameId` must be able to end.
     */
    modifier onlyInTurnTime(uint256 gameId) {
        require(isTurnTimedOut(gameId) == false, "onlyInTurnTime -> turn timedout");
        _;
    }

    modifier onlyWhenTurnCanEnd(uint256 gameId) {
        require(canEndTurn(gameId) == true, "onlyWhenTurnCanEnd: Not everyone made a move yet and there still is time");
        _;
    }

    /**
     * @dev Clears the current moves in a game. `game` is the game.
     *
     * Modifies:
     *
     * - Sets the madeMove of each player in `game` to false.
     */
    function _clearCurrentMoves(GameInstance storage game) internal {
        for (uint256 i = 0; i < game.players.length(); i++) {
            address player = game.players.at(i);
            game.madeMove[player] = false;
        }
        game.numPlayersMadeMove = 0;
    }

    /**
     * @dev Resets the states of the players in a game. `game` is the game.
     *
     * Modifies:
     *
     * - Sets the madeMove and score of each player in `game` to their initial values.
     */
    function _resetPlayerStates(GameInstance storage game) internal {
        for (uint256 i = 0; i < game.players.length(); i++) {
            address player = game.players.at(i);
            game.madeMove[player] = false;
            game.score[player] = 0;
        }
    }

    /**
     * @dev Sets the score of a player in a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player. `value` is the score.
     *
     * Requirements:
     *
     * - `player` must be in the game with `gameId`.
     *
     * Modifies:
     *
     * - Sets the score of `player` in the game with `gameId` to `value`.
     */
    function setScore(uint256 gameId, address player, uint256 value) internal {
        GameInstance storage _game = _getGame(gameId);
        require(isPlayerInGame(gameId, player), "player not in a game");
        _game.score[player] = value;
    }

    /**
     * @dev Gets the score of a player in a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player.
     *
     * Returns:
     *
     * - The score of `player` in the game with `gameId`.
     */
    function getScore(uint256 gameId, address player) internal view returns (uint256) {
        GameInstance storage _game = _getGame(gameId);
        return _game.score[player];
    }

    /**
     * @dev Gets the scores of the players in a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - An array of the addresses of the players in the game with `gameId`.
     * - An array of the scores of the players in the game with `gameId`.
     */
    function getScores(uint256 gameId) internal view returns (address[] memory, uint256[] memory) {
        address[] memory players = getPlayers(gameId);
        uint256[] memory scores = new uint256[](players.length);
        for (uint256 i = 0; i < players.length; i++) {
            scores[i] = getScore(gameId, players[i]);
        }
        return (players, scores);
    }

    /**
     * @dev Opens registration for a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     *
     * Modifies:
     *
     * - Sets the registrationOpenAt of the game with `gameId` to the current block timestamp.
     */
    function openRegistration(uint256 gameId) internal {
        require(gameExists(gameId), "game not found");
        GameInstance storage _game = _getGame(gameId);
        _game.registrationOpenAt = block.timestamp;
    }

    /**
     * @dev Checks if registration is open for a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - A boolean indicating whether registration is open for the game.
     */
    function isRegistrationOpen(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        TBGStorageStruct storage tbg = TBGStorage();
        if (_game.registrationOpenAt == 0) {
            return false;
        } else {
            return _game.registrationOpenAt < block.timestamp + tbg.settings.timeToJoin ? true : false;
        }
    }

    /**
     * @dev Checks if a game with the provided game ID can start. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - A boolean indicating whether the game can start.
     */
    function canStart(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        TBGStorageStruct storage tbg = TBGStorage();
        if (_game.hasStarted) return false;
        if (_game.registrationOpenAt == 0) return false;
        if (gameId == 0) return false;
        if (block.timestamp <= _game.registrationOpenAt + tbg.settings.timeToJoin) return false;
        if (_game.players.length() < tbg.settings.minPlayersSize) return false;
        return true;
    }

    /**
     * @dev Checks if a game with the provided game ID can start early. `gameId` is the ID of the game.
     * By "early" it is assumed that time to join has not yet passed, but it's already cap players limit reached.
     *
     * Returns:
     *
     * - A boolean indicating whether the game can start early.
     */
    function canStartEarly(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        TBGStorageStruct storage tbg = TBGStorage();

        if ((_game.players.length() == tbg.settings.maxPlayersSize) || canStart(gameId)) return true;
        return false;
    }

    /**
     * @dev Starts a game with the provided game ID early. `gameId` is the ID of the game.
     * By "early" it is assumed that time to join has not yet passed, but it's already cap players limit reached.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     * - The game with `gameId` must not have started.
     * - The game with `gameId` must have opened registration.
     * - The number of players in the game with `gameId` must be greater than or equal to the minimum number of players.
     * - The number of players in the game with `gameId` must be equal to the maximum number of players or the current block timestamp must be greater than the registration open time plus the time to join.
     *
     * Modifies:
     *
     * - Sets the hasStarted, hasEnded, currentTurn, and turnStartedAt of the game with `gameId` to their new values.
     * - Resets the states of the players in the game with `gameId`.
     */
    function startGameEarly(uint256 gameId) internal {
        GameInstance storage _game = _getGame(gameId);
        TBGStorageStruct storage tbg = TBGStorage();
        require(_game.hasStarted == false, "startGame->already started");
        require(_game.registrationOpenAt != 0, "startGame->Game registration was not yet open");
        require(gameId != 0, "startGame->Game not found");
        require(_game.players.length() >= tbg.settings.minPlayersSize, "startGame->Not enough players");
        require(
            (_game.players.length() == tbg.settings.maxPlayersSize) ||
                (block.timestamp > _game.registrationOpenAt + tbg.settings.timeToJoin),
            "startGame->Not enough players"
        );
        _game.hasStarted = true;
        _game.hasEnded = false;
        _game.currentTurn = 1;
        _game.turnStartedAt = block.timestamp;
        _resetPlayerStates(_game);
    }

    /**
     * @dev Starts a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     * - The game with `gameId` must not have started.
     * - The game with `gameId` must have opened registration.
     * - The current block timestamp must be greater than the registration open time plus the time to join.
     *
     * Modifies:
     *
     * - Sets the hasStarted, hasEnded, currentTurn, and turnStartedAt of the game with `gameId` to their new values.
     * - Resets the states of the players in the game with `gameId`.
     */
    function startGame(uint256 gameId) internal {
        GameInstance storage _game = _getGame(gameId);
        TBGStorageStruct storage tbg = TBGStorage();
        require(_game.hasStarted == false, "startGame->already started");
        require(_game.registrationOpenAt != 0, "startGame->Game registration was not yet open");
        require(block.timestamp > _game.registrationOpenAt + tbg.settings.timeToJoin, "startGame->Still Can Join");
        require(gameId != 0, "startGame->Game not found");
        require(_game.players.length() >= tbg.settings.minPlayersSize, "startGame->Not enough players");
        _game.hasStarted = true;
        _game.hasEnded = false;
        _game.currentTurn = 1;
        _game.turnStartedAt = block.timestamp;
        _resetPlayerStates(_game);
    }

    /**
     * @dev Gets the current turn of a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - The current turn of the game with `gameId`.
     */
    function getTurn(uint256 gameId) internal view returns (uint256) {
        GameInstance storage _game = _getGame(gameId);
        return _game.currentTurn;
    }

    /**
     * @dev Gets the game master of a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - The game master of the game with `gameId`.
     */
    function getGM(uint256 gameId) internal view returns (address) {
        GameInstance storage _game = _getGame(gameId);
        return _game.gameMaster;
    }

    /**
     * @dev Checks if the current turn is the last turn in a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - A boolean indicating whether the current turn is the last turn in the game.
     */
    function isLastTurn(uint256 gameId) internal view returns (bool) {
        TBGStorageStruct storage tbg = TBGStorage();
        GameInstance storage _game = _getGame(gameId);
        if (_game.currentTurn == tbg.settings.maxTurns) return true;
        else return false;
    }

    /**
     * @dev Checks if a game with the provided game ID is over. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - A boolean indicating whether the game is over.
     */
    function isGameOver(uint256 gameId) internal view returns (bool) {
        TBGStorageStruct storage tbg = TBGStorage();
        GameInstance storage _game = _getGame(gameId);
        if ((_game.currentTurn > tbg.settings.maxTurns) && !_game.isOvertime) return true;
        else return false;
    }

    /**
     * @dev Enforces that a game with the provided game ID is not over. `gameId` is the ID of the game.
     *
     * Requirements:
     *
     * - The game with `gameId` must not be over.
     */
    function enforceIsNotOver(uint256 gameId) internal view {
        require(!isGameOver(gameId), "Game over");
    }

    /**
     * @dev Records a player's move in a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player.
     *
     * Requirements:
     *
     * - The game with `gameId` must have started.
     * - The game with `gameId` must not be over.
     * - `player` must not have made a move in the current turn of the game with `gameId`.
     * - `player` must be in the game with `gameId`.
     *
     * Modifies:
     *
     * - Sets the madeMove of `player` in the game with `gameId` to true.
     * - Increments the numPlayersMadeMove of the game with `gameId`.
     */
    function playerMove(uint256 gameId, address player) internal onlyInTurnTime(gameId) {
        GameInstance storage _game = _getGame(gameId);
        enforceHasStarted(gameId);
        enforceIsNotOver(gameId);
        require(_game.madeMove[player] == false, "already made a move");
        TBGStorageStruct storage tbg = TBGStorage();
        require(gameId == tbg.playerInGame[player], "is not in the game");
        _game.madeMove[player] = true;
        _game.numPlayersMadeMove += 1;
    }

    function isPlayerTurnComplete(uint256 gameId, address player) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        return _game.madeMove[player];
    }

    /**
     * @dev Enforces that a player is in a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player.
     *
     * Requirements:
     *
     * - `player` must be in the game with `gameId`.
     */
    function enforceIsPlayingGame(uint256 gameId, address player) internal view {
        TBGStorageStruct storage tbg = TBGStorage();
        require(gameId == tbg.playerInGame[player], "is not in the game");
    }

    /**
     * @dev Checks if a game with the provided game ID has started. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - A boolean indicating whether the game has started.
     */
    function hasStarted(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        return _game.hasStarted;
    }

    /**
     * @dev Gets the leaderboard of a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - An array of the addresses of the players in the game with `gameId`, sorted by score.
     */
    function getLeaderBoard(uint256 gameId) internal view returns (address[] memory) {
        GameInstance storage _game = _getGame(gameId);
        return _game.leaderboard;
    }

    /**
     * @dev Advances to the next turn in a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Requirements:
     *
     * - The game with `gameId` must be able to end the current turn early. (all players have moved or the turn has timed out)
     *
     * Modifies:
     *
     * - Clears the current moves in the game with `gameId`.
     * - Increments the currentTurn of the game with `gameId`.
     * - Sets the turnStartedAt of the game with `gameId` to the current block timestamp.
     * - If the current turn is the last turn or the game with `gameId` is in overtime, checks if the game is a tie and sets the isOvertime of the game with `gameId` to the result.
     * - Sets the hasEnded of the game with `gameId` to whether the game is over.
     *
     * Returns:
     *
     * - A boolean indicating whether the current turn is the last turn.
     * - A boolean indicating whether the game is a tie.
     * - A boolean indicating whether the game is over.
     */
    function nextTurn(uint256 gameId) internal returns (bool, bool, bool) {
        require(canEndTurnEarly(gameId), "nextTurn->CanEndEarly");
        GameInstance storage _game = _getGame(gameId);
        _clearCurrentMoves(_game);
        _game.currentTurn += 1;
        _game.turnStartedAt = block.timestamp;
        bool _isLastTurn = isLastTurn(gameId);
        if (_isLastTurn || _game.isOvertime) {
            bool _isTie = isTie(gameId);
            _game.isOvertime = _isTie;
        }
        _game.hasEnded = isGameOver(gameId);

        (_game.leaderboard, ) = sortByScore(gameId);
        return (_isLastTurn, _game.isOvertime, _game.hasEnded);
    }

    /**
     * @dev Gets the data storage pointer.
     *
     * Returns:
     *
     * - The data storage pointer.
     */
    function getDataStorage() internal pure returns (bytes32 pointer) {
        return IMPLEMENTATION_STORAGE_POSITION;
    }

    /**
     * @dev Gets the game data storage pointer of a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - The game data storage pointer of the game with `gameId`.
     */
    function getGameDataStorage(uint256 gameId) internal view returns (bytes32 pointer) {
        GameInstance storage _game = _getGame(gameId);
        return _game.implemenationStoragePointer;
    }

    /**
     * @dev Gets the number of players in a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - The number of players in the game with `gameId`.
     */
    function getPlayersNumber(uint256 gameId) internal view returns (uint256) {
        GameInstance storage _game = _getGame(gameId);
        return _game.players.length();
    }

    /**
     * @dev Gets the players in a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - An array of the addresses of the players in the game with `gameId`.
     */
    function getPlayers(uint256 gameId) internal view returns (address[] memory) {
        GameInstance storage _game = _getGame(gameId);
        return _game.players.values();
    }

    /**
     * @dev Gets the game settings.
     *
     * Returns:
     *
     * - The game settings.
     */
    function getGameSettings() internal view returns (GameSettings memory) {
        TBGStorageStruct storage tbg = TBGStorage();
        return tbg.settings;
    }

    /**
     * @dev Enforces that a game with the provided game ID is in the pre-registration stage. `gameId` is the ID of the game.
     *
     * Requirements:
     *
     * - Registration must not be open for the game with `gameId`.
     * - The game with `gameId` must not have started.
     */
    function enforceIsPreRegistrationStage(uint256 gameId) internal view {
        require(!isRegistrationOpen(gameId), "Cannot do when registration is open");
        require(!hasStarted(gameId), "Cannot do when game started");
    }

    /**
     * @dev Adds overtime to a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Modifies:
     *
     * - Sets the isOvertime of the game with `gameId` to true.
     */
    function addOvertime(uint256 gameId) internal {
        GameInstance storage _game = _getGame(gameId);
        _game.isOvertime = true;
    }

    /**
     * @dev Checks if a game with the provided game ID is in overtime. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - A boolean indicating whether the game is in overtime.
     */
    function isOvertime(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        return _game.isOvertime;
    }

    /**
     * @dev Resets the overtime of a game with the provided game ID. `gameId` is the ID of the game.
     *
     * Modifies:
     *
     * - Sets the isOvertime of the game with `gameId` to false.
     */
    function resetOvertime(uint256 gameId) internal {
        GameInstance storage _game = _getGame(gameId);
        _game.isOvertime = false;
    }

    /**
     * @dev Checks if a game with the provided game ID is a tie. `gameId` is the ID of the game.
     * Tie being defined as at least two of the top `numWinners` players having the same score.
     *
     * Returns:
     *
     * - A boolean indicating whether the game is a tie.
     */
    function isTie(uint256 gameId) internal view returns (bool) {
        TBGStorageStruct storage tbg = TBGStorage();
        (address[] memory players, uint256[] memory scores) = getScores(gameId);

        LibArray.quickSort(scores, int256(0), int256(scores.length - 1));
        for (uint256 i = 0; i < players.length - 1; i++) {
            if ((i <= tbg.settings.numWinners - 1)) {
                if (scores[i] == scores[i + 1]) {
                    return (true);
                }
            } else {
                break;
            }
        }
        return (false);
    }

    /**
     * @dev Gets the game ID of the game a player is in. `player` is the address of the player.
     *
     * Returns:
     *
     * - The game ID of the game `player` is in.
     */
    function getPlayersGame(address player) internal view returns (uint256) {
        TBGStorageStruct storage tbg = TBGStorage();

        return tbg.playerInGame[player];
    }

    /**
     * @dev Sorts the players and scores arrays in descending order of scores using the quicksort algorithm. `players` is the array of player addresses. `scores` is the array of scores. `left` is the left index. `right` is the right index.
     *
     * Modifies:
     *
     * - Sorts the `players` and `scores` arrays in place.
     */
    function _quickSort(address[] memory players, uint256[] memory scores, int256 left, int256 right) private view {
        int256 i = left;
        int256 j = right;
        if (i == j) return;
        uint256 pivot = scores[uint256(left + (right - left) / 2)];
        while (i <= j) {
            while (scores[uint256(i)] > pivot) i++;
            while (pivot > scores[uint256(j)]) j--;
            if (i <= j) {
                (scores[uint256(i)], scores[uint256(j)]) = (scores[uint256(j)], scores[uint256(i)]);
                (players[uint256(i)], players[uint256(j)]) = (players[uint256(j)], players[uint256(i)]);
                i++;
                j--;
            }
        }
        if (left < j) _quickSort(players, scores, left, j);
        if (i < right) _quickSort(players, scores, i, right);
    }

    /**
     * @dev Sorts the players in a game with the provided game ID by score in descending order. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - An array of the addresses of the players in the game with `gameId`, sorted by score.
     * - An array of the scores of the players in the game with `gameId`, sorted in descending order.
     */
    function sortByScore(uint256 gameId) internal view returns (address[] memory, uint256[] memory) {
        (address[] memory players, uint256[] memory scores) = getScores(gameId);
        _quickSort(players, scores, 0, int256(scores.length - 1));
        return (players, scores);
    }
}
