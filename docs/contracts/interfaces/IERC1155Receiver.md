
# ERC1155 transfer receiver interface
## Description

## Implementation

### external function onERC1155Received

validate receipt of ERC1155 transfer

```solidity
function onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes data) external returns (bytes4) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `operator` | `address` | executor of transfer |
| `from` | `address` | sender of tokens |
| `id` | `uint256` | token ID received |
| `value` | `uint256` | quantity of tokens received |
| `data` | `bytes` | data payload |
| **Output** | |
|  `0`  | `bytes4` | function's own selector if transfer is accepted |

### external function onERC1155BatchReceived

validate receipt of ERC1155 batch transfer

```solidity
function onERC1155BatchReceived(address operator, address from, uint256[] ids, uint256[] values, bytes data) external returns (bytes4) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `operator` | `address` | executor of transfer |
| `from` | `address` | sender of tokens |
| `ids` | `uint256[]` | token IDs received |
| `values` | `uint256[]` | quantities of tokens received |
| `data` | `bytes` | data payload |
| **Output** | |
|  `0`  | `bytes4` | function's own selector if transfer is accepted |

<!--CONTRACT_END-->

