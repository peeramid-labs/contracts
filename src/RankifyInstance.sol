// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.20;

// import {LibTBG} from "./libraries/LibTurnBasedGame.sol";
// import {LibRankify} from "./libraries/LibRankify.sol";
// import {IRankifyInstance} from "./interfaces/IRankifyInstance.sol";
// import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
// import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
// import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
// import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
// import {LibCoinVending} from "./libraries/LibCoinVending.sol";
// import "hardhat/console.sol";
// import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
// import "@openzeppelin/contracts/utils/Strings.sol";
// import {IERC1155Receiver} from "./interfaces/IERC1155Receiver.sol";
// import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

// import {IRankToken} from "./interfaces/IRankToken.sol";
// import {LibQuadraticVoting} from "./libraries/LibQuadraticVoting.sol";
// // import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// contract RankifyInstance is
//     ReentrancyGuardUpgradeable,
//     EIP712Upgradeable,
//     IRankifyInstance,
//     IERC1155Receiver,
//     IERC721Receiver

// {
//     using LibTBG for uint256;
//     using LibRankify for uint256;
//     using LibTBG for LibTBG.State;

//     struct contractInitializer {
//         address rewardToken;
//         uint256 timeToJoin;
//         uint256 principalCost;
//         uint256 principalTimeConstant;
//         uint256 maxTurns;
//         uint256 voteCredits;
//         address paymentToken;
//         address beneficiary;
//     }
//     constructor() {
//         _disableInitializers();
//     }

//     function _buildDomainSeparator(
//         bytes32 typeHash,
//         bytes32 nameHash,
//         bytes32 versionHash
//     ) private view returns (bytes32) {
//         return keccak256(abi.encode(typeHash, nameHash, versionHash, block.chainid, address(this)));
//     }

//     function InstanceState() internal pure returns (LibRankify.InstanceState storage bog) {
//         bytes32 position = LibTBG.getDataStorage();
//         assembly {
//             bog.slot := position
//         }
//     }
//     // You can add parameters to this function in order to pass in
//     // data to set your own state variables
//     function initialize(
//         string memory name,
//         string memory version,
//         contractInitializer memory initData
//     ) external initializer {
//         __EIP712_init(name, version);

//         LibRankify.CommonParams storage commons = LibRankify.instanceState().commonParams;

//         commons.principalCost = initData.principalCost;
//         commons.principalTimeConstant = initData.principalTimeConstant;
//         commons.gamePaymentToken = initData.paymentToken;
//         commons.rankTokenAddress = initData.rewardToken;
//         commons.beneficiary = initData.beneficiary;

//         // game.voting = LibQuadraticVoting.precomputeValues(initData.voteCredits, initData.minPlayerCnt);
//         // game.gamePrice = initData.gamePrice;
//         // game.joinPrice = initData.joinPrice;
//         require(initData.paymentToken != address(0), "initializer.paymentToken not set");
//         // game.gamePaymentToken = initData.paymentToken;
//         IRankToken rankContract = IRankToken(initData.rewardToken);
//         require(
//             rankContract.supportsInterface(type(IRankToken).interfaceId),
//             "RankifyInstance->init: rank token address does not support Rank interface"
//         );
//         // game.rankTokenAddress = initData.rewardToken;
//         // game.contractInitialized = true;
//     }

//     struct ProposalParams {
//         uint256 gameId;
//         string encryptedProposal;
//         bytes32 commitmentHash;
//         address proposer;
//     }

//     event VoteSubmitted(uint256 indexed gameId, uint256 indexed turn, address indexed player, string votesHidden);

//     /**
//      * @dev Handles the end of the game for a player. `gameId` is the ID of the game. `player` is the address of the player.
//      *
//      * Modifies:
//      *
//      * - Releases the coins for the game with `gameId`, the game creator, the top player, and `player`.
//      */
//     function onPlayersGameEnd(uint256 gameId, address player) private {
//         LibRankify.GameState storage game = gameId.getGameState();
//         LibCoinVending.release(bytes32(gameId), game.createdBy, gameId.getLeaderBoard()[0], player);
//     }

