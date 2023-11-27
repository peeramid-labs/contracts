# Solidity API

## CompositeERC1155

_An abstract contract that extends LockableERC1155 and provides functionality for composite ERC1155 tokens.
Composite tokens can be "composed" from multiple underlying assets, which however do not change their owner
and in contrast to that use LockableERC1155 standard, which allows to read locked asset BalanceOf, OwnerOf methods correctly_

### constructor

```solidity
constructor(string uri_, address[] dimensionTokens, uint256[] tokenWeights) internal
```

### _mint

```solidity
function _mint(address to, uint256 tokenId, uint256 value, bytes data) internal virtual
```

### _burn

```solidity
function _burn(address from, uint256 id, uint256 amount) internal
```

_Destroys `amount` tokens of token type `id` from `from`

Emits a {TransferSingle} event.

Requirements:

- `from` cannot be the zero address.
- `from` must have at least `amount` tokens of token type `id`._

### decompose

```solidity
function decompose(address from, uint256 id, uint256 amount) public virtual
```

_Decomposes a composite ERC1155 token into its individual components.
This function unlocks the specified amount of the composite token from each dimension,
and then burns the specified amount of the composite token from the caller's balance._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address from which the composite token is being decomposed. |
| id | uint256 | The ID of the composite token being decomposed. |
| amount | uint256 | The amount of the composite token to decompose. |

### burn

```solidity
function burn(address account, uint256 id, uint256 value) public virtual
```

_Burns a specified amount of tokens from the given account.
This will burn all underlying (composite) assets

Requirements:
- `account` must be the token owner or an approved operator.
- `id` and `value` must be valid token ID and amount to burn.
- All underlying "composite" assets implement burn as well_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the token owner. |
| id | uint256 | The ID of the token to burn. |
| value | uint256 | The amount of tokens to burn. |

### getComponents

```solidity
function getComponents() public virtual returns (address[], uint256[])
```

_Retrieves the components of the CompositeERC1155 contract._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address[] | An array of component addresses and an array of component weights. |
| [1] | uint256[] |  |

## DiamondReentrancyGuard

### nonReentrant

```solidity
modifier nonReentrant()
```

## insufficient

```solidity
error insufficient(uint256 id, uint256 balance, uint256 required)
```

## LockableERC1155

_This is an abstract contract that extends the ERC1155 token contract and implements the ILockableERC1155 interface.
     It provides functionality to lock and unlock token amounts for specific accounts and IDs._

### lockedAmounts

```solidity
mapping(address => mapping(uint256 => uint256)) lockedAmounts
```

### lock

```solidity
function lock(address account, uint256 id, uint256 amount) public virtual
```

_Locks a specified amount of tokens for a given account and token ID.
If the account does not have enough balance to lock the specified amount,
the function will revert with an "insufficient" error message.
Emits a `TokensLocked` event after successfully locking the tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the account to lock tokens for. |
| id | uint256 | The ID of the token to lock. |
| amount | uint256 | The amount of tokens to lock. |

### unlock

```solidity
function unlock(address account, uint256 id, uint256 amount) public virtual
```

_Unlocks a specified amount of tokens for a given account and token ID.
If the locked amount is less than the specified amount, it reverts with an "insufficient" error message.
Emits a `TokensUnlocked` event after unlocking the tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the account to unlock tokens for. |
| id | uint256 | The ID of the token to unlock. |
| amount | uint256 | The amount of tokens to unlock. |

### unlockedBalanceOf

```solidity
function unlockedBalanceOf(address account, uint256 id) public view returns (uint256)
```

_Returns the unlocked balance of a specific ERC1155 token for an account.
The unlocked balance is calculated by subtracting the locked amount from the total balance._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the account. |
| id | uint256 | The ID of the ERC1155 token. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The unlocked balance of the ERC1155 token for the account. |

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_Hook function that is called before any token transfer.
It checks if the transfer is allowed based on the locked amounts of the tokens.
If the transfer is not allowed, it reverts with an error message._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operator | address | The address performing the token transfer. |
| from | address | The address from which the tokens are being transferred. |
| to | address | The address to which the tokens are being transferred. |
| ids | uint256[] | An array of token IDs being transferred. |
| amounts | uint256[] | An array of token amounts being transferred. |
| data | bytes | Additional data attached to the transfer. |

## EIP712

_https://eips.ethereum.org/EIPS/eip-712[EIP 712] is a standard for hashing and signing of typed structured data.

The encoding specified in the EIP is very generic, and such a generic implementation in Solidity is not feasible,
thus this contract does not implement the encoding itself. Protocols need to implement the type-specific encoding
they need in their contracts using a combination of `abi.encode` and `keccak256`.

This contract implements the EIP 712 domain separator ({_domainSeparatorV4}) that is used as part of the encoding
scheme, and the final step of the encoding to obtain the message digest that is then signed via ECDSA
({_hashTypedDataV4}).

The implementation of the domain separator was designed to be as efficient as possible while still properly updating
the chain id to protect against replay attacks on an eventual fork of the chain.

NOTE: This contract implements the version of the encoding known as "v4", as implemented by the JSON RPC method
https://docs.metamask.io/guide/signing-data.html[`eth_signTypedDataV4` in MetaMask].

_Available since v3.4.__

### constructor

```solidity
constructor() internal
```

_Initializes the domain separator and parameter caches.

The meaning of `name` and `version` is specified in
https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator[EIP 712]:

- `name`: the user readable name of the signing domain, i.e. the name of the DApp or the protocol.
- `version`: the current major version of the signing domain.

NOTE: These parameters cannot be changed except through a xref:learn::upgrading-smart-contracts.adoc[smart
contract upgrade]._

### _domainSeparatorV4

```solidity
function _domainSeparatorV4() internal view returns (bytes32)
```

_Returns the domain separator for the current chain._

### _hashTypedDataV4

```solidity
function _hashTypedDataV4(bytes32 structHash) internal view virtual returns (bytes32)
```

_Given an already https://eips.ethereum.org/EIPS/eip-712#definition-of-hashstruct[hashed struct], this
function returns the hash of the fully encoded EIP712 message for this domain.

This hash can be used together with {ECDSA-recover} to obtain the signer of a message. For example:

```solidity
bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
    keccak256("Mail(address to,string contents)"),
    mailTo,
    keccak256(bytes(mailContents))
)));
address signer = ECDSA.recover(digest, signature);
```_

## EIP712InspectorFacet

### inspectEIP712Hashes

```solidity
function inspectEIP712Hashes() public view returns (bytes32 _CACHED_DOMAIN_SEPARATOR, uint256 _CACHED_CHAIN_ID, address _CACHED_THIS, bytes32 _HASHED_NAME, bytes32 _HASHED_VERSION, bytes32 _TYPE_HASH)
```

### currentChainId

```solidity
function currentChainId() public view returns (uint256)
```

## RankifyInstanceGameMastersFacet

### OverTime

```solidity
event OverTime(uint256 gameId)
```

### LastTurn

```solidity
event LastTurn(uint256 gameId)
```

### ProposalScore

```solidity
event ProposalScore(uint256 gameId, uint256 turn, string proposalHash, string proposal, uint256 score)
```

### TurnEnded

```solidity
event TurnEnded(uint256 gameId, uint256 turn, address[] players, uint256[] scores, string[] newProposals, uint256[] proposerIndicies, uint256[][] votes)
```

### GameOver

```solidity
event GameOver(uint256 gameId, address[] players, uint256[] scores)
```

### ProposalSubmitted

```solidity
event ProposalSubmitted(uint256 gameId, uint256 turn, address proposer, bytes32 commitmentHash, string proposalEncryptedByGM)
```

### ProposalParams

```solidity
struct ProposalParams {
  uint256 gameId;
  string encryptedProposal;
  bytes32 commitmentHash;
  address proposer;
}
```

### VoteSubmitted

```solidity
event VoteSubmitted(uint256 gameId, uint256 turn, address player, string votesHidden)
```

