# Solidity API

## IRepository

The interface required for a repository.
This is a modified source from Aragon X, where interface names have been changed by generalising "plugin" in to source code address".
Implication of this is that this contract will not be aware of any setup code as opposed in original Aragon implementation which relied on having IPluginSetup requirements
This means that it is thought to be consumed by a factory contract, that will act as "Installer" and use reposiories for solo purpose of code lookup.
I think this is a good change as it makes the interface more generic and reusable for any kind of contract code, not just OSx specific.
TBD - I think that major release versions should include migration contract and call signatures, but this would breaking interfaces reliant on "Tag" structure.

### VersionHashDoesNotExist

```solidity
error VersionHashDoesNotExist(bytes32 versionHash)
```

Thrown if a version does not exist.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| versionHash | bytes32 | The tag hash. |

### ReleaseZeroNotAllowed

```solidity
error ReleaseZeroNotAllowed()
```

Thrown if a release number is zero.

### InvalidReleaseIncrement

```solidity
error InvalidReleaseIncrement(uint8 latestRelease, uint8 newRelease)
```

Thrown if a release number is incremented by more than one.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| latestRelease | uint8 | The latest release number. |
| newRelease | uint8 | The new release number. |

### AlreadyInPreviousRelease

```solidity
error AlreadyInPreviousRelease(uint8 release, uint16 build, address source)
```

Thrown if the same contract exists already in a previous releases.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| release | uint8 | The release number of the already existing source. |
| build | uint16 | The build number of the already existing source. |
| source | address | The  contract address. |

### EmptyReleaseMetadata

```solidity
error EmptyReleaseMetadata()
```

Thrown if the metadata URI is empty.

### ReleaseDoesNotExist

```solidity
error ReleaseDoesNotExist()
```

Thrown if release does not exist.

### updateReleaseMetadata

```solidity
function updateReleaseMetadata(uint8 release, bytes releaseMetadata) external
```

Updates the metadata for release with content `@fromHex(releaseMetadata)`.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| release | uint8 | The release number. |
| releaseMetadata | bytes | The release metadata URI. |

### createVersion

```solidity
function createVersion(uint8 release, address source, bytes buildMetadata, bytes releaseMetadata) external
```

Creates a new version as the latest build for an existing release number or the first build for a new release number for the provided `source` contract address and metadata.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| release | uint8 | The release number. |
| source | address | The address of the source code. |
| buildMetadata | bytes | The build metadata URI. |
| releaseMetadata | bytes | The release metadata URI. |

### VersionCreated

```solidity
event VersionCreated(uint8 release, uint16 build, address source, bytes buildMetadata)
```

Emitted if the same source exists in previous releases.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| release | uint8 | The release number. |
| build | uint16 | The build number. |
| source | address | The address of the source code. |
| buildMetadata | bytes | The build metadata URI. |

### ReleaseMetadataUpdated

```solidity
event ReleaseMetadataUpdated(uint8 release, bytes releaseMetadata)
```

Emitted when a release's metadata was updated.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| release | uint8 | The release number. |
| releaseMetadata | bytes | The release metadata URI. |

### buildCount

```solidity
function buildCount(uint8 release) external view returns (uint256)
```

Gets the total number of builds for a given release number.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| release | uint8 | The release number. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of builds of this release. |

### getVersion

```solidity
function getVersion(bytes32 tagHash) external view returns (struct Version)
```

Returns the version for a tag hash.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tagHash | bytes32 | The tag hash. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Version | The version associated with a tag hash. |

### getVersion

```solidity
function getVersion(struct Tag tag) external view returns (struct Version)
```

Returns the version associated with a tag.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tag | struct Tag | The version tag. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Version | The version associated with the tag. |

### getLatestVersion

```solidity
function getLatestVersion(address source) external view returns (struct Version)
```

Returns the latest version for a given source.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| source | address | The source address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Version | The latest version associated with the source. |

### getLatestVersion

```solidity
function getLatestVersion(uint8 release) external view returns (struct Version)
```

Returns the latest version for a given release number.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| release | uint8 | The release number. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Version | The latest version of this release. |

### latestRelease

```solidity
function latestRelease() external view returns (uint8)
```

Returns the latest version for a given release number.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint8 | The latest version of this repository. |

