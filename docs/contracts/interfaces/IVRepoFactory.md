# Solidity API

## IVRepoFactory

This Interface creates `IRepository contract` proxies and registers them on a `IVersionBasedRegistry` contract.
This is a modified source from Aragon X, where interface names have been changed by generalising "plugin" in to source code address".
this implies that Repository anymore will not be aware of source code implementation and initialization selectors must be passed.

### RepoCreated

```solidity
event RepoCreated(contract IRepository repo, address proxy)
```

_Emitted when a new repository is created._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| repo | contract IRepository | The address of the newly created repository. |
| proxy | address | The address of the proxy contract associated with the repository. |

### createRepo

```solidity
function createRepo(string _subdomain, address _initialOwner) external returns (contract IRepository)
```

Creates a repository proxy pointing to the implementation of IRepository

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _subdomain | string | The repository subdomain. |
| _initialOwner | address | The maintainer address. |

### createRepoWithFirstVersion

```solidity
function createRepoWithFirstVersion(string _subdomain, address _source, address _maintainer, bytes _releaseMetadata, bytes _buildMetadata) external returns (contract IRepository repository)
```

Creates and registers a Repository with an ENS subdomain and publishes an initial version `1.1`.

_After the creation of the and release of the first version by the factory, ownership is transferred to the `_maintainer` address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _subdomain | string | The repository subdomain. |
| _source | address | contract associated with the version. |
| _maintainer | address | The maintainer of the repo. This address has permission to update metadata, upgrade the repo logic, and manage the repo permissions. |
| _releaseMetadata | bytes | The release metadata URI. |
| _buildMetadata | bytes | The build metadata URI. |

