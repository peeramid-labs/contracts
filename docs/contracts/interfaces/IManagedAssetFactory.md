# Solidity API

## IManagedAssetFactory

### deployAsset

```solidity
function deployAsset(bytes32 assetUri, bytes32 assetType, bytes instantiationPayload) external payable returns (address)
```

### deployAssetManager

```solidity
function deployAssetManager(address sAddr, bytes32 strategyId, bytes instantiationPayload) external payable returns (address)
```

### isAssetManager

```solidity
function isAssetManager(address maybeManager) external view returns (bool)
```

### isManagedAsset

```solidity
function isManagedAsset(address maybeAsset) external view returns (bool)
```

### getAsset

```solidity
function getAsset(address manager) external view returns (address)
```

### getAssetType

```solidity
function getAssetType(address asset) external view returns (bytes32)
```

### getAssetUri

```solidity
function getAssetUri(address asset) external view returns (bytes32)
```

### AssetDeployed

```solidity
event AssetDeployed(address asset, bytes32 assetUri, bytes32 assetType)
```

### AssetManagerDeployed

```solidity
event AssetManagerDeployed(address asset, address manager, bytes32 strategyId)
```

