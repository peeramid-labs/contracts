
# 
###  error insufficient

```solidity
error insufficient(uint256 id, uint256 balance, uint256 required) 
```

# LockableERC1155
## Description

This is an abstract contract that extends the ERC1155 token contract and implements the ILockableERC1155 interface.
     It provides functionality to lock and unlock token amounts for specific accounts and IDs.

## Implementation

### internal variable lockedAmounts

```solidity
mapping(address => mapping(uint256 => uint256)) lockedAmounts 
```

### public function lock

```solidity
function lock(address account, uint256 id, uint256 amount) public virtual 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `account` | `address` | The address of the account to lock tokens for. |
| `id` | `uint256` | The ID of the token to lock. |
| `amount` | `uint256` | The amount of tokens to lock. |

*Locks a specified amount of tokens for a given account and token ID.
If the account does not have enough balance to lock the specified amount,
the function will revert with an "insufficient" error message.
Emits a `TokensLocked` event after successfully locking the tokens.*
### public function unlock

```solidity
function unlock(address account, uint256 id, uint256 amount) public virtual 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `account` | `address` | The address of the account to unlock tokens for. |
| `id` | `uint256` | The ID of the token to unlock. |
| `amount` | `uint256` | The amount of tokens to unlock. |

*Unlocks a specified amount of tokens for a given account and token ID.
If the locked amount is less than the specified amount, it reverts with an "insufficient" error message.
Emits a `TokensUnlocked` event after unlocking the tokens.*
### public function unlockedBalanceOf

```solidity
function unlockedBalanceOf(address account, uint256 id) public view returns (uint256) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `account` | `address` | The address of the account. |
| `id` | `uint256` | The ID of the ERC1155 token. |
| **Output** | |
|  `0`  | `uint256` | The unlocked balance of the ERC1155 token for the account. |

*Returns the unlocked balance of a specific ERC1155 token for an account.
The unlocked balance is calculated by subtracting the locked amount from the total balance.*
### internal function _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `operator` | `address` | The address performing the token transfer. |
| `from` | `address` | The address from which the tokens are being transferred. |
| `to` | `address` | The address to which the tokens are being transferred. |
| `ids` | `uint256[]` | An array of token IDs being transferred. |
| `amounts` | `uint256[]` | An array of token amounts being transferred. |
| `data` | `bytes` | Additional data attached to the transfer. |

*Hook function that is called before any token transfer.
It checks if the transfer is allowed based on the locked amounts of the tokens.
If the transfer is not allowed, it reverts with an error message.*
<!--CONTRACT_END-->

