# Solidity API

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

