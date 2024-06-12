
# 
## Description

## Implementation

### external function register

Registers a contract with a specific version.

```solidity
function register(address source, struct Version version) external 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `source` | `address` | The address of the contract to register. |
| `version` | `struct Version` | The version of the contract. |

### external function invalidate

Sets the contract address of specific version to zero.

```solidity
function invalidate(address source, bool invalidateMinors, struct Version version) external 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `source` | `address` | The address of the contract to register. |
| `invalidateMinors` | `bool` |  |
| `version` | `struct Version` | The version of the contract. |

### external function getVersion

```solidity
function getVersion(struct Version version) external view returns (address) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `version` | `struct Version` | The version of the contract. |

*Checks if a given address is registered in the IVRegistry.*
<!--CONTRACT_END-->

