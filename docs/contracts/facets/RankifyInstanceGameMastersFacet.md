
# 
## Description

## Implementation

###  event OverTime

```solidity
event OverTime(uint256 gameId) 
```

###  event LastTurn

```solidity
event LastTurn(uint256 gameId) 
```

###  event ProposalScore

```solidity
event ProposalScore(uint256 gameId, uint256 turn, string proposalHash, string proposal, uint256 score) 
```

###  event TurnEnded

```solidity
event TurnEnded(uint256 gameId, uint256 turn, address[] players, uint256[] scores, string[] newProposals, uint256[] proposerIndicies, uint256[][] votes) 
```

###  event GameOver

```solidity
event GameOver(uint256 gameId, address[] players, uint256[] scores) 
```

###  event ProposalSubmitted

```solidity
event ProposalSubmitted(uint256 gameId, uint256 turn, address proposer, bytes32 commitmentHash, string proposalEncryptedByGM) 
```

### public struct ProposalParams

```solidity
struct ProposalParams {
  uint256 gameId;
  string encryptedProposal;
  bytes32 commitmentHash;
  address proposer;
}
```
###  event VoteSubmitted

```solidity
event VoteSubmitted(uint256 gameId, uint256 turn, address player, string votesHidden) 
```

### public function submitVote

```solidity
function submitVote(uint256 gameId, string encryptedVotes, address voter) public 
```

*Submits a vote for a game. `gameId` is the ID of the game. `encryptedVotes` is the encrypted votes. `voter` is the address of the voter.

Emits a _VoteSubmitted_ event.

Requirements:

- The caller must be a game master of the game with `gameId`.
- The game with `gameId` must exist.
- The game with `gameId` must have started.
- The game with `gameId` must not be over.
- `voter` must be in the game with `gameId`.
- The current turn of the game with `gameId` must be greater than 1.*
### public function submitProposal

```solidity
function submitProposal(struct RankifyInstanceGameMastersFacet.ProposalParams proposalData) public 
```

*Submits a proposal for a game. `proposalData` is the proposal data.

Requirements:

- The game with `proposalData.gameId` must exist.
- The caller must be a game master of the game with `proposalData.gameId`.*
### public function endTurn

```solidity
function endTurn(uint256 gameId, uint256[][] votes, string[] newProposals, uint256[] proposerIndicies) public 
```

*Ends the current turn of a game with the provided game ID. `gameId` is the ID of the game. `votes` is the array of votes.
 `newProposals` is the array of new proposals for the upcoming voting round.
 `proposerIndicies` is the array of indices of the proposers in the previous voting round.

emits a _ProposalScore_ event for each player if the turn is not the first.
emits a _TurnEnded_ event.

Modifies:

- Calls the `_nextTurn` function with `gameId` and `newProposals`.
- Resets the number of commitments of the game with `gameId` to 0.
- Resets the proposal commitment hash and ongoing proposal of each player in the game with `gameId`.

Requirements:

- The caller must be a game master of the game with `gameId`.
- The game with `gameId` must have started.
- The game with `gameId` must not be over.
-  newProposals array MUST be sorted randomly to ensure privacy
votes and proposerIndicies MUST correspond to players array from game.getPlayers()*
<!--CONTRACT_END-->

