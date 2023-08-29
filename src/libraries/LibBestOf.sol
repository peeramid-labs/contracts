// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {IBestOf} from "../interfaces/IBestOf.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

import "hardhat/console.sol";

library LibBestOf {
    using LibTBG for LibTBG.GameInstance;
    using LibTBG for uint256;
    using LibTBG for LibTBG.GameSettings;

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    function getGameStorage(uint256 gameId) internal view returns (IBestOf.BOGInstance storage game) {
        bytes32 position = LibTBG.getGameDataStorage(gameId);
        assembly {
            game.slot := position
        }
    }

    function BOGStorage() internal pure returns (IBestOf.BOGSettings storage bog) {
        bytes32 position = LibTBG.getDataStorage();
        assembly {
            bog.slot := position
        }
    }

    bytes32 internal constant _PROPOSAL_PROOF_TYPEHASH =
        keccak256("signProposalByGM(uint256 gameId,uint256 turn,bytes32 proposalHash,string encryptedByGMProposal)");
    bytes32 internal constant _VOTE_PROOF_TYPEHASH =
        keccak256("signVote(uint256 vote1,uint256 vote2,uint256 vote3,uint256 gameId,uint256 turn,bytes32 salt)");
    bytes32 internal constant _VOTE_SUBMIT_PROOF_TYPEHASH =
        keccak256("publicSignVote(uint256 gameId,uint256 turn,bytes32 vote1,bytes32 vote2,bytes32 vote3)");

    function enforceIsInitialized() internal view {
        IBestOf.BOGSettings storage settings = BOGStorage();
        require(settings.contractInitialized, "onlyInitialized");
    }

    function enforceGameExists(uint256 gameId) internal view {
        enforceIsInitialized();
        require(gameId.gameExists(), "no game found");
    }

    function enforceIsGameCreator(uint256 gameId) internal view {
        enforceGameExists(gameId);
        IBestOf.BOGInstance storage game = getGameStorage(gameId);
        require(game.createdBy == msg.sender, "Only game creator");
    }

    function enforceIsGM(uint256 gameId) internal view {
        enforceGameExists(gameId);
        require(gameId.getGM() == msg.sender, "Only game master");
    }

    function getProposalScore(
        uint256 gameId,
        address[] memory voters,
        uint256[3][] memory votesRevealed,
        address proposer
    ) internal view returns (uint256) {
        address[] memory players = gameId.getPlayers();
        IBestOf.BOGInstance storage game = getGameStorage(gameId);
        uint256 proposalIdx = game.playersOngoingProposalIdx[proposer];
        assert(voters.length <= players.length);
        uint256 score = 0;
        for (uint256 i = 0; i < voters.length; i++) {
            if (votesRevealed[i][0] == proposalIdx) score += 3;
            if (votesRevealed[i][1] == proposalIdx) score += 2;
            if (votesRevealed[i][2] == proposalIdx) score += 1;
            if (
                (votesRevealed[i][0] >= game.numOngoingProposals ||
                    votesRevealed[i][1] >= game.numOngoingProposals ||
                    votesRevealed[i][2] >= game.numOngoingProposals ||
                    (voters[i] != proposer))
            ) score = 3; // This means vote is empty -> give 3 points everyone except voter (N.B. Ensure default Vote Indicies not equal to zero! )
        }
        return score;
    }

    function fulfillRankRq(address applicant, address to, uint256 gameRank, bool mustLock) internal {
        IBestOf.BOGSettings storage settings = BOGStorage();
        if (gameRank > 1) {
            IERC1155 rankToken = IERC1155(settings.rankTokenAddress);
            if (mustLock) {
                rankToken.safeTransferFrom(applicant, to, gameRank, 1, "0x");
            } else {
                require(rankToken.balanceOf(applicant, gameRank) > 0, "Has no rank for this action");
            }
        }
    }

    function removeAndUnlockPlayer(uint256 gameId, address player) internal {
        gameId.removePlayer(player);
        IBestOf.BOGInstance storage game = getGameStorage(gameId);
        LibBestOf.fulfillRankRq(address(this), player, game.rank, true);
    }
}
