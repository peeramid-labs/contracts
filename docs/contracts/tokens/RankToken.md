# Solidity API

## RankToken

### rank

```solidity
mapping(address => uint256) rank
```

### topRank

```solidity
uint256 topRank
```

### _levelUpThreshold

```solidity
uint256 _levelUpThreshold
```

### onlyRankingInstance

```solidity
modifier onlyRankingInstance()
```

### constructor

```solidity
constructor(string uri_, address owner_, string cURI, uint256 levelUpThreshold, address[] components, uint256[] componentWeights) public
```

### getRankingInstance

```solidity
function getRankingInstance() public view returns (address)
```

_Gets the ranking instance which can emit new rank updates and mint rank tokens.

Returns:

- The address of the ranking instance._

### contractURI

```solidity
function contractURI() public view returns (string)
```

### setURI

```solidity
function setURI(string uri_) public
```

### setContractURI

```solidity
function setContractURI(string uri_) public
```

### Leader

```solidity
event Leader(address account, uint256 rank)
```

### mint

```solidity
function mint(address to, uint256 amount, uint256 level, bytes data) public
```

### updateRankingInstance

```solidity
function updateRankingInstance(address newRankingInstance) public
```

_Updates the ranking instance. `newRankingInstance` is the address of the new ranking instance.

emits a _RankingInstanceUpdated_ event._

### lock

```solidity
function lock(address account, uint256 id, uint256 amount) public
```

### unlock

```solidity
function unlock(address account, uint256 id, uint256 amount) public
```

### batchMint

```solidity
function batchMint(address to, uint256[] ids, uint256[] amounts, bytes data) public
```

_Mints specified amounts of tokens to an account. `to` is the address of the account to mint the tokens to. `ids` is the array of IDs of the tokens to mint. `amounts` is the array of amounts of tokens to mint. `data` is the additional data._

### levelUp

```solidity
function levelUp(address to, uint256 level, bytes data) public
```

### findNewRank

```solidity
function findNewRank(address account, uint256 oldRank) public view returns (uint256)
```

_Finds the new rank of an account. `account` is the address of the account. `oldRank` is the old rank of the account.
It checks the balance of the account and returns the new rank that can be upgraded to.

Returns:

- The new rank of the account._

### RankUpdated

```solidity
event RankUpdated(address account, uint256 rank)
```

### _afterTokenTransfer

```solidity
function _afterTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal
```

_Hook that is called after any token transfer. This includes minting
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

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### getAccountRank

```solidity
function getAccountRank(address account) external view returns (uint256)
```

_Gets the rank of an account. `account` is the address of the account.

Returns:

- The rank of the account._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