### submitVote

```solidity
function submitVote(uint256 gameId, string encryptedVotes, address voter) public
```

_Submits a vote for a game. `gameId` is the ID of the game. `encryptedVotes` is the encrypted votes. `voter` is the address of the voter.

Emits a _VoteSubmitted_ event.

Requirements:

- The caller must be a game master of the game with `gameId`.
- The game with `gameId` must exist.
- The game with `gameId` must have started.
- The game with `gameId` must not be over.
- `voter` must be in the game with `gameId`.
- The current turn of the game with `gameId` must be greater than 1._

### submitProposal

```solidity
function submitProposal(struct RankifyInstanceGameMastersFacet.ProposalParams proposalData) public
```

_Submits a proposal for a game. `proposalData` is the proposal data.

Requirements:

- The game with `proposalData.gameId` must exist.
- The caller must be a game master of the game with `proposalData.gameId`._

### endTurn

```solidity
function endTurn(uint256 gameId, uint256[][] votes, string[] newProposals, uint256[] proposerIndicies) public
```

_Ends the current turn of a game with the provided game ID. `gameId` is the ID of the game. `votes` is the array of votes. `newProposals` is the array of new proposals for the upcoming voting round. `proposerIndicies` is the array of indices of the proposers in the previous voting round.

emits a _ProposalScore_ event for each player if the turn is not the first.
emits a _TurnEnded_ event.

Modifies:

- Calls the `_nextTurn` function with `gameId` and `newProposals`.
- Resets the number of commitments of the game with `gameId` to 0.
- Resets the proposal commitment hash and ongoing proposal of each player in the game with `gameId`.

Requirements:

- The caller must be a game master of the game with `gameId`.
- The game with `gameId` must have started.
- The game with `gameId` must not be over.
-  newProposals array MUST be sorted randomly to ensure privacy
votes and proposerIndicies MUST correspond to players array from game.getPlayers()_

## ZeroValue

```solidity
error ZeroValue()
```

## WrongAddress

```solidity
error WrongAddress()
```

## OutOfBounds

```solidity
error OutOfBounds()
```

## RankifyInstanceGameOwnersFacet

### RInstanceStorage

```solidity
function RInstanceStorage() internal pure returns (struct IRankifyInstanceCommons.RInstanceSettings bog)
```

### setGamePrice

```solidity
function setGamePrice(uint256 newPrice) external
```

_Sets the game price. `newPrice` is the new game price.

Modifies:

- Sets the game price to `newPrice`.

Requirements:

- The caller must be the contract owner._

### setJoinGamePrice

```solidity
function setJoinGamePrice(uint256 newPrice) external
```

_Sets the join game price. `newPrice` is the new join game price.

Modifies:

- Sets the join game price to `newPrice`.

Requirements:

- The caller must be the contract owner._

### setRankTokenAddress

```solidity
function setRankTokenAddress(address newRankToken) external
```

_Sets the rank token address. `newRankToken` is the new rank token address.

Modifies:

- Sets the rank token address to `newRankToken`.

Requirements:

- The caller must be the contract owner.
- `newRankToken` must not be the zero address.
- `newRankToken` must support the ERC1155 interface._

### setTimePerTurn

```solidity
function setTimePerTurn(uint256 newTimePerTurn) external
```

_Sets the time per turn. `newTimePerTurn` is the new time per turn.

Modifies:

- Sets the time per turn to `newTimePerTurn`.

Requirements:

- The caller must be the contract owner._

### setMaxPlayersSize

```solidity
function setMaxPlayersSize(uint256 newMaxPlayersSize) external
```

_Sets the maximum number of players in a game. `newMaxPlayersSize` is the new maximum number of players.

Modifies:

- Sets the maximum number of players to `newMaxPlayersSize`.

Requirements:

- The caller must be the contract owner.
- `newMaxPlayersSize` must be greater than or equal to the minimum number of players._

### setMinPlayersSize

```solidity
function setMinPlayersSize(uint256 newMinPlayersSize) external
```

_Sets the minimum number of players in a game. `newMinPlayersSize` is the new minimum number of players.

Modifies:

- Sets the minimum number of players to `newMinPlayersSize`.

Requirements:

- The caller must be the contract owner.
- `newMinPlayersSize` must be less than or equal to the maximum number of players._

### setTimeToJoin

```solidity
function setTimeToJoin(uint256 newTimeToJoin) external
```

_Sets the time to join a game. `newTimeToJoin` is the new time to join.

Modifies:

- Sets the time to join to `newTimeToJoin`.

Requirements:

- The caller must be the contract owner.
- `newTimeToJoin` must not be zero._

### setMaxTurns

```solidity
function setMaxTurns(uint256 newMaxTurns) external
```

_Sets the maximum number of turns in a game. `newMaxTurns` is the new maximum number of turns.

Modifies:

- Sets the maximum number of turns to `newMaxTurns`.

Requirements:

- The caller must be the contract owner.
- `newMaxTurns` must not be zero._

## RankifyInstanceMainFacet

### RInstanceStorage

```solidity
function RInstanceStorage() internal pure returns (struct IRankifyInstanceCommons.RInstanceSettings bog)
```

### createGame

```solidity
function createGame(address gameMaster, uint256 gameId, uint256 gameRank) public
```

_Creates a new game with the provided game master, game ID, and game rank. Optionally, additional ranks can be provided. `gameMaster` is the address of the game master. `gameId` is the ID of the new game. `gameRank` is the rank of the new game. `additionalRanks` is the array of additional ranks.

emits a _GameCreated_ event.

Requirements:
 There are some game price requirments that must be met under gameId.newGame function that are set during the contract initialization and refer to the contract maintainer benefits.

Modifies:

- Calls the `newGame` function with `gameMaster`, `gameRank`, and `msg.sender`.
- Configures the coin vending with `gameId` and an empty configuration.
- If `additionalRanks` is not empty, mints rank tokens for each additional rank and sets the additional ranks of the game with `gameId` to `additionalRanks`._

### createGame

```solidity
function createGame(address gameMaster, uint256 gameId, uint256 gameRank, address[] additionalRanks) public
```

### createGame

```solidity
function createGame(address gameMaster, uint256 gameRank) public
```

### cancelGame

```solidity
function cancelGame(uint256 gameId) public
```

_Cancels a game with the provided game ID. `gameId` is the ID of the game.

Modifies:

- Calls the `enforceIsGameCreator` function with `msg.sender`.

Requirements:

- The caller must be the game creator of the game with `gameId`.
- Game must not be started._

### leaveGame

```solidity
function leaveGame(uint256 gameId) public
```

_Allows a player to leave a game with the provided game ID. `gameId` is the ID of the game.

Modifies:

- Calls the `quitGame` function with `msg.sender`, `true`, and `onPlayerQuit`.

Requirements:

- The caller must be a player in the game with `gameId`.
- Game must not be started._

### openRegistration

```solidity
function openRegistration(uint256 gameId) public
```

_Opens registration for a game with the provided game ID. `gameId` is the ID of the game.

emits a _RegistrationOpen_ event.

Modifies:

- Calls the `enforceIsGameCreator` function with `msg.sender`.
- Calls the `enforceIsPreRegistrationStage` function.
- Calls the `openRegistration` function.

Requirements:

- The caller must be the game creator of the game with `gameId`.
- The game with `gameId` must be in the pre-registration stage._

### joinGame

```solidity
function joinGame(uint256 gameId) public payable
```

_Allows a player to join a game with the provided game ID. `gameId` is the ID of the game.

emits a _PlayerJoined_ event.

Modifies:

- Calls the `joinGame` function with `msg.sender`.
- Calls the `fund` function with `bytes32(gameId)`.

Requirements:

- The caller must not be a player in the game with `gameId`.
- Game phase must be registration.
- Caller must be able to fulfill funding requirements._

### startGame

```solidity
function startGame(uint256 gameId) public
```

_Starts a game with the provided game ID early. `gameId` is the ID of the game.

