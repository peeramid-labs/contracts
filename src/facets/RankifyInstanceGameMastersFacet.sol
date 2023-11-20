// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

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
import "../vendor/libraries/LibDiamond.sol";

contract RankifyInstanceGameMastersFacet is DiamondReentrancyGuard, EIP712 {
    using LibTBG for uint256;
    using LibRankify for uint256;
    using LibTBG for LibTBG.GameInstance;
    event OverTime(uint256 indexed gameId);
    event LastTurn(uint256 indexed gameId);
    event ProposalScore(uint256 indexed gameId, uint256 indexed turn, string indexed proposalHash, string proposal, uint256  score);
    event TurnEnded(
        uint256 indexed gameId,
        uint256 indexed turn,
        address[] players,
        uint256[] scores,
        string[] newProposals,
        uint256[] proposerIndicies,
        uint256[][] votes
    );

    event GameOver(uint256 indexed gameId, address[] indexed players, uint256[] indexed scores);

    function checkSignature(bytes memory message, bytes memory signature, address account) public view returns (bool) {
        bytes32 typedHash = _hashTypedDataV4(keccak256(message));
        return SignatureChecker.isValidSignatureNow(account, typedHash, signature);
    }

    function playerSalt(address player, bytes32 turnSalt) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(player, turnSalt));
    }

    function _isValidSignature(
        bytes memory message,
        bytes memory signature,
        address account
    ) private view returns (bool) {
        return checkSignature(message, signature, account);
    }

    function releaseAndReward(uint256 gameId, address player, address[] memory leaderboard) private {}

    function onPlayersGameEnd(uint256 gameId, address player) private {
        IRankifyInstanceCommons.RInstance storage game = gameId.getGameStorage();
        LibCoinVending.release(bytes32(gameId), game.createdBy, gameId.getLeaderBoard()[0], player);
    }

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

    function submitVote(uint256 gameId, string memory encryptedVotes, address voter) public {
        LibRankify.enforceIsGM(gameId, msg.sender);
        gameId.enforceGameExists();
        gameId.enforceHasStarted();
        require(!gameId.isGameOver(), "Game over");
        gameId.enforceIsPlayingGame(voter);
        require(gameId.getTurn() > 1, "No proposals exist at turn 1: cannot vote");
        IRankifyInstanceCommons.RInstance storage game = gameId.getGameStorage();
        game.numVotesThisTurn += 1;
        game.playerVoted[voter] = true;
        gameId.tryPlayerMove(voter);
        emit VoteSubmitted(gameId, gameId.getTurn(), voter, encryptedVotes);
    }

    function submitProposal(ProposalParams memory proposalData) public {
        proposalData.gameId.enforceGameExists();
        proposalData.gameId.enforceIsGM(msg.sender);
        require(!proposalData.gameId.isGameOver(), "Game over");
        proposalData.gameId.enforceHasStarted();

        IRankifyInstanceCommons.RInstance storage game = proposalData.gameId.getGameStorage();
        require(LibTBG.getPlayersGame(proposalData.proposer) == proposalData.gameId, "not a player");
        require(!proposalData.gameId.isLastTurn(), "Cannot propose in last turn");
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


    // Clean up game instance for upcoming round
    function _beforeNextTurn(uint256 gameId) internal {
        address[] memory players = gameId.getPlayers();
        IRankifyInstanceCommons.RInstance storage game = gameId.getGameStorage();
        game.numCommitments = 0;
        for (uint256 i = 0; i < players.length; i++) {
            game.proposalCommitmentHashes[players[i]] = bytes32(0);
            game.ongoingProposals[i] = "";
            game.playerVoted[players[i]] = false;
            game.votesHidden[players[i]].hash = bytes32(0);
        }
        // This data is to needed to correctly detetermine "PlayerMove" conditions during next turn
         game.numVotesPrevTurn = game.numVotesThisTurn;
         game.numVotesThisTurn = 0;
         game.numPrevProposals = game.numOngoingProposals;
         game.numOngoingProposals = 0;
    }

    // Move new proposals in to ongoing proposals
    function _afterNextTurn(uint256 gameId, string[] memory newProposals) private {
        IRankifyInstanceCommons.RInstance storage game = gameId.getGameStorage();
        for (uint256 i = 0; i < newProposals.length; i++) {
            game.ongoingProposals[i] = newProposals[i];
            game.numOngoingProposals += 1;
        }

    }

    function _nextTurn(uint256 gameId, string[] memory newProposals) private {
        _beforeNextTurn(gameId);
        (bool _isLastTurn, bool _isOvertime, bool _isGameOver, ) = gameId.nextTurn();

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

    // newProposals array MUST be sorted randomly
    // votes and proposerIndicies MUST correspond to players array from game.getPlayers()
    function endTurn(
        uint256 gameId,
        uint256[][] memory votes,
        string[] memory newProposals, //REFERRING TO UPCOMING VOTING ROUND
        uint256[] memory proposerIndicies //REFERRING TO game.players index in PREVIOUS VOTING ROUND
    ) public {
        gameId.enforceIsGM(msg.sender);
        IRankifyInstanceCommons.RInstance storage game = gameId.getGameStorage();
        require(!gameId.isGameOver(), "Game over");
        gameId.enforceHasStarted();
        uint256 turn = gameId.getTurn();
        if(turn != 1) {
            require(gameId.canEndTurnEarly() == true, "endTurn->canEndTurnEarly");
        }
        if (!gameId.isLastTurn()) {
            require(
                (game.numCommitments == gameId.getPlayers().length) || gameId.isTurnTimedOut(),
                "Some players still have time to propose"
            );
        }
        address[] memory players = gameId.getPlayers();
        if (turn != 1) {
            (,uint256[] memory roundScores) = gameId.calculateScoresQuadratic(votes, proposerIndicies);
            for(uint256  i = 0; i<players.length; i++)
            {
                string memory proposal = game.ongoingProposals[proposerIndicies[i]];
                emit ProposalScore(gameId,turn,proposal,proposal,roundScores[i]);
            }
        }
        (, uint256[] memory scores) = gameId.getScores();
         emit TurnEnded(gameId, gameId.getTurn(), players, scores, newProposals,proposerIndicies,votes);
        _nextTurn(gameId, newProposals);
    }
}
