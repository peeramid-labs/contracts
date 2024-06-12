
# ILockableERC1155
## Description

Interface for a lockable ERC1155 token contract.

## Implementation

###  event TokensLocked

```solidity
event TokensLocked(address account, uint256 id, uint256 value) 
```

###  event TokensUnlocked

```solidity
event TokensUnlocked(address account, uint256 id, uint256 value) 
```

### external function lock

```solidity
function lock(address account, uint256 id, uint256 amount) external 
```

*Locks a specified amount of tokens for a given account and token ID. `account` is the address of the account to lock the tokens for. `id` is the ID of the token to lock. `amount` is the amount of tokens to lock.

emits a _TokensLocked_ event.*
### external function unlock

```solidity
function unlock(address account, uint256 id, uint256 amount) external 
```

*Unlocks a specified amount of tokens for a given account and token ID. `account` is the address of the account to unlock the tokens for. `id` is the ID of the token to unlock. `amount` is the amount of tokens to unlock.

emits a _TokensUnlocked_ event.*
### external function unlockedBalanceOf

```solidity
function unlockedBalanceOf(address account, uint256 id) external view returns (uint256) 
```

*Returns the unlocked balance of tokens for a given account and token ID. `account` is the address of the account to check the unlocked balance for. `id` is the ID of the token to check the unlocked balance for.

Returns:

- The unlocked balance of tokens.*
<!--CONTRACT_END-->

