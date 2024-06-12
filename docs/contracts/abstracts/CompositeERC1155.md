
# CompositeERC1155
## Description

An abstract contract that extends LockableERC1155 and provides functionality for composite ERC1155 tokens.
Composite tokens can be "composed" from multiple underlying assets, which however do not change their owner
and in contrast to that use LockableERC1155 standard, which allows to read locked asset BalanceOf, OwnerOf methods correctly

## Implementation

### internal function constructor

```solidity
constructor(string uri_, address[] dimensionTokens, uint256[] tokenWeights) internal 
```

### internal function _mint

```solidity
function _mint(address to, uint256 tokenId, uint256 value, bytes data) internal virtual 
```

### internal function _burn

```solidity
function _burn(address from, uint256 id, uint256 amount) internal 
```

*Destroys `amount` tokens of token type `id` from `from`

Emits a {TransferSingle} event.

Requirements:

- `from` cannot be the zero address.
- `from` must have at least `amount` tokens of token type `id`.*
### public function decompose

```solidity
function decompose(address from, uint256 id, uint256 amount) public virtual 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `from` | `address` | The address from which the composite token is being decomposed. |
| `id` | `uint256` | The ID of the composite token being decomposed. |
| `amount` | `uint256` | The amount of the composite token to decompose. |

*Decomposes a composite ERC1155 token into its individual components.
This function unlocks the specified amount of the composite token from each dimension,
and then burns the specified amount of the composite token from the caller's balance.*
### public function burn

```solidity
function burn(address account, uint256 id, uint256 value) public virtual 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `account` | `address` | The address of the token owner. |
| `id` | `uint256` | The ID of the token to burn. |
| `value` | `uint256` | The amount of tokens to burn. |

*Burns a specified amount of tokens from the given account.
This will burn all underlying (composite) assets

Requirements:
- `account` must be the token owner or an approved operator.
- `id` and `value` must be valid token ID and amount to burn.
- All underlying "composite" assets implement burn as well*
### public function getComponents

```solidity
function getComponents() public virtual returns (address[], uint256[]) 
```

| Output | Type | Description |
| ------ | ---- | ----------- |
|  `0`  | `address[]` | An array of component addresses and an array of component weights. |
|  `1`  | `uint256[]` |  |

*Retrieves the components of the CompositeERC1155 contract.*
<!--CONTRACT_END-->

