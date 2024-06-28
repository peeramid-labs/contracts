
# 
## Description

## Implementation

### public variable rank

```solidity
mapping(address => uint256) rank 
```

### public variable topRank

```solidity
uint256 topRank 
```

### internal variable _levelUpThreshold

```solidity
uint256 _levelUpThreshold 
```

### internal modifier onlyRankingInstance

```solidity
modifier onlyRankingInstance() 
```

### public function constructor

```solidity
constructor(string uri_, address owner_, string cURI, uint256 levelUpThreshold, address[] components, uint256[] componentWeights) public 
```

### public function getRankingInstance

```solidity
function getRankingInstance() public view returns (address) 
```

*Gets the ranking instance which can emit new rank updates and mint rank tokens.

Returns:

- The address of the ranking instance.*
### public function contractURI

```solidity
function contractURI() public view returns (string) 
```

### public function setURI

```solidity
function setURI(string uri_) public 
```

### public function setContractURI

```solidity
function setContractURI(string uri_) public 
```

###  event Leader

```solidity
event Leader(address account, uint256 rank) 
```

### public function mint

```solidity
function mint(address to, uint256 amount, uint256 level, bytes data) public 
```

### public function updateRankingInstance

```solidity
function updateRankingInstance(address newRankingInstance) public 
```

*Updates the ranking instance. `newRankingInstance` is the address of the new ranking instance.

emits a _RankingInstanceUpdated_ event.*
### public function lock

```solidity
function lock(address account, uint256 id, uint256 amount) public 
```

### public function unlock

```solidity
function unlock(address account, uint256 id, uint256 amount) public 
```

### public function batchMint

```solidity
function batchMint(address to, uint256[] ids, uint256[] amounts, bytes data) public 
```

*Mints specified amounts of tokens to an account. `to` is the address of the account to mint the tokens to. `ids` is the array of IDs of the tokens to mint. `amounts` is the array of amounts of tokens to mint. `data` is the additional data.*
### public function levelUp

```solidity
function levelUp(address to, uint256 level, bytes data) public 
```

### public function findNewRank

```solidity
function findNewRank(address account, uint256 oldRank) public view returns (uint256) 
```

*Finds the new rank of an account. `account` is the address of the account. `oldRank` is the old rank of the account.
It checks the balance of the account and returns the new rank that can be upgraded to.

Returns:

- The new rank of the account.*
###  event RankUpdated

```solidity
event RankUpdated(address account, uint256 rank) 
```

### internal function _afterTokenTransfer

```solidity
function _afterTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal 
```

*Hook that is called after any token transfer. This includes minting
and burning, as well as batched variants.

The same hook is called on both single and batched variants. For single
transfers, the length of the `id` and `amount` arrays will be 1.

Calling conditions (for each `id` and `amount` pair):

- When `from` and `to` are both non-zero, `amount` of ``from``'s tokens
of token type `id` will be  transferred to `to`.
- When `from` is zero, `amount` tokens of token type `id` will be minted
for `to`.
- when `to` is zero, `amount` of ``from``'s tokens of token type `id`
will be burned.
- `from` and `to` are never both zero.
- `ids` and `amounts` have the same, non-zero length.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].*
### external function getAccountRank

```solidity
function getAccountRank(address account) external view returns (uint256) 
```

*Gets the rank of an account. `account` is the address of the account.

Returns:

- The rank of the account.*
### public function supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) 
```

<!--CONTRACT_END-->

