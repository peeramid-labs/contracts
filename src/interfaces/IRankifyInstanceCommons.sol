// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {LibQuadraticVoting} from "../libraries/LibQuadraticVoting.sol";

interface IRankifyInstanceCommons {
    struct RInstanceSettings {
        uint256 gamePrice;
        address gamePaymentToken;
        uint256 joinGamePrice;
        uint256 numGames;
        address rankTokenAddress;
        bool contractInitialized;
        LibQuadraticVoting.qVotingStruct voting;
    }

    struct RInstanceState {
        RInstanceSettings BestOfState;
        LibTBG.GameSettings TBGSEttings;
    }

    struct VoteHidden {
        bytes32 hash;
        bytes proof;
    }

    struct RInstance {
        uint256 rank;
        address createdBy;
        mapping(uint256 => string) ongoingProposals; //Previous Turn Proposals (These are being voted on)
        uint256 numOngoingProposals;
        uint256 numPrevProposals;
        mapping(address => bytes32) proposalCommitmentHashes; //Current turn Proposal submittion
        uint256 numCommitments;
        mapping(address => VoteHidden) votesHidden;
        address[] additionalRanks;
        uint256 paymentsBalance;
        uint256 numVotesThisTurn;
        uint256 numVotesPrevTurn;
        mapping(address => bool) playerVoted;
    }

    event RegistrationOpen(uint256 indexed gameid);
    event PlayerJoined(uint256 indexed gameId, address participant);
    event GameStarted(uint256 indexed gameId);
    event gameCreated(uint256 gameId, address indexed gm, address indexed creator, uint256 indexed rank);
    event GameClosed(uint256 indexed gameId);
    event PlayerLeft(uint256 indexed gameId, address indexed player);
}