//     /**
//      * @dev Submits a vote for a game. `gameId` is the ID of the game. `encryptedVotes` is the encrypted votes. `voter` is the address of the voter.
//      *
//      * Emits a _VoteSubmitted_ event.
//      *
//      * Requirements:
//      *
//      * - The caller must be a game master of the game with `gameId`.
//      * - The game with `gameId` must exist.
//      * - The game with `gameId` must have started.
//      * - The game with `gameId` must not be over.
//      * - `voter` must be in the game with `gameId`.
//      * - The current turn of the game with `gameId` must be greater than 1.
//      */
//     function submitVote(uint256 gameId, string memory encryptedVotes, address voter) public {
//         LibRankify.enforceIsGM(gameId, msg.sender);
//         gameId.enforceGameExists();
//         gameId.enforceHasStarted();
//         require(!gameId.isGameOver(), "Game over");
//         gameId.enforceIsPlayingGame(voter);
//         require(gameId.getTurn() > 1, "No proposals exist at turn 1: cannot vote");
//         LibRankify.GameState storage game = gameId.getGameState();
//         require(!game.playerVoted[voter], "Already voted");
//         game.numVotesThisTurn += 1;
//         game.playerVoted[voter] = true;
//         gameId.tryPlayerMove(voter);
//         emit VoteSubmitted(gameId, gameId.getTurn(), voter, encryptedVotes);
//     }

//     /**
//      * @dev Submits a proposal for a game. `proposalData` is the proposal data.
//      *
//      * Requirements:
//      *
//      * - The game with `proposalData.gameId` must exist.
//      * - The caller must be a game master of the game with `proposalData.gameId`.
//      */
//     function submitProposal(ProposalParams memory proposalData) public {
//         proposalData.gameId.enforceGameExists();
//         proposalData.gameId.enforceIsGM(msg.sender);
//         require(!proposalData.gameId.isGameOver(), "Game over");
//         proposalData.gameId.enforceHasStarted();

//         LibRankify.GameState storage game = proposalData.gameId.getGameState();
//         require(LibTBG.getPlayersGame(proposalData.proposer) == proposalData.gameId, "not a player");
//         // require(!proposalData.gameId.isLastTurn(), "Cannot propose in last turn");
//         require(bytes(proposalData.encryptedProposal).length != 0, "Cannot propose empty");
//         require(game.proposalCommitmentHashes[proposalData.proposer] == "", "Already proposed!");
//         uint256 turn = proposalData.gameId.getTurn();
//         game.proposalCommitmentHashes[proposalData.proposer] = proposalData.commitmentHash;
//         game.numCommitments += 1;
//         proposalData.gameId.tryPlayerMove(proposalData.proposer);
//         emit ProposalSubmitted(
//             proposalData.gameId,
//             turn,
//             proposalData.proposer,
//             proposalData.commitmentHash,
//             proposalData.encryptedProposal
//         );
//     }

//     /**
//      * @dev Handles the actions after the next turn of a game with the provided game ID. `gameId` is the ID of the game. `newProposals` is the array of new proposals.
//      *
//      * Modifies:
//      *
//      * - Sets the ongoing proposals of the game with `gameId` to `newProposals`.
//      * - Increments the number of ongoing proposals of the game with `gameId` by the number of `newProposals`.
//      */
//     function _afterNextTurn(uint256 gameId, string[] memory newProposals) private {
//         LibRankify.GameState storage game = gameId.getGameState();
//         for (uint256 i = 0; i < newProposals.length; ++i) {
//             game.ongoingProposals[i] = newProposals[i];
//         }
//     }

