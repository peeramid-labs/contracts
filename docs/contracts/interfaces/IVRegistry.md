# Solidity API

## IVRegistry

### register

```solidity
function register(address source, struct Version version) external
```

Registers a contract with a specific version.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| source | address | The address of the contract to register. |
| version | struct Version | The version of the contract. |

### invalidate

```solidity
function invalidate(address source, bool invalidateMinors, struct Version version) external
```

Sets the contract address of specific version to zero.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| source | address | The address of the contract to register. |
| invalidateMinors | bool |  |
| version | struct Version | The version of the contract. |

### getVersion

```solidity
function getVersion(struct Version version) external view returns (address)
```

_Checks if a given address is registered in the IVRegistry._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| version | struct Version | The version of the contract. |

