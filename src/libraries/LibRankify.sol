// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {IRankifyInstanceCommons} from "../interfaces/IRankifyInstanceCommons.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IRankToken} from "../interfaces/IRankToken.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {LibQuadraticVoting} from "./LibQuadraticVoting.sol";
import "hardhat/console.sol";

library LibRankify {
    using LibTBG for LibTBG.Instance;
    using LibTBG for uint256;
    using LibTBG for LibTBG.Settings;
    using LibTBG for LibTBG.State;
    using LibQuadraticVoting for LibQuadraticVoting.qVotingStruct;

    struct InstanceState {
        uint256 numGames;
        bool contractInitialized;
        CommonParams instanceConfiguration;
    }

    struct CommonParams {
        uint256 principalCost;
        uint256 principalTimeConstant;
        address gamePaymentToken;
        address rankTokenAddress;
    }

    struct VoteHidden {
        bytes32 hash;
        bytes proof;
    }

    struct GameState {
        uint256 joinGamePrice;
        uint256 gamePrice;
        uint256 rank;
        address createdBy;
        uint256 numOngoingProposals;
        uint256 numPrevProposals;
        uint256 numCommitments;
        address[] additionalRanks;
        uint256 paymentsBalance;
        uint256 numVotesThisTurn;
        uint256 numVotesPrevTurn;
        LibQuadraticVoting.qVotingStruct voting;
        mapping(uint256 => string) ongoingProposals; //Previous Turn Proposals (These are being voted on)
        mapping(address => bytes32) proposalCommitmentHashes; //Current turn Proposal submission
        mapping(address => VoteHidden) votesHidden;
        mapping(address => bool) playerVoted;
    }

    /**
     * @dev Compares two strings for equality. `a` and `b` are the strings to compare.
     *
     * Returns:
     *
     * - `true` if the strings are equal, `false` otherwise.
     */
    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    /**
     * @dev Returns the game storage for the given game ID. `gameId` is the ID of the game.
     *
     * Returns:
     *
     * - The game storage for `gameId`.
     */
    function getGameState(uint256 gameId) internal view returns (GameState storage game) {
        bytes32 position = LibTBG.getGameDataStorage(gameId);
        assembly {
            game.slot := position
        }
    }

    /**
     * @dev Returns the Rankify InstanceSettings storage.
     *
     * Returns:
     *
     * - The instanceState storage.
     */
    function instanceState() internal pure returns (InstanceState storage contractState) {
        bytes32 position = LibTBG.getDataStorage();
        assembly {
            contractState.slot := position
        }
    }

    bytes32 internal constant _PROPOSAL_PROOF_TYPEHASH =
        keccak256("signProposalByGM(uint256 gameId,uint256 turn,bytes32 proposalNHash,string encryptedProposal)");
    bytes32 internal constant _VOTE_PROOF_TYPEHASH =
        keccak256("signVote(uint256 vote1,uint256 vote2,uint256 vote3,uint256 gameId,uint256 turn,bytes32 salt)");
    bytes32 internal constant _VOTE_SUBMIT_PROOF_TYPEHASH =
        keccak256("publicSignVote(uint256 gameId,uint256 turn,bytes32 vote1,bytes32 vote2,bytes32 vote3)");

    /**
     * @dev Ensures that the contract is initialized.
     *
     * Requirements:
     *
     * - The contract must be initialized.
     */
    function enforceIsInitialized() internal view {
        InstanceState storage settings = instanceState();
        require(settings.contractInitialized, "onlyInitialized");
    }

    /**
     * @dev Ensures that the game with the given ID exists. `gameId` is the ID of the game.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     */
    function enforceGameExists(uint256 gameId) internal view {
        enforceIsInitialized();
        require(gameId.gameExists(), "no game found");
    }

    /**
     * @dev Creates a new game with the given parameters. `gameId` is the ID of the new game. `gameMaster` is the address of the game master. `gameRank` is the rank of the game. `creator` is the address of the creator of the game.
     *
     * Requirements:
     *
     * - The game with `gameId` must not already exist.
     * - `gameRank` must not be 0.
     * - If the game price is not 0, the `creator` must have approved this contract to transfer the game price amount of the game payment token on their behalf.
     *
     * Modifies:
     *
     * - Creates a new game with `gameId`.
     * - Transfers the game price amount of the game payment token from `creator` to this contract.
     * - Sets the payments balance of the game to the game price.
     * - Sets the creator of the game to `creator`.
     * - Increments the number of games.
     * - Sets the rank of the game to `gameRank`.
     * - Mints new rank tokens.
     */
    function newGame(uint256 gameId, address gameMaster, uint256 gameRank, address creator) internal {
        LibRankify.enforceIsInitialized();
        InstanceState storage settings = instanceState();
        gameId.createGame(gameMaster); // This will enforce game does not exist yet
        GameState storage game = getGameState(gameId);
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

    /**
     * @dev Ensures that the candidate is the creator of the game with the given ID. `gameId` is the ID of the game. `candidate` is the address of the candidate.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     * - `candidate` must be the creator of the game.
     */
    function enforceIsGameCreator(uint256 gameId, address candidate) internal view {
        enforceGameExists(gameId);
        GameState storage game = getGameState(gameId);
        require(game.createdBy == candidate, "Only game creator");
    }

    /**
     * @dev Ensures that the candidate is the game master of the game with the given ID. `gameId` is the ID of the game. `candidate` is the address of the candidate.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     * - `candidate` must be the game master of the game.
     */
    function enforceIsGM(uint256 gameId, address candidate) internal view {
        enforceGameExists(gameId);
        require(gameId.getGM() == candidate, "Only game master");
    }

    /**
     * @dev Locks the rank token of the player. `player` is the address of the player. `gameRank` is the rank of the game. `rankTokenAddress` is the address of the rank token contract.
     *
     * Requirements:
     *
     * - `RankTokenAddress` must support `IRankToken` interface
     *
     * Modifies:
     *
     * - Locks `gameRank` rank of `player` in the rank token contract.
     */
    function _fulfillRankRq(address player, uint256 gameRank, address rankTokenAddress) private {
        IRankToken rankToken = IRankToken(rankTokenAddress);
        rankToken.lock(player, gameRank, 1);
    }

    /**
     * @dev Allows a player to join a game. `gameId` is the ID of the game. `player` is the address of the player.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     * - If the join game price is not 0, the `player` must have approved this contract to transfer the join game price amount of the game payment token on their behalf.
     *
     * Modifies:
     *
     * - Transfers the join game price amount of the game payment token from `player` to this contract.
     * - Increases the payments balance of the game by the join game price.
     * - Adds `player` to the game.
     */
    function joinGame(uint256 gameId, address player) internal {
        enforceGameExists(gameId);
        fulfillRankRq(gameId, player);
        InstanceState storage _RInstance = instanceState();
        if (_RInstance.joinGamePrice != 0) {
            IERC20(_RInstance.gamePaymentToken).transferFrom(player, address(this), _RInstance.joinGamePrice);
            GameState storage game = getGameState(gameId);
            game.paymentsBalance += _RInstance.joinGamePrice;
        }
        gameId.addPlayer(player);
    }

    /**
     * @dev Closes the game with the given ID and transfers the game's balance to the beneficiary. `gameId` is the ID of the game. `beneficiary` is the address to transfer the game's balance to. `playersGameEndedCallback` is a callback function to call for each player when the game ends.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     *
     * Modifies:
     *
     * - Emits rank rewards for the game.
     * - Removes and unlocks each player from the game.
     * - Calls `playersGameEndedCallback` for each player.
     * - Transfers the game's balance to `beneficiary`.
     *
     * Returns:
     *
     * - The final scores of the game.
     */
    function closeGame(
        uint256 gameId,
        address beneficiary,
        function(uint256, address) playersGameEndedCallback
    ) internal returns (uint256[] memory) {
        enforceGameExists(gameId);
        emitRankRewards(gameId, gameId.getLeaderBoard());
        (, uint256[] memory finalScores) = gameId.getScores();
        address[] memory players = gameId.getPlayers();
        for (uint256 i = 0; i < players.length; ++i) {
            removeAndUnlockPlayer(gameId, players[i]);
            playersGameEndedCallback(gameId, players[i]);
        }
        InstanceState storage _RInstance = LibRankify.instanceState();
        IERC20(_RInstance.gamePaymentToken).transfer(
            beneficiary,
            (_RInstance.joinGamePrice * players.length) + _RInstance.gamePrice
        );
        return finalScores;
    }

    /**
     * @dev Allows a player to quit a game. `gameId` is the ID of the game. `player` is the address of the player. `slash` is a boolean indicating whether to slash the player's payment refund. `onPlayerLeftCallback` is a callback function to call when the player leaves.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     *
     * Modifies:
     *
     * - If the join game price is not 0, transfers a refund to `player` and decreases the game's payments balance by the refund amount.
     * - Removes and unlocks `player` from the game.
     * - Calls `onPlayerLeftCallback` for `player`.
     */
    function quitGame(
        uint256 gameId,
        address player,
        bool slash,
        function(uint256, address) onPlayerLeftCallback
    ) internal {
        InstanceState storage _RInstance = instanceState();
        if (_RInstance.joinGamePrice != 0) {
            uint256 divideBy = slash ? 2 : 1;
            uint256 paymentRefund = _RInstance.joinGamePrice / divideBy;
            GameState storage game = getGameState(gameId);
            game.paymentsBalance -= paymentRefund;
            IERC20(_RInstance.gamePaymentToken).transfer(player, paymentRefund);
        }
        removeAndUnlockPlayer(gameId, player); // this will throw if game has started or doesnt exist
        onPlayerLeftCallback(gameId, player);
    }

    /**
     * @dev Cancels the game with the given ID, refunds half of the game's payment to the game creator, and transfers the remaining balance to the beneficiary. `gameId` is the ID of the game. `onPlayerLeftCallback` is a callback function to call for each player when they leave. `beneficiary` is the address to transfer the remaining balance to.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     *
     * Modifies:
     *
     * - Calls `quitGame` for each player in the game.
     * - Transfers half of the game's payment to the game creator.
     * - Decreases the game's payments balance by the refund amount.
     * - Transfers the remaining balance of the game to `beneficiary`.
     * - Deletes the game.
     */ function cancelGame(
        uint256 gameId,
        function(uint256, address) onPlayerLeftCallback,
        address beneficiary
    ) internal {
        // Cancel the game for each player
        address[] memory players = gameId.getPlayers();
        for (uint256 i = 0; i < players.length; ++i) {
            quitGame(gameId, players[i], false, onPlayerLeftCallback); //this will throw if game has started or doesnt exist
        }

        // Refund payment to the game creator
        GameState storage game = getGameState(gameId);
        InstanceState storage _RInstance = instanceState();
        uint256 paymentRefund = _RInstance.gamePrice / 2;
        IERC20(_RInstance.gamePaymentToken).transfer(game.createdBy, paymentRefund);
        game.paymentsBalance -= paymentRefund;

        // Transfer remaining payments balance to the beneficiary
        IERC20(_RInstance.gamePaymentToken).transfer(beneficiary, game.paymentsBalance);
        game.paymentsBalance = 0;

        // Delete the game
        gameId.deleteGame();
    }

    /**
     * @dev Fulfills the rank requirement for a player to join a game. `gameId` is the ID of the game. `player` is the address of the player.
     *
     * Modifies:
     *
     * - Locks the rank token(s) of `player` in the rank token contract.
     * - If the game has additional ranks, locks the additional ranks of `player` in the respective rank token contracts.
     */
    function fulfillRankRq(uint256 gameId, address player) internal {
        InstanceState storage settings = instanceState();
        GameState storage game = getGameState(gameId);
        if (game.rank > 1) {
            _fulfillRankRq(player, game.rank, settings.rankTokenAddress);
            for (uint256 i = 0; i < game.additionalRanks.length; ++i) {
                _fulfillRankRq(player, game.rank, game.additionalRanks[i]);
            }
        }
    }

    /**
     * @dev Emits rank rewards to the top three addresses in the leaderboard. `gameId` is the ID of the game. `leaderboard` is an array of addresses representing the leaderboard sorted in descendign order. `rankTokenAddress` is the address of the rank token contract.
     *
     * Modifies:
     *
     * - Transfers rank tokens from this contract to the top three addresses in the leaderboard.
     */
    function emitRankReward(uint256 gameId, address[] memory leaderboard, address rankTokenAddress) private {
        GameState storage game = getGameState(gameId);
        IRankToken rankTokenContract = IRankToken(rankTokenAddress);
        rankTokenContract.safeTransferFrom(address(this), leaderboard[0], game.rank + 1, 1, "");
        rankTokenContract.safeTransferFrom(address(this), leaderboard[1], game.rank, 2, "");
        rankTokenContract.safeTransferFrom(address(this), leaderboard[2], game.rank, 1, "");
    }

    /**
     * @dev Emits rank rewards to the top addresses in the leaderboard for each rank in the game. `gameId` is the ID of the game. `leaderboard` is an array of addresses representing the leaderboard.
     *
     * Modifies:
     *
     * - Calls `emitRankReward` for the main rank and each additional rank in the game.
     */
    function emitRankRewards(uint256 gameId, address[] memory leaderboard) internal {
        GameState storage game = getGameState(gameId);
        InstanceState storage settings = LibRankify.instanceState();
        emitRankReward(gameId, leaderboard, settings.rankTokenAddress);
        for (uint256 i = 0; i < game.additionalRanks.length; ++i) {
            emitRankReward(gameId, leaderboard, game.additionalRanks[i]);
        }
    }

    /**
     * @dev Releases a rank token for a player with a specific game rank. `player` is the address of the player. `gameRank` is the game rank of the player. `rankTokenAddress` is the address of the rank token contract.
     *
     * Modifies:
     *
     * - Unlocks one rank token of `gameRank` for `player` in the rank token contract.
     */
    function _releaseRankToken(address player, uint256 gameRank, address rankTokenAddress) private {
        IRankToken rankToken = IRankToken(rankTokenAddress);
        rankToken.unlock(player, gameRank, 1);
    }

    /**
     * @dev Removes a player from a game and unlocks their rank tokens. `gameId` is the ID of the game. `player` is the address of the player to be removed.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     *
     * Modifies:
     *
     * - Removes `player` from the game.
     * - If the game rank is greater than 1, unlocks the game rank token for `player` in the rank token contract and unlocks each additional rank token for `player` in the respective rank token contracts.
     */
    function removeAndUnlockPlayer(uint256 gameId, address player) internal {
        enforceGameExists(gameId);
        gameId.removePlayer(player); //This will throw if game is in the process
        InstanceState storage settings = instanceState();
        GameState storage game = getGameState(gameId);
        if (game.rank > 1) {
            _releaseRankToken(player, game.rank, settings.rankTokenAddress);
            for (uint256 i = 0; i < game.additionalRanks.length; ++i) {
                _releaseRankToken(player, game.rank, game.additionalRanks[i]);
            }
        }
    }

    /**
     * @dev Tries to make a move for a player in a game. `gameId` is the ID of the game. `player` is the address of the player.
     * The "move" is considered to be a state when player has made all actions he could in the given turn.
     *
     * Requirements:
     *
     * - The game with `gameId` must exist.
     *
     * Modifies:
     *
     * - If the player has not voted and a vote is expected, or if the player has not made a proposal and a proposal is expected, does not make a move and returns `false`.
     * - Otherwise, makes a move for `player` and returns `true`.
     */
    function tryPlayerMove(uint256 gameId, address player) internal returns (bool) {
        uint256 turn = gameId.getTurn();
        InstanceState storage settings = instanceState();
        GameState storage game = getGameState(gameId);
        bool expectVote = true;
        bool expectProposal = true;
        if (turn == 1) expectVote = false; //Dont expect votes at firt turn
        // else if (gameId.isLastTurn()) expectProposal = false; // For now easiest solution is to keep collecting proposals as that is less complicated boundry case
        if (game.numPrevProposals < settings.voting.minQuadraticPositons) expectVote = false; // If there is not enough proposals then round is skipped votes cannot be filled
        bool madeMove = true;
        if (expectVote && !game.playerVoted[player]) madeMove = false;
        if (expectProposal && game.proposalCommitmentHashes[player] == "") madeMove = false;
        if (madeMove) gameId.playerMove(player);
        return madeMove;
    }

    /**
     * @dev Calculates the scores using a quadratic formula based on the revealed votes and proposer indices. `gameId` is the ID of the game. `votesRevealed` is an array of revealed votes. `proposerIndicies` is an array of proposer indices that links proposals to index in getPlayers().
     *
     * Returns:
     *
     * - An array of updated scores for each player.
     * - An array of scores calculated for the current round.
     */
    function calculateScoresQuadratic(
        uint256 gameId,
        uint256[][] memory votesRevealed,
        uint256[] memory proposerIndicies
    ) internal returns (uint256[] memory, uint256[] memory) {
        address[] memory players = gameId.getPlayers();
        uint256[] memory scores = new uint256[](players.length);
        bool[] memory playerVoted = new bool[](players.length);
        InstanceState storage settings = instanceState();
        GameState storage game = getGameState(gameId);
        // Convert mappiing to array to pass it to libQuadratic
        for (uint256 i = 0; i < players.length; ++i) {
            playerVoted[i] = game.playerVoted[players[i]];
        }
        uint256[] memory roundScores = settings.voting.computeScoresByVPIndex(
            votesRevealed,
            playerVoted,
            settings.voting.maxQuadraticPoints,
            proposerIndicies.length
        );
        for (uint256 playerIdx = 0; playerIdx < players.length; playerIdx++) {
            //for each player
            if (proposerIndicies[playerIdx] < players.length) {
                //if player proposal exists
                scores[playerIdx] = gameId.getScore(players[playerIdx]) + roundScores[playerIdx];
                gameId.setScore(players[playerIdx], scores[playerIdx]);
            } else {
                //Player did not propose
            }
        }
        return (scores, roundScores);
    }
}