emits a _GameStarted_ event.

Modifies:

- Calls the `enforceGameExists` function.
- Calls the `startGameEarly` function.

Requirements:

- The game with `gameId` must exist._

### onERC1155Received

```solidity
function onERC1155Received(address operator, address, uint256, uint256, bytes) public view returns (bytes4)
```

### onERC1155BatchReceived

```solidity
function onERC1155BatchReceived(address operator, address, uint256[], uint256[], bytes) external view returns (bytes4)
```

### onERC721Received

```solidity
function onERC721Received(address operator, address, uint256, bytes) external view returns (bytes4)
```

### getContractState

```solidity
function getContractState() public view returns (struct IRankifyInstanceCommons.RInstanceState)
```

### getTurn

```solidity
function getTurn(uint256 gameId) public view returns (uint256)
```

### getGM

```solidity
function getGM(uint256 gameId) public view returns (address)
```

### getScores

```solidity
function getScores(uint256 gameId) public view returns (address[], uint256[])
```

### isOvertime

```solidity
function isOvertime(uint256 gameId) public view returns (bool)
```

### isGameOver

```solidity
function isGameOver(uint256 gameId) public view returns (bool)
```

### getPlayersGame

```solidity
function getPlayersGame(address player) public view returns (uint256)
```

### isLastTurn

```solidity
function isLastTurn(uint256 gameId) public view returns (bool)
```

### isRegistrationOpen

```solidity
function isRegistrationOpen(uint256 gameId) public view returns (bool)
```

### gameCreator

```solidity
function gameCreator(uint256 gameId) public view returns (address)
```

### getGameRank

```solidity
function getGameRank(uint256 gameId) public view returns (uint256)
```

### getPlayers

```solidity
function getPlayers(uint256 gameId) public view returns (address[])
```

### canStartGame

```solidity
function canStartGame(uint256 gameId) public view returns (bool)
```

### canEndTurn

```solidity
function canEndTurn(uint256 gameId) public view returns (bool)
```

## RankifyInstanceRequirementsFacet

### RequirementsConfigured

```solidity
event RequirementsConfigured(uint256 gameId, struct LibCoinVending.ConfigPosition config)
```

### setJoinRequirements

```solidity
function setJoinRequirements(uint256 gameId, struct LibCoinVending.ConfigPosition config) public
```

_Sets the join requirements for a specific game.
Only the game creator can call this function.
The game must be in the pre-registration stage._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| gameId | uint256 | The ID of the game. |
| config | struct LibCoinVending.ConfigPosition | The configuration position for the join requirements. |

### getJoinRequirements

```solidity
function getJoinRequirements(uint256 gameId) public view returns (struct LibCoinVending.ConditionReturn)
```

_Retrieves the join requirements for a specific game._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| gameId | uint256 | The ID of the game. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct LibCoinVending.ConditionReturn | The join requirements as a `LibCoinVending.ConditionReturn` struct. |

### getJoinRequirementsByToken

```solidity
function getJoinRequirementsByToken(uint256 gameId, address contractAddress, uint256 contractId, enum LibCoinVending.ContractTypes contractType) public view returns (struct LibCoinVending.ContractCondition)
```

_Retrieves the join requirements for a specific token in a game._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| gameId | uint256 | The ID of the game. |
| contractAddress | address | The address of the contract. |
| contractId | uint256 | The ID of the contract. |
| contractType | enum LibCoinVending.ContractTypes | The type of the contract. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct LibCoinVending.ContractCondition | The join requirements for the specified token. |

## IERC1155Receiver

### onERC1155Received

```solidity
function onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes data) external returns (bytes4)
```

validate receipt of ERC1155 transfer

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operator | address | executor of transfer |
| from | address | sender of tokens |
| id | uint256 | token ID received |
| value | uint256 | quantity of tokens received |
| data | bytes | data payload |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes4 | function's own selector if transfer is accepted |

### onERC1155BatchReceived

```solidity
function onERC1155BatchReceived(address operator, address from, uint256[] ids, uint256[] values, bytes data) external returns (bytes4)
```

validate receipt of ERC1155 batch transfer

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operator | address | executor of transfer |
| from | address | sender of tokens |
| ids | uint256[] | token IDs received |
| values | uint256[] | quantities of tokens received |
| data | bytes | data payload |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes4 | function's own selector if transfer is accepted |

## ILockableERC1155

_Interface for a lockable ERC1155 token contract._

### TokensLocked

```solidity
event TokensLocked(address account, uint256 id, uint256 value)
```

### TokensUnlocked

```solidity
event TokensUnlocked(address account, uint256 id, uint256 value)
```

### lock

```solidity
function lock(address account, uint256 id, uint256 amount) external
```

_Locks a specified amount of tokens for a given account and token ID. `account` is the address of the account to lock the tokens for. `id` is the ID of the token to lock. `amount` is the amount of tokens to lock.

emits a _TokensLocked_ event._

### unlock

```solidity
function unlock(address account, uint256 id, uint256 amount) external
```

_Unlocks a specified amount of tokens for a given account and token ID. `account` is the address of the account to unlock the tokens for. `id` is the ID of the token to unlock. `amount` is the amount of tokens to unlock.

emits a _TokensUnlocked_ event._

### unlockedBalanceOf

```solidity
function unlockedBalanceOf(address account, uint256 id) external view returns (uint256)
```

_Returns the unlocked balance of tokens for a given account and token ID. `account` is the address of the account to check the unlocked balance for. `id` is the ID of the token to check the unlocked balance for.

Returns:

- The unlocked balance of tokens._

## IRankToken

### RankingInstanceUpdated

```solidity
event RankingInstanceUpdated(address newRankingInstance)
```

### LevelUp

```solidity
event LevelUp(address account, uint256 id)
```

### mint

```solidity
function mint(address to, uint256 amount, uint256 poolId, bytes data) external
```

_Mints a specified amount of tokens to an account. `to` is the address of the account to mint the tokens to. `amount` is the amount of tokens to mint. `poolId` is the ID of the pool. `data` is the additional data._

### batchMint

```solidity
function batchMint(address to, uint256[] ids, uint256[] amounts, bytes data) external
```

_Mints specified amounts of tokens to an account. `to` is the address of the account to mint the tokens to. `ids` is the array of IDs of the tokens to mint. `amounts` is the array of amounts of tokens to mint. `data` is the additional data._

### levelUp

```solidity
function levelUp(address to, uint256 id, bytes data) external
```

_Levels up an account. `to` is the address of the account to level up. `id` is the ID of the token. `data` is the additional data.

emits a _LevelUp_ event._

### updateRankingInstance

```solidity
function updateRankingInstance(address newRankingInstance) external
```

_Updates the ranking instance. `newRankingInstance` is the address of the new ranking instance.

emits a _RankingInstanceUpdated_ event._

### getRankingInstance

```solidity
function getRankingInstance() external view returns (address)
```

_Gets the ranking instance which can emit new rank updates and mint rank tokens.

Returns:

- The address of the ranking instance._

### findNewRank

```solidity
function findNewRank(address account, uint256 oldRank) external view returns (uint256)
```

_Finds the new rank of an account. `account` is the address of the account. `oldRank` is the old rank of the account.
It checks the balance of the account and returns the new rank that can be upgraded to.

Returns:

- The new rank of the account._

### getAccountRank

```solidity
function getAccountRank(address account) external view returns (uint256)
```

_Gets the rank of an account. `account` is the address of the account.

Returns:

- The rank of the account._

## IRankifyInstanceCommons

### Score

```solidity
struct Score {
  address participant;
  uint256 score;
}
```

### RInstanceSettings

```solidity
struct RInstanceSettings {
  uint256 gamePrice;
  address gamePaymentToken;
  uint256 joinGamePrice;
  uint256 numGames;
  address rankTokenAddress;
  bool contractInitialized;
  struct LibQuadraticVoting.qVotingStruct voting;
}
```

### RInstanceState

