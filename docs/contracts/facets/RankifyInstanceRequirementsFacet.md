
# 
## Description

## Implementation

###  event RequirementsConfigured

```solidity
event RequirementsConfigured(uint256 gameId, struct LibCoinVending.ConfigPosition config) 
```

### public function setJoinRequirements

```solidity
function setJoinRequirements(uint256 gameId, struct LibCoinVending.ConfigPosition config) public 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `gameId` | `uint256` | The ID of the game. |
| `config` | `struct LibCoinVending.ConfigPosition` | The configuration position for the join requirements. |

*Sets the join requirements for a specific game.
Only the game creator can call this function.
The game must be in the pre-registration stage.*
### public function getJoinRequirements

```solidity
function getJoinRequirements(uint256 gameId) public view returns (struct LibCoinVending.ConditionReturn) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `gameId` | `uint256` | The ID of the game. |
| **Output** | |
|  `0`  | `struct LibCoinVending.ConditionReturn` | The join requirements as a `LibCoinVending.ConditionReturn` struct. |

*Retrieves the join requirements for a specific game.*
### public function getJoinRequirementsByToken

```solidity
function getJoinRequirementsByToken(uint256 gameId, address contractAddress, uint256 contractId, enum LibCoinVending.ContractTypes contractType) public view returns (struct LibCoinVending.ContractCondition) 
```

| Input | Type | Description |
|:----- | ---- | ----------- |
| `gameId` | `uint256` | The ID of the game. |
| `contractAddress` | `address` | The address of the contract. |
| `contractId` | `uint256` | The ID of the contract. |
| `contractType` | `enum LibCoinVending.ContractTypes` | The type of the contract. |
| **Output** | |
|  `0`  | `struct LibCoinVending.ContractCondition` | The join requirements for the specified token. |

*Retrieves the join requirements for a specific token in a game.*
<!--CONTRACT_END-->

