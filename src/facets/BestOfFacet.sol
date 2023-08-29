// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { LibTBG } from "../libraries/LibTurnBasedGame.sol";
import { IBestOf } from "../interfaces/IBestOf.sol";

import { IERC1155Receiver } from "../interfaces/IERC1155Receiver.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import { IRankToken } from "../interfaces/IRankToken.sol";
import "../abstracts/DiamondReentrancyGuard.sol";
import { LibBestOf } from "../libraries/LibBestOf.sol";
import { LibCoinVending } from "../libraries/LibCoinVending.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../abstracts/draft-EIP712Diamond.sol";

import "hardhat/console.sol";

contract BestOfFacet is
  IBestOf,
  IERC1155Receiver,
  DiamondReentrancyGuard,
  IERC721Receiver,
  EIP712
{
  using LibTBG for LibTBG.GameInstance;
  using LibTBG for uint256;
  using LibTBG for LibTBG.GameSettings;
  using LibBestOf for uint256;

  event VoteSubmitted(
    uint256 indexed gameId,
    uint256 indexed turn,
    address indexed player,
    bytes32[3] votesHidden,
    bytes proof
  );

  function checkSignature(
    bytes memory message,
    bytes memory signature,
    address account
  ) private view returns (bool) {
    bytes32 typedHash = _hashTypedDataV4(keccak256(message));
    return SignatureChecker.isValidSignatureNow(account, typedHash, signature);
  }

  function _isValidSignature(
    bytes memory message,
    bytes memory signature,
    address account
  ) private view returns (bool) {
    return checkSignature(message, signature, account);
  }

  function BOGStorage() internal pure returns (BOGSettings storage bog) {
    bytes32 position = LibTBG.getDataStorage();
    assembly {
      bog.slot := position
    }
  }

  function createGame(
    address gameMaster,
    uint256 gameId,
    uint256 gameRank
  ) public payable nonReentrant {
    LibBestOf.enforceIsInitialized();
    BOGSettings storage settings = BOGStorage();
    gameId.createGame(gameMaster);
    // LibBestOf.fulfillTokenRequirement(msg.sender, address(this), gameId, settings.newGameReq);
    require(gameRank != 0, "game rank not specified");
    require(msg.value >= settings.gamePrice, "Not enough payment");
    LibBestOf.fulfillRankRq(msg.sender, address(this), gameRank, false);
    BOGInstance storage game = gameId.getGameStorage();
    game.createdBy = msg.sender;
    settings.numGames += 1;
    game.rank = gameRank;

    IRankToken rankTokenContract = IRankToken(settings.rankTokenAddress);
    rankTokenContract.mint(address(this), 1, gameRank + 1, "");
    rankTokenContract.mint(address(this), 3, gameRank, "");

    LibCoinVending.ConfigPosition memory emptyConfig;
    LibCoinVending.configure(bytes32(gameId), emptyConfig);

    emit gameCreated(gameId, gameMaster, msg.sender, gameRank);
  }

  function createGame(address gameMaster, uint256 gameRank) public payable {
    LibBestOf.enforceIsInitialized();
    BOGSettings storage settings = BOGStorage();
    createGame(gameMaster, settings.numGames + 1, gameRank);
  }

  function cancelGame(uint256 gameId) public nonReentrant {
    gameId.enforceGameExists();
    LibBestOf.enforceIsGameCreator(gameId);
    require(!gameId.hasStarted(), "Game already has started");
    address[] memory players = gameId.getPlayers();
    for (uint256 i = 0; i < players.length; i++) {
      gameId.removeAndUnlockPlayer(players[i]);
      LibCoinVending.refund(bytes32(gameId), players[i]);
      emit PlayerLeft(gameId, players[i]);
    }
    gameId.closeGame();
    emit GameClosed(gameId);
  }

  function leaveGame(uint256 gameId) public nonReentrant {
    gameId.removeAndUnlockPlayer(msg.sender);
    LibCoinVending.refund(bytes32(gameId), msg.sender);
    emit PlayerLeft(gameId, msg.sender);
  }

  function openRegistration(uint256 gameId) public {
    LibBestOf.enforceIsGameCreator(gameId);
    gameId.enforceIsPreRegistrationStage();
    gameId.openRegistration();
    emit RegistrationOpen(gameId);
  }

  // function getCreateGameRequirements() public view returns (TokenAction memory) {
  //     BOGSettings storage settings = BOGStorage();
  //     return settings.newGameReq;
  // }

  function joinGame(uint256 gameId) public payable nonReentrant {
    BOGInstance storage game = gameId.getGameStorage();
    gameId.enforceGameExists();
    LibCoinVending.fund(bytes32(gameId));
    LibBestOf.fulfillRankRq(msg.sender, address(this), game.rank, true);
    gameId.addPlayer(msg.sender);
    emit PlayerJoined(gameId, msg.sender);
  }

  function startGame(uint256 gameId) public {
    gameId.enforceGameExists();
    gameId.startGame();
    emit GameStarted(gameId);
  }

  //
  /* Proof is GM signed message formulated as:
    keccak256(
        abi.encode(voteHidden[1], voteHidden[2], voteHidden[3],playerTurnSalt)
    )

    where playerTurnSalt is :
    keccak256(abi.encode(msg.sender,turnSalt))

    Where turnSalt is:
    turnSalt = keccak256(abi.encode(gameId,turn,seed))

    Where seed is secret of game master which it never reveals.

    and voteHidden[i] = keccak256(abi.encode(proposerHidden,playerTurnSalt))

    where proposerHidden is

    proposerHidden = keccak256(abi.encode(playerAddress, turnSalt))

    Therefore secret voting can be revealed by making turnSalt publiclly availible.

    Having that, one can decode all hidden messages in local enviroment.


    it is game master responsibility to check and sign only such message where
    voteHidden1-3 are valid and can be decoded as

*/
  function submitVote(
    uint256 gameId,
    bytes32[3] memory votesHidden,
    bytes memory proof,
    bytes memory gmSignature
  ) public {
    gameId.enforceGameExists();
    gameId.enforceHasStarted();
    bytes memory message = abi.encode(
      //ToDo: add address of a player to signature as well proof
      LibBestOf._VOTE_SUBMIT_PROOF_TYPEHASH,
      gameId,
      gameId.getTurn(),
      votesHidden[0],
      votesHidden[1],
      votesHidden[2]
    );
    BOGInstance storage game = gameId.getGameStorage();
    _isValidSignature(message, gmSignature, gameId.getGM());
    require(!gameId.isGameOver(), "Game over");
    require(gameId.getTurn() > 1, "No proposals exist at turn 1: cannot vote");
    // game.votesHidden[msg.sender].votedFor = votesHidden;
    game.votesHidden[msg.sender].proof = proof;
    gameId.playerMove(msg.sender); // This will enforce player is in in the game
    emit VoteSubmitted(
      gameId,
      gameId.getTurn(),
      msg.sender,
      votesHidden,
      proof
    );
  }

  function onERC1155Received(
    address operator,
    address,
    uint256,
    uint256,
    bytes calldata
  ) public view override returns (bytes4) {
    LibBestOf.enforceIsInitialized();
    if (operator == address(this)) {
      return
        bytes4(
          keccak256("onERC1155Received(address,address,uint256,uint256,bytes)")
        );
    }
    return bytes4("");
  }

  function onERC1155BatchReceived(
    address operator,
    address,
    uint256[] calldata,
    uint256[] calldata,
    bytes calldata
  ) external view override returns (bytes4) {
    LibBestOf.enforceIsInitialized();
    if (operator == address(this)) {
      return
        bytes4(
          keccak256(
            "onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"
          )
        );
    }
    return bytes4("");
  }

  function onERC721Received(
    address operator,
    address,
    uint256,
    bytes calldata
  ) external view override returns (bytes4) {
    LibBestOf.enforceIsInitialized();
    if (operator == address(this)) {
      return IERC721Receiver.onERC721Received.selector;
    }
    return bytes4("");
  }

  function getContractState() public view returns (ContractState memory) {
    BOGSettings storage settings = BOGStorage();
    LibTBG.GameSettings memory tbgSettings = LibTBG.getGameSettings();
    return (ContractState({ BestOfState: settings, TBGSEttings: tbgSettings }));
  }

  function getTurn(uint256 gameId) public view returns (uint256) {
    return gameId.getTurn();
  }

  function getGM(uint256 gameId) public view returns (address) {
    return gameId.getGM();
  }

  function getScores(
    uint256 gameId
  ) public view returns (address[] memory, uint256[] memory) {
    return gameId.getScores();
  }

  function isOvertime(uint256 gameId) public view returns (bool) {
    return gameId.isOvertime();
  }

  function isGameOver(uint256 gameId) public view returns (bool) {
    return gameId.isGameOver();
  }

  function getPlayersGame(address player) public view returns (uint256) {
    return LibTBG.getPlayersGame(player);
  }

  function isLastTurn(uint256 gameId) public view returns (bool) {
    return gameId.isLastTurn();
  }

  function isRegistrationOpen(uint256 gameId) public view returns (bool) {
    return gameId.isRegistrationOpen();
  }

  function gameCreator(uint256 gameId) public view returns (address) {
    return gameId.getGameStorage().createdBy;
  }

  function getGameRank(uint256 gameId) public view returns (uint256) {
    return gameId.getGameStorage().rank;
  }

  function getPlayers(uint256 gameId) public view returns (address[] memory) {
    return gameId.getPlayers();
  }

  function canStartGame(uint256 gameId) public view returns (bool) {
    return gameId.canStart();
  }
}