```solidity
struct RInstanceState {
  struct IRankifyInstanceCommons.RInstanceSettings BestOfState;
  struct LibTBG.GameSettings TBGSEttings;
}
```

### VoteHidden

```solidity
struct VoteHidden {
  bytes32 hash;
  bytes proof;
}
```

### RInstance

```solidity
struct RInstance {
  uint256 rank;
  address createdBy;
  mapping(uint256 => string) ongoingProposals;
  uint256 numOngoingProposals;
  uint256 numPrevProposals;
  mapping(address => bytes32) proposalCommitmentHashes;
  uint256 numCommitments;
  mapping(address => struct IRankifyInstanceCommons.VoteHidden) votesHidden;
  address[] additionalRanks;
  uint256 paymentsBalance;
  uint256 numVotesThisTurn;
  uint256 numVotesPrevTurn;
  mapping(address => bool) playerVoted;
}
```

### RegistrationOpen

```solidity
event RegistrationOpen(uint256 gameid)
```

### PlayerJoined

```solidity
event PlayerJoined(uint256 gameId, address participant)
```

### GameStarted

```solidity
event GameStarted(uint256 gameId)
```

### gameCreated

```solidity
event gameCreated(uint256 gameId, address gm, address creator, uint256 rank)
```

### GameClosed

```solidity
event GameClosed(uint256 gameId)
```

### PlayerLeft

```solidity
event PlayerLeft(uint256 gameId, address player)
```

## LibArray

### quickSort

```solidity
function quickSort(uint256[] arr, int256 left, int256 right) internal view
```

_Sorts the elements of the array in ascending order using the quicksort algorithm.

Requirements:

- The array to be sorted must not be empty.
- The starting and ending indices must be within the bounds of the array.

Modifies:

- The array is sorted in ascending order.

Note:

- This function uses the in-place quicksort algorithm, which has an average-case complexity of O(n log n) and a worst-case complexity of O(n^2)._

## LibCoinVending

_This library is used to simulate the vending machine coin acceptor state machine that:
 - Supports large number of positions; Each represents requirements to acess different goods of the virtual vending machine.
 - Accepts multiple assets of following types: Native (Eth), ERC20, ERC721, and ERC1155 tokens that can be stacked together.
 - Allows for each individual asset action promise can be one of following:
     - Lock: The asset is locked in the acceptor with promise that asset will be returned to the sender at release funds time.
     - Bet: The asset is locked in the acceptor with promise that asset will be awarded to benificiary at release funds time.
     - Pay: The asset is locked in the acceptor with promise that asset will be paid to payee at release funds time.
     - Burn: The asset is locked in the acceptor with promise that asset will be destroyed at release funds time.
 - Maintains each position balance, hence allowing multiple participants to line up for the same position.
 - Allows three actions:
     - Fund position with assets
     - Refund assets to user
     - Consume assets and provide goods to user
     - Consuming asset might take a form of
     - Transferring assets to payee
     - Burning assets
     - Awarding beneficiary with assets
     - Returning locked assets back to sender

This library DOES enforces that any position can only be refunded or processed only within amount funded boundaries
This library DOES NOT store the addresses of senders, nor benificiaries, nor payees.
This is to be stored within implementation contract.

 !!!!! IMPORTANT !!!!!
This library does NOT invocates reentrancy guards. It is implementation contract's responsibility to enforce reentrancy guards.
Reentrancy guards MUST be implemented in an implementing contract.

 Usage:

 0. Configure position via configure(...)
 1. fund position with assets via fund(...)
 2. release or refund assets via release(...) or refund(...)
 3. repeat steps 1 and 2 as needed.
 Position can be recofigured at any time when it's effective balance is zero: `timesFunded - timesRefuned - timesReleased = 0`

Test state:
This library most functionality has been tested: see ../tests/LibCoinVending.ts and ../tests/report.md for details.

ERC721 token is checked only for "HAVE" condition since putting requirements on non fungable token id yet to be resolved.
(see ERC721 section in the code below)

This library has not been yet audited_

### Condition

```solidity
struct Condition {
  mapping(enum LibCoinVending.ContractTypes => mapping(address => mapping(uint256 => struct LibCoinVending.ContractCondition))) contracts;
  struct LibCoinVending.NumericCondition ethValues;
  uint256 timesRefunded;
  uint256 timesReleased;
  uint256 timesFunded;
  enum LibCoinVending.ContractTypes[] contractTypes;
  address[] contractAddresses;
  uint256[] contractIds;
  bool _isConfigured;
}
```

### RequirementTypes

```solidity
enum RequirementTypes {
  HAVE,
  LOCK,
  BURN,
  BET,
  PAY
}
```

### TransactionProperties

```solidity
struct TransactionProperties {
  bytes data;
  uint256 amount;
}
```

### ContractCondition

```solidity
struct ContractCondition {
  struct LibCoinVending.TransactionProperties have;
  struct LibCoinVending.TransactionProperties lock;
  struct LibCoinVending.TransactionProperties burn;
  struct LibCoinVending.TransactionProperties pay;
  struct LibCoinVending.TransactionProperties bet;
}
```

### NumericCondition

```solidity
struct NumericCondition {
  uint256 have;
  uint256 lock;
  uint256 burn;
  uint256 pay;
  uint256 bet;
}
```

### TransferTypes

```solidity
enum TransferTypes {
  FUND,
  REFUND,
  RELEASE
}
```

### ConditionReturn

```solidity
struct ConditionReturn {
  struct LibCoinVending.NumericCondition ethValues;
  uint256 timesRefunded;
  uint256 timesReleased;
  uint256 timesFunded;
  address[] contractAddresses;
  uint256[] contractIds;
  enum LibCoinVending.ContractTypes[] contractTypes;
  bool _isConfigured;
}
```

### configSmartRequirement

```solidity
struct configSmartRequirement {
  address contractAddress;
  uint256 contractId;
  enum LibCoinVending.ContractTypes contractType;
  struct LibCoinVending.ContractCondition contractRequirement;
}
```

### ConfigPosition

```solidity
struct ConfigPosition {
  struct LibCoinVending.NumericCondition ethValues;
  struct LibCoinVending.configSmartRequirement[] contracts;
}
```

### LibCoinVendingStorage

```solidity
struct LibCoinVendingStorage {
  mapping(bytes32 => struct LibCoinVending.Condition) positions;
  address beneficiary;
}
```

### ContractTypes

```solidity
enum ContractTypes {
  ERC20,
  ERC1155,
  ERC721
}
```

### COIN_VENDING_STORAGE_POSITION

```solidity
bytes32 COIN_VENDING_STORAGE_POSITION
```

### coinVendingPosition

```solidity
function coinVendingPosition(bytes32 position) internal view returns (struct LibCoinVending.Condition)
```

### coinVendingStorage

```solidity
function coinVendingStorage() internal pure returns (struct LibCoinVending.LibCoinVendingStorage es)
```

### refund

```solidity
function refund(bytes32 position, address to) internal
```

_Returns all position requirements back to fundee. `position` is the identifier of the condition. `to` is the address to refund the balance to.

Requirements:

- The sum of `timesRefunded` and `timesReleased` for the condition must be less than `timesFunded`.

Modifies:

- Transfers the remaining balance of the condition to the `to` address.
- Increments the `timesRefunded` counter for the condition._

### batchRefund

```solidity
function batchRefund(bytes32 position, address[] returnAddresses) internal
```

_Returns all position requirements back to multiple fundees. `position` is the identifier of the condition. `returnAddresses` is an array of addresses to refund the balance to.

Requirements:

- The sum of `timesRefunded` and `timesReleased` for the condition must be less than `timesFunded`.

Modifies:

- Transfers the remaining balance of the condition to each address in `returnAddresses`.
- Increments the `timesRefunded` counter for the condition for each address in `returnAddresses`._

### release

```solidity
function release(bytes32 position, address payee, address beneficiary, address returnAddress) internal
```

