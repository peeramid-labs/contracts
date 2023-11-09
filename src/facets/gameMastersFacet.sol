// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {LibArray} from "../libraries/LibArray.sol";
import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {LibBestOf} from "../libraries/LibBestOf.sol";
import {IBestOf} from "../interfaces/IBestOf.sol";
import "../abstracts/DiamondReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../abstracts/draft-EIP712Diamond.sol";
import {RankToken} from "../tokens/RankToken.sol";
import {LibCoinVending} from "../libraries/LibCoinVending.sol";
import "hardhat/console.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import "../vendor/libraries/LibDiamond.sol";

contract GameMastersFacet is DiamondReentrancyGuard, EIP712 {
    using LibTBG for uint256;
    using LibBestOf for uint256;
    using LibTBG for LibTBG.GameInstance;
    event OverTime(uint256 indexed gameId);
    event LastTurn(uint256 indexed gameId);

    event TurnEnded(
        uint256 indexed gameId,
        uint256 indexed turn,
        address[] players,
        uint256[] scores,
        string[] newProposals
        // uint256[3][] votesRevealed
    );

    event GameOver(uint256 indexed gameId, address[] indexed players, uint256[] indexed scores);

    function checkSignature(bytes memory message, bytes memory signature, address account) public view returns (bool) {
        bytes32 typedHash = _hashTypedDataV4(keccak256(message));
        return SignatureChecker.isValidSignatureNow(account, typedHash, signature);
    }

    function playerSalt(address player, bytes32 turnSalt) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(player, turnSalt));
    }

    // function validateVote(
    //     uint256 gameId,
    //     address voter,
    //     uint256[] memory votes,
    //     bytes32 turnSalt,
    //     address[] memory prevProposersRevealed
    // ) public view {
    //     IBestOf.BOGInstance storage game = gameId.getGameStorage();
    //     bytes32 salt = playerSalt(voter, turnSalt);
    //     require(gameId.isPlayerInGame(voter), "Player not in that game");
    //     bytes memory proof = game.votesHidden[voter].proof;
    //     //make sure voter did not vote for himself
    //     for (uint256 i = 0; i < votes.length; i++) {
    //         require(prevProposersRevealed[votes[i]] != voter, "voted for himself");
    //     }
    // }

    // function validateVotes(
    //     uint256 gameId,
    //     address[] memory voters,
    //     uint256[][] memory votes,
    //     bytes32 turnSalt,
    //     address[] memory prevProposersRevealed
    // ) private view {
    //     for (uint256 i = 0; i < gameId.getPlayersNumber(); i++) {
    //         validateVote(gameId, voters[i], votes[i], turnSalt, prevProposersRevealed);
    //     }
    // }

    function _isValidSignature(
        bytes memory message,
        bytes memory signature,
        address account
    ) private view returns (bool) {
        return checkSignature(message, signature, account);
    }

    function releaseAndReward(uint256 gameId, address player, address[] memory leaderboard) private {}

    function onPlayersGameEnd(uint256 gameId, address player) private {
        IBestOf.BOGInstance storage game = gameId.getGameStorage();
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
        LibBestOf.enforceIsGM(gameId, msg.sender);
        gameId.enforceGameExists();
        gameId.enforceHasStarted();
        // bytes memory message = abi.encode(
        //     //ToDo: add address of a player to signature as well proof
        //     LibBestOf._VOTE_SUBMIT_PROOF_TYPEHASH,
        //     gameId,
        //     gameId.getTurn(),
        //     votesHidden[0],
        //     votesHidden[1],
        //     votesHidden[2]
        // );
        // IBestOf.BOGInstance storage game = gameId.getGameStorage();
        require(!gameId.isGameOver(), "Game over");
        require(gameId.getTurn() > 1, "No proposals exist at turn 1: cannot vote");
        // game.votesHidden[msg.sender].votedFor = votesHidden;
        // game.votesHidden[voter].proof = bytes memory (0);
        gameId.playerMove(voter); // This will enforce player is in in the game
        emit VoteSubmitted(gameId, gameId.getTurn(), voter, encryptedVotes);
    }

    function submitProposal(ProposalParams memory proposalData) public {
        proposalData.gameId.enforceGameExists();
        proposalData.gameId.enforceIsGM(msg.sender);
        require(!proposalData.gameId.isGameOver(), "Game over");
        proposalData.gameId.enforceHasStarted();

        IBestOf.BOGInstance storage game = proposalData.gameId.getGameStorage();
        require(LibTBG.getPlayersGame(proposalData.proposer) == proposalData.gameId, "not a player");
        require(!proposalData.gameId.isLastTurn(), "Cannot propose in last turn");
        require(bytes(proposalData.encryptedProposal).length != 0, "Cannot propose empty");
        require(game.proposalCommitmentHashes[proposalData.proposer] == "", "Already proposed!");
        // bytes memory message = abi.encode(
        //   LibBestOf._PROPOSAL_PROOF_TYPEHASH,
        //   gameId,
        //   _turn,
        //   proposalNHash,
        //   keccak256(abi.encodePacked(encryptedProposal))
        // );
        // require(
        //   _isValidSignature(message, gmSignature, gameId.getGM()),
        //   "wrong signature"
        // );
        game.proposalCommitmentHashes[proposalData.proposer] = proposalData.commitmentHash;
        game.numCommitments += 1;
        emit ProposalSubmitted(
            proposalData.gameId,
            proposalData.gameId.getTurn(),
            proposalData.proposer,
            proposalData.commitmentHash,
            proposalData.encryptedProposal
        );
    }

    // function enforceValidProposalsRevealed(
    //   uint256 gameId,
    //   uint256 turn,
    //   bytes32[] memory nullifiers // string[] memory proposals unused until ZKP is implemented
    // ) private {
    //   IBestOf.BOGInstance storage game = gameId.getGameStorage();
    //   require(nullifiers.length == game.numCommitments, "unequal lengths");
    //   uint256 length = nullifiers.length;
    //   for (uint256 i = 0; i < length; i++) {
    //     require(
    //       !game.futureProposalNs[turn + 1][nullifiers[i]],
    //       "Duplicate nullifier detected"
    //     );
    //     game.futureProposalNs[turn + 1][nullifiers[i]] = true;
    //     bytes32 nHash = keccak256(abi.encode(nullifiers[i]));
    //     require(
    //       game.proposalCommitmentHashes[turn + 1][nHash],
    //       "invalid nullifier"
    //     );
    //     //ToDo: ZKP verification that proposalNHash exists for a proposal. Until that assumption is that GM must be honest
    //     // validateZKP(game.proposalCommitmentHashes[turn+1][nHash],proposals[i])
    //   }
    // }

    // Clean up game instance for upcoming round
    function _beforeNextTurn(uint256 gameId) internal {
        address[] memory players = gameId.getPlayers();
        IBestOf.BOGInstance storage game = gameId.getGameStorage();
        game.numOngoingProposals = 0;
        game.numCommitments = 0;
        for (uint256 i = 0; i < players.length; i++) {
            game.proposalCommitmentHashes[players[i]] = bytes32(0);
            game.ongoingProposals[i] = "";
            game.votesHidden[players[i]].hash = bytes32(0);
            // delete game.votesHidden[players[i]].proof;
        }
    }

    function _afterNextTurn(uint256 gameId, string[] memory newProposals) private {
        IBestOf.BOGInstance storage game = gameId.getGameStorage();
        for (uint256 i = 0; i < newProposals.length; i++) {
            game.ongoingProposals[i] = newProposals[i];
            game.numOngoingProposals += 1;
        }
    }

    function _nextTurn(uint256 gameId, string[] memory newProposals) private {
        _beforeNextTurn(gameId);
        address[] memory players = gameId.getPlayers();
        (bool _isLastTurn, bool _isOvertime, bool _isGameOver, ) = gameId.nextTurn();
        (, uint256[] memory scores) = gameId.getScores();
        emit TurnEnded(gameId, gameId.getTurn() - 1, players, scores, newProposals);
        if (_isLastTurn && _isOvertime) {
            emit OverTime(gameId);
        }
        if (_isLastTurn) {
            emit LastTurn(gameId);
        }
        if (_isGameOver) {
            uint256[] memory finalScores = gameId.closeGame(LibDiamond.contractOwner(), onPlayersGameEnd);
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

        IBestOf.BOGInstance storage game = gameId.getGameStorage();
        require(!gameId.isGameOver(), "Game over");
        gameId.enforceHasStarted();
        if (gameId.getTurn() != 1) {
            require(gameId.canEndTurn() == true, "Cannot do this now");
        }
        if (!gameId.isLastTurn()) {
            require(
                (game.numCommitments == gameId.getPlayers().length) || gameId.isTurnTimedOut(),
                "Some players still have time to propose"
            );
        }
        if (gameId.getTurn() != 1) {
            gameId.calculateScoresQuadratic(votes, proposerIndicies);
        }
        _nextTurn(gameId, newProposals);
    }
}
