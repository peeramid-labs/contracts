// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {LibQuadraticVoting} from "../libraries/LibQuadraticVoting.sol";

interface IRankifyInstance {
    error NoDivisionReminderAllowed(uint256 a, uint256 b);
    error invalidTurnCount(uint256 nTurns);
    error RankNotSpecified();

    event RegistrationOpen(uint256 indexed gameId);
    event PlayerJoined(uint256 indexed gameId, address participant);
    event GameStarted(uint256 indexed gameId);
    event gameCreated(uint256 gameId, address indexed gm, address indexed creator, uint256 indexed rank);
    event GameClosed(uint256 indexed gameId);
    event PlayerLeft(uint256 indexed gameId, address indexed player);

    struct NewGameParamsInput {
        uint256 gameRank;
        uint256 minPlayerCnt;
        uint256 maxPlayerCnt;
        uint96 nTurns;
        uint256 voteCredits;
        address gameMaster;
        uint128 minGameTime;
        uint128 timePerTurn;
        uint128 timeToJoin;
    }
}
