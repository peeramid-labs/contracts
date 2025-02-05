---
'rankify-contracts': minor
---

# Changelog

## Major Contract Changes

### Major Features

- **Zero-Knowledge Proof Integration**
  Added circuit-based integrity verification system for game state transitions:

  - New `proposals_integrity_15.circom` circuit using Poseidon hashing
  - Commitment scheme for proposal permutations and ballot validity
  - Proof verification required for turn transitions (`endTurn`)

- **EIP-712 Signature Workflows**
  Implemented typed message signing for critical operations:
  - Game joining requires `signJoiningGame`, signed by GameMaster, attesting player for joining the game
  - Vote submissions now need dual signatures (GM + Voter)
  - Cryptographic commitments for proposal submissions also are signed

### Breaking Changes

- **Maximum number of participants**
  Due to the limits of the ZK proof, maximum number of participants is now 15 per one game.
  We may change this later but for now this is the limit.


- **Proposal Submission**

  - `bytes32 commitmentHash;` is now `uint256 commitment;`
  - gm and voter signatures were added

  new proposal params struct looks like this:

  ```solidity
  struct ProposalParams {
    uint256 gameId;
    string encryptedProposal;
    uint256 commitment;
    address proposer;
    bytes gmSignature;
    bytes voterSignature;
  }
  ```

- **Vote Submission**

  - `string encryptedVotes;` is now `string sealedBallotId;`
  - signatures for gm and voter were added
  - ballot hash is added as parameter it is calculated as `keccak256(vote, playerVoteSalt)`
    new interface for vote submission looks as follows:

  ```solidity
  function submitVote(
        uint256 gameId,
        string memory sealedBallotId,
        address voter,
        bytes memory gmSignature,
        bytes memory voterSignature,
        bytes32 ballotHash
    )
  ```

- **Turn Transition Requirements**

    `endTurn` now requires ZK proof parameters:

    ```solidity
        function endTurn(
            uint256 gameId,
            uint256[][] memory votes,
            BatchProposalReveal memory newProposals,
            uint256[] memory permutation,
            uint256 shuffleSalt
        )
    ```

    Where `BatchProposalReveal` is defined as:

    ```solidity
    /**
     * @dev Represents a batch of proposal reveals for a game.
    * @param proposals Array of revealed proposals
    * @param a ZK proof components
    * @param b ZK proof components
    * @param c ZK proof components
    * @param permutationCommitment The commitment to the permutation
    * @notice permutationCommitment must be poseidon(sponge(nextTurnPermutation), nullifier). For sponge implementation see poseidonSpongeT3
    */
    struct BatchProposalReveal {
        string[] proposals; // Array of revealed proposals
        uint[2] a; // ZK proof components
        uint[2][2] b;
        uint[2] c;
        uint256 permutationCommitment;
    }
    ```

- **Join game**: signature and salt are now required

  ```solidity
  function joinGame(
        uint256 gameId,
        bytes memory gameMasterSignature,
        bytes memory hiddenSalt
    )
  ```

- **Start game**
  Now requires permutationCommitment from game master. This is used as permutation integrity value during first turn proposal reveal.

  ```solidity
  function startGame(uint256 gameId, uint256 permutationCommitment)
  ```

- **Game Winner**
  New interface to query for game winner added

    ```solidity
    /**
     * @dev Returns the winner of the game with the specified ID
     * @param gameId The ID of the game
     * @return address The winner of the game
     */
    function gameWinner(uint256 gameId) public view returns (address) {
    return gameId.getGameState().winner;
    }
    ```

- **Player joined event**
  Now when player joins, participant address and commitment are emitted

  ```solidity
  event PlayerJoined(uint256 indexed gameId, address indexed participant, bytes hiddenSalt);
  ```

### Other Improvements

- **Enhanced Security**

  - Ballot integrity checks with hash commitments

  ```solidity
  require(
      ballotHash == ballotHashFromVotes,
      "Ballot integrity check failed"
  );
  ```

- **Testing Infrastructure**
  Added comprehensive test coverage for:

  - ZK proof generation/verification workflows
  - Signature validation edge cases
  - Game cancellation scenarios
  - Malicious actor simulations

- **Governance Constraints**
  - Minimum participant requirements
  - Principal cost calculations based on game parameters
  - 90/10 payment split between burn and DAO

### Migration Notes

1. **Client Updates Required**
   All game interactions must now:

   - Generate ZK proofs for turn transitions
   - Handle EIP-712 signatures for votes/joining

2. **Upgrade Path**
   ```bash
   pnpm update rankify-contracts
   ```
