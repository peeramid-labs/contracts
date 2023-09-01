// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {LibCoinVending} from "../libraries/LibCoinVending.sol";

interface IBestOf {
    struct Score {
        address participant;
        uint256 score;
    }

    struct BOGSettings {
        uint256 gamePrice;
        uint256 joinGamePrice;
        uint256 numGames;
        address rankTokenAddress;
        bool contractInitialized;
    }

    struct ContractState {
        BOGSettings BestOfState;
        LibTBG.GameSettings TBGSEttings;
    }

    // struct HiddenProposal {
    //     string cipherText; //encrypted with game masters key
    //     bytes32 hash; //plain proposal string hashed with current turn salt
    // }

    struct VoteHidden {
        bytes32[3] votedFor;
        bytes proof;
    }

    struct BOGInstance {
        uint256 rank;
        address createdBy;
        mapping(uint256 => string) ongoingProposals; //Previous Turn Proposals (These are being voted on)
        uint256 numOngoingProposals;
        mapping(address => bytes32) proposalCommitmentHashes; //Current turn Proposal submittion
        uint256 numCommitments;
        mapping(address => VoteHidden) votesHidden;
    }

    event RegistrationOpen(uint256 indexed gameid);
    event PlayerJoined(uint256 indexed gameId, address participant);
    event GameStarted(uint256 indexed gameId);
    event gameCreated(uint256 gameId, address indexed gm, address indexed creator, uint256 rank);
    event GameClosed(uint256 indexed gameId);
    event PlayerLeft(uint256 indexed gameId, address indexed player);
}
