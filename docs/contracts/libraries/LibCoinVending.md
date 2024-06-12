
# 
## Description

This library is used to simulate the vending machine coin acceptor state machine that:
 - Supports large number of positions; Each represents requirements to acess different goods of the virtual vending machine.
 - Accepts multiple assets of following types: Native (Eth), ERC20, ERC721, and ERC1155 tokens that can be stacked together.
 - Allows for each individual asset action promise can be one of following:
     - Lock: The asset is locked in the acceptor with promise that asset will be returned to the sender at release funds time.
     - Bet: The asset is locked in the acceptor with promise that asset will be awarded to benificiary at release funds time.
     - Pay: The asset is locked in the acceptor with promise that asset will be paid to payee at release funds time.
     - Burn: The asset is locked in the acceptor with promise that asset will be destroyed at release funds time.
 - Maintains each position balance, hence allowing multiple participants to line up for the same position.
 - Allows three actions:
     - Fund position with assets
     - Refund assets to user
     - Consume assets and provide goods to user
     - Consuming asset might take a form of
     - Transferring assets to payee
     - Burning assets
     - Awarding beneficiary with assets
     - Returning locked assets back to sender

This library DOES enforces that any position can only be refunded or processed only within amount funded boundaries
This library DOES NOT store the addresses of senders, nor benificiaries, nor payees.
This is to be stored within implementation contract.

 !!!!! IMPORTANT !!!!!
This library does NOT invocates reentrancy guards. It is implementation contract's responsibility to enforce reentrancy guards.
Reentrancy guards MUST be implemented in an implementing contract.

 Usage:

 0. Configure position via configure(...)
 1. fund position with assets via fund(...)
 2. release or refund assets via release(...) or refund(...)
 3. repeat steps 1 and 2 as needed.
 Position can be recofigured at any time when it's effective balance is zero: `timesFunded - timesRefuned - timesReleased = 0`

Test state:
This library most functionality has been tested: see ../tests/LibCoinVending.ts and ../tests/report.md for details.

ERC721 token is checked only for "HAVE" condition since putting requirements on non fungable token id yet to be resolved.
(see ERC721 section in the code below)

This library has not been yet audited

## Implementation

### public struct Condition

```solidity
struct Condition {
  mapping(enum LibCoinVending.ContractTypes => mapping(address => mapping(uint256 => struct LibCoinVending.ContractCondition))) contracts;
  struct LibCoinVending.NumericCondition ethValues;
  uint256 timesRefunded;
  uint256 timesReleased;
  uint256 timesFunded;
  enum LibCoinVending.ContractTypes[] contractTypes;
  address[] contractAddresses;
  uint256[] contractIds;
  bool _isConfigured;
}
```
###  enum RequirementTypes

```solidity
enum RequirementTypes {
  HAVE,
  LOCK,
  BURN,
  BET,
  PAY
}
```
### public struct TransactionProperties

```solidity
struct TransactionProperties {
  bytes data;
  uint256 amount;
}
```
### public struct ContractCondition

```solidity
struct ContractCondition {
  struct LibCoinVending.TransactionProperties have;
  struct LibCoinVending.TransactionProperties lock;
  struct LibCoinVending.TransactionProperties burn;
  struct LibCoinVending.TransactionProperties pay;
  struct LibCoinVending.TransactionProperties bet;
}
```
### public struct NumericCondition

```solidity
struct NumericCondition {
  uint256 have;
  uint256 lock;
  uint256 burn;
  uint256 pay;
  uint256 bet;
}
```
###  enum TransferTypes

```solidity
enum TransferTypes {
  FUND,
  REFUND,
  RELEASE
}
```
### public struct ConditionReturn

```solidity
struct ConditionReturn {
  struct LibCoinVending.NumericCondition ethValues;
  uint256 timesRefunded;
  uint256 timesReleased;
  uint256 timesFunded;
  address[] contractAddresses;
  uint256[] contractIds;
  enum LibCoinVending.ContractTypes[] contractTypes;
  bool _isConfigured;
}
```
### public struct configSmartRequirement

```solidity
struct configSmartRequirement {
  address contractAddress;
  uint256 contractId;
  enum LibCoinVending.ContractTypes contractType;
  struct LibCoinVending.ContractCondition contractRequirement;
}
```
### public struct ConfigPosition

```solidity
struct ConfigPosition {
  struct LibCoinVending.NumericCondition ethValues;
  struct LibCoinVending.configSmartRequirement[] contracts;
}
```
### public struct LibCoinVendingStorage

