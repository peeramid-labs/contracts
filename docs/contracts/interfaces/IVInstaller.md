# Solidity API

## VersionRequirementTypes

_Enum defining the types of version requirements for repositories.
- All: Matches any version.
- MajorVersion: Matches any version with the same major version number.
- ExactVersion: Matches the exact version specified._

```solidity
enum VersionRequirementTypes {
  All,
  MajorVersion,
  ExactVersion
}
```

## InstallationTypes

```solidity
enum InstallationTypes {
  Cloneable,
  Constructable
}
```

## VersionControl

_Struct defining a version requirement for a repository._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct VersionControl {
  address source;
  struct Tag baseVersion;
  enum VersionRequirementTypes requirementType;
}
```

## InstallationPlan

_Struct defining the installation plan for a repository._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct InstallationPlan {
  struct VersionControl requiredSource;
  bytes4[] initializerFnSelectors;
  enum InstallationTypes installationType;
}
```

## Envelope

```solidity
struct Envelope {
  address destination;
  bytes[] data;
}
```

## IVInstaller

### RepositoryIsNotAdded

```solidity
error RepositoryIsNotAdded(contract IRepository repository)
```

_Error thrown when a repository is not added to the installer._

### VersionDoesNotMatchRequirement

```solidity
error VersionDoesNotMatchRequirement(address repository, struct Tag version, struct Tag requiredTag)
```

_Error thrown when the version does not match the requirement for a repository._

### RepositoryRequirementUpdated

```solidity
event RepositoryRequirementUpdated(contract IRepository repository, struct Tag oldTag, struct Tag newTag)
```

_Event emitted when the version requirement for a repository is updated._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| repository | contract IRepository | The address of the repository. |
| oldTag | struct Tag | The old version requirement for the repository. |
| newTag | struct Tag | The new version requirement for the repository. |

### RepositoryAdded

```solidity
event RepositoryAdded(contract IRepository repository, address adder, struct VersionControl requirement, bytes32 metadata)
```

_Event emitted when a repository is added to the installer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| repository | contract IRepository | The address of the repository. |
| adder | address | The address of the account that added the repository. |
| requirement | struct VersionControl | The version requirement for the repository. |
| metadata | bytes32 | The metadata associated with the repository. |

### RepositoryRemoved

```solidity
event RepositoryRemoved(contract IRepository repository)
```

_Event emitted when a repository is removed from the installer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| repository | contract IRepository | The address of the repository. |

### Instantiated

```solidity
event Instantiated(address newInstance, contract IRepository repository, address instantiator, struct Tag version, bytes metadata)
```

_Event emitted when a new instance is instantiated from a repository._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newInstance | address | The address of the new instance. |
| repository | contract IRepository | The address of the repository. |
| instantiator | address | The address of the account that instantiated the instance. |
| version | struct Tag | The version of the repository used for instantiation. |
| metadata | bytes | The metadata associated with the instance. |

### UpgradedMinor

```solidity
event UpgradedMinor(contract IRepository repository, uint16 oldMinor, uint16 newMinor, uint8 build, bytes metadata)
```

_Event emitted when source repository is upgraded to a new minor version._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| repository | contract IRepository | The address of the repository. |
| oldMinor | uint16 | The old minor version. |
| newMinor | uint16 | The new minor version. |
| build | uint8 | The build number. |
| metadata | bytes | The metadata associated with the upgrade. |

### UpgradedMajor

```solidity
event UpgradedMajor(contract IRepository repository, uint8 oldMajor, uint8 newMajor, uint16 build, bytes metadata)
```

_Event emitted when source repository is upgraded to a new major version._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| repository | contract IRepository | The address of the repository. |
| oldMajor | uint8 | The old major version. |
| newMajor | uint8 | The new major version. |
| build | uint16 | The build number. |
| metadata | bytes | The metadata associated with the upgrade. |

### addSource

```solidity
function addSource(struct VersionControl versionedSource, struct InstallationPlan config, bytes32 metadata) external
```

_Adds new source repository to the installer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| versionedSource | struct VersionControl | The version of the source repository. |
| config | struct InstallationPlan | The configuration for the source repository. |
| metadata | bytes32 | The metadata associated with the source repository. |

### removeSource

```solidity
function removeSource(contract IRepository repository) external
```

_Removes a repository from the installer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| repository | contract IRepository | The address of the repository. |

### installNewExact

```solidity
function installNewExact(struct Envelope installationData, struct Tag version) external returns (address)
```

_Installs a new instance from the latest version of a repository._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| installationData | struct Envelope | The payload for the installation. |
| version | struct Tag | The version of the repository to install. |

### installNewLatest

```solidity
function installNewLatest(struct Envelope installationData) external returns (address)
```

_Installs a new instance from the latest version of a repository._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| installationData | struct Envelope | The payload for the installation. |

### upgradeSource

```solidity
function upgradeSource(struct InstallationPlan newConfig, address migrationContract, bytes migrationData) external returns (address[] instances)
```

_Upgrades versioned source new requirements._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newConfig | struct InstallationPlan | The new configuration for the source repository. |
| migrationContract | address | The address of the migration contract. |
| migrationData | bytes | The data for the migration contract. |

### getInstances

```solidity
function getInstances(contract IRepository repository) external view returns (address[])
```

_Gets all instances created by installer for a specific repository source_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| repository | contract IRepository | The address of the repository. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address[] | An array of addresses representing the instances. |

### getInstancesByVersion

```solidity
function getInstancesByVersion(struct VersionControl sources) external view returns (address[])
```

_Gets all instances created by installer for a specific repository source_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sources | struct VersionControl | The version control for the repository. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address[] | An array of addresses representing the instances. |

### getRepositories

```solidity
function getRepositories() external view returns (address[])
```

_Gets all repositories added to the installer._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address[] | An array of addresses representing the repositories. |

### getRepository

```solidity
function getRepository(contract IRepository instance) external view returns (address)
```

_Gets the repository associated with a specific instance._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| instance | contract IRepository | The address of the instance. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The address of the repository. |

### getVersion

```solidity
function getVersion(address instance) external view returns (struct Tag)
```

_Gets the version of a specific instance._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| instance | address | The address of the instance. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Tag | The version of the instance. |

### getVersionControl

```solidity
function getVersionControl(address instance) external view returns (struct VersionControl)
```

_Gets the version requirement for a specific instance._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| instance | address | The address of the instance. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct VersionControl | The version requirement for the instance. |

### getInstallationPlan

```solidity
function getInstallationPlan(contract IRepository repository) external view returns (struct InstallationPlan)
```

_Gets the installation plan for a specific repository._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| repository | contract IRepository | The address of the repository. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct InstallationPlan | The installation plan for the repository. |