_Releases the funds from a coin vending position to the specified addresses. `position` is the identifier of the condition. `payee`, `beneficiary`, and `returnAddress` are the addresses to release the funds to.

Requirements:

- The sum of `timesRefunded` and `timesReleased` for the condition must be less than `timesFunded`.

Modifies:

- Transfers the remaining balance of the condition to the `payee`, `beneficiary`, and `returnAddress`.
- Increments the `timesReleased` counter for the condition._

### batchRelease

```solidity
function batchRelease(bytes32 position, address payee, address beneficiary, address[] returnAddresses) internal
```

_Releases the funds from a coin vending position to multiple return addresses. `position` is the identifier of the condition. `payee`, `beneficiary`, and `returnAddresses` are the addresses to release the funds to.

Requirements:

- The sum of `timesRefunded` and `timesReleased` for the condition must be less than `timesFunded`.

Modifies:

- Transfers the remaining balance of the condition to the `payee`, `beneficiary`, and each address in `returnAddresses`.
- Increments the `timesReleased` counter for the condition for each address in `returnAddresses`._

### fund

```solidity
function fund(bytes32 position) internal
```

_Funds the position by `msg.sender`. `position` is the identifier of the condition.

Requirements:

- The condition must be configured.

Modifies:

- Transfers the funds from `msg.sender` to this contract.
- Increments the `timesFunded` counter for the condition._

### configure

```solidity
function configure(bytes32 position, struct LibCoinVending.ConfigPosition configuration) internal
```

_Configures the position. `position` is the identifier of the condition. `configuration` is the new configuration for the condition.

Requirements:

- The condition must not have a positive balance.

Modifies:

- Sets the configuration of the condition to `configuration`._

### getPosition

```solidity
function getPosition(bytes32 position) internal view returns (struct LibCoinVending.ConditionReturn)
```

_Returns the condition associated with the given position. `position` is the identifier of the condition.

Returns:

- The condition associated with `position`._

### getPositionByContract

```solidity
function getPositionByContract(bytes32 position, address contractAddress, uint256 contractId, enum LibCoinVending.ContractTypes contractType) internal view returns (struct LibCoinVending.ContractCondition)
```

_Returns the contract condition associated with the given position, contract address, contract ID, and contract type. `position` is the identifier of the condition. `contractAddress` is the address of the contract. `contractId` is the ID of the contract. `contractType` is the type of the contract.

Returns:

- The contract condition associated with `position`, `contractAddress`, `contractId`, and `contractType`._

## LibEIP712WithStorage

### EIP712_STORAGE_POSITION

```solidity
bytes32 EIP712_STORAGE_POSITION
```

### LibEIP712WithStorageStorage

```solidity
struct LibEIP712WithStorageStorage {
  bytes32 _CACHED_DOMAIN_SEPARATOR;
  uint256 _CACHED_CHAIN_ID;
  address _CACHED_THIS;
  bytes32 _HASHED_NAME;
  bytes32 _HASHED_VERSION;
  bytes32 _TYPE_HASH;
}
```

### EIP712WithStorage

```solidity
function EIP712WithStorage() internal pure returns (struct LibEIP712WithStorage.LibEIP712WithStorageStorage ds)
```

## quadraticVotingError

```solidity
error quadraticVotingError(string paramter, uint256 arg, uint256 arg2)
```

## LibQuadraticVoting

_A library for quadratic voting calculations._

### qVotingStruct

```solidity
struct qVotingStruct {
  uint256 voteCredits;
  uint256 maxQuadraticPoints;
  uint256 minQuadraticPositons;
}
```

### precomputeValues

```solidity
function precomputeValues(uint256 voteCredits, uint256 minExpectedVoteItems) internal pure returns (struct LibQuadraticVoting.qVotingStruct)
```

_Precomputes the values for quadratic voting. `voteCredits` is the total number of vote credits. `minExpectedVoteItems` is the minimum expected number of vote items.

Returns:

- A `qVotingStruct` containing the precomputed values._

### computeScoresByVPIndex

```solidity
function computeScoresByVPIndex(struct LibQuadraticVoting.qVotingStruct q, uint256[][] VotersVotes, bool[] voterVoted, uint256 notVotedGivesEveyone, uint256 proposalsLength) internal pure returns (uint256[])
```

_Computes the scores for each proposal by voter preference index. `q` is the precomputed quadratic voting values. `VotersVotes` is a 2D array of votes, where each row corresponds to a voter and each column corresponds to a proposal. `voterVoted` is an array indicating whether each voter has voted. `notVotedGivesEveyone` is the number of points to distribute to each proposal for each voter that did not vote. `proposalsLength` is the number of proposals.

Returns:

- An array of scores for each proposal._

## LibRankify

### compareStrings

```solidity
function compareStrings(string a, string b) internal pure returns (bool)
```

_Compares two strings for equality. `a` and `b` are the strings to compare.

Returns:

- `true` if the strings are equal, `false` otherwise._

### getGameStorage

```solidity
function getGameStorage(uint256 gameId) internal view returns (struct IRankifyInstanceCommons.RInstance game)
```

_Returns the game storage for the given game ID. `gameId` is the ID of the game.

Returns:

- The game storage for `gameId`._

### RInstanceStorage

```solidity
function RInstanceStorage() internal pure returns (struct IRankifyInstanceCommons.RInstanceSettings bog)
```

_Returns the Rankify InstanceSettings storage.

Returns:

- The RInstanceSettings storage._

### _PROPOSAL_PROOF_TYPEHASH

```solidity
bytes32 _PROPOSAL_PROOF_TYPEHASH
```

### _VOTE_PROOF_TYPEHASH

```solidity
bytes32 _VOTE_PROOF_TYPEHASH
```

### _VOTE_SUBMIT_PROOF_TYPEHASH

```solidity
bytes32 _VOTE_SUBMIT_PROOF_TYPEHASH
```

### enforceIsInitialized

```solidity
function enforceIsInitialized() internal view
```

_Ensures that the contract is initialized.

Requirements:

- The contract must be initialized._

### enforceGameExists

```solidity
function enforceGameExists(uint256 gameId) internal view
```

_Ensures that the game with the given ID exists. `gameId` is the ID of the game.

Requirements:

- The game with `gameId` must exist._

### newGame

```solidity
function newGame(uint256 gameId, address gameMaster, uint256 gameRank, address creator) internal
```

_Creates a new game with the given parameters. `gameId` is the ID of the new game. `gameMaster` is the address of the game master. `gameRank` is the rank of the game. `creator` is the address of the creator of the game.

Requirements:

- The game with `gameId` must not already exist.
- `gameRank` must not be 0.
- If the game price is not 0, the `creator` must have approved this contract to transfer the game price amount of the game payment token on their behalf.

Modifies:

- Creates a new game with `gameId`.
- Transfers the game price amount of the game payment token from `creator` to this contract.
- Sets the payments balance of the game to the game price.
- Sets the creator of the game to `creator`.
- Increments the number of games.
- Sets the rank of the game to `gameRank`.
- Mints new rank tokens._

### enforceIsGameCreator

```solidity
function enforceIsGameCreator(uint256 gameId, address candidate) internal view
```

_Ensures that the candidate is the creator of the game with the given ID. `gameId` is the ID of the game. `candidate` is the address of the candidate.

Requirements:

- The game with `gameId` must exist.
- `candidate` must be the creator of the game._

### enforceIsGM

```solidity
function enforceIsGM(uint256 gameId, address candidate) internal view
```

_Ensures that the candidate is the game master of the game with the given ID. `gameId` is the ID of the game. `candidate` is the address of the candidate.

Requirements:

- The game with `gameId` must exist.
- `candidate` must be the game master of the game._

### joinGame

```solidity
function joinGame(uint256 gameId, address player) internal
```

_Allows a player to join a game. `gameId` is the ID of the game. `player` is the address of the player.

Requirements:

- The game with `gameId` must exist.
- If the join game price is not 0, the `player` must have approved this contract to transfer the join game price amount of the game payment token on their behalf.

