// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LibArray} from "../libraries/LibArray.sol";
import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {LibRankify} from "../libraries/LibRankify.sol";
import {IRankifyInstanceCommons} from "../interfaces/IRankifyInstanceCommons.sol";
import "../abstracts/DiamondReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../abstracts/draft-EIP712Diamond.sol";
import {RankToken} from "../tokens/RankToken.sol";
import {LibCoinVending} from "../libraries/LibCoinVending.sol";
import "hardhat/console.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import "../vendor/diamond/libraries/LibDiamond.sol";

contract RankifyInstanceGameMastersFacet is DiamondReentrancyGuard, EIP712 {
    using LibTBG for uint256;
    using LibRankify for uint256;
    using LibTBG for LibTBG.GameInstance;
    event OverTime(uint256 indexed gameId);
    event LastTurn(uint256 indexed gameId);
    event ProposalScore(
        uint256 indexed gameId,
        uint256 indexed turn,
        string indexed proposalHash,
        string proposal,
        uint256 score
    );
    event TurnEnded(
        uint256 indexed gameId,
        uint256 indexed turn,
        address[] players,
        uint256[] scores,
        string[] newProposals,
        uint256[] proposerIndicies,
        uint256[][] votes
    );

    event GameOver(uint256 indexed gameId, address[] players, uint256[] scores);

    event ProposalSubmitted(
        uint256 indexed gameId,
        uint256 indexed turn,
        address indexed proposer,
        bytes32 commitmentHash,
        string proposalEncryptedByGM
    );
    struct ProposalParams {
        uint256 gameId;
        string encryptedProposal;
        bytes32 commitmentHash;
        address proposer;
    }

    event VoteSubmitted(uint256 indexed gameId, uint256 indexed turn, address indexed player, string votesHidden);

    /**
     * @dev Handles the end of the game for a player. `gameId` is the ID of the game. `player` is the address of the player.
     *
     * Modifies:
     *
     * - Releases the coins for the game with `gameId`, the game creator, the top player, and `player`.
     */
    function onPlayersGameEnd(uint256 gameId, address player) private {
        IRankifyInstanceCommons.RInstance storage game = gameId.getGameStorage();
        LibCoinVending.release(bytes32(gameId), game.createdBy, gameId.getLeaderBoard()[0], player);
    }

    /**
     * @dev Submits a vote for a game. `gameId` is the ID of the game. `encryptedVotes` is the encrypted votes. `voter` is the address of the voter.
     *
     * Emits a _VoteSubmitted_ event.
     *
     * Requirements:
     *
     * - The caller must be a game master of the game with `gameId`.
     * - The game with `gameId` must exist.
     * - The game with `gameId` must have started.
     * - The game with `gameId` must not be over.
     * - `voter` must be in the game with `gameId`.
     * - The current turn of the game with `gameId` must be greater than 1.
     */
    function submitVote(uint256 gameId, string memory encryptedVotes, address voter) public {
        LibRankify.enforceIsGM(gameId, msg.sender);
        gameId.enforceGameExists();
        gameId.enforceHasStarted();
        require(!gameId.isGameOver(), "Game over");
        gameId.enforceIsPlayingGame(voter);
        require(gameId.getTurn() > 1, "No proposals exist at turn 1: cannot vote");
        IRankifyInstanceCommons.RInstance storage game = gameId.getGameStorage();
        require(!game.playerVoted[voter], "Already voted");
        game.numVotesThisTurn += 1;
        game.playerVoted[voter] = true;
        gameId.tryPlayerMove(voter);
        emit VoteSubmitted(gameId, gameId.getTurn(), voter, encryptedVotes);
    }

    /**
     * @dev Submits a proposal for a game. `proposalData` is the proposal data.
     *
     * Requirements:
     *
     * - The game with `proposalData.gameId` must exist.
     * - The caller must be a game master of the game with `proposalData.gameId`.
     */
    function submitProposal(ProposalParams memory proposalData) public {
        proposalData.gameId.enforceGameExists();
        proposalData.gameId.enforceIsGM(msg.sender);
        require(!proposalData.gameId.isGameOver(), "Game over");
        proposalData.gameId.enforceHasStarted();

        IRankifyInstanceCommons.RInstance storage game = proposalData.gameId.getGameStorage();
        require(LibTBG.getPlayersGame(proposalData.proposer) == proposalData.gameId, "not a player");
        // require(!proposalData.gameId.isLastTurn(), "Cannot propose in last turn");
        require(bytes(proposalData.encryptedProposal).length != 0, "Cannot propose empty");
        require(game.proposalCommitmentHashes[proposalData.proposer] == "", "Already proposed!");
        uint256 turn = proposalData.gameId.getTurn();
        game.proposalCommitmentHashes[proposalData.proposer] = proposalData.commitmentHash;
        game.numCommitments += 1;
        proposalData.gameId.tryPlayerMove(proposalData.proposer);
        emit ProposalSubmitted(
            proposalData.gameId,
            turn,
            proposalData.proposer,
            proposalData.commitmentHash,
            proposalData.encryptedProposal
        );
    }

    /**
     * @dev Handles the actions after the next turn of a game with the provided game ID. `gameId` is the ID of the game. `newProposals` is the array of new proposals.
     *
     * Modifies:
     *
     * - Sets the ongoing proposals of the game with `gameId` to `newProposals`.
     * - Increments the number of ongoing proposals of the game with `gameId` by the number of `newProposals`.
     */
    function _afterNextTurn(uint256 gameId, string[] memory newProposals) private {
        IRankifyInstanceCommons.RInstance storage game = gameId.getGameStorage();
        for (uint256 i = 0; i < newProposals.length; i++) {
            game.ongoingProposals[i] = newProposals[i];
        }
    }

    /**
     * @dev Handles the next turn of a game with the provided game ID. `gameId` is the ID of the game. `newProposals` is the array of new proposals.
     *
     * Emits an {OverTime_ event if the game is in the last turn and overtime.
     * emits a _LastTurn_ event if the game is in the last turn.
     * emits a _GameOver_ event if the game is over.
     *
     * Modifies:
     *
     * - Calls the `_afterNextTurn` function with `gameId` and `newProposals`.
     */
    function _nextTurn(uint256 gameId, string[] memory newProposals) private {
        (bool _isLastTurn, bool _isOvertime, bool _isGameOver) = gameId.nextTurn();
        if (_isLastTurn && _isOvertime) {
            emit OverTime(gameId);
        }
        if (_isLastTurn) {
            emit LastTurn(gameId);
        }
        if (_isGameOver) {
            uint256[] memory finalScores = gameId.closeGame(LibDiamond.contractOwner(), onPlayersGameEnd);
            address[] memory players = gameId.getPlayers();
            emit GameOver(gameId, players, finalScores);
        }
        _afterNextTurn(gameId, newProposals);
    }

    /**
     * @dev Ends the current turn of a game with the provided game ID. `gameId` is the ID of the game. `votes` is the array of votes.
     *  `newProposals` is the array of new proposals for the upcoming voting round.
     *  `proposerIndicies` is the array of indices of the proposers in the previous voting round.
     *
     * emits a _ProposalScore_ event for each player if the turn is not the first.
     * emits a _TurnEnded_ event.
     *
     * Modifies:
     *
     * - Calls the `_nextTurn` function with `gameId` and `newProposals`.
     * - Resets the number of commitments of the game with `gameId` to 0.
     * - Resets the proposal commitment hash and ongoing proposal of each player in the game with `gameId`.
     *
     * Requirements:
     *
     * - The caller must be a game master of the game with `gameId`.
     * - The game with `gameId` must have started.
     * - The game with `gameId` must not be over.
     * -  newProposals array MUST be sorted randomly to ensure privacy
     * votes and proposerIndicies MUST correspond to players array from game.getPlayers()
     */
    function endTurn(
        uint256 gameId,
        uint256[][] memory votes,
        string[] memory newProposals, //REFERRING TO UPCOMING VOTING ROUND
        uint256[] memory proposerIndicies //REFERRING TO game.players index in PREVIOUS VOTING ROUND
    ) public {
        gameId.enforceIsGM(msg.sender);
        gameId.enforceHasStarted();
        gameId.enforceIsNotOver();
        IRankifyInstanceCommons.RInstance storage game = gameId.getGameStorage();
        uint256 turn = gameId.getTurn();

        address[] memory players = gameId.getPlayers();
        if (turn != 1) {
            uint256[][] memory votesSorted = new uint256[][](players.length);
            for (uint256 player = 0; player < players.length; player++) {
                votesSorted[player] = new uint256[](players.length);
            }
            for (uint256 votee = 0; votee < players.length; votee++) {
                uint256 voteesColumn = proposerIndicies[votee];
                if (voteesColumn < players.length) {
                    // if index is above length of players array, it means the player did not propose
                    for (uint256 voter = 0; voter < players.length; voter++) {
                        votesSorted[voter][votee] = votes[voter][voteesColumn];
                    }
                }
            }

            (, uint256[] memory roundScores) = gameId.calculateScoresQuadratic(votesSorted, proposerIndicies);
            for (uint256 i = 0; i < players.length; i++) {
                string memory proposal = game.ongoingProposals[proposerIndicies[i]];
                emit ProposalScore(gameId, turn, proposal, proposal, roundScores[i]);
            }
        }
        (, uint256[] memory scores) = gameId.getScores();
        emit TurnEnded(gameId, gameId.getTurn(), players, scores, newProposals, proposerIndicies, votes);

        // Clean up game instance for upcoming round

        for (uint256 i = 0; i < players.length; i++) {
            game.proposalCommitmentHashes[players[i]] = bytes32(0);
            game.ongoingProposals[i] = "";
            game.playerVoted[players[i]] = false;
            game.votesHidden[players[i]].hash = bytes32(0);
        }
        // This data is to needed to correctly detetermine "PlayerMove" conditions during next turn
        game.numVotesPrevTurn = game.numVotesThisTurn;
        game.numVotesThisTurn = 0;
        game.numPrevProposals = game.numCommitments;
        game.numCommitments = 0;

        _nextTurn(gameId, newProposals);
    }
}
