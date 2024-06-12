
# LibTBG
## Description

Library for managing turn-based games.
It is designed to be used as a base library for games, and provides the following functionality:
- setting game settings such as time per turn, max players, min players, etc as well as perform score and leaderboard tracking

Limitations:
- It is assumed there is only one game per player
- It is assumed there is only on game master per game

***WARNING*** Some limitations:
- This library is still under development and its interfaces may change.
- getting game data (which has own storage assigement and can be encapsulated from library) however there is no storage slot collision checks in place

## Implementation

### public struct GameSettings

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
### public struct GameInstance

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
### public struct TBGStorageStruct

```solidity
struct TBGStorageStruct {
  struct LibTBG.GameSettings settings;
  mapping(uint256 => struct LibTBG.GameInstance) games;
  mapping(address => uint256) playerInGame;
  uint256 totalGamesCreated;
}
```
### internal variable TBG_STORAGE_POSITION

```solidity
bytes32 TBG_STORAGE_POSITION 
```

### internal variable IMPLEMENTATION_STORAGE_POSITION

```solidity
bytes32 IMPLEMENTATION_STORAGE_POSITION 
```

### internal function TBGStorage

```solidity
function TBGStorage() internal pure returns (struct LibTBG.TBGStorageStruct es) 
```

### internal function _getGame

```solidity
function _getGame(uint256 gameId) internal view returns (struct LibTBG.GameInstance) 
```

### internal function init

```solidity
function init(struct LibTBG.GameSettings settings) internal 
```

*Initializes the game with the provided settings. `settings` is the settings for the game.

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

- Sets the settings of the game to `settings`.*
### internal function createGame

```solidity
function createGame(uint256 gameId, address gm) internal 
```

*Creates a new game with the provided game ID and game master. `gameId` is the ID of the game. `gm` is the address of the game master.

Requirements:

- The game with `gameId` must not already exist.
- `gm` must not be the zero address.
- `gameId` must not be zero.
- The game master of the game with `gameId` must be the zero address.

Modifies:

- Sets the game master of the game with `gameId` to `gm`.
- Increments the total number of games created.*
### internal function deleteGame

```solidity
function deleteGame(uint256 gameId) internal 
```

*Deletes a game with the provided game ID. `gameId` is the ID of the game.

Requirements:

- The game with `gameId` must exist.

Modifies:

- Sets the game master, current turn, hasEnded, hasStarted,
  implementationStoragePointer, isOvertime, leaderboard, numPlayersMadeMove,
  players, registrationOpenAt, and turnStartedAt of the game with `gameId`
  to their initial values.
- Sets the score and madeMove of each player in the game with `gameId`
  to their initial values.*
### internal function canBeJoined

```solidity
function canBeJoined(uint256 gameId) internal view returns (bool) 
```

*Checks if a game with the provided game ID can be joined. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether the game can be joined.*
### internal function addPlayer

```solidity
function addPlayer(uint256 gameId, address participant) internal 
```

*Adds a player to a game with the provided game ID. `gameId` is the ID of the game. `participant` is the address of the player.

Requirements:

- The game with `gameId` must exist.
- `participant` must not already be in a game.
- The number of players in the game with `gameId` must be less than the maximum number of players.
- The game with `gameId` must be joinable.

Modifies:

- Adds `participant` to the players of the game with `gameId`.
- Sets the madeMove of `participant` in the game with `gameId` to false.
- Sets the game of `participant` to `gameId`.*
### internal function isPlayerInGame

```solidity
function isPlayerInGame(uint256 gameId, address player) internal view returns (bool) 
```

*Checks if a player is in a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player.

Returns:

- A boolean indicating whether the player is in the game.*
### internal function removePlayer

```solidity
function removePlayer(uint256 gameId, address participant) internal 
```

*Removes a player from a game with the provided game ID. `gameId` is the ID of the game. `participant` is the address of the player.

Requirements:

- The game with `gameId` must exist.
- `participant` must be in the game with `gameId`.
- The game with `gameId` must not have started or must have ended.

Modifies:

- Sets the game of `participant` to 0.
- Removes `participant` from the players of the game with `gameId`.*
### internal function isTurnTimedOut

```solidity
function isTurnTimedOut(uint256 gameId) internal view returns (bool) 
```

*Checks if the current turn in a game with the provided game ID has timed out. `gameId` is the ID of the game.

Requirements:

- `gameId` must not be zero.
- The game with `gameId` must have started.

Returns:

- A boolean indicating whether the current turn has timed out.*
### internal function gameExists

```solidity
function gameExists(uint256 gameId) internal view returns (bool) 
```

*Checks if a game with the provided game ID exists. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether the game exists.*
### internal function enforceHasStarted

```solidity
function enforceHasStarted(uint256 gameId) internal view 
```

*Enforces that a game with the provided game ID has started. `gameId` is the ID of the game.

Requirements:

- `gameId` must not be zero.
- The game with `gameId` must have started.*
### internal function canEndTurn

```solidity
function canEndTurn(uint256 gameId) internal view returns (bool) 
```

