# Solidity API

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

