// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {LibRankify} from "../libraries/LibRankify.sol";
import {IRankifyInstance} from "../interfaces/IRankifyInstance.sol";
import "../abstracts/DiamondReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../abstracts/draft-EIP712Diamond.sol";
import {LibCoinVending} from "../libraries/LibCoinVending.sol";
import "hardhat/console.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import "../vendor/diamond/libraries/LibDiamond.sol";
import {IErrors} from "../interfaces/IErrors.sol";

/**
 * @title RankifyInstanceGameMastersFacet
 * @notice Facet handling game master functionality for Rankify instances
 * @dev Implements game master specific operations like vote submission and game management
 * @author Peeramid Labs, 2024
 */
contract RankifyInstanceGameMastersFacet is DiamondReentrancyGuard, EIP712 {
    error ballotIntegrityCheckFailed(bytes32 ballotHash, bytes32 ballotHashFromVotes);
    using LibTBG for uint256;
    using LibRankify for uint256;
    using LibTBG for LibTBG.State;
    event OverTime(uint256 indexed gameId);
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
        uint256[] proposerIndices,
        uint256[][] votes
    );
    event LastTurn(uint256 indexed gameId);
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
        bytes gmSignature;
        bytes voterSignature;
    }

    event VoteSubmitted(uint256 indexed gameId, uint256 indexed turn, address indexed player, string votesHidden);

    struct ProposalReveal {
        string proposal;           // The revealed proposal
        bytes32 nullifier;        // Nullifier proving proposer's right to reveal
        uint[2] a;                // ZK proof components
        uint[2][2] b;
        uint[2] c;
    }

    struct BatchProposalReveal {
        string[] proposals;           // Array of revealed proposals
        bytes32[] nullifiers;        // Array of nullifiers
        uint[2] a;                   // Single ZK proof components
        uint[2][2] b;
        uint[2] c;
    }

    /**
     * @dev Handles the end of the game for a player. `gameId` is the ID of the game. `player` is the address of the player.
     *
     * Modifies:
     *
     * - Releases the coins for the game with `gameId`, the game creator, the top player, and `player`.
     */
    function onPlayersGameEnd(uint256 gameId, address player) private {
        LibRankify.GameState storage game = gameId.getGameState();
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
    function submitVote(
        uint256 gameId,
        string memory sealedBallotId,
        address voter,
        bytes memory gmSignature,
        bytes memory voterSignature,
        bytes32 ballotHash
    ) public {
        gameId.enforceGameExists();
        gameId.enforceHasStarted();
        require(!gameId.isGameOver(), "Game over");
        gameId.enforceIsPlayingGame(voter);
        require(gameId.getTurn() > 1, "No proposals exist at turn 1: cannot vote");
        address gm = gameId.getGM();
        if (msg.sender != gm) {
            // Verify GM signature for sealed ballot
            bytes32 ballotDigest = _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        keccak256("SubmitVote(uint256 gameId,address voter,string sealedBallotId,bytes32 ballotHash)"),
                        gameId,
                        voter,
                        keccak256(bytes(sealedBallotId)),
                        ballotHash
                    )
                )
            );

            require(
                SignatureChecker.isValidSignatureNow(gm, ballotDigest, gmSignature),
                IErrors.invalidECDSARecoverSigner(ballotDigest, "Invalid GM signature")
            );
        }
        // If sender is not the voter, verify voter's signature
        bytes32 voterDigest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("AuthorizeVoteSubmission(uint256 gameId,string sealedBallotId,bytes32 ballotHash)"),
                    gameId,
                    keccak256(bytes(sealedBallotId)),
                    ballotHash
                )
            )
        );
        require(
            SignatureChecker.isValidSignatureNow(voter, voterDigest, voterSignature),
            IErrors.invalidECDSARecoverSigner(voterDigest, "Invalid voter signature")
        );

        LibRankify.GameState storage game = gameId.getGameState();
        game.ballotHashes[voter] = ballotHash;
        require(!game.playerVoted[voter], "Already voted");
        game.numVotesThisTurn += 1;
        game.playerVoted[voter] = true;
        gameId.tryPlayerMove(voter);
        emit VoteSubmitted(gameId, gameId.getTurn(), voter, sealedBallotId);
    }

    /**
     * @dev Submits a proposal for a game. `proposalData` is the proposal data.
     *
     * Requirements:
     *
     * - The game with `proposalData.gameId` must exist.
     * - The caller must be a game master of the game with `proposalData.gameId`.
     */
    function submitProposal(
        ProposalParams memory params
    ) public {
        params.gameId.enforceGameExists();
        require(!params.gameId.isGameOver(), "Game over");
        address gm = params.gameId.getGM();
        if(msg.sender != gm) {
            bytes32 proposalDigest = _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        keccak256("SubmitProposal(uint256 gameId,address proposer,string encryptedProposal,bytes32 commitmentHash)"),
                        params.gameId,
                        params.proposer,
                        keccak256(bytes(params.encryptedProposal)),
                        params.commitmentHash
                    )
                )
            );
            require(
                SignatureChecker.isValidSignatureNow(gm, proposalDigest, params.gmSignature),
                IErrors.invalidECDSARecoverSigner(proposalDigest, "Invalid GM signature")
            );
        }

        bytes32 voterDigest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("AuthorizeProposalSubmission(uint256 gameId,string encryptedProposal,bytes32 commitmentHash)"),
                    params.gameId,
                    keccak256(bytes(params.encryptedProposal)),
                    params.commitmentHash
                )
            )
        );
        require(
            SignatureChecker.isValidSignatureNow(params.proposer, voterDigest, params.voterSignature),
            IErrors.invalidECDSARecoverSigner(voterDigest, "Invalid voter signature")
        );
        LibRankify.GameState storage game = params.gameId.getGameState();
        require(LibTBG.getPlayersGame(params.proposer) == params.gameId, "not a player");
        require(bytes(params.encryptedProposal).length != 0, "Cannot propose empty");
        require(game.proposalCommitmentHashes[params.proposer] == "", "Already proposed!");
        uint256 turn = params.gameId.getTurn();
        game.proposalCommitmentHashes[params.proposer] = params.commitmentHash;

        params.gameId.enforceHasStarted();

        LibRankify.GameState storage game = params.gameId.getGameState();

        game.numCommitments += 1;
        params.gameId.tryPlayerMove(proposalData.proposer);
        emit ProposalSubmitted(
            params.gameId,
            turn,
            params.proposer,
            params.commitmentHash,
            params.encryptedProposal
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
        LibRankify.GameState storage game = gameId.getGameState();
        for (uint256 i = 0; i < newProposals.length; ++i) {
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
            (address[] memory players, uint256[] memory finalScores) = gameId.closeGame(onPlayersGameEnd);
            emit GameOver(gameId, players, finalScores);
        }
        _afterNextTurn(gameId, newProposals);
    }

    /**
     * @dev Ends the current turn of a game with the provided game ID. `gameId` is the ID of the game. `votes` is the array of votes.
     *  `newProposals` is the array of new proposals for the upcoming voting round.
     *  `proposerIndices` is the array of indices of the proposers in the previous voting round.
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
     * votes and proposerIndices MUST correspond to players array from game.getPlayers()
     */
    function endTurn(
        uint256 gameId,
        uint256[][] memory votes,
        BatchProposalReveal memory newProposals,
        uint256[] memory proposerIndices,
        bytes32 turnSalt
    ) public {
        gameId.enforceIsGM(msg.sender);
        gameId.enforceHasStarted();
        gameId.enforceIsNotOver();
        LibRankify.GameState storage game = gameId.getGameState();
        uint256 turn = gameId.getTurn();
        address[] memory players = gameId.getPlayers();

        if (turn != 1) {
            // 1. Handle previous turn's voting and scoring
            uint256[][] memory votesSorted = new uint256[][](players.length);

            // Verify vote integrity
            for (uint256 player = 0; player < players.length; ++player) {
                votesSorted[player] = new uint256[](players.length);
                bytes32 ballotHash = game.ballotHashes[players[player]];
                bytes32 playerSalt = keccak256(abi.encodePacked(players[player], turnSalt));
                bytes32 ballotHashFromVotes = keccak256(abi.encodePacked(votes[player], playerSalt));
                if (game.playerVoted[players[player]]) {
                    require(ballotHash == ballotHashFromVotes, ballotIntegrityCheckFailed(ballotHash, ballotHashFromVotes));
                }
            }

            // Verify proposer indices for previous turn's proposals
            bool[] memory used = new bool[](players.length);
            for (uint256 i = 0; i < proposerIndices.length; i++) {
                require(proposerIndices[i] < players.length, "Invalid proposer index");
                require(!used[proposerIndices[i]], "Duplicate proposer index");
                used[proposerIndices[i]] = true;
            }

            // Sort votes according to previous turn's proposer indices
            for (uint256 votee = 0; votee < players.length; ++votee) {
                // proposerIndices is the index of the player in the previous voting round
                uint256 voteesColumn = proposerIndices[votee];
                // We slice the votes array to get the votes for the current player
                if (voteesColumn < players.length) {
                    // if index is above length of players array, it means the player did not propose
                    for (uint256 voter = 0; voter < players.length; voter++) {
                        votesSorted[voter][votee] = votes[voter][voteesColumn];
                    }
                }
            }

            // Calculate scores for previous turn's proposals
            (, uint256[] memory roundScores) = gameId.calculateScoresQuadratic(votesSorted, proposerIndices);
            for (uint256 i = 0; i < players.length; ++i) {
                string memory proposal = game.ongoingProposals[proposerIndices[i]];
                emit ProposalScore(gameId, turn, proposal, proposal, roundScores[i]);
            }
        }
        bytes32[] memory currentCommitmentHashes = new bytes32[](game.numCommitments);
        uint256 currentCommitmentHashesIndex = 0;
        for (uint256 i = 0; i < players.length; ++i) {
            bytes32 commitmentHash = game.proposalCommitmentHashes[players[i]];
            if(commitmentHash != bytes(0)) {
                currentCommitmentHashes[currentCommitmentHashesIndex] = commitmentHash;
                currentCommitmentHashesIndex++;
            }
        }

        // 2. Handle current turn's proposal reveals with single proof
        require(
            verifier.verifyProof(
                newProposals.a,
                newProposals.b,
                newProposals.c,
                [
                    uint256(keccak256(abi.encode(newProposals.proposals))),
                    uint256(keccak256(abi.encode(newProposals.nullifiers))),
                    uint256(gameId.getTurn()),
                    uint256(gameId),
                    uint256(keccak256(abi.encode(game.currentProposals))),
                    uint256(players.length)
                ]
            ),
            "Invalid batch proposal reveal proof"
        );

        // Verify nullifiers haven't been used
        for (uint256 i = 0; i < newProposals.nullifiers.length; i++) {
            require(!game.usedNullifiers[newProposals.nullifiers[i]], "Nullifier already used");
            game.usedNullifiers[newProposals.nullifiers[i]] = true;
        }

        // Emit event and clean up
        (, uint256[] memory scores) = gameId.getScores();
        emit TurnEnded(gameId, gameId.getTurn(), players, scores, newProposals.proposals, proposerIndices, votes);

        // Clean up for next turn
        for (uint256 i = 0; i < players.length; ++i) {
            game.ongoingProposals[i] = "";
            game.playerVoted[players[i]] = false;
            game.ballotHashes[players[i]] = bytes32(0);
        }
        delete game.currentProposals; // Clear all current proposals

        game.numVotesPrevTurn = game.numVotesThisTurn;
        game.numVotesThisTurn = 0;
        game.numPrevProposals = game.numCommitments;
        game.numCommitments = 0;

        _nextTurn(gameId, newProposals.proposals);
    }
}