*Enforces that a game with the provided game ID has started. `gameId` is the ID of the game.

Requirements:

- `gameId` must not be zero.
- The game with `gameId` must have started.*
### internal function canEndTurnEarly

```solidity
function canEndTurnEarly(uint256 gameId) internal view returns (bool) 
```

*Checks if the current turn in a game with the provided game ID can end early. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether the current turn can end early.*
### internal modifier onlyInTurnTime

```solidity
modifier onlyInTurnTime(uint256 gameId) 
```

*Modifier that requires the current turn in a game with the provided game ID to be able to end. `gameId` is the ID of the game.

Requirements:

- The current turn in the game with `gameId` must be able to end.*
### internal modifier onlyWhenTurnCanEnd

```solidity
modifier onlyWhenTurnCanEnd(uint256 gameId) 
```

### internal function _clearCurrentMoves

```solidity
function _clearCurrentMoves(struct LibTBG.GameInstance game) internal 
```

*Clears the current moves in a game. `game` is the game.

Modifies:

- Sets the madeMove of each player in `game` to false.*
### internal function _resetPlayerStates

```solidity
function _resetPlayerStates(struct LibTBG.GameInstance game) internal 
```

*Resets the states of the players in a game. `game` is the game.

Modifies:

- Sets the madeMove and score of each player in `game` to their initial values.*
### internal function setScore

```solidity
function setScore(uint256 gameId, address player, uint256 value) internal 
```

*Sets the score of a player in a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player. `value` is the score.

Requirements:

- `player` must be in the game with `gameId`.

Modifies:

- Sets the score of `player` in the game with `gameId` to `value`.*
### internal function getScore

```solidity
function getScore(uint256 gameId, address player) internal view returns (uint256) 
```

*Gets the score of a player in a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player.

Returns:

- The score of `player` in the game with `gameId`.*
### internal function getScores

```solidity
function getScores(uint256 gameId) internal view returns (address[], uint256[]) 
```

*Gets the scores of the players in a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- An array of the addresses of the players in the game with `gameId`.
- An array of the scores of the players in the game with `gameId`.*
### internal function openRegistration

```solidity
function openRegistration(uint256 gameId) internal 
```

*Opens registration for a game with the provided game ID. `gameId` is the ID of the game.

Requirements:

- The game with `gameId` must exist.

Modifies:

- Sets the registrationOpenAt of the game with `gameId` to the current block timestamp.*
### internal function isRegistrationOpen

```solidity
function isRegistrationOpen(uint256 gameId) internal view returns (bool) 
```

*Checks if registration is open for a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether registration is open for the game.*
### internal function canStart

```solidity
function canStart(uint256 gameId) internal view returns (bool) 
```

*Checks if a game with the provided game ID can start. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether the game can start.*
### internal function canStartEarly

```solidity
function canStartEarly(uint256 gameId) internal view returns (bool) 
```

*Checks if a game with the provided game ID can start early. `gameId` is the ID of the game.
By "early" it is assumed that time to join has not yet passed, but it's already cap players limit reached.

Returns:

- A boolean indicating whether the game can start early.*
### internal function startGameEarly

```solidity
function startGameEarly(uint256 gameId) internal 
```

*Starts a game with the provided game ID early. `gameId` is the ID of the game.
By "early" it is assumed that time to join has not yet passed, but it's already cap players limit reached.

Requirements:

- The game with `gameId` must exist.
- The game with `gameId` must not have started.
- The game with `gameId` must have opened registration.
- The number of players in the game with `gameId` must be greater than or equal to the minimum number of players.
- The number of players in the game with `gameId` must be equal to the maximum number of players or the current block timestamp must be greater than the registration open time plus the time to join.

Modifies:

- Sets the hasStarted, hasEnded, currentTurn, and turnStartedAt of the game with `gameId` to their new values.
- Resets the states of the players in the game with `gameId`.*
### internal function startGame

```solidity
function startGame(uint256 gameId) internal 
```

*Starts a game with the provided game ID. `gameId` is the ID of the game.

Requirements:

- The game with `gameId` must exist.
- The game with `gameId` must not have started.
- The game with `gameId` must have opened registration.
- The current block timestamp must be greater than the registration open time plus the time to join.

Modifies:

- Sets the hasStarted, hasEnded, currentTurn, and turnStartedAt of the game with `gameId` to their new values.
- Resets the states of the players in the game with `gameId`.*
### internal function getTurn

```solidity
function getTurn(uint256 gameId) internal view returns (uint256) 
```

*Gets the current turn of a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- The current turn of the game with `gameId`.*
### internal function getGM

```solidity
function getGM(uint256 gameId) internal view returns (address) 
```

*Gets the game master of a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- The game master of the game with `gameId`.*
### internal function isLastTurn

```solidity
function isLastTurn(uint256 gameId) internal view returns (bool) 
```

*Checks if the current turn is the last turn in a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether the current turn is the last turn in the game.*
### internal function isGameOver

