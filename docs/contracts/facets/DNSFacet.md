
# 
## Description

## Implementation

### internal function _isValidSignature

```solidity
function _isValidSignature(bytes message, bytes signature, address account) internal view returns (bool) 
```

### public function initializeDomain

```solidity
function initializeDomain(address registrar, uint256 freeRegistrationsNumber, uint256 fee, bytes32 domainName, uint256 referrerReward, uint256 referralDiscount) public 
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
### public function activateDomain

```solidity
function activateDomain(bytes32 domainName) public 
```

*Activates LibMultipass.Domain name

Requirements:
 msg.sender is Owner

 Emits an {DomainActivated} event.*
### public function deactivateDomain

```solidity
function deactivateDomain(bytes32 domainName) public 
```

*Deactivates LibMultipass.Domain name

Deactivated LibMultipass.Domain cannot mutate names and will return zeros

Requirements:
 msg.sender is Owner OR registrar

 Emits an {DomainDeactivated} event.*
### public function changeFee

```solidity
function changeFee(bytes32 domainName, uint256 fee) public 
```

*Changes registrar address

Requirements:
 msg.sender is Owner

 Emits an {DomainFeeChanged} event.*
### public function changeRegistrar

```solidity
function changeRegistrar(bytes32 domainName, address newRegistrar) public 
```

*Changes registrar address

Requirements:
 msg.sender is Owner

 Emits an {RegistrarChangeRequested} event.*
### public function deleteName

```solidity
function deleteName(struct LibMultipass.NameQuery query) public 
```

*deletes name

Requirements:
 msg.sender is Owner

 Emits an {DomainTTLChangeRequested} event.*
### public function changeReferralProgram

```solidity
function changeReferralProgram(uint256 referrerReward, uint256 freeRegistrations, uint256 referralDiscount, bytes32 domainName) public 
```

### public function resolveRecord

```solidity
function resolveRecord(struct LibMultipass.NameQuery query) public view returns (bool, struct LibMultipass.Record) 
```

*resolves LibMultipass.Record of name query in to status and identity*
### public function register

```solidity
function register(struct LibMultipass.Record newRecord, bytes32 domainName, bytes registrarSignature, uint256 signatureDeadline, struct LibMultipass.NameQuery referrer, bytes referralCode) public payable 
```

*registers new name under LibMultipass.Domain

Requirements:
 all arguments must be set
 domainName must be active
resolveRecord for given arguments should return no LibMultipass.Record

 Emits an {registered} event.*
### public function getModifyPrice

```solidity
function getModifyPrice(struct LibMultipass.NameQuery query) public view returns (uint256) 
```

### public function modifyUserName

```solidity
function modifyUserName(bytes32 domainName, struct LibMultipass.NameQuery query, bytes32 newName, bytes registrarSignature, uint256 signatureDeadline) public payable 
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
### external function getDomainStateByIdx

```solidity
function getDomainStateByIdx(uint256 index) external view returns (struct LibMultipass.Domain) 
```

### external function getContractState

```solidity
function getContractState() external view returns (uint256) 
```

| Output | Type | Description |
| ------ | ---- | ----------- |
|  `0`  | `uint256` | (s_numDomains) |

*returns contract state variables*
### public function withrawFunds

```solidity
function withrawFunds(address to) public 
```

*Withraws funds stored in smart contract

Requirements:
 onlyOwner

 Emits an {fundsWithdawn} event.*
<!--CONTRACT_END-->

