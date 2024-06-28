
# 
## Description

## Implementation

### public struct NameQuery

| Input | Type | Description |
|:----- | ---- | ----------- |

*resolves user from any given argument
Requirements:
 domainName must be given and must be initialized
 id OR username OR address must be given
This method first tries to resolve by address, then by user id and finally by username*

```solidity
struct NameQuery {
  bytes32 domainName;
  address wallet;
  bytes32 name;
  bytes32 id;
  bytes32 targetDomain;
}
```
### public struct Domain

| Input | Type | Description |
|:----- | ---- | ----------- |

*The domain name of the registrar.*

```solidity
struct Domain {
  bytes32 name;
  uint256 fee;
  uint256 freeRegistrationsNumber;
  uint256 referrerReward;
  uint256 referralDiscount;
  bool isActive;
  address registrar;
  uint24 ttl;
  uint256 registerSize;
}
```
### public struct Record

```solidity
struct Record {
  address wallet;
  bytes32 name;
  bytes32 id;
  uint96 nonce;
  bytes32 domainName;
}
```
### internal variable MULTIPASS_STORAGE_POSITION

```solidity
bytes32 MULTIPASS_STORAGE_POSITION 
```

### public struct DomainNameService

| Input | Type | Description |
|:----- | ---- | ----------- |

*The domain name of the registrar.*

```solidity
struct DomainNameService {
  struct LibMultipass.Domain properties;
  mapping(bytes32 => address) idToAddress;
  mapping(bytes32 => uint96) nonce;
  mapping(address => bytes32) addressToId;
  mapping(bytes32 => bytes32) nameToId;
  mapping(bytes32 => bytes32) idToName;
}
```
### public struct MultipassStorageStruct

```solidity
struct MultipassStorageStruct {
  mapping(uint256 => struct LibMultipass.DomainNameService) domains;
  mapping(bytes32 => uint256) domainNameToIndex;
  uint256 numDomains;
}
```
### internal function MultipassStorage

```solidity
function MultipassStorage() internal pure returns (struct LibMultipass.MultipassStorageStruct es) 
```

### internal variable _TYPEHASH

```solidity
bytes32 _TYPEHASH 
```

### internal variable _TYPEHASH_REFERRAL

```solidity
bytes32 _TYPEHASH_REFERRAL 
```

### internal function _checkStringFits32b

```solidity
function _checkStringFits32b(string value) internal pure returns (bool) 
```

### internal function _checkNotEmpty

```solidity
function _checkNotEmpty(bytes32 value) internal pure returns (bool) 
```

### internal function resolveDomainIndex

```solidity
function resolveDomainIndex(bytes32 domainName) internal view returns (uint256) 
```

### internal function _getDomainStorage

```solidity
function _getDomainStorage(bytes32 domainName) internal view returns (struct LibMultipass.DomainNameService) 
```

### internal function _initializeDomain

```solidity
function _initializeDomain(address registrar, uint256 freeRegistrationsNumber, uint256 fee, bytes32 domainName, uint256 referrerReward, uint256 referralDiscount) internal 
```

### internal function _getModifyPrice

```solidity
function _getModifyPrice(struct LibMultipass.Record userRecord) internal view returns (uint256) 
```

### internal function resolveRecord

```solidity
function resolveRecord(struct LibMultipass.NameQuery query) internal view returns (bool, struct LibMultipass.Record) 
```

*resolves Record of name query in to status and identity*
### internal function _setRecord

```solidity
function _setRecord(struct LibMultipass.DomainNameService domain, struct LibMultipass.Record record) internal 
```

*this function bears no security checks, it will ignore nonce in arg and will increment
  nonce value stored in domain instread*
### internal function queryFromRecord

```solidity
function queryFromRecord(struct LibMultipass.Record _record, bytes32 _domainName) internal pure returns (struct LibMultipass.NameQuery) 
```

### internal function shouldRegisterForFree

```solidity
function shouldRegisterForFree(struct LibMultipass.DomainNameService domain) internal view returns (bool) 
```

### internal function _registerNew

```solidity
function _registerNew(struct LibMultipass.Record newRecord, struct LibMultipass.DomainNameService domain) internal 
```

### internal function _getContractState

```solidity
function _getContractState() internal view returns (uint256) 
```

### internal function _getDomainStorageByIdx

```solidity
function _getDomainStorageByIdx(uint256 index) internal view returns (struct LibMultipass.DomainNameService) 
```

<!--CONTRACT_END-->

