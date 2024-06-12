
# 
## Description

## Implementation

### external function deployAsset

```solidity
function deployAsset(bytes32 assetUri, bytes32 assetType, bytes instantiationPayload) external payable returns (address) 
```

### external function deployAssetManager

```solidity
function deployAssetManager(address sAddr, bytes32 strategyId, bytes instantiationPayload) external payable returns (address) 
```

### external function isAssetManager

```solidity
function isAssetManager(address maybeManager) external view returns (bool) 
```

### external function isManagedAsset

```solidity
function isManagedAsset(address maybeAsset) external view returns (bool) 
```

### external function getAsset

```solidity
function getAsset(address manager) external view returns (address) 
```

### external function getAssetType

```solidity
function getAssetType(address asset) external view returns (bytes32) 
```

### external function getAssetUri

```solidity
function getAssetUri(address asset) external view returns (bytes32) 
```

###  event AssetDeployed

```solidity
event AssetDeployed(address asset, bytes32 assetUri, bytes32 assetType) 
```

###  event AssetManagerDeployed

```solidity
event AssetManagerDeployed(address asset, address manager, bytes32 strategyId) 
```

<!--CONTRACT_END-->