//     /**
//      * @dev Handles the next turn of a game with the provided game ID. `gameId` is the ID of the game. `newProposals` is the array of new proposals.
//      *
//      * Emits an {OverTime_ event if the game is in the last turn and overtime.
//      * emits a _LastTurn_ event if the game is in the last turn.
//      * emits a _GameOver_ event if the game is over.
//      *
//      * Modifies:
//      *
//      * - Calls the `_afterNextTurn` function with `gameId` and `newProposals`.
//      */
//     function _nextTurn(uint256 gameId, string[] memory newProposals) private {
//         (bool _isLastTurn, bool _isOvertime, bool _isGameOver) = gameId.nextTurn();
//         if (_isLastTurn && _isOvertime) {
//             emit OverTime(gameId);
//         }
//         if (_isLastTurn) {
//             emit LastTurn(gameId);
//         }
//         if (_isGameOver) {
//             address beneficiary = InstanceState().commonParams.beneficiary;
//             uint256[] memory finalScores = gameId.closeGame(beneficiary, onPlayersGameEnd);
//             address[] memory players = gameId.getPlayers();
//             emit GameOver(gameId, players, finalScores);
//         }
//         _afterNextTurn(gameId, newProposals);
//     }

//     /**
//      * @dev Ends the current turn of a game with the provided game ID. `gameId` is the ID of the game. `votes` is the array of votes.
//      *  `newProposals` is the array of new proposals for the upcoming voting round.
//      *  `proposerIndices` is the array of indices of the proposers in the previous voting round.
//      *
//      * emits a _ProposalScore_ event for each player if the turn is not the first.
//      * emits a _TurnEnded_ event.
//      *
//      * Modifies:
//      *
//      * - Calls the `_nextTurn` function with `gameId` and `newProposals`.
//      * - Resets the number of commitments of the game with `gameId` to 0.
//      * - Resets the proposal commitment hash and ongoing proposal of each player in the game with `gameId`.
//      *
//      * Requirements:
//      *
//      * - The caller must be a game master of the game with `gameId`.
//      * - The game with `gameId` must have started.
//      * - The game with `gameId` must not be over.
//      * -  newProposals array MUST be sorted randomly to ensure privacy
//      * votes and proposerIndices MUST correspond to players array from game.getPlayers()
//      */
//     function endTurn(
//         uint256 gameId,
//         uint256[][] memory votes,
//         string[] memory newProposals, //REFERRING TO UPCOMING VOTING ROUND
//         uint256[] memory proposerIndices //REFERRING TO game.players index in PREVIOUS VOTING ROUND
//     ) public {
//         gameId.enforceIsGM(msg.sender);
//         gameId.enforceHasStarted();
//         gameId.enforceIsNotOver();
//         LibRankify.GameState storage game = gameId.getGameState();
//         uint256 turn = gameId.getTurn();

//         address[] memory players = gameId.getPlayers();
//         if (turn != 1) {
//             uint256[][] memory votesSorted = new uint256[][](players.length);
//             for (uint256 player = 0; player < players.length; ++player) {
//                 votesSorted[player] = new uint256[](players.length);
//             }
//             for (uint256 votee = 0; votee < players.length; ++votee) {
//                 uint256 voteesColumn = proposerIndices[votee];
//                 if (voteesColumn < players.length) {
//                     // if index is above length of players array, it means the player did not propose
//                     for (uint256 voter = 0; voter < players.length; voter++) {
//                         votesSorted[voter][votee] = votes[voter][voteesColumn];
//                     }
//                 }
//             }

//             (, uint256[] memory roundScores) = gameId.calculateScoresQuadratic(votesSorted, proposerIndices);
//             for (uint256 i = 0; i < players.length; ++i) {
//                 string memory proposal = game.ongoingProposals[proposerIndices[i]];
//                 emit ProposalScore(gameId, turn, proposal, proposal, roundScores[i]);
//             }
//         }
//         (, uint256[] memory scores) = gameId.getScores();
//         emit TurnEnded(gameId, gameId.getTurn(), players, scores, newProposals, proposerIndices, votes);

//         // Clean up game instance for upcoming round