```solidity
function isGameOver(uint256 gameId) internal view returns (bool) 
```

*Checks if a game with the provided game ID is over. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether the game is over.*
### internal function enforceIsNotOver

```solidity
function enforceIsNotOver(uint256 gameId) internal view 
```

*Enforces that a game with the provided game ID is not over. `gameId` is the ID of the game.

Requirements:

- The game with `gameId` must not be over.*
### internal function playerMove

```solidity
function playerMove(uint256 gameId, address player) internal 
```

*Records a player's move in a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player.

Requirements:

- The game with `gameId` must have started.
- The game with `gameId` must not be over.
- `player` must not have made a move in the current turn of the game with `gameId`.
- `player` must be in the game with `gameId`.

Modifies:

- Sets the madeMove of `player` in the game with `gameId` to true.
- Increments the numPlayersMadeMove of the game with `gameId`.*
### internal function isPlayerTurnComplete

```solidity
function isPlayerTurnComplete(uint256 gameId, address player) internal view returns (bool) 
```

### internal function enforceIsPlayingGame

```solidity
function enforceIsPlayingGame(uint256 gameId, address player) internal view 
```

*Enforces that a player is in a game with the provided game ID. `gameId` is the ID of the game. `player` is the address of the player.

Requirements:

- `player` must be in the game with `gameId`.*
### internal function hasStarted

```solidity
function hasStarted(uint256 gameId) internal view returns (bool) 
```

*Checks if a game with the provided game ID has started. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether the game has started.*
### internal function getLeaderBoard

```solidity
function getLeaderBoard(uint256 gameId) internal view returns (address[]) 
```

*Gets the leaderboard of a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- An array of the addresses of the players in the game with `gameId`, sorted by score.*
### internal function nextTurn

```solidity
function nextTurn(uint256 gameId) internal returns (bool, bool, bool) 
```

*Advances to the next turn in a game with the provided game ID. `gameId` is the ID of the game.

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
- A boolean indicating whether the game is over.*
### internal function getDataStorage

```solidity
function getDataStorage() internal pure returns (bytes32 pointer) 
```

*Gets the data storage pointer.

Returns:

- The data storage pointer.*
### internal function getGameDataStorage

```solidity
function getGameDataStorage(uint256 gameId) internal view returns (bytes32 pointer) 
```

*Gets the game data storage pointer of a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- The game data storage pointer of the game with `gameId`.*
### internal function getPlayersNumber

```solidity
function getPlayersNumber(uint256 gameId) internal view returns (uint256) 
```

*Gets the number of players in a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- The number of players in the game with `gameId`.*
### internal function getPlayers

```solidity
function getPlayers(uint256 gameId) internal view returns (address[]) 
```

*Gets the players in a game with the provided game ID. `gameId` is the ID of the game.

Returns:

- An array of the addresses of the players in the game with `gameId`.*
### internal function getGameSettings

```solidity
function getGameSettings() internal view returns (struct LibTBG.GameSettings) 
```

*Gets the game settings.

Returns:

- The game settings.*
### internal function enforceIsPreRegistrationStage

```solidity
function enforceIsPreRegistrationStage(uint256 gameId) internal view 
```

*Enforces that a game with the provided game ID is in the pre-registration stage. `gameId` is the ID of the game.

Requirements:

- Registration must not be open for the game with `gameId`.
- The game with `gameId` must not have started.*
### internal function addOvertime

```solidity
function addOvertime(uint256 gameId) internal 
```

*Adds overtime to a game with the provided game ID. `gameId` is the ID of the game.

Modifies:

- Sets the isOvertime of the game with `gameId` to true.*
### internal function isOvertime

```solidity
function isOvertime(uint256 gameId) internal view returns (bool) 
```

*Checks if a game with the provided game ID is in overtime. `gameId` is the ID of the game.

Returns:

- A boolean indicating whether the game is in overtime.*
### internal function resetOvertime

```solidity
function resetOvertime(uint256 gameId) internal 
```

*Resets the overtime of a game with the provided game ID. `gameId` is the ID of the game.

Modifies:

- Sets the isOvertime of the game with `gameId` to false.*
### internal function isTie

```solidity
function isTie(uint256 gameId) internal view returns (bool) 
```

*Checks if a game with the provided game ID is a tie. `gameId` is the ID of the game.
Tie being defined as at least two of the top `numWinners` players having the same score.

Returns:

- A boolean indicating whether the game is a tie.*
### internal function getPlayersGame

```solidity
function getPlayersGame(address player) internal view returns (uint256) 
```

*Gets the game ID of the game a player is in. `player` is the address of the player.

Returns:

- The game ID of the game `player` is in.*
### internal function sortByScore

```solidity
function sortByScore(uint256 gameId) internal view returns (address[], uint256[]) 
```

*Sorts the players in a game with the provided game ID by score in descending order. `gameId` is the ID of the game.

Returns:

- An array of the addresses of the players in the game with `gameId`, sorted by score.
- An array of the scores of the players in the game with `gameId`, sorted in descending order.*
<!--CONTRACT_END-->