Modifies:

- Transfers the join game price amount of the game payment token from `player` to this contract.
- Increases the payments balance of the game by the join game price.
- Adds `player` to the game._

### closeGame

```solidity
function closeGame(uint256 gameId, address beneficiary, function (uint256,address) playersGameEndedCallback) internal returns (uint256[])
```

_Closes the game with the given ID and transfers the game's balance to the beneficiary. `gameId` is the ID of the game. `beneficiary` is the address to transfer the game's balance to. `playersGameEndedCallback` is a callback function to call for each player when the game ends.

Requirements:

- The game with `gameId` must exist.

Modifies:

- Emits rank rewards for the game.
- Removes and unlocks each player from the game.
- Calls `playersGameEndedCallback` for each player.
- Transfers the game's balance to `beneficiary`.

Returns:

- The final scores of the game._

### quitGame

```solidity
function quitGame(uint256 gameId, address player, bool slash, function (uint256,address) onPlayerLeftCallback) internal
```

_Allows a player to quit a game. `gameId` is the ID of the game. `player` is the address of the player. `slash` is a boolean indicating whether to slash the player's payment refund. `onPlayerLeftCallback` is a callback function to call when the player leaves.

Requirements:

- The game with `gameId` must exist.

Modifies:

- If the join game price is not 0, transfers a refund to `player` and decreases the game's payments balance by the refund amount.
- Removes and unlocks `player` from the game.
- Calls `onPlayerLeftCallback` for `player`._

### cancelGame

```solidity
function cancelGame(uint256 gameId, function (uint256,address) onPlayerLeftCallback, address beneficiary) internal
```

_Cancels the game with the given ID, refunds half of the game's payment to the game creator, and transfers the remaining balance to the beneficiary. `gameId` is the ID of the game. `onPlayerLeftCallback` is a callback function to call for each player when they leave. `beneficiary` is the address to transfer the remaining balance to.

Requirements:

- The game with `gameId` must exist.

Modifies:

- Calls `quitGame` for each player in the game.
- Transfers half of the game's payment to the game creator.
- Decreases the game's payments balance by the refund amount.
- Transfers the remaining balance of the game to `beneficiary`.
- Deletes the game._

### fulfillRankRq

```solidity
function fulfillRankRq(uint256 gameId, address player) internal
```

_Fulfills the rank requirement for a player to join a game. `gameId` is the ID of the game. `player` is the address of the player.

Modifies:

- Locks the rank token(s) of `player` in the rank token contract.
- If the game has additional ranks, locks the additional ranks of `player` in the respective rank token contracts._

### emitRankRewards

```solidity
function emitRankRewards(uint256 gameId, address[] leaderboard) internal
```

_Emits rank rewards to the top addresses in the leaderboard for each rank in the game. `gameId` is the ID of the game. `leaderboard` is an array of addresses representing the leaderboard.

Modifies:

- Calls `emitRankReward` for the main rank and each additional rank in the game._

### removeAndUnlockPlayer

```solidity
function removeAndUnlockPlayer(uint256 gameId, address player) internal
```

_Removes a player from a game and unlocks their rank tokens. `gameId` is the ID of the game. `player` is the address of the player to be removed.

Requirements:

- The game with `gameId` must exist.

Modifies:

- Removes `player` from the game.
- If the game rank is greater than 1, unlocks the game rank token for `player` in the rank token contract and unlocks each additional rank token for `player` in the respective rank token contracts._

### tryPlayerMove

```solidity
function tryPlayerMove(uint256 gameId, address player) internal returns (bool)
```

_Tries to make a move for a player in a game. `gameId` is the ID of the game. `player` is the address of the player.
The "move" is considered to be a state when player has made all actions he could in the given turn.

Requirements:

- The game with `gameId` must exist.

Modifies:

- If the player has not voted and a vote is expected, or if the player has not made a proposal and a proposal is expected, does not make a move and returns `false`.
- Otherwise, makes a move for `player` and returns `true`._

### calculateScoresQuadratic

```solidity
function calculateScoresQuadratic(uint256 gameId, uint256[][] votesRevealed, uint256[] proposerIndicies) internal returns (uint256[], uint256[])
```

_Calculates the scores using a quadratic formula based on the revealed votes and proposer indices. `gameId` is the ID of the game. `votesRevealed` is an array of revealed votes. `proposerIndicies` is an array of proposer indices that links proposals to index in getPlayers().

Returns:

- An array of updated scores for each player.
- An array of scores calculated for the current round._

## LibReentrancyGuard

### TBG_STORAGE_POSITION

```solidity
bytes32 TBG_STORAGE_POSITION
```

### ReentrancyGuardStruct

```solidity
struct ReentrancyGuardStruct {
  bool _entered;
}
```

### reentrancyGuardStorage

```solidity
function reentrancyGuardStorage() internal pure returns (struct LibReentrancyGuard.ReentrancyGuardStruct ds)
```

## LibTBG

_Library for managing turn-based games.
It is designed to be used as a base library for games, and provides the following functionality:
- setting game settings such as time per turn, max players, min players, etc as well as perform score and leaderboard tracking

Limitations:
- It is assumed there is only one game per player
- It is assumed there is only on game master per game

***WARNING*** Some limitations:
- This library is still under development and its interfaces may change.
- getting game data (which has own storage assigement and can be encapsulated from library) however there is no storage slot collision checks in place_

### GameSettings

```solidity
struct GameSettings {
  uint256 timePerTurn;
  uint256 maxPlayersSize;
  uint256 minPlayersSize;
  uint256 timeToJoin;
  uint256 maxTurns;
  uint256 numWinners;
  uint256 voteCredits;
  string subject;
}
```

### GameInstance

```solidity
struct GameInstance {
  address gameMaster;
  uint256 currentTurn;
  uint256 turnStartedAt;
  uint256 registrationOpenAt;
  bool hasStarted;
  bool hasEnded;
  struct EnumerableSet.AddressSet players;
  mapping(address => bool) madeMove;
  uint256 numPlayersMadeMove;
  mapping(address => uint256) score;
  bytes32 implemenationStoragePointer;
  bool isOvertime;
  address[] leaderboard;
}
```

### TBGStorageStruct

```solidity
struct TBGStorageStruct {
  struct LibTBG.GameSettings settings;
  mapping(uint256 => struct LibTBG.GameInstance) games;
  mapping(address => uint256) playerInGame;
  uint256 totalGamesCreated;
}
```

### TBG_STORAGE_POSITION

```solidity
bytes32 TBG_STORAGE_POSITION
```

### IMPLEMENTATION_STORAGE_POSITION

```solidity
bytes32 IMPLEMENTATION_STORAGE_POSITION
```

### TBGStorage

```solidity
function TBGStorage() internal pure returns (struct LibTBG.TBGStorageStruct es)
```

### _getGame

```solidity
function _getGame(uint256 gameId) internal view returns (struct LibTBG.GameInstance)
```

### init

```solidity
function init(struct LibTBG.GameSettings settings) internal
```

_Initializes the game with the provided settings. `settings` is the settings for the game.

Requirements:

- `settings.timePerTurn` must not be zero.
- `settings.maxPlayersSize` must not be zero.
- `settings.minPlayersSize` must be at least 2.
- `settings.maxTurns` must not be zero.
- `settings.numWinners` must not be zero and must be less than `settings.minPlayersSize`.
- `settings.timeToJoin` must not be zero.
- `settings.maxPlayersSize` must not be less than `settings.minPlayersSize`.
- `settings.subject` must not be an empty string.

Modifies:

- Sets the settings of the game to `settings`._

### createGame

```solidity
function createGame(uint256 gameId, address gm) internal
```

_Creates a new game with the provided game ID and game master. `gameId` is the ID of the game. `gm` is the address of the game master.

Requirements:

- The game with `gameId` must not already exist.
- `gm` must not be the zero address.
- `gameId` must not be zero.
- The game master of the game with `gameId` must be the zero address.

Modifies:

