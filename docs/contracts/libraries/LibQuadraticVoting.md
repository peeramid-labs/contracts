# Solidity API

## quadraticVotingError

```solidity
error quadraticVotingError(string paramter, uint256 arg, uint256 arg2)
```

## LibQuadraticVoting

_A library for quadratic voting calculations._

### qVotingStruct

```solidity
struct qVotingStruct {
  uint256 voteCredits;
  uint256 maxQuadraticPoints;
  uint256 minQuadraticPositons;
}
```

### precomputeValues

```solidity
function precomputeValues(uint256 voteCredits, uint256 minExpectedVoteItems) internal pure returns (struct LibQuadraticVoting.qVotingStruct)
```

_Precomputes the values for quadratic voting. `voteCredits` is the total number of vote credits. `minExpectedVoteItems` is the minimum expected number of vote items.

Returns:

- A `qVotingStruct` containing the precomputed values._

### computeScoresByVPIndex

```solidity
function computeScoresByVPIndex(struct LibQuadraticVoting.qVotingStruct q, uint256[][] VotersVotes, bool[] voterVoted, uint256 notVotedGivesEveyone, uint256 proposalsLength) internal pure returns (uint256[])
```

_Computes the scores for each proposal by voter preference index. `q` is the precomputed quadratic voting values. `VotersVotes` is a 2D array of votes, where each row corresponds to a voter and each column corresponds to a proposal. `voterVoted` is an array indicating whether each voter has voted. `notVotedGivesEveyone` is the number of points to distribute to each proposal for each voter that did not vote. `proposalsLength` is the number of proposals.

Returns:

- An array of scores for each proposal._

