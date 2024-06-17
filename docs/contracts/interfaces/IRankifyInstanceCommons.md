
# 
## Description

## Implementation

### public struct Score

```solidity
struct Score {
  address participant;
  uint256 score;
}
```
### public struct RInstanceSettings

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
### public struct RInstanceState

```solidity
struct RInstanceState {
  struct IRankifyInstanceCommons.RInstanceSettings BestOfState;
  struct LibTBG.GameSettings TBGSEttings;
}
```
### public struct VoteHidden

```solidity
struct VoteHidden {
  bytes32 hash;
  bytes proof;
}
```
### public struct RInstance

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
###  event RegistrationOpen

```solidity
event RegistrationOpen(uint256 gameid) 
```

###  event PlayerJoined

```solidity
event PlayerJoined(uint256 gameId, address participant) 
```

###  event GameStarted

```solidity
event GameStarted(uint256 gameId) 
```

###  event gameCreated

```solidity
event gameCreated(uint256 gameId, address gm, address creator, uint256 rank) 
```

###  event GameClosed

```solidity
event GameClosed(uint256 gameId) 
```

###  event PlayerLeft

```solidity
event PlayerLeft(uint256 gameId, address player) 
```

<!--CONTRACT_END-->

