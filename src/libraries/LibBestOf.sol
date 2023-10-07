// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {IBestOf} from "../interfaces/IBestOf.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IRankToken} from "../interfaces/IRankToken.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
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

    function newGame(uint256 gameId, address gameMaster, uint256 gameRank, address creator) internal {
        LibBestOf.enforceIsInitialized();
        IBestOf.BOGSettings storage settings = BOGStorage();
        gameId.createGame(gameMaster); // This will enforce game does not exist yet
        IBestOf.BOGInstance storage game = getGameStorage(gameId);
        require(gameRank != 0, "game rank not specified");
        if (settings.gamePrice != 0) {
            IERC20(settings.gamePaymentToken).transferFrom(creator, address(this), settings.gamePrice);
            game.paymentsBalance = settings.gamePrice;
        }

        game.createdBy = creator;
        settings.numGames += 1;
        game.rank = gameRank;

        IRankToken rankTokenContract = IRankToken(settings.rankTokenAddress);
        rankTokenContract.mint(address(this), 1, gameRank + 1, "");
        rankTokenContract.mint(address(this), 3, gameRank, "");
    }

    function enforceIsGameCreator(uint256 gameId, address candidate) internal view {
        enforceGameExists(gameId);
        IBestOf.BOGInstance storage game = getGameStorage(gameId);
        require(game.createdBy == candidate, "Only game creator");
    }

    function enforceIsGM(uint256 gameId, address candidate) internal view {
        enforceGameExists(gameId);
        require(gameId.getGM() == candidate, "Only game master");
    }

    function _fulfillRankRq(address player, uint256 gameRank, address rankTokenAddress) private {
        IRankToken rankToken = IRankToken(rankTokenAddress);
        rankToken.lockInInstance(player, gameRank, 1);
    }

    function joinGame(uint256 gameId, address player) internal {
        enforceGameExists(gameId);
        fulfillRankRq(gameId, player);
        IBestOf.BOGSettings storage _BOG = BOGStorage();
        if (_BOG.joinGamePrice != 0) {
            IERC20(_BOG.gamePaymentToken).transferFrom(player, address(this), _BOG.joinGamePrice);
            IBestOf.BOGInstance storage game = getGameStorage(gameId);
            game.paymentsBalance += _BOG.joinGamePrice;
        }
        gameId.addPlayer(player);
    }

    function closeGame(
        uint256 gameId,
        address beneficiary,
        function(uint256, address) playersGameEndedCallback
    ) internal returns (uint256[] memory) {
        enforceGameExists(gameId);
        emitRankRewards(gameId, gameId.getLeaderBoard());
        (, uint256[] memory finalScores) = gameId.getScores();
        address[] memory players = gameId.getPlayers();
        for (uint256 i = 0; i < players.length; i++) {
            removeAndUnlockPlayer(gameId, players[i]);
            playersGameEndedCallback(gameId, players[i]);
        }
        IBestOf.BOGSettings storage _BOG = LibBestOf.BOGStorage();
        IERC20(_BOG.gamePaymentToken).transfer(beneficiary, (_BOG.joinGamePrice * players.length) + _BOG.gamePrice);
        return finalScores;
    }

    function quitGame(
        uint256 gameId,
        address player,
        bool slash,
        function(uint256, address) onPlayerLeftCallback
    ) internal {
        IBestOf.BOGSettings storage _BOG = BOGStorage();
        if (_BOG.joinGamePrice != 0) {
            uint256 divideBy = slash ? 2 : 1;
            uint256 paymentRefund = _BOG.joinGamePrice / divideBy;
            IBestOf.BOGInstance storage game = getGameStorage(gameId);
            game.paymentsBalance -= paymentRefund;
            IERC20(_BOG.gamePaymentToken).transfer(player, paymentRefund);
        }
        removeAndUnlockPlayer(gameId, player); // this will throw if game has started or doesnt exist
        onPlayerLeftCallback(gameId, player);
    }

    function cancelGame(uint256 gameId, function(uint256, address) onPlayerLeftCallback, address beneficiary) internal {
        address[] memory players = gameId.getPlayers();
        for (uint256 i = 0; i < players.length; i++) {
            quitGame(gameId, players[i], false, onPlayerLeftCallback); //this will throw if game has started or doesnt exist
        }
        IBestOf.BOGInstance storage game = getGameStorage(gameId);
        IBestOf.BOGSettings storage _BOG = BOGStorage();
        uint256 paymentRefund = _BOG.gamePrice / 2;
        IERC20(_BOG.gamePaymentToken).transfer(game.createdBy, paymentRefund);
        game.paymentsBalance -= paymentRefund;
        IERC20(_BOG.gamePaymentToken).transfer(beneficiary, game.paymentsBalance);
        game.paymentsBalance = 0;
        gameId.deleteGame();
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
        enforceGameExists(gameId);
        gameId.removePlayer(player); //This will throw if game is in the process
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
