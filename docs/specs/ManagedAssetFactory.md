# Managed Asset Factory

## Abstract

Producer is a smart contract that is able to deploy(produce) asset contracts and asset management contracts from one, versioned and trusted implementation factory-like source. It allows an asset emission to be controlled by multiple management contracts by being an asset emitter himself who only can does this on behalf of registered management contract.
Such contract allows to have single registry of multiple assets each of whose is known to behave according to same logical constraints of trusted implementation of management instances that only differ with instantiation constructor argument differences.

## Motivation

Rating systems often are based on some quantitative representation for participants strengths and can be often expressed as an integer number selected so that minimum resolution can describe ratings granularly enough particular application. In practice forming tournaments, payment tiers etc however such granularity often is being reduced by quantizing participant ratings to some less granular groupings.
For example in chess, FIDE used [Elo](https://en.wikipedia.org/wiki/Chess_rating_system) rating system will use scale that defined in boundaries of [1000,2700]. FIDE will also [quantize](https://handbook.fide.com/) these values in to categories each being 25 points wide to form tournament game groups. It will also specify that awarded titles, such as "Grand-Master" requires rating over a threshold.

With bloom of meta-verse philosophy it seem to be valuable to be able to define such rating system agnostic from any particular implementation and organization, rather as modular and generic aggregator for different ratings, hence enabling cross-stream collaboration and convenient way of sharing, querying ratings as well as the quantization values that represent distinct, principal quality difference.

In order to build such an asset system, where each would be capable representing a category for some matter in united and global registry existing token ERC1155 standard can be utilized. To link those together some kind of trusted registry is needed that can manage such coupled assets and create cross-domain trust.

## Specification

Assets and asset management logic are separated and are pre-defined as factory templates, that allow instantiating party only pass in arbitrary constructor arguments as customization properties. Whenever a management contract needs to call privileged method on the asset, it calls Factory Asset Manager which forwards call.

### Definitions

- **Asset**: An ERC1155 contract that represents a matter
- **Asset manager**: An arbitrary contract that can manage one particular asset
- **Registry**: Storage located within the Producer contract which stores records about assets and corresponding managers
- **Instance**: A factory deployment, it may be either asset or asset manager
- **Template**: A reference code that is used to produce instances

### Requirements

- Must deploy asset Manager with exactly one asset assigned.
- Must allow multiple Managers to manage same asset.
- Must be able to deploy new assets by instantiating from a template.
- Must be able to deploy new AssetManager by instantiating from a template.
- Must record deployed instance address and template identifier and it's relationship to other instances in the registry.
- Must emit an event when asset is created.
- Must emit an event when manager is created.
- May have multiple asset types available to instantiate.
- May have multiple management types available to instantiate
- Should be EIP165 compliant.
- Mus be able to distinguish whether address is an asset
- Must be able to distinguish whether address is a manager
- Must be able to distinguish whether manager manages an asset
- Must be able to distinguish whether asset is is managed by a manager
- Must store in the registry and return Asset URI
- Must store in the registry and return Asset Type
- Must store in the registry and return Manager Template Id
- Must store in the registry and return Managers asset address

### Interface

```solidity
interface IFactoryAssetsManager {
  function deployAsset(bytes32 assetUri, bytes32 assetType, bytes calldata instantiationPayload) external;

  function deployAssetManager(address sAddr, bytes32 strategyId, bytes calldata instantiationPayload) external;

  function isAssetManager(address maybeManager) external view returns (bool);

  function isManagedAsset(address maybeAsset) external view returns (bool);

  function getAsset(address manager) external view returns (address);

  function getAssetType(address asset) external view returns (bytes32);

  function getAssetUri(address asset) external view returns (bytes32);

  event AssetDeployed(address indexed asset, bytes32 indexed assetUri, bytes32 indexed assetType);
  event AssetManagerDeployed(address indexed asset, address indexed manager, bytes32 indexed strategyId);
}
```

## Rationale

**Combining asset factory with manager instance factory** - It could be possible to isolate functionality in two different contracts. Such design would imply that rank token factory may be called by either owner or game instance factory. Hence they are sharing same security level, and since factory deploys instances already tied to a particular rank token, they would become decoupled from token factory in case if token factory was swapped. Same can be achieved by deploying one factory as diamond contract and using Instance & Token deployments factory
