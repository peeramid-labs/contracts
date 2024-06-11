# Solidity API

## DNSFacet

### _isValidSignature

```solidity
function _isValidSignature(bytes message, bytes signature, address account) internal view returns (bool)
```

### initializeDomain

```solidity
function initializeDomain(address registrar, uint256 freeRegistrationsNumber, uint256 fee, bytes32 domainName, uint256 referrerReward, uint256 referralDiscount) public
```

_Initializes new LibMultipass.Domain and configures it's parameters

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

 Emits an {InitializedDomain} event._

### activateDomain

```solidity
function activateDomain(bytes32 domainName) public
```

_Activates LibMultipass.Domain name

Requirements:
 msg.sender is Owner

 Emits an {DomainActivated} event._

### deactivateDomain

```solidity
function deactivateDomain(bytes32 domainName) public
```

_Deactivates LibMultipass.Domain name

Deactivated LibMultipass.Domain cannot mutate names and will return zeros

Requirements:
 msg.sender is Owner OR registrar

 Emits an {DomainDeactivated} event._

### changeFee

```solidity
function changeFee(bytes32 domainName, uint256 fee) public
```

_Changes registrar address

Requirements:
 msg.sender is Owner

 Emits an {DomainFeeChanged} event._

### changeRegistrar

```solidity
function changeRegistrar(bytes32 domainName, address newRegistrar) public
```

_Changes registrar address

Requirements:
 msg.sender is Owner

 Emits an {RegistrarChangeRequested} event._

### deleteName

```solidity
function deleteName(struct LibMultipass.NameQuery query) public
```

_deletes name

Requirements:
 msg.sender is Owner

 Emits an {DomainTTLChangeRequested} event._

### changeReferralProgram

```solidity
function changeReferralProgram(uint256 referrerReward, uint256 freeRegistrations, uint256 referralDiscount, bytes32 domainName) public
```

### resolveRecord

```solidity
function resolveRecord(struct LibMultipass.NameQuery query) public view returns (bool, struct LibMultipass.Record)
```

_resolves LibMultipass.Record of name query in to status and identity_

### register

```solidity
function register(struct LibMultipass.Record newRecord, bytes32 domainName, bytes registrarSignature, uint256 signatureDeadline, struct LibMultipass.NameQuery referrer, bytes referralCode) public payable
```

_registers new name under LibMultipass.Domain

Requirements:
 all arguments must be set
 domainName must be active
resolveRecord for given arguments should return no LibMultipass.Record

 Emits an {registered} event._

### getModifyPrice

```solidity
function getModifyPrice(struct LibMultipass.NameQuery query) public view returns (uint256)
```

### modifyUserName

```solidity
function modifyUserName(bytes32 domainName, struct LibMultipass.NameQuery query, bytes32 newName, bytes registrarSignature, uint256 signatureDeadline) public payable
```

_modifies exsisting LibMultipass.Record

Requirements:
resolveRecord for given arguments should return valid LibMultipass.Record
LibMultipass.Domain must be active
newAddress and newName should be set and be unique in current LibMultipass.Domain_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| domainName | bytes32 | LibMultipass.Domain |
| query | struct LibMultipass.NameQuery |  |
| newName | bytes32 | new name  Emits an {Modified} event. |
| registrarSignature | bytes |  |
| signatureDeadline | uint256 |  |

### getBalance

```solidity
function getBalance() external view returns (uint256)
```

_returns balance of this contract_

### getDomainState

```solidity
function getDomainState(bytes32 domainName) external view returns (struct LibMultipass.Domain)
```

_returns LibMultipass.Domain state variables_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| domainName | bytes32 | name of the LibMultipass.Domain |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct LibMultipass.Domain | (name,       fee,       freeRegistrationsNumber,        referrerReward,        referralDiscount,        isActive,        registrar,        ttl,         registerSize) |

### getDomainStateByIdx

```solidity
function getDomainStateByIdx(uint256 index) external view returns (struct LibMultipass.Domain)
```

### getContractState

```solidity
function getContractState() external view returns (uint256)
```

_returns contract state variables_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | (s_numDomains) |

### withrawFunds

```solidity
function withrawFunds(address to) public
```

_Withraws funds stored in smart contract

Requirements:
 onlyOwner

 Emits an {fundsWithdawn} event._

