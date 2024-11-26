// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
error quadraticVotingError(string parameter, uint256 arg, uint256 arg2);

/**
 * @title LibQuadraticVoting
 * @dev A library for quadratic voting calculations.
 */
library LibQuadraticVoting {
    struct qVotingStruct {
        uint256 voteCredits;
        uint256 maxQuadraticPoints;
        uint256 minQuadraticPositions;
    }

    /**
     * @dev Precomputes the values for quadratic voting. `voteCredits` is the total number of vote credits. `minExpectedVoteItems` is the minimum expected number of vote items.
     *
     * Returns:
     *
     * - A `qVotingStruct` containing the precomputed values.
     */
    function precomputeValues(
        uint256 voteCredits,
        uint256 minExpectedVoteItems
    ) internal pure returns (qVotingStruct memory) {
        qVotingStruct memory q;

        q.maxQuadraticPoints = Math.sqrt(voteCredits);

        // This block finds how many vote positions are needed to distribute all quadratic vote points.
        uint256 iterator = 0;
        uint256 accumulator = 0;
        do {
            accumulator += (q.maxQuadraticPoints - iterator) ** 2;
            iterator++;
        } while (accumulator < voteCredits);
        // This enforces requirement that all vote credits can indeed be spended (no leftovers)
        if (accumulator != voteCredits) require(false, "quadraticVotingError: voteCredits bust be i^2 series"); //revert quadraticVotingError("voteCredits bust be i^2 series", accumulator, voteCredits);
        q.minQuadraticPositions = iterator;
        // In order to spend all vote credits there must be at least minQuadraticPositions+1 (becuase proposer is also a player and cannot vote for himself)
        if (minExpectedVoteItems <= q.minQuadraticPositions)
            require(false, "quadraticVotingError: Minimum Voting positions above min players");
        // revert quadraticVotingError(
        //     "Minimum Voting positions above min players",
        //     q.minQuadraticPositions,
        //     minExpectedVoteItems
        // );
        q.voteCredits = voteCredits;
        return q;
    }

    /**
     * @dev Computes the scores for each proposal by voter preference index. `q` is the precomputed quadratic voting values. `VotersVotes` is a 2D array of votes, where each row corresponds to a voter and each column corresponds to a proposal. `voterVoted` is an array indicating whether each voter has voted. `notVotedGivesEveyone` is the number of points to distribute to each proposal for each voter that did not vote. `proposalsLength` is the number of proposals.
     *
     * Returns:
     *
     * - An array of scores for each proposal.
     */
    function computeScoresByVPIndex(
        qVotingStruct memory q,
        uint256[][] memory VotersVotes,
        bool[] memory voterVoted,
        uint256 notVotedGivesEveryone,
        uint256 proposalsLength
    ) internal pure returns (uint256[] memory) {
        uint256[] memory scores = new uint256[](proposalsLength);
        uint256[] memory creditsUsed = new uint256[](VotersVotes.length);

        for (uint256 proposalIdx = 0; proposalIdx < proposalsLength; proposalIdx++) {
            //For each proposal
            scores[proposalIdx] = 0;
            for (uint256 vi = 0; vi < VotersVotes.length; vi++) {
                // For each potential voter
                uint256[] memory voterVotes = VotersVotes[vi];
                if (!voterVoted[vi]) {
                    // Check if voter wasn't voting
                    scores[proposalIdx] += notVotedGivesEveryone; // Gives benefits to everyone but himself
                    creditsUsed[vi] = q.voteCredits;
                } else {
                    //If voter voted
                    scores[proposalIdx] += voterVotes[proposalIdx];
                    creditsUsed[vi] += voterVotes[proposalIdx] ** 2;
                    require(
                        creditsUsed[vi] <= q.voteCredits,
                        quadraticVotingError("Quadratic: vote credits overrun", q.voteCredits, creditsUsed[vi])
                    );
                }
            }
        }
        return scores;
    }
}
