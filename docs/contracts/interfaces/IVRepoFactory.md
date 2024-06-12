
# IVRepoFactory
## Description

This Interface creates `IRepository contract` proxies and registers them on a `IVersionBasedRegistry` contract.
This is a modified source from Aragon X, where interface names have been changed by generalising "plugin" in to source code address".
this implies that Repository anymore will not be aware of source code implementation and initialization selectors must be passed.

## Implementation

###  event RepoCreated

```solidity
event RepoCreated(contract IRepository repo, address proxy) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `repo` | `contract IRepository` | The address of the newly created repository. |
| `proxy` | `address` | The address of the proxy contract associated with the repository. |

*Emitted when a new repository is created.*
### external function createRepo

Creates a repository proxy pointing to the implementation of IRepository

```solidity
function createRepo(string _subdomain, address _initialOwner) external returns (contract IRepository) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `_subdomain` | `string` | The repository subdomain. |
| `_initialOwner` | `address` | The maintainer address. |

### external function createRepoWithFirstVersion

Creates and registers a Repository with an ENS subdomain and publishes an initial version `1.1`.

```solidity
function createRepoWithFirstVersion(string _subdomain, address _source, address _maintainer, bytes _releaseMetadata, bytes _buildMetadata) external returns (contract IRepository repository) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `_subdomain` | `string` | The repository subdomain. |
| `_source` | `address` | contract associated with the version. |
| `_maintainer` | `address` | The maintainer of the repo. This address has permission to update metadata, upgrade the repo logic, and manage the repo permissions. |
| `_releaseMetadata` | `bytes` | The release metadata URI. |
| `_buildMetadata` | `bytes` | The build metadata URI. |

*After the creation of the and release of the first version by the factory, ownership is transferred to the `_maintainer` address.*
<!--CONTRACT_END-->

