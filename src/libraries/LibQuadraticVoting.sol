// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
error quadraticVotingError(string paramter, uint256 arg, uint256 arg2);

/**
 * @title LibQuadraticVoting
 * @dev A library for quadratic voting calculations.
 */
library LibQuadraticVoting {
    struct qVotingStruct {
        uint256 voteCredits;
        uint256 maxQuadraticPoints;
        uint256 minQuadraticPositons;
    }

    /**
     * @dev Precomputes the values for quadratic voting.
     * @param `voteCredits` is the total number of vote credits.
     * @param `minExpectedVoteItems` is the minimum expected number of vote items.
     * @return  A `qVotingStruct` containing the precomputed values.
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
            iterator++;
            accumulator += iterator ** 2;
        } while (accumulator < voteCredits);
        // This enforces requirement that all vote credits can indeed be spended (no leftovers)
        if (accumulator != voteCredits) require(false, "quadraticVotingError"); //revert quadraticVotingError("voteCredits bust be i^2 series", accumulator, voteCredits);
        q.minQuadraticPositons = iterator;
        // In order to spend all vote credits there must be at least minQuadraticPositons+1 (becuase proposer is also a player and cannot vote for himself)
        if (minExpectedVoteItems <= q.minQuadraticPositons) require(false, "quadraticVotingError");
        // revert quadraticVotingError(
        //     "Minimum Voting positions above min players",
        //     q.minQuadraticPositons,
        //     minExpectedVoteItems
        // );
        q.voteCredits = voteCredits;
        return q;
    }

    /**
     * @dev Computes the scores for each proposal by voter preference index.
     * @param `q` is the precomputed quadratic voting values. `VotersVotes` is a 2D array of votes, where each row corresponds to a voter and each column corresponds to a proposal.
     * @param `voterVoted` is an array indicating whether each voter has voted. `notVotedGivesEveyone` is the number of points to distribute to each proposal for each voter that did not vote.
     * @param `proposalsLength` is the number of proposals.
     * @return An array of scores for each proposal.
     */
    function computeScoresByVPIndex(
        qVotingStruct memory q,
        uint256[][] memory VotersVotes,
        bool[] memory voterVoted,
        uint256 notVotedGivesEveyone,
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
                    scores[proposalIdx] += notVotedGivesEveyone; // Gives benefits to everyone but himself
                    creditsUsed[vi] = q.voteCredits;
                } else {
                    //If voter voted
                    scores[proposalIdx] += voterVotes[proposalIdx];
                    creditsUsed[vi] += voterVotes[proposalIdx] ** 2;
                    if (creditsUsed[vi] > q.voteCredits) require(false, "quadraticVotingError"); // revert quadraticVotingError("Quadratic: vote credits overrun", q.voteCredits, creditsUsed[vi]);
                }
            }
        }
        return scores;
    }
}
