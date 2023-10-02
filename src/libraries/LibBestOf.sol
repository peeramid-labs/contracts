// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {IBestOf} from "../interfaces/IBestOf.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IRankToken} from "../interfaces/IRankToken.sol";

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
        keccak256("signProposalByGM(uint256 gameId,uint256 turn,bytes32 proposalNHash,string encryptedProposal)");
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

    function _fulfillRankRq(address player, uint256 gameRank, address rankTokenAddress) private {
        IRankToken rankToken = IRankToken(rankTokenAddress);
        rankToken.lockInInstance(player, gameRank, 1);
    }

    function fulfillRankRq(uint256 gameId, address player) internal {
        IBestOf.BOGSettings storage settings = BOGStorage();
        IBestOf.BOGInstance storage game = getGameStorage(gameId);
        if (game.rank > 1) {
            _fulfillRankRq(player, game.rank, settings.rankTokenAddress);
            for (uint256 i = 0; i < game.additionalRanks.length; i++) {
                _fulfillRankRq(player, game.rank, game.additionalRanks[i]);
            }
        }
    }

    function emitRankReward(uint256 gameId, address[] memory leaderboard, address rankTokenAddress) private {
        IBestOf.BOGInstance storage game = getGameStorage(gameId);
        IRankToken rankTokenContract = IRankToken(rankTokenAddress);
        rankTokenContract.safeTransferFrom(address(this), leaderboard[0], game.rank + 1, 1, "");
        rankTokenContract.safeTransferFrom(address(this), leaderboard[1], game.rank, 2, "");
        rankTokenContract.safeTransferFrom(address(this), leaderboard[2], game.rank, 1, "");
    }

    function emitRankRewards(uint256 gameId, address[] memory leaderboard) internal {
        IBestOf.BOGInstance storage game = getGameStorage(gameId);
        IBestOf.BOGSettings storage settings = LibBestOf.BOGStorage();
        emitRankReward(gameId, leaderboard, settings.rankTokenAddress);
        for (uint256 i = 0; i < game.additionalRanks.length; i++) {
            emitRankReward(gameId, leaderboard, game.additionalRanks[i]);
        }
    }

    function _releaseRankToken(address player, uint256 gameRank, address rankTokenAddress) private {
        IRankToken rankToken = IRankToken(rankTokenAddress);
        rankToken.unlockFromInstance(player, gameRank, 1);
    }

    function removeAndUnlockPlayer(uint256 gameId, address player) internal {
        gameId.removePlayer(player);
        IBestOf.BOGSettings storage settings = BOGStorage();
        IBestOf.BOGInstance storage game = getGameStorage(gameId);
        if (game.rank > 1) {
            _releaseRankToken(player, game.rank, settings.rankTokenAddress);
            for (uint256 i = 0; i < game.additionalRanks.length; i++) {
                _releaseRankToken(player, game.rank, game.additionalRanks[i]);
            }
        }
    }
}