//         for (uint256 i = 0; i < players.length; ++i) {
//             game.proposalCommitmentHashes[players[i]] = bytes32(0);
//             game.ongoingProposals[i] = "";
//             game.playerVoted[players[i]] = false;
//             game.votesHidden[players[i]].hash = bytes32(0);
//         }
//         // This data is to needed to correctly detetermine "PlayerMove" conditions during next turn
//         game.numVotesPrevTurn = game.numVotesThisTurn;
//         game.numVotesThisTurn = 0;
//         game.numPrevProposals = game.numCommitments;
//         game.numCommitments = 0;

//         _nextTurn(gameId, newProposals);
//     }

//     event RequirementsConfigured(uint256 indexed gameId, LibCoinVending.ConfigPosition config);

//     /**
//      * @dev Sets the join requirements for a specific game.
//      * Only the game creator can call this function.
//      * The game must be in the pre-registration stage.
//      *
//      * @param gameId The ID of the game.
//      * @param config The configuration position for the join requirements.
//      */
//     function setJoinRequirements(uint256 gameId, LibCoinVending.ConfigPosition memory config) public {
//         gameId.enforceIsGameCreator(msg.sender);
//         gameId.enforceIsPreRegistrationStage();
//         LibCoinVending.configure(bytes32(gameId), config);
//         emit RequirementsConfigured(gameId, config);
//     }

//     /**
//      * @dev Retrieves the join requirements for a specific game.
//      * @param gameId The ID of the game.
//      * @return The join requirements as a `LibCoinVending.ConditionReturn` struct.
//      */
//     function getJoinRequirements(uint256 gameId) public view returns (LibCoinVending.ConditionReturn memory) {
//         return LibCoinVending.getPosition(bytes32(gameId));
//     }

//     /**
//      * @dev Retrieves the join requirements for a specific token in a game.
//      * @param gameId The ID of the game.
//      * @param contractAddress The address of the contract.
//      * @param contractId The ID of the contract.
//      * @param contractType The type of the contract.
//      * @return The join requirements for the specified token.
//      */
//     function getJoinRequirementsByToken(
//         uint256 gameId,
//         address contractAddress,
//         uint256 contractId,
//         LibCoinVending.ContractTypes contractType
//     ) public view returns (LibCoinVending.ContractCondition memory) {
//         return LibCoinVending.getPositionByContract(bytes32(gameId), contractAddress, contractId, contractType);
//     }

//     /**
//      * @dev Creates a new game with the provided game master, game ID, and game rank. Optionally, additional ranks can be provided. `gameMaster` is the address of the game master. `gameId` is the ID of the new game. `gameRank` is the rank of the new game. `additionalRanks` is the array of additional ranks.
//      *
//      * emits a _GameCreated_ event.
//      *
//      * Requirements:
//      *  There are some game price requirments that must be met under gameId.newGame function that are set during the contract initialization and refer to the contract maintainer benefits.
//      *
//      * Modifies:
//      *
//      * - Calls the `newGame` function with `gameMaster`, `gameRank`, and `msg.sender`.
//      * - Configures the coin vending with `gameId` and an empty configuration.
//      * - If `additionalRanks` is not empty, mints rank tokens for each additional rank and sets the additional ranks of the game with `gameId` to `additionalRanks`.
//      */
//     function createGame(LibRankify.NewGameParams memory params) private nonReentrant {
//         LibRankify.newGame(params);
//         LibCoinVending.ConfigPosition memory emptyConfig;
//         LibCoinVending.configure(bytes32(params.gameId), emptyConfig);
//         emit gameCreated(params.gameId, params.gameMaster, msg.sender, params.gameRank);
//     }

//     function createGame(IRankifyInstance.NewGameParamsInput memory params) public {
//         LibRankify.enforceIsInitialized();
//         LibRankify.InstanceState storage settings = InstanceState();