```solidity
struct LibCoinVendingStorage {
  mapping(bytes32 => struct LibCoinVending.Condition) positions;
  address beneficiary;
}
```
###  enum ContractTypes

```solidity
enum ContractTypes {
  ERC20,
  ERC1155,
  ERC721
}
```
### internal variable COIN_VENDING_STORAGE_POSITION

```solidity
bytes32 COIN_VENDING_STORAGE_POSITION 
```

### internal function coinVendingPosition

```solidity
function coinVendingPosition(bytes32 position) internal view returns (struct LibCoinVending.Condition) 
```

### internal function coinVendingStorage

```solidity
function coinVendingStorage() internal pure returns (struct LibCoinVending.LibCoinVendingStorage es) 
```

### internal function refund

```solidity
function refund(bytes32 position, address to) internal 
```

*Returns all position requirements back to fundee. `position` is the identifier of the condition. `to` is the address to refund the balance to.

Requirements:

- The sum of `timesRefunded` and `timesReleased` for the condition must be less than `timesFunded`.

Modifies:

- Transfers the remaining balance of the condition to the `to` address.
- Increments the `timesRefunded` counter for the condition.*
### internal function batchRefund

```solidity
function batchRefund(bytes32 position, address[] returnAddresses) internal 
```

*Returns all position requirements back to multiple fundees. `position` is the identifier of the condition. `returnAddresses` is an array of addresses to refund the balance to.

Requirements:

- The sum of `timesRefunded` and `timesReleased` for the condition must be less than `timesFunded`.

Modifies:

- Transfers the remaining balance of the condition to each address in `returnAddresses`.
- Increments the `timesRefunded` counter for the condition for each address in `returnAddresses`.*
### internal function release

```solidity
function release(bytes32 position, address payee, address beneficiary, address returnAddress) internal 
```

*Releases the funds from a coin vending position to the specified addresses. `position` is the identifier of the condition. `payee`, `beneficiary`, and `returnAddress` are the addresses to release the funds to.

Requirements:

- The sum of `timesRefunded` and `timesReleased` for the condition must be less than `timesFunded`.

Modifies:

- Transfers the remaining balance of the condition to the `payee`, `beneficiary`, and `returnAddress`.
- Increments the `timesReleased` counter for the condition.*
### internal function batchRelease

```solidity
function batchRelease(bytes32 position, address payee, address beneficiary, address[] returnAddresses) internal 
```

*Releases the funds from a coin vending position to multiple return addresses. `position` is the identifier of the condition. `payee`, `beneficiary`, and `returnAddresses` are the addresses to release the funds to.

Requirements:

- The sum of `timesRefunded` and `timesReleased` for the condition must be less than `timesFunded`.

Modifies:

- Transfers the remaining balance of the condition to the `payee`, `beneficiary`, and each address in `returnAddresses`.
- Increments the `timesReleased` counter for the condition for each address in `returnAddresses`.*
### internal function fund

```solidity
function fund(bytes32 position) internal 
```

*Funds the position by `msg.sender`. `position` is the identifier of the condition.

Requirements:

- The condition must be configured.

Modifies:

- Transfers the funds from `msg.sender` to this contract.
- Increments the `timesFunded` counter for the condition.*
### internal function configure

```solidity
function configure(bytes32 position, struct LibCoinVending.ConfigPosition configuration) internal 
```

*Configures the position. `position` is the identifier of the condition. `configuration` is the new configuration for the condition.

Requirements:

- The condition must not have a positive balance.

Modifies:

- Sets the configuration of the condition to `configuration`.*
### internal function getPosition

```solidity
function getPosition(bytes32 position) internal view returns (struct LibCoinVending.ConditionReturn) 
```

*Returns the condition associated with the given position. `position` is the identifier of the condition.

Returns:

- The condition associated with `position`.*
### internal function getPositionByContract

```solidity
function getPositionByContract(bytes32 position, address contractAddress, uint256 contractId, enum LibCoinVending.ContractTypes contractType) internal view returns (struct LibCoinVending.ContractCondition) 
```

*Returns the contract condition associated with the given position, contract address, contract ID, and contract type. `position` is the identifier of the condition. `contractAddress` is the address of the contract. `contractId` is the ID of the contract. `contractType` is the type of the contract.

Returns:

- The contract condition associated with `position`, `contractAddress`, `contractId`, and `contractType`.*
<!--CONTRACT_END-->

