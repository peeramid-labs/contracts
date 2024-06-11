# Solidity API

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

