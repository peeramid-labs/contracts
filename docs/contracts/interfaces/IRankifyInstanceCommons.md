# Solidity API

## IRankifyInstanceCommons

### Score

```solidity
struct Score {
  address participant;
  uint256 score;
}
```

### RInstanceSettings

```solidity
struct RInstanceSettings {
  uint256 gamePrice;
  address gamePaymentToken;
  uint256 joinGamePrice;
  uint256 numGames;
  address rankTokenAddress;
  bool contractInitialized;
  struct LibQuadraticVoting.qVotingStruct voting;
}
```

### RInstanceState

```solidity
struct RInstanceState {
  struct IRankifyInstanceCommons.RInstanceSettings BestOfState;
  struct LibTBG.GameSettings TBGSEttings;
}
```

### VoteHidden

```solidity
struct VoteHidden {
  bytes32 hash;
  bytes proof;
}
```

### RInstance

```solidity
struct RInstance {
  uint256 rank;
  address createdBy;
  mapping(uint256 => string) ongoingProposals;
  uint256 numOngoingProposals;
  uint256 numPrevProposals;
  mapping(address => bytes32) proposalCommitmentHashes;
  uint256 numCommitments;
  mapping(address => struct IRankifyInstanceCommons.VoteHidden) votesHidden;
  address[] additionalRanks;
  uint256 paymentsBalance;
  uint256 numVotesThisTurn;
  uint256 numVotesPrevTurn;
  mapping(address => bool) playerVoted;
}
```

### RegistrationOpen

```solidity
event RegistrationOpen(uint256 gameid)
```

### PlayerJoined

```solidity
event PlayerJoined(uint256 gameId, address participant)
```

### GameStarted

```solidity
event GameStarted(uint256 gameId)
```

### gameCreated

```solidity
event gameCreated(uint256 gameId, address gm, address creator, uint256 rank)
```

### GameClosed

```solidity
event GameClosed(uint256 gameId)
```

### PlayerLeft

```solidity
event PlayerLeft(uint256 gameId, address player)
```

