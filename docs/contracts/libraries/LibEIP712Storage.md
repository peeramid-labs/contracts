# Solidity API

## LibEIP712WithStorage

### EIP712_STORAGE_POSITION

```solidity
bytes32 EIP712_STORAGE_POSITION
```

### LibEIP712WithStorageStorage

```solidity
struct LibEIP712WithStorageStorage {
  bytes32 _CACHED_DOMAIN_SEPARATOR;
  uint256 _CACHED_CHAIN_ID;
  address _CACHED_THIS;
  bytes32 _HASHED_NAME;
  bytes32 _HASHED_VERSION;
  bytes32 _TYPE_HASH;
}
```

### EIP712WithStorage

```solidity
function EIP712WithStorage() internal pure returns (struct LibEIP712WithStorage.LibEIP712WithStorageStorage ds)
```