//         LibRankify.NewGameParams memory newGameParams = LibRankify.NewGameParams({
//             gameId: settings.numGames + 1,
//             gameRank: params.gameRank,
//             creator: params.creator,
//             joinPrice: params.joinPrice,
//             minPlayerCnt: params.minPlayerCnt,
//             maxPlayerCnt: params.maxPlayerCnt,
//             gameMaster: params.gameMaster,
//             nTurns: params.nTurns,
//             voteCredits: params.voteCredits,
//             minGameTime: params.minGameTime,
//             timePerTurn: params.timePerTurn,
//             timeToJoin: params.timeToJoin
//         });

//         createGame(newGameParams);
//     }

//     /**
//      * @dev Handles a player quitting a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player.
//      *
//      * emits a _PlayerLeft_ event.
//      *
//      * Modifies:
//      *
//      * - Refunds the coins for `player` in the game with `gameId`.
//      */
//     function onPlayerQuit(uint256 gameId, address player) private {
//         LibCoinVending.refund(bytes32(gameId), player);
//         emit PlayerLeft(gameId, player);
//     }

//     /**
//      * @dev Cancels a game with the provided game ID. `gameId` is the ID of the game.
//      *
//      * Modifies:
//      *
//      * - Calls the `enforceIsGameCreator` function with `msg.sender`.
//      *
//      * Requirements:
//      *
//      * - The caller must be the game creator of the game with `gameId`.
//      * - Game must not be started.
//      */
//     function cancelGame(uint256 gameId) public nonReentrant {
//         gameId.enforceIsGameCreator(msg.sender);
//         address beneficiary = InstanceState().commonParams.beneficiary;
//         gameId.cancelGame(onPlayerQuit, beneficiary);
//         emit GameClosed(gameId);
//     }

//     /**
//      * @dev Allows a player to leave a game with the provided game ID. `gameId` is the ID of the game.
//      *
//      * Modifies:
//      *
//      * - Calls the `quitGame` function with `msg.sender`, `true`, and `onPlayerQuit`.
//      *
//      * Requirements:
//      *
//      * - The caller must be a player in the game with `gameId`.
//      * - Game must not be started.
//      */
//     function leaveGame(uint256 gameId) public nonReentrant {
//         gameId.quitGame(msg.sender, true, onPlayerQuit);
//     }

//     /**
//      * @dev Opens registration for a game with the provided game ID. `gameId` is the ID of the game.
//      *
//      * emits a _RegistrationOpen_ event.
//      *
//      * Modifies:
//      *
//      * - Calls the `enforceIsGameCreator` function with `msg.sender`.
//      * - Calls the `enforceIsPreRegistrationStage` function.
//      * - Calls the `openRegistration` function.
//      *
//      * Requirements:
//      *
//      * - The caller must be the game creator of the game with `gameId`.
//      * - The game with `gameId` must be in the pre-registration stage.
//      */
//     function openRegistration(uint256 gameId) public {
//         gameId.enforceIsGameCreator(msg.sender);
//         gameId.enforceIsPreRegistrationStage();
//         gameId.openRegistration();
//         emit RegistrationOpen(gameId);
//     }

//     /**
//      * @dev Allows a player to join a game with the provided game ID. `gameId` is the ID of the game.
//      *
//      * emits a _PlayerJoined_ event.
//      *
//      * Modifies:
//      *
//      * - Calls the `joinGame` function with `msg.sender`.
//      * - Calls the `fund` function with `bytes32(gameId)`.
//      *
//      * Requirements:
//      *
//      * - The caller must not be a player in the game with `gameId`.
//      * - Game phase must be registration.
//      * - Caller must be able to fulfill funding requirements.
//      */
//     function joinGame(uint256 gameId) public payable nonReentrant {
//         gameId.joinGame(msg.sender);
//         LibCoinVending.fund(bytes32(gameId));
//         emit PlayerJoined(gameId, msg.sender);
//     }

//     /**
//      * @dev Starts a game with the provided game ID early. `gameId` is the ID of the game.
//      *
//      * emits a _GameStarted_ event.
//      *
//      * Modifies:
//      *
//      * - Calls the `enforceGameExists` function.
//      * - Calls the `startGameEarly` function.
//      *
//      * Requirements:
//      *
//      * - The game with `gameId` must exist.
//      */
//     function startGame(uint256 gameId) public {
//         gameId.enforceGameExists();
//         gameId.startGameEarly();
//         emit GameStarted(gameId);
//     }

