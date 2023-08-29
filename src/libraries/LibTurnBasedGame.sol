// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
// import {EnumerableMap} from "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {LibArray} from "../libraries/LibArray.sol";

library LibTBG {
    // using EnumerableMap for EnumerableMap.AddressToUintMap;
    // using EnumerableMap for EnumerableMap.UintToAddressMap;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct GameSettings {
        uint256 blocksPerTurn;
        uint256 maxPlayersSize;
        uint256 minPlayersSize;
        uint256 blocksToJoin;
        uint256 maxTurns;
        uint256 numWinners;
    }

    struct GameInstance {
        address gameMaster;
        uint256 currentTurn;
        uint256 turnStartedAt;
        uint256 registrationOpenAt;
        bool hasStarted;
        EnumerableSet.AddressSet players;
        mapping(address => bool) madeMove;
        uint256 numPlayersMadeMove;
        mapping(address => uint256) score;
        bytes32 implemenationStoragePointer;
        bool isOvertime;
    }

    struct TBGStorageStruct {
        GameSettings settings;
        mapping(uint256 => GameInstance) games;
        uint256 gameNum;
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
        require(settings.blocksPerTurn != 0, "init->blocksPerTurn");
        require(settings.maxPlayersSize != 0, "init->maxPartySize");
        require(settings.minPlayersSize != 0, "init->minPartySize");
        require(settings.maxTurns != 0, "init->maxTurns");
        require((settings.numWinners != 0) && (settings.numWinners < settings.minPlayersSize), "init->numWinners");
        require(settings.blocksToJoin != 0, "init->blocksToJoin");
        require(settings.maxPlayersSize >= settings.minPlayersSize, "init->maxPlayersSize");
        tbg.settings = settings;
    }

    function createGame(uint256 gameId, address gm) internal {
        TBGStorageStruct storage tbg = TBGStorage();
        require(gm != address(0), "createGame->GM");
        require(gameId != 0, "createGame->gameId");
        require(tbg.games[gameId].gameMaster == address(0), "createGame->gameId");
        tbg.gameNum += 1;
        gameId = tbg.gameNum;
        tbg.games[tbg.gameNum].gameMaster = gm;
        tbg.totalGamesCreated += 1;

        //totalGamesCreated ensures nonce-like behaviur:
        //even if game would get deleted and re-created with same name, data storage would be different
        tbg.games[tbg.gameNum].implemenationStoragePointer = keccak256(
            abi.encode(gameId, tbg.totalGamesCreated, TBG_STORAGE_POSITION)
        );
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
        require(_game.hasStarted == false, "Cannot leave once started");
        tbg.playerInGame[participant] = 0;
        _game.players.remove(participant);
    }

    function isTurnTimedOut(uint256 gameId) internal view returns (bool) {
        TBGStorageStruct storage tbg = TBGStorage();
        GameInstance storage _game = _getGame(gameId);
        assert(gameId != 0);
        assert(_game.hasStarted == true);
        if (block.number <= tbg.settings.blocksPerTurn + _game.turnStartedAt) return false;
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
        GameInstance storage _game = _getGame(gameId);
        bool turnTimedOut = isTurnTimedOut(gameId);
        bool everyoneMadeMove = _game.numPlayersMadeMove == _game.players.length() ? true : false;
        if ((everyoneMadeMove && !turnTimedOut) || turnTimedOut) return true;
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
        _game.registrationOpenAt = block.number;
    }

    function isRegistrationOpen(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        TBGStorageStruct storage tbg = TBGStorage();
        if (_game.registrationOpenAt == 0) {
            return false;
        } else {
            return _game.registrationOpenAt < block.number + tbg.settings.blocksToJoin ? true : false;
        }
    }

    function canStart(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        TBGStorageStruct storage tbg = TBGStorage();
        bool retval = true;
        if (_game.hasStarted != false) retval = false;
        if (_game.registrationOpenAt == 0) retval = false;
        if (block.number <= _game.registrationOpenAt + tbg.settings.blocksToJoin) retval = false;
        if (gameId == 0) retval = false;
        if (_game.players.length() < tbg.settings.minPlayersSize) retval = false;
        return retval;
    }

    function startGame(uint256 gameId) internal {
        GameInstance storage _game = _getGame(gameId);
        TBGStorageStruct storage tbg = TBGStorage();
        require(_game.hasStarted == false, "startGame->already started");
        require(_game.registrationOpenAt != 0, "startGame->Game registration was not yet open");
        require(block.number > _game.registrationOpenAt + tbg.settings.blocksToJoin, "startGame->Still Can Join");
        require(gameId != 0, "startGame->Game not found");
        require(_game.players.length() >= tbg.settings.minPlayersSize, "startGame->Not enough players");
        _game.hasStarted = true;
        _game.currentTurn = 1;
        _game.turnStartedAt = block.number;
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

    function hasStarted(uint256 gameId) internal view returns (bool) {
        GameInstance storage _game = _getGame(gameId);
        return _game.hasStarted;
    }

    function closeGame(uint256 gameId) internal {
        TBGStorageStruct storage tbg = TBGStorage();
        address[] memory players = getPlayers(gameId);
        for (uint256 i = 0; i < players.length; i++) {
            tbg.playerInGame[players[i]] = 0;
        }
    }

    function nextTurn(uint256 gameId) internal returns (bool, bool, bool, address[] memory) {
        GameInstance storage _game = _getGame(gameId);
        enforceHasStarted(gameId);
        enforceIsNotOver(gameId);
        _clearCurrentMoves(_game);
        _game.currentTurn += 1;
        _game.turnStartedAt = block.number;
        bool _isLastTurn = isLastTurn(gameId);
        bool _isOvertime = _game.isOvertime;
        address[] memory sortedLeaders = new address[](getPlayers(gameId).length);
        if (_isLastTurn || _game.isOvertime || isGameOver(gameId)) {
            (_isOvertime, sortedLeaders) = isLeadersScoresEqual(gameId);
            _game.isOvertime = _isOvertime;
        }

        return (_isLastTurn, _isOvertime, isGameOver(gameId), sortedLeaders);
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

    function isLeadersScoresEqual(uint256 gameId) internal view returns (bool, address[] memory) {
        TBGStorageStruct storage tbg = TBGStorage();
        (address[] memory players, uint256[] memory scores) = getScores(gameId);

        LibArray.quickSort(scores, int256(0), int256(scores.length - 1));
        for (uint256 i = 0; i < players.length - 1; i++) {
            if ((i <= tbg.settings.numWinners - 1)) {
                if (scores[i] == scores[i + 1]) {
                    return (true, players);
                }
            } else {
                break;
            }
        }
        return (false, players);
    }

    function getPlayersGame(address player) internal view returns (uint256) {
        TBGStorageStruct storage tbg = TBGStorage();

        return tbg.playerInGame[player];
    }
}
