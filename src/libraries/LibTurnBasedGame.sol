// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
// import {EnumerableMap} from "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {LibArray} from "../libraries/LibArray.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

library LibTBG {
    // using EnumerableMap for EnumerableMap.AddressToUintMap;
    // using EnumerableMap for EnumerableMap.UintToAddressMap;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct GameSettings {
        uint256 timePerTurn;
        uint256 maxPlayersSize;
        uint256 minPlayersSize;
        uint256 timeToJoin;
        uint256 maxTurns;
        uint256 numWinners;
        uint256 voteCredits;
        string subject;
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

    function init(GameSettings memory settings) internal {
        TBGStorageStruct storage tbg = TBGStorage();
        if (settings.timePerTurn == 0) require(false, "settings.timePerTurn"); //  revert invalidConfiguration('timePerTurn');
        if (settings.maxPlayersSize == 0) require(false, "settings.maxPlayersSize"); // revert invalidConfiguration('maxPlayersSize');
        if (settings.minPlayersSize < 2) require(false, "settings.minPlayersSize"); //revert invalidConfiguration('minPlayersSize');
        if (settings.maxTurns == 0) require(false, "settings.maxTurns"); //revert invalidConfiguration('maxTurns');
        if (settings.numWinners == 0 || settings.numWinners >= settings.minPlayersSize) require(false, "numWinners"); //revert invalidConfiguration('numWinners');
        if (settings.timeToJoin == 0) require(false, "timeToJoin"); // revert invalidConfiguration('timeToJoin');
        if (settings.maxPlayersSize < settings.minPlayersSize) require(false, "maxPlayersSize"); //revert invalidConfiguration('maxPlayersSize');
        if (bytes(settings.subject).length == 0) require(false, "subject length"); //revert invalidConfiguration('subject length');

        tbg.settings = settings;
    }

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

    function canBeJoined(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        if (_game.hasStarted || _game.registrationOpenAt == 0) return false;
        return true;
    }

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

    function isPlayerInGame(uint256 gameId, address player) internal view returns (bool) {
        TBGStorageStruct storage tbg = TBGStorage();
        return tbg.playerInGame[player] == gameId ? true : false;
    }

    function removePlayer(uint256 gameId, address participant) internal {
        TBGStorageStruct storage tbg = TBGStorage();
        GameInstance storage _game = _getGame(gameId);
        require(gameExists(gameId), "game does not exist");
        require(tbg.playerInGame[participant] == gameId, "Not in the game");
        require(_game.hasStarted == false || _game.hasEnded == true, "Cannot leave once started");
        tbg.playerInGame[participant] = 0;
        _game.players.remove(participant);
    }

    function isTurnTimedOut(uint256 gameId) internal view returns (bool) {
        TBGStorageStruct storage tbg = TBGStorage();
        GameInstance storage _game = _getGame(gameId);
        assert(gameId != 0);
        assert(_game.hasStarted == true);
        if (block.timestamp <= tbg.settings.timePerTurn + _game.turnStartedAt) return false;
        return true;
    }

    function gameExists(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        if (_game.gameMaster != address(0)) return true;
        return false;
    }

    function enforceHasStarted(uint256 gameId) internal view {
        GameInstance storage _game = _getGame(gameId);
        assert(gameId != 0);
        require(_game.hasStarted, "Game has not yet started");
    }

    function canEndTurn(uint256 gameId) internal view returns (bool) {
        bool turnTimedOut = isTurnTimedOut(gameId);
        GameInstance storage _game = _getGame(gameId);
        if (!_game.hasStarted || isGameOver(gameId)) return false;
        if (turnTimedOut) return true;
        return false;
    }

    function canEndTurnEarly(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        bool everyoneMadeMove = (_game.numPlayersMadeMove) == _game.players.length() ? true : false;
        if (!_game.hasStarted || isGameOver(gameId)) return false;
        if (everyoneMadeMove || canEndTurn(gameId)) return true;
        return false;
    }

    modifier onlyInTurnTime(uint256 gameId) {
        require(isTurnTimedOut(gameId) == false, "onlyInTurnTime -> turn timedout");
        _;
    }

    modifier onlyWhenTurnCanEnd(uint256 gameId) {
        require(canEndTurn(gameId) == true, "onlyWhenTurnCanEnd: Not everyone made a move yet and there still is time");
        _;
    }

    function _clearCurrentMoves(GameInstance storage game) internal {
        for (uint256 i = 0; i < game.players.length(); i++) {
            address player = game.players.at(i);
            game.madeMove[player] = false;
        }
        game.numPlayersMadeMove = 0;
    }

    function _resetPlayerStates(GameInstance storage game) internal {
        for (uint256 i = 0; i < game.players.length(); i++) {
            address player = game.players.at(i);
            game.madeMove[player] = false;
            game.score[player] = 0;
        }
    }

    function setScore(uint256 gameId, address player, uint256 value) internal {
        GameInstance storage _game = _getGame(gameId);
        require(isPlayerInGame(gameId, player), "player not in a game");
        _game.score[player] = value;
    }

    function getScore(uint256 gameId, address player) internal view returns (uint256) {
        GameInstance storage _game = _getGame(gameId);
        return _game.score[player];
    }

    function getScores(uint256 gameId) internal view returns (address[] memory, uint256[] memory) {
        address[] memory players = getPlayers(gameId);
        uint256[] memory scores = new uint256[](players.length);
        for (uint256 i = 0; i < players.length; i++) {
            scores[i] = getScore(gameId, players[i]);
        }
        return (players, scores);
    }

    function openRegistration(uint256 gameId) internal {
        require(gameExists(gameId), "game not found");
        GameInstance storage _game = _getGame(gameId);
        _game.registrationOpenAt = block.timestamp;
    }

    function isRegistrationOpen(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        TBGStorageStruct storage tbg = TBGStorage();
        if (_game.registrationOpenAt == 0) {
            return false;
        } else {
            return _game.registrationOpenAt < block.timestamp + tbg.settings.timeToJoin ? true : false;
        }
    }

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

    function canStartEarly(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        TBGStorageStruct storage tbg = TBGStorage();

        if ((_game.players.length() == tbg.settings.maxPlayersSize) || canStart(gameId)) return true;
        return false;
    }

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

    function getTurn(uint256 gameId) internal view returns (uint256) {
        GameInstance storage _game = _getGame(gameId);
        return _game.currentTurn;
    }

    function getGM(uint256 gameId) internal view returns (address) {
        GameInstance storage _game = _getGame(gameId);
        return _game.gameMaster;
    }

    function isLastTurn(uint256 gameId) internal view returns (bool) {
        TBGStorageStruct storage tbg = TBGStorage();
        GameInstance storage _game = _getGame(gameId);
        if (_game.currentTurn == tbg.settings.maxTurns) return true;
        else return false;
    }

    function isGameOver(uint256 gameId) internal view returns (bool) {
        TBGStorageStruct storage tbg = TBGStorage();
        GameInstance storage _game = _getGame(gameId);
        if ((_game.currentTurn > tbg.settings.maxTurns) && !_game.isOvertime) return true;
        else return false;
    }

    function enforceIsNotOver(uint256 gameId) internal view {
        require(!isGameOver(gameId), "Game over");
    }

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

    function enforceIsPlayingGame(uint256 gameId, address player) internal view {
        TBGStorageStruct storage tbg = TBGStorage();
        require(gameId == tbg.playerInGame[player], "is not in the game");
    }

    function hasStarted(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        return _game.hasStarted;
    }

    function getLeaderBoard(uint256 gameId) internal view returns (address[] memory) {
        GameInstance storage _game = _getGame(gameId);
        return _game.leaderboard;
    }

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

    function getDataStorage() internal pure returns (bytes32 pointer) {
        return IMPLEMENTATION_STORAGE_POSITION;
    }

    function getGameDataStorage(uint256 gameId) internal view returns (bytes32 pointer) {
        GameInstance storage _game = _getGame(gameId);
        return _game.implemenationStoragePointer;
    }

    function getPlayersNumber(uint256 gameId) internal view returns (uint256) {
        GameInstance storage _game = _getGame(gameId);
        return _game.players.length();
    }

    function getPlayers(uint256 gameId) internal view returns (address[] memory) {
        GameInstance storage _game = _getGame(gameId);
        return _game.players.values();
    }

    function getGameSettings() internal view returns (GameSettings memory) {
        TBGStorageStruct storage tbg = TBGStorage();
        return tbg.settings;
    }

    function enforceIsPreRegistrationStage(uint256 gameId) internal view {
        require(!isRegistrationOpen(gameId), "Cannot do when registration is open");
        require(!hasStarted(gameId), "Cannot do when game started");
    }

    function addOvertime(uint256 gameId) internal {
        GameInstance storage _game = _getGame(gameId);
        _game.isOvertime = true;
    }

    function isOvertime(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        return _game.isOvertime;
    }

    function resetOvertime(uint256 gameId) internal {
        GameInstance storage _game = _getGame(gameId);
        _game.isOvertime = false;
    }

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

    function getPlayersGame(address player) internal view returns (uint256) {
        TBGStorageStruct storage tbg = TBGStorage();

        return tbg.playerInGame[player];
    }

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

    function sortByScore(uint256 gameId) internal view returns (address[] memory, uint256[] memory) {
        (address[] memory players, uint256[] memory scores) = getScores(gameId);
        _quickSort(players, scores, 0, int256(scores.length - 1));
        return (players, scores);
    }
}
