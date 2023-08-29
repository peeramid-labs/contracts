// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { LibArray } from "../libraries/LibArray.sol";
import { LibTBG } from "../libraries/LibTurnBasedGame.sol";
import { LibBestOf } from "../libraries/LibBestOf.sol";
import { IBestOf } from "../interfaces/IBestOf.sol";
import "../abstracts/DiamondReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../abstracts/draft-EIP712Diamond.sol";
import { RankToken } from "../tokens/RankToken.sol";
import { LibCoinVending } from "../libraries/LibCoinVending.sol";

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
    bytes32 indexed turnSalt,
    address[] voters,
    uint256[3][] votesRevealed
  );

  event GameOver(
    uint256 indexed gameId,
    address[] indexed players,
    uint256[] indexed scores
  );

  function checkSignature(
    bytes memory message,
    bytes memory signature,
    address account
  ) public view returns (bool) {
    bytes32 typedHash = _hashTypedDataV4(keccak256(message));
    return SignatureChecker.isValidSignatureNow(account, typedHash, signature);
  }

  function playerSalt(
    address player,
    bytes32 turnSalt
  ) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(player, turnSalt));
  }

  function validateVote(
    uint256 gameId,
    address voter,
    uint256[3] memory votes,
    bytes32 turnSalt,
    address[] memory prevProposersRevealed
  ) public view {
    IBestOf.BOGInstance storage game = gameId.getGameStorage();
    bytes32 salt = playerSalt(voter, turnSalt);
    require(gameId.isPlayerInGame(voter), "Player not in that game");
    bytes memory message = abi.encode( //Todo must contain address of voter
      LibBestOf._VOTE_PROOF_TYPEHASH,
      votes[0],
      votes[1],
      votes[2],
      gameId,
      gameId.getTurn(),
      salt
    );
    bytes memory proof = game.votesHidden[voter].proof;
    require(
      _isValidSignature(message, proof, gameId.getGM()),
      "invalid signature"
    );
    //make sure voter did not vote for himself
    for (uint256 i = 0; i < votes.length; i++) {
      require(prevProposersRevealed[votes[i]] != voter, "voted for himself");
    }
  }

  function validateVotes(
    uint256 gameId,
    address[] memory voters,
    uint256[3][] memory votes,
    bytes32 turnSalt,
    address[] memory prevProposersRevealed
  ) private view {
    for (uint256 i = 0; i < gameId.getPlayersNumber(); i++) {
      validateVote(
        gameId,
        voters[i],
        [votes[i][0], votes[i][1], votes[i][2]],
        turnSalt,
        prevProposersRevealed
      );
    }
  }

  function _isValidSignature(
    bytes memory message,
    bytes memory signature,
    address account
  ) private view returns (bool) {
    return checkSignature(message, signature, account);
  }

  function _endGame(
    uint256 gameId,
    address[] memory leaderboard,
    uint256[] memory scores,
    address[] memory players
  ) internal nonReentrant {
    IBestOf.BOGInstance storage game = gameId.getGameStorage();
    gameId.closeGame();
    emitRankRewards(gameId, leaderboard);

    for (uint256 i = 0; i < players.length; i++) {
      LibCoinVending.release(
        bytes32(gameId),
        game.createdBy,
        leaderboard[0],
        players[i]
      );
      LibBestOf.fulfillRankRq(address(this), players[i], game.rank, true);
    }
    emit GameOver(gameId, players, scores);
  }

  function endVoting(
    uint256 gameId,
    bytes32 turnSalt,
    address[] memory voters,
    uint256[3][] memory votesRevealed,
    address[] memory prevProposersRevealed
  ) private {
    address[] memory players = gameId.getPlayers();
    IBestOf.BOGInstance storage game = gameId.getGameStorage();
    uint256[] memory scores = new uint256[](players.length);
    for (uint256 i = 0; i < game.numOngoingProposals; i++) {
      if (
        (gameId.getTurn() != 1) && bytes(game.ongoingProposals[i]).length != 0
      ) {
        //if proposal exsists
        validateVotes(
          gameId,
          voters,
          votesRevealed,
          turnSalt,
          prevProposersRevealed
        );
        scores[i] =
          gameId.getScore(players[i]) +
          LibBestOf.getProposalScore(gameId, voters, votesRevealed, players[i]);
        gameId.setScore(players[i], scores[i]);
      } else {
        //Player did not propose anything - his score stays same;
        //Unless there is still time to submit proposals
      }
    }
    (
      bool _isLastTurn,
      bool _isOvertime,
      bool _isGameOver,
      address[] memory leaderboard
    ) = gameId.nextTurn();
    game.numOngoingProposals = 0; //numProposals = 0;
    game.prevTurnSalt = turnSalt;
    emit TurnEnded(
      gameId,
      gameId.getTurn() - 1,
      players,
      scores,
      turnSalt,
      voters,
      votesRevealed
    );
    if (_isLastTurn && _isOvertime) {
      emit OverTime(gameId);
    }
    if (_isLastTurn) {
      emit LastTurn(gameId);
    }
    if (_isGameOver) {
      _endGame(gameId, leaderboard, scores, players);
    }
  }

  event ProposalSubmitted(
    uint256 indexed gameId,
    uint256 indexed turn,
    address indexed proposer,
    bytes gmSignature,
    string proposalEncryptedByGM,
    bytes32 proposalHash
  );

  function submitProposal(
    uint256 gameId,
    bytes memory gmSignature,
    string memory encryptedByGMProposal,
    bytes32 proposalHash
  ) public {
    // LibBestOf.enforceIsGM(gameId);
    IBestOf.BOGInstance storage game = gameId.getGameStorage();
    gameId.enforceGameExists();
    gameId.enforceHasStarted();
    require(LibTBG.getPlayersGame(msg.sender) == gameId, "not a player");
    require(!gameId.isGameOver(), "Game over");
    require(!gameId.isLastTurn(), "Cannot propose in last turn");
    uint256 _turn = gameId.getTurn();
    require(bytes(encryptedByGMProposal).length != 0, "Cannot propose empty");
    require(
      game.futureProposalHashes[proposalHash] == false,
      "Already proposed!"
    );
    bytes memory message = abi.encode(
      LibBestOf._PROPOSAL_PROOF_TYPEHASH,
      gameId,
      _turn,
      proposalHash,
      keccak256(abi.encodePacked(encryptedByGMProposal))
    );
    require(
      _isValidSignature(message, gmSignature, gameId.getGM()),
      "wrong signature"
    );
    game.futureProposalHashes[proposalHash] = true;
    game.numFutureProposals += 1;
    //ToDo: Here must have ZK proof workflow that ensures unique proposer from proposers pool and in simple manner - that numFutureProposals is below numPlayers.
    //In MVP assumption is that GM service is honest
    emit ProposalSubmitted(
      gameId,
      gameId.getTurn(),
      msg.sender,
      gmSignature,
      encryptedByGMProposal,
      proposalHash
    );
  }

  function startNewVoting(
    uint256 gameId,
    string[] memory ProposalsRevealed
  ) private {
    address[] memory players = gameId.getPlayers();
    IBestOf.BOGInstance storage game = gameId.getGameStorage();
    for (uint256 i = 0; i < players.length; i++) {
      //indexing trough players does not mean i corresponds to a player, but rather to a max number of possible proposals out there
      game.numOngoingProposals = 0;
      if (game.numFutureProposals > i) {
        //This would be a good place for ZK proof that hash(proposalRevealed + salt) is equal to futureProposalHashes without revealing the salt
        //Whilist this relies on Game Master submitting correct data, otherwise will fail later on when turn is ending.
        game.ongoingProposals[i] = ProposalsRevealed[i];
        game.numOngoingProposals += 1;
      } else {
        // Some proposals were not submitted -> cleaning up old proposals
        game.ongoingProposals[i] = "";
      }
      bytes32 revealedProposalHash = keccak256(
        abi.encodePacked(ProposalsRevealed[i])
      );
      assert(game.futureProposalHashes[revealedProposalHash] == true);
      game.futureProposalHashes[revealedProposalHash] = false;
    }
    game.numFutureProposals = 0;
  }

  function enforceValidProposalsRevealed(
    uint256 gameId,
    address[] memory prevProposersRevealed,
    string[] memory ProposalsRevealed
  ) private view {
    IBestOf.BOGInstance storage game = gameId.getGameStorage();
    for (uint256 i = 0; i < prevProposersRevealed.length; i++) {
      address proposer = prevProposersRevealed[i];
      bytes32 revealedProposalHash = keccak256(
        abi.encodePacked(ProposalsRevealed[i])
      );
      bool proposalHashFromStore = game.futureProposalHashes[
        revealedProposalHash
      ];
      require(proposalHashFromStore, "Proposal hashes do not match");
    }
  }

  //Proposers order must be same as hidden proposal ordering in game.proposals
  function endTurn(
    uint256 gameId,
    bytes32 turnSalt,
    address[] memory voters,
    uint256[3][] memory votesRevealed,
    string[] memory ProposalsRevealed, //REFERRING TO UPCOMING VOTING ROUND
    address[] memory prevProposersRevealed //REFERRING TO PREVIOUS VOTING ROUND
  ) public {
    LibBestOf.enforceIsGM(gameId);

    IBestOf.BOGInstance storage game = gameId.getGameStorage();
    require(!gameId.isGameOver(), "Game over");
    gameId.enforceHasStarted();
    if (gameId.getTurn() != 1) {
      require(gameId.canEndTurn() == true, "Cannot do this now");
    }
    if (!gameId.isLastTurn()) {
      require(
        (game.numFutureProposals == gameId.getPlayers().length) ||
          gameId.isTurnTimedOut(),
        "Some players still have time to propose"
      );
    }
    enforceValidProposalsRevealed(
      gameId,
      prevProposersRevealed,
      ProposalsRevealed
    );
    endVoting(gameId, turnSalt, voters, votesRevealed, prevProposersRevealed);
    startNewVoting(gameId, ProposalsRevealed);
  }

  function emitRankRewards(
    uint256 gameId,
    address[] memory leaderboard
  ) private {
    IBestOf.BOGInstance storage game = gameId.getGameStorage();
    IBestOf.BOGSettings storage settings = LibBestOf.BOGStorage();
    RankToken rankTokenContract = RankToken(settings.rankTokenAddress);
    rankTokenContract.safeTransferFrom(
      address(this),
      leaderboard[0],
      game.rank + 1,
      1,
      ""
    );
    rankTokenContract.safeTransferFrom(
      address(this),
      leaderboard[1],
      game.rank,
      2,
      ""
    );
    rankTokenContract.safeTransferFrom(
      address(this),
      leaderboard[2],
      game.rank,
      1,
      ""
    );
  }
}
