# Solidity API

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

### isPlayerTurnComplete

```solidity
function isPlayerTurnComplete(uint256 gameId, address player) public view returns (bool)
```

### getPlayerVotedArray

```solidity
function getPlayerVotedArray(uint256 gameId) public view returns (bool[])
```

### getPlayersMoved

```solidity
function getPlayersMoved(uint256 gameId) public view returns (bool[], uint256)
```