- Sets the game master of the game with `gameId` to `gm`.
- Increments the total number of games created._

### deleteGame

```solidity
function deleteGame(uint256 gameId) internal
```

_Deletes a game with the provided game ID. `gameId` is the ID of the game.

Requirements:

- The game with `gameId` must exist.

Modifies:

- Sets the game master, current turn, hasEnded, hasStarted,
  implementationStoragePointer, isOvertime, leaderboard, numPlayersMadeMove,
  players, registrationOpenAt, and turnStartedAt of the game with `gameId`
  to their initial values.
- Sets the score and madeMove of each player in the game with `gameId`
  to their initial values._

### canBeJoined

```solidity
function canBeJoined(uint256 gameId) internal view returns (bool)
```

_Checks if a game with the provided game ID can be joined. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether the game can be joined._

### addPlayer

```solidity
function addPlayer(uint256 gameId, address participant) internal
```

_Adds a player to a game with the provided game ID. `gameId` is the ID of the game. `participant` is the address of the player.

Requirements:

- The game with `gameId` must exist.
- `participant` must not already be in a game.
- The number of players in the game with `gameId` must be less than the maximum number of players.
- The game with `gameId` must be joinable.

Modifies:

- Adds `participant` to the players of the game with `gameId`.
- Sets the madeMove of `participant` in the game with `gameId` to false.
- Sets the game of `participant` to `gameId`._

### isPlayerInGame

```solidity
function isPlayerInGame(uint256 gameId, address player) internal view returns (bool)
```

_Checks if a player is in a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player.

Returns:

- A boolean indicating whether the player is in the game._

### removePlayer

```solidity
function removePlayer(uint256 gameId, address participant) internal
```

_Removes a player from a game with the provided game ID. `gameId` is the ID of the game. `participant` is the address of the player.

Requirements:

- The game with `gameId` must exist.
- `participant` must be in the game with `gameId`.
- The game with `gameId` must not have started or must have ended.

Modifies:

- Sets the game of `participant` to 0.
- Removes `participant` from the players of the game with `gameId`._

### isTurnTimedOut

```solidity
function isTurnTimedOut(uint256 gameId) internal view returns (bool)
```

_Checks if the current turn in a game with the provided game ID has timed out. `gameId` is the ID of the game.

Requirements:

- `gameId` must not be zero.
- The game with `gameId` must have started.

Returns:

- A boolean indicating whether the current turn has timed out._

### gameExists

```solidity
function gameExists(uint256 gameId) internal view returns (bool)
```

_Checks if a game with the provided game ID exists. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether the game exists._

### enforceHasStarted

```solidity
function enforceHasStarted(uint256 gameId) internal view
```

_Enforces that a game with the provided game ID has started. `gameId` is the ID of the game.

Requirements:

- `gameId` must not be zero.
- The game with `gameId` must have started._

### canEndTurn

```solidity
function canEndTurn(uint256 gameId) internal view returns (bool)
```

_Enforces that a game with the provided game ID has started. `gameId` is the ID of the game.

Requirements:

- `gameId` must not be zero.
- The game with `gameId` must have started.

***WARNING*** This function is unused in the current implementation of the library._

### canEndTurnEarly

```solidity
function canEndTurnEarly(uint256 gameId) internal view returns (bool)
```

_Checks if the current turn in a game with the provided game ID can end early. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether the current turn can end early._

### onlyInTurnTime

```solidity
modifier onlyInTurnTime(uint256 gameId)
```

_Modifier that requires the current turn in a game with the provided game ID to be able to end. `gameId` is the ID of the game.

Requirements:

- The current turn in the game with `gameId` must be able to end._

### onlyWhenTurnCanEnd

```solidity
modifier onlyWhenTurnCanEnd(uint256 gameId)
```

### _clearCurrentMoves

```solidity
function _clearCurrentMoves(struct LibTBG.GameInstance game) internal
```

_Clears the current moves in a game. `game` is the game.

Modifies:

- Sets the madeMove of each player in `game` to false._

### _resetPlayerStates

```solidity
function _resetPlayerStates(struct LibTBG.GameInstance game) internal
```

_Resets the states of the players in a game. `game` is the game.

Modifies:

- Sets the madeMove and score of each player in `game` to their initial values._

### setScore

```solidity
function setScore(uint256 gameId, address player, uint256 value) internal
```

_Sets the score of a player in a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player. `value` is the score.

Requirements:

- `player` must be in the game with `gameId`.

Modifies:

- Sets the score of `player` in the game with `gameId` to `value`._

### getScore

```solidity
function getScore(uint256 gameId, address player) internal view returns (uint256)
```

_Gets the score of a player in a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player.

Returns:

- The score of `player` in the game with `gameId`._

### getScores

```solidity
function getScores(uint256 gameId) internal view returns (address[], uint256[])
```

_Gets the scores of the players in a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- An array of the addresses of the players in the game with `gameId`.
- An array of the scores of the players in the game with `gameId`._

### openRegistration

```solidity
function openRegistration(uint256 gameId) internal
```

_Opens registration for a game with the provided game ID. `gameId` is the ID of the game.

Requirements:

- The game with `gameId` must exist.

Modifies:

- Sets the registrationOpenAt of the game with `gameId` to the current block timestamp._

### isRegistrationOpen

```solidity
function isRegistrationOpen(uint256 gameId) internal view returns (bool)
```

_Checks if registration is open for a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether registration is open for the game._

### canStart

```solidity
function canStart(uint256 gameId) internal view returns (bool)
```

_Checks if a game with the provided game ID can start. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether the game can start._

### canStartEarly

```solidity
function canStartEarly(uint256 gameId) internal view returns (bool)
```

_Checks if a game with the provided game ID can start early. `gameId` is the ID of the game.
By "early" it is assumed that time to join has not yet passed, but it's already cap players limit reached.

Returns:

- A boolean indicating whether the game can start early._

### startGameEarly

```solidity
function startGameEarly(uint256 gameId) internal
```

_Starts a game with the provided game ID early. `gameId` is the ID of the game.
By "early" it is assumed that time to join has not yet passed, but it's already cap players limit reached.

Requirements:

- The game with `gameId` must exist.
- The game with `gameId` must not have started.
- The game with `gameId` must have opened registration.
- The number of players in the game with `gameId` must be greater than or equal to the minimum number of players.
- The number of players in the game with `gameId` must be equal to the maximum number of players or the current block timestamp must be greater than the registration open time plus the time to join.

Modifies:

- Sets the hasStarted, hasEnded, currentTurn, and turnStartedAt of the game with `gameId` to their new values.
- Resets the states of the players in the game with `gameId`._

### startGame

```solidity
function startGame(uint256 gameId) internal
```

_Starts a game with the provided game ID. `gameId` is the ID of the game.

Requirements:

- The game with `gameId` must exist.
- The game with `gameId` must not have started.
- The game with `gameId` must have opened registration.
- The current block timestamp must be greater than the registration open time plus the time to join.

Modifies:

- Sets the hasStarted, hasEnded, currentTurn, and turnStartedAt of the game with `gameId` to their new values.
- Resets the states of the players in the game with `gameId`._

### getTurn

```solidity
function getTurn(uint256 gameId) internal view returns (uint256)
```

_Gets the current turn of a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- The current turn of the game with `gameId`._

### getGM

```solidity
function getGM(uint256 gameId) internal view returns (address)
```

_Gets the game master of a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- The game master of the game with `gameId`._

### isLastTurn

```solidity
function isLastTurn(uint256 gameId) internal view returns (bool)
```

_Checks if the current turn is the last turn in a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether the current turn is the last turn in the game._

### isGameOver

```solidity
function isGameOver(uint256 gameId) internal view returns (bool)
```

_Checks if a game with the provided game ID is over. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether the game is over._

### enforceIsNotOver

```solidity
function enforceIsNotOver(uint256 gameId) internal view
```

_Enforces that a game with the provided game ID is not over. `gameId` is the ID of the game.