//     function onERC1155Received(
//         address operator,
//         address,
//         uint256,
//         uint256,
//         bytes calldata
//     ) public view override returns (bytes4) {
//         LibRankify.enforceIsInitialized();
//         if (operator == address(this)) {
//             return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
//         }
//         return bytes4("");
//     }

//     function onERC1155BatchReceived(
//         address operator,
//         address,
//         uint256[] calldata,
//         uint256[] calldata,
//         bytes calldata
//     ) external view override returns (bytes4) {
//         LibRankify.enforceIsInitialized();
//         if (operator == address(this)) {
//             return bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"));
//         }
//         return bytes4("");
//     }

//     function onERC721Received(
//         address operator,
//         address,
//         uint256,
//         bytes calldata
//     ) external view override returns (bytes4) {
//         LibRankify.enforceIsInitialized();
//         if (operator == address(this)) {
//             return IERC721Receiver.onERC721Received.selector;
//         }
//         return bytes4("");
//     }

//     function getContractState() public view returns (LibRankify.InstanceState memory) {
//         return LibRankify.instanceState();
//     }

//     function getTurn(uint256 gameId) public view returns (uint256) {
//         return gameId.getTurn();
//     }

//     function getGM(uint256 gameId) public view returns (address) {
//         return gameId.getGM();
//     }

//     function getScores(uint256 gameId) public view returns (address[] memory, uint256[] memory) {
//         return gameId.getScores();
//     }

//     function isOvertime(uint256 gameId) public view returns (bool) {
//         return gameId.isOvertime();
//     }

//     function isGameOver(uint256 gameId) public view returns (bool) {
//         return gameId.isGameOver();
//     }

//     function getPlayersGame(address player) public view returns (uint256) {
//         return LibTBG.getPlayersGame(player);
//     }

//     function isLastTurn(uint256 gameId) public view returns (bool) {
//         return gameId.isLastTurn();
//     }

//     function isRegistrationOpen(uint256 gameId) public view returns (bool) {
//         return gameId.isRegistrationOpen();
//     }

//     function gameCreator(uint256 gameId) public view returns (address) {
//         return gameId.getGameState().createdBy;
//     }

//     function getGameRank(uint256 gameId) public view returns (uint256) {
//         return gameId.getGameState().rank;
//     }

//     function getPlayers(uint256 gameId) public view returns (address[] memory) {
//         return gameId.getPlayers();
//     }

//     function canStartGame(uint256 gameId) public view returns (bool) {
//         return gameId.canStartEarly();
//     }

//     function canEndTurn(uint256 gameId) public view returns (bool) {
//         return gameId.canEndTurnEarly();
//     }

//     function isPlayerTurnComplete(uint256 gameId, address player) public view returns (bool) {
//         return gameId.isPlayerTurnComplete(player);
//     }

//     function getPlayerVotedArray(uint256 gameId) public view returns (bool[] memory) {
//         LibRankify.GameState storage game = gameId.getGameState();
//         address[] memory players = gameId.getPlayers();
//         bool[] memory playerVoted = new bool[](players.length);
//         for (uint256 i = 0; i < players.length; ++i) {
//             playerVoted[i] = game.playerVoted[players[i]];
//         }
//         return playerVoted;
//     }

//     function getPlayersMoved(uint256 gameId) public view returns (bool[] memory, uint256) {
//         LibTBG.State storage game = gameId._getState();
//         address[] memory players = gameId.getPlayers();
//         bool[] memory playersMoved = new bool[](players.length);
//         for (uint256 i = 0; i < players.length; ++i) {
//             playersMoved[i] = game.madeMove[players[i]];
//         }
//         return (playersMoved, game.numPlayersMadeMove);
//     }
// }
