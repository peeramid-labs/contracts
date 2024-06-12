
# 
###  error ZeroValue

```solidity
error ZeroValue() 
```

# 
###  error WrongAddress

```solidity
error WrongAddress() 
```

# 
###  error OutOfBounds

```solidity
error OutOfBounds() 
```

# 
## Description

## Implementation

### internal function RInstanceStorage

```solidity
function RInstanceStorage() internal pure returns (struct IRankifyInstanceCommons.RInstanceSettings bog) 
```

### external function setGamePrice

```solidity
function setGamePrice(uint256 newPrice) external 
```

*Sets the game price. `newPrice` is the new game price.

Modifies:

- Sets the game price to `newPrice`.

Requirements:

- The caller must be the contract owner.*
### external function setJoinGamePrice

```solidity
function setJoinGamePrice(uint256 newPrice) external 
```

*Sets the join game price. `newPrice` is the new join game price.

Modifies:

- Sets the join game price to `newPrice`.

Requirements:

- The caller must be the contract owner.*
### external function setRankTokenAddress

```solidity
function setRankTokenAddress(address newRankToken) external 
```

*Sets the rank token address. `newRankToken` is the new rank token address.

Modifies:

- Sets the rank token address to `newRankToken`.

Requirements:

- The caller must be the contract owner.
- `newRankToken` must not be the zero address.
- `newRankToken` must support the ERC1155 interface.*
### external function setTimePerTurn

```solidity
function setTimePerTurn(uint256 newTimePerTurn) external 
```

*Sets the time per turn. `newTimePerTurn` is the new time per turn.

Modifies:

- Sets the time per turn to `newTimePerTurn`.

Requirements:

- The caller must be the contract owner.*
### external function setMaxPlayersSize

```solidity
function setMaxPlayersSize(uint256 newMaxPlayersSize) external 
```

*Sets the maximum number of players in a game. `newMaxPlayersSize` is the new maximum number of players.

Modifies:

- Sets the maximum number of players to `newMaxPlayersSize`.

Requirements:

- The caller must be the contract owner.
- `newMaxPlayersSize` must be greater than or equal to the minimum number of players.*
### external function setMinPlayersSize

```solidity
function setMinPlayersSize(uint256 newMinPlayersSize) external 
```

*Sets the minimum number of players in a game. `newMinPlayersSize` is the new minimum number of players.

Modifies:

- Sets the minimum number of players to `newMinPlayersSize`.

Requirements:

- The caller must be the contract owner.
- `newMinPlayersSize` must be less than or equal to the maximum number of players.*
### external function setTimeToJoin

```solidity
function setTimeToJoin(uint256 newTimeToJoin) external 
```

*Sets the time to join a game. `newTimeToJoin` is the new time to join.

Modifies:

- Sets the time to join to `newTimeToJoin`.

Requirements:

- The caller must be the contract owner.
- `newTimeToJoin` must not be zero.*
### external function setMaxTurns

```solidity
function setMaxTurns(uint256 newMaxTurns) external 
```

*Sets the maximum number of turns in a game. `newMaxTurns` is the new maximum number of turns.

Modifies:

- Sets the maximum number of turns to `newMaxTurns`.

Requirements:

- The caller must be the contract owner.
- `newMaxTurns` must not be zero.*
<!--CONTRACT_END-->