Requirements:

- The game with `gameId` must not be over._

### playerMove

```solidity
function playerMove(uint256 gameId, address player) internal
```

_Records a player's move in a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player.

Requirements:

- The game with `gameId` must have started.
- The game with `gameId` must not be over.
- `player` must not have made a move in the current turn of the game with `gameId`.
- `player` must be in the game with `gameId`.

Modifies:

- Sets the madeMove of `player` in the game with `gameId` to true.
- Increments the numPlayersMadeMove of the game with `gameId`._

### enforceIsPlayingGame

```solidity
function enforceIsPlayingGame(uint256 gameId, address player) internal view
```

_Enforces that a player is in a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player.

Requirements:

- `player` must be in the game with `gameId`._

### hasStarted

```solidity
function hasStarted(uint256 gameId) internal view returns (bool)
```

_Checks if a game with the provided game ID has started. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether the game has started._

### getLeaderBoard

```solidity
function getLeaderBoard(uint256 gameId) internal view returns (address[])
```

_Gets the leaderboard of a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- An array of the addresses of the players in the game with `gameId`, sorted by score._

### nextTurn

```solidity
function nextTurn(uint256 gameId) internal returns (bool, bool, bool)
```

_Advances to the next turn in a game with the provided game ID. `gameId` is the ID of the game.

Requirements:

- The game with `gameId` must be able to end the current turn early. (all players have moved or the turn has timed out)

Modifies:

- Clears the current moves in the game with `gameId`.
- Increments the currentTurn of the game with `gameId`.
- Sets the turnStartedAt of the game with `gameId` to the current block timestamp.
- If the current turn is the last turn or the game with `gameId` is in overtime, checks if the game is a tie and sets the isOvertime of the game with `gameId` to the result.
- Sets the hasEnded of the game with `gameId` to whether the game is over.

Returns:

- A boolean indicating whether the current turn is the last turn.
- A boolean indicating whether the game is a tie.
- A boolean indicating whether the game is over._

### getDataStorage

```solidity
function getDataStorage() internal pure returns (bytes32 pointer)
```

_Gets the data storage pointer.

Returns:

- The data storage pointer._

### getGameDataStorage

```solidity
function getGameDataStorage(uint256 gameId) internal view returns (bytes32 pointer)
```

_Gets the game data storage pointer of a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- The game data storage pointer of the game with `gameId`._

### getPlayersNumber

```solidity
function getPlayersNumber(uint256 gameId) internal view returns (uint256)
```

_Gets the number of players in a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- The number of players in the game with `gameId`._

### getPlayers

```solidity
function getPlayers(uint256 gameId) internal view returns (address[])
```

_Gets the players in a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- An array of the addresses of the players in the game with `gameId`._

### getGameSettings

```solidity
function getGameSettings() internal view returns (struct LibTBG.GameSettings)
```

_Gets the game settings.

Returns:

- The game settings._

### enforceIsPreRegistrationStage

```solidity
function enforceIsPreRegistrationStage(uint256 gameId) internal view
```

_Enforces that a game with the provided game ID is in the pre-registration stage. `gameId` is the ID of the game.

Requirements:

- Registration must not be open for the game with `gameId`.
- The game with `gameId` must not have started._

### addOvertime

```solidity
function addOvertime(uint256 gameId) internal
```

_Adds overtime to a game with the provided game ID. `gameId` is the ID of the game.

Modifies:

- Sets the isOvertime of the game with `gameId` to true._

### isOvertime

```solidity
function isOvertime(uint256 gameId) internal view returns (bool)
```

_Checks if a game with the provided game ID is in overtime. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether the game is in overtime._

### resetOvertime

```solidity
function resetOvertime(uint256 gameId) internal
```

_Resets the overtime of a game with the provided game ID. `gameId` is the ID of the game.

Modifies:

- Sets the isOvertime of the game with `gameId` to false._

### isTie

```solidity
function isTie(uint256 gameId) internal view returns (bool)
```

_Checks if a game with the provided game ID is a tie. `gameId` is the ID of the game.
Tie being defined as at least two of the top `numWinners` players having the same score.

Returns:

- A boolean indicating whether the game is a tie._

### getPlayersGame

```solidity
function getPlayersGame(address player) internal view returns (uint256)
```

_Gets the game ID of the game a player is in. `player` is the address of the player.

Returns:

- The game ID of the game `player` is in._

### sortByScore

```solidity
function sortByScore(uint256 gameId) internal view returns (address[], uint256[])
```

_Sorts the players in a game with the provided game ID by score in descending order. `gameId` is the ID of the game.

Returns:

- An array of the addresses of the players in the game with `gameId`, sorted by score.
- An array of the scores of the players in the game with `gameId`, sorted in descending order._

## RankToken

### rank

```solidity
mapping(address => uint256) rank
```

### topRank

```solidity
uint256 topRank
```

### _levelUpThreshold

```solidity
uint256 _levelUpThreshold
```

### onlyRankingInstance

```solidity
modifier onlyRankingInstance()
```

### constructor

```solidity
constructor(string uri_, address owner_, string cURI, uint256 levelUpThreshold, address[] components, uint256[] componentWeights) public
```

### getRankingInstance

```solidity
function getRankingInstance() public view returns (address)
```

_Gets the ranking instance which can emit new rank updates and mint rank tokens.

Returns:

- The address of the ranking instance._

### contractURI

```solidity
function contractURI() public view returns (string)
```

### setURI

```solidity
function setURI(string uri_) public
```

### setContractURI

```solidity
function setContractURI(string uri_) public
```

### Leader

```solidity
event Leader(address account, uint256 rank)
```

### mint

```solidity
function mint(address to, uint256 amount, uint256 level, bytes data) public
```

### updateRankingInstance

```solidity
function updateRankingInstance(address newRankingInstance) public
```

_Updates the ranking instance. `newRankingInstance` is the address of the new ranking instance.

emits a _RankingInstanceUpdated_ event._

### lock

```solidity
function lock(address account, uint256 id, uint256 amount) public
```

### unlock

```solidity
function unlock(address account, uint256 id, uint256 amount) public
```

### batchMint

```solidity
function batchMint(address to, uint256[] ids, uint256[] amounts, bytes data) public
```

_Mints specified amounts of tokens to an account. `to` is the address of the account to mint the tokens to. `ids` is the array of IDs of the tokens to mint. `amounts` is the array of amounts of tokens to mint. `data` is the additional data._

### levelUp

```solidity
function levelUp(address to, uint256 level, bytes data) public
```

### findNewRank

```solidity
function findNewRank(address account, uint256 oldRank) public view returns (uint256)
```

_Finds the new rank of an account. `account` is the address of the account. `oldRank` is the old rank of the account.
It checks the balance of the account and returns the new rank that can be upgraded to.

Returns:

- The new rank of the account._

### RankUpdated

```solidity
event RankUpdated(address account, uint256 rank)
```

### _afterTokenTransfer

```solidity
function _afterTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal
```

_Hook that is called after any token transfer. This includes minting
and burning, as well as batched variants.

The same hook is called on both single and batched variants. For single
transfers, the length of the `id` and `amount` arrays will be 1.

Calling conditions (for each `id` and `amount` pair):

- When `from` and `to` are both non-zero, `amount` of ``from``'s tokens
of token type `id` will be  transferred to `to`.
- When `from` is zero, `amount` tokens of token type `id` will be minted
for `to`.
- when `to` is zero, `amount` of ``from``'s tokens of token type `id`
will be burned.
- `from` and `to` are never both zero.
- `ids` and `amounts` have the same, non-zero length.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### getAccountRank

```solidity
function getAccountRank(address account) external view returns (uint256)
```

_Gets the rank of an account. `account` is the address of the account.

Returns:

- The rank of the account._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

## Rankify

### numTokens

```solidity
uint256 numTokens
```

### constructor

```solidity
constructor(address owner) public
```

### mint

```solidity
function mint(address to, uint256 amount) public
```

