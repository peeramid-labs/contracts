
# IVInstaller
## Description

Interface for managing the installation and instantiation of repositories.

Distinguishing

## Implementation

###  enum InstallationTypes

*Enum defining the types of installation for repositories.
- Cloneable: The repository is cloneable.
- Constructable: The repository is constructable.*

```solidity
enum InstallationTypes {
  Cloneable,
  Constructable
}
```
### public struct Distribution

| Input | Type | Description |
|:----- | ---- | ----------- |

*Struct defining the installation plan for a repository.*

```solidity
struct Distribution {
  struct VersionControl requiredSource;
  bytes4[] initializerFnSelectors;
  enum IVInstaller.InstallationTypes installationType;
}
```
###  error NotDistributing

```solidity
error NotDistributing(contract IRepository repository) 
```

*Error thrown when a repository is not added to the installer.*
###  error VersionOutOfBounds

```solidity
error VersionOutOfBounds(address repository, struct Tag version, struct Tag requiredTag) 
```

*Error thrown when the version does not match the requirement for a repository.*
###  event DistributionChanged

```solidity
event DistributionChanged(contract IRepository repository, struct IVInstaller.Distribution oldInstaller, struct IVInstaller.Distribution newInstaller) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `repository` | `contract IRepository` | The address of the repository. |
| `oldInstaller` | `struct IVInstaller.Distribution` | The old version requirement for the repository. |
| `newInstaller` | `struct IVInstaller.Distribution` | The new version requirement for the repository. |

*Event emitted when the installer for repository is updated.*
###  event DistributionCreated

```solidity
event DistributionCreated(contract IRepository repository, address adder, struct VersionControl requirement, bytes32 metadata) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `repository` | `contract IRepository` | The address of the repository. |
| `adder` | `address` | The address of the account that added the repository. |
| `requirement` | `struct VersionControl` | The version requirement for the repository. |
| `metadata` | `bytes32` | The metadata associated with the repository. |

*Event emitted when a repository is added to the installer.*
###  event DistributionRemoved

```solidity
event DistributionRemoved(contract IRepository repository) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `repository` | `contract IRepository` | The address of the repository. |

*Event emitted when a repository is removed from the installer.*
###  event Instantiated

```solidity
event Instantiated(address newInstance, contract IRepository repository, address instantiator, struct Tag version, bytes metadata) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `newInstance` | `address` | The address of the new instance. |
| `repository` | `contract IRepository` | The address of the repository. |
| `instantiator` | `address` | The address of the account that instantiated the instance. |
| `version` | `struct Tag` | The version of the repository used for instantiation. |
| `metadata` | `bytes` | The metadata associated with the instance. |

*Event emitted when a new instance is instantiated from a distribution.*
###  event UpgradedMinor

```solidity
event UpgradedMinor(contract IRepository repository, uint16 oldMinor, uint16 newMinor, uint8 build, bytes metadata) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `repository` | `contract IRepository` | The address of the repository. |
| `oldMinor` | `uint16` | The old minor version. |
| `newMinor` | `uint16` | The new minor version. |
| `build` | `uint8` | The build number. |
| `metadata` | `bytes` | The metadata associated with the upgrade. |

*Event emitted when distribution is upgraded to a new minor version.*
###  event UpgradedMajor

```solidity
event UpgradedMajor(contract IRepository repository, uint8 oldMajor, uint8 newMajor, uint16 build, bytes metadata) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `repository` | `contract IRepository` | The address of the repository. |
| `oldMajor` | `uint8` | The old major version. |
| `newMajor` | `uint8` | The new major version. |
| `build` | `uint16` | The build number. |
| `metadata` | `bytes` | The metadata associated with the upgrade. |

*Event emitted when source repository is upgraded to a new major version.*
### external function addDistribution

```solidity
function addDistribution(struct IVInstaller.Distribution config, bytes32 metadata) external 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `config` | `struct IVInstaller.Distribution` | The configuration for the source repository. |
| `metadata` | `bytes32` | The metadata associated with the source repository. |

*Adds new source repository to the installer.*
### external function removeSource

```solidity
function removeSource(contract IRepository repository) external 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `repository` | `contract IRepository` | The address of the repository. |

*Removes a repository from the installer.*
### external function installNewExact

```solidity
function installNewExact(struct Envelope installationData, struct Tag version) external returns (address) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `installationData` | `struct Envelope` | The payload for the installation. |
| `version` | `struct Tag` | The version of the repository to install. |

*Installs a new instance from the latest version of a repository.*
### external function installNewLatest

```solidity
function installNewLatest(struct Envelope installationData) external returns (address) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `installationData` | `struct Envelope` | The payload for the installation. |

*Installs a new instance from the latest version of a repository.*
### external function upgradeDistribution

```solidity
function upgradeDistribution(struct IVInstaller.Distribution newConfig, address migrationContract, bytes migrationData) external returns (address[] instances) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `newConfig` | `struct IVInstaller.Distribution` | The new configuration for the source repository. |
| `migrationContract` | `address` | The address of the migration contract. |
| `migrationData` | `bytes` | The data for the migration contract. |

*Upgrades versioned source new requirements.*
### external function getInstances

```solidity
function getInstances(contract IRepository repository) external view returns (address[]) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `repository` | `contract IRepository` | The address of the repository. |
| **Output** | |
|  `0`  | `address[]` | An array of addresses representing the instances. |

*Gets all instances created by installer for a specific repository source*
### external function getInstancesByVersion

```solidity
function getInstancesByVersion(struct VersionControl sources) external view returns (address[]) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `sources` | `struct VersionControl` | The version control for the repository. |
| **Output** | |
|  `0`  | `address[]` | An array of addresses representing the instances. |

*Gets all instances created by installer for a specific repository source*
### external function getDistributions

```solidity
function getDistributions() external view returns (struct IVInstaller.Distribution[]) 
```

| Output | Type | Description |
| ------ | ---- | ----------- |
|  `0`  | `struct IVInstaller.Distribution[]` | An array of addresses representing the repositories. |

*Gets all distributions added to the installer.*
### external function getDistributor

```solidity
function getDistributor(contract IRepository instance) external view returns (struct IVInstaller.Distribution) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `instance` | `contract IRepository` | The address of the instance. |
| **Output** | |
|  `0`  | `struct IVInstaller.Distribution` | The address of the repository. |

*Gets the repository associated with a specific instance.*
### external function getVersion

```solidity
function getVersion(address instance) external view returns (struct Tag) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `instance` | `address` | The address of the instance. |
| **Output** | |
|  `0`  | `struct Tag` | The version of the instance. |

*Gets the version of a specific instance.*
### external function getDistribution

```solidity
function getDistribution(contract IRepository repository) external view returns (struct IVInstaller.Distribution) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `repository` | `contract IRepository` | The address of the repository. |
| **Output** | |
|  `0`  | `struct IVInstaller.Distribution` | The installation plan for the repository. |

*Gets the installation plan for a specific repository.*
<!--CONTRACT_END-->

