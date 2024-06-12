
# 
## Description

## Implementation

### external function resolveRecord

```solidity
function resolveRecord(struct LibMultipass.NameQuery query) external view returns (bool, struct LibMultipass.Record) 
```

### external function initializeDomain

```solidity
function initializeDomain(address registrar, uint256 freeRegistrationsNumber, uint256 fee, bytes32 domainName, uint256 referrerReward, uint256 referralDiscount) external 
```

*Initializes new LibMultipass.Domain and configures it's parameters

Requirements:
 registrar is not zero
 domainName is not empty
 domainIndex is either zero(auto assign) or can be one of preoccupied LibMultipass.Domain names
 domainName does not exist yet
 onlyOwner
 referrerReward+referralDiscount cannot be larger than fee
 @param registrar address of registrar
 @param freeRegistrationsNumber number of registrations free of fee
 @param fee fee in base currency of network
 @param domainName name of LibMultipass.Domain
 @param referrerReward referral fee share in base currency of network
 @param referralDiscount referral discount in base currency of network

 Emits an {InitializedDomain} event.*
### external function activateDomain

```solidity
function activateDomain(bytes32 domainName) external 
```

*Activates LibMultipass.Domain name

Requirements:
 msg.sender is Owner

 Emits an {DomainActivated} event.*
### external function deactivateDomain

```solidity
function deactivateDomain(bytes32 domainName) external 
```

*Deactivates LibMultipass.Domain name

Deactivated LibMultipass.Domain cannot mutate names and will return zeros

Requirements:
 msg.sender is Owner OR registrar

 Emits an {DomainDeactivated} event.*
### external function changeFee

```solidity
function changeFee(bytes32 domainName, uint256 fee) external 
```

*Changes registrar address

Requirements:
 msg.sender is Owner

 Emits an {DomainFeeChanged} event.*
### external function changeRegistrar

```solidity
function changeRegistrar(bytes32 domainName, address newRegistrar) external 
```

*Changes registrar address

Requirements:
 msg.sender is Owner

 Emits an {RegistrarChangeRequested} event.*
### external function deleteName

```solidity
function deleteName(struct LibMultipass.NameQuery query) external 
```

*deletes name

Requirements:
 msg.sender is Owner

 Emits an {DomainTTLChangeRequested} event.*
### external function changeReferralProgram

```solidity
function changeReferralProgram(uint256 referrerFeeShare, uint256 referralDiscount, uint256 freeRegistrations, bytes32 domainName) external 
```

*executes all pending changes to LibMultipass.Domain that fulfill TTL

Requirements:
 domainName must be set
 referrerFeeShare+referralDiscount cannot be larger than 2^32

 Emits an {ReferralProgramChangeRequested} event.*
### external function register

```solidity
function register(struct LibMultipass.Record newRecord, bytes32 domainName, bytes registrarSignature, uint256 signatureDeadline, struct LibMultipass.NameQuery referrer, bytes referralCode) external payable 
```

*registers new name under LibMultipass.Domain

Requirements:
 all arguments must be set
 domainName must be active
resolveRecord for given arguments should return no LibMultipass.Record

 Emits an {registered} event.*
### external function modifyUserName

```solidity
function modifyUserName(bytes32 domainName, struct LibMultipass.NameQuery query, bytes32 newName, bytes registrarSignature, uint256 signatureDeadline) external payable 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `domainName` | `bytes32` | LibMultipass.Domain |
| `query` | `struct LibMultipass.NameQuery` |  |
| `newName` | `bytes32` | new name  Emits an {Modified} event. |
| `registrarSignature` | `bytes` |  |
| `signatureDeadline` | `uint256` |  |

*modifies exsisting LibMultipass.Record

Requirements:
resolveRecord for given arguments should return valid LibMultipass.Record
LibMultipass.Domain must be active
newAddress and newName should be set and be unique in current LibMultipass.Domain*
### external function getBalance

```solidity
function getBalance() external view returns (uint256) 
```

*returns balance of this contract*
### external function getDomainState

```solidity
function getDomainState(bytes32 domainName) external view returns (struct LibMultipass.Domain) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `domainName` | `bytes32` | name of the LibMultipass.Domain |
| **Output** | |
|  `0`  | `struct LibMultipass.Domain` | (name,       fee,       freeRegistrationsNumber,        referrerReward,        referralDiscount,        isActive,        registrar,        ttl,         registerSize) |

*returns LibMultipass.Domain state variables*
### external function getContractState

```solidity
function getContractState() external view returns (uint256) 
```

| Output | Type | Description |
| ------ | ---- | ----------- |
|  `0`  | `uint256` | (s_numDomains) |

*returns contract state variables*
### external function withrawFunds

```solidity
function withrawFunds(address to) external 
```

*Withraws funds stored in smart contract

Requirements:
 onlyOwner

 Emits an {fundsWithdawn} event.*
### external function getModifyPrice

```solidity
function getModifyPrice(struct LibMultipass.NameQuery query) external view returns (uint256) 
```

###  event fundsWithdawn

```solidity
event fundsWithdawn(uint256 amount, address account) 
```

###  event InitializedDomain

```solidity
event InitializedDomain(address registrar, uint256 freeRegistrationsNumber, uint256 fee, bytes32 domainName, uint256 referrerReward, uint256 referralDiscount) 
```

###  event DomainActivated

```solidity
event DomainActivated(bytes32 domainName) 
```

###  event DomainDeactivated

```solidity
event DomainDeactivated(bytes32 domainName) 
```

###  event DomainFeeChanged

```solidity
event DomainFeeChanged(bytes32 domainName, uint256 newFee) 
```

###  event FreeRegistrationsChanged

```solidity
event FreeRegistrationsChanged(uint256 domainIndex, uint256 newAmount) 
```

###  event RegistrarChangeRequested

```solidity
event RegistrarChangeRequested(bytes32 domainName, address registrar) 
```

###  event DomainNameChangeRequested

```solidity
event DomainNameChangeRequested(uint256 domainIndex, bytes32 NewDomainName) 
```

###  event nameDeleted

```solidity
event nameDeleted(bytes32 domainName, address wallet, bytes32 id, bytes32 name) 
```

###  event DomainTTLChangeRequested

```solidity
event DomainTTLChangeRequested(bytes32 domainName, uint256 amount) 
```

###  event ReferralProgramChanged

```solidity
event ReferralProgramChanged(bytes32 domainName, uint256 reward, uint256 discount, uint256 freeNumber) 
```

###  event DomainChangesAreLive

```solidity
event DomainChangesAreLive(bytes32 domainName, bytes32[] changes) 
```

###  event changesQeueCanceled

```solidity
event changesQeueCanceled(bytes32 domainName, bytes32[] changes) 
```

###  event Registered

```solidity
event Registered(bytes32 domainName, struct LibMultipass.Record NewRecord) 
```

###  event Referred

```solidity
event Referred(struct LibMultipass.Record refferrer, struct LibMultipass.Record newRecord, bytes32 domainName) 
```

###  event UserRecordModified

```solidity
event UserRecordModified(struct LibMultipass.Record newRecord, bytes32 oldName, bytes32 domainName) 
```

<!--CONTRACT_END-->

