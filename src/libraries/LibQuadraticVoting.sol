// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
error quadraticVotingError(string paramter, uint256 arg, uint256 arg2);

library LibQuadraticVoting {
    struct qVotingStruct {
        uint256 voteCredits;
        uint256 maxQuadraticPoints;
        uint256 minQuadraticPositons;
    }

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
        if (accumulator != voteCredits)
             require(false, 'quadraticVotingError'); //revert quadraticVotingError("voteCredits bust be i^2 series", accumulator, voteCredits);
        q.minQuadraticPositons = iterator;
        // In order to spend all vote credits there must be at least minQuadraticPositons+1 (becuase proposer is also a player and cannot vote for himself)
        if (minExpectedVoteItems <= q.minQuadraticPositons)  require(false, 'quadraticVotingError');
            // revert quadraticVotingError(
            //     "Minimum Voting positions above min players",
            //     q.minQuadraticPositons,
            //     minExpectedVoteItems
            // );
        q.voteCredits = voteCredits;
        return q;
    }

    // function computeScoreByVPIndex(
    //     qVotingStruct memory q,
    //     uint256[][] memory VotersVotes,
    //     bool[] memory voterVoted,
    //     uint256 notVotedGivesEveyone,
    //     uint256 proposerIdx
    // ) internal pure returns (uint256) {
    //     uint256 score = 0;
    //     for (uint256 i = 0; i < VotersVotes.length; i++) {
    //         // For each potential voter
    //         if (i != proposerIdx) {
    //             // Calculate scores only for cases when voter is not proposer
    //             uint256 creditsUsed = 0;
    //             uint256[] memory voterVotes = VotersVotes[i];

    //             if (!voterVoted[i]) {
    //                 // Check if voter wasn't voting
    //                 score += notVotedGivesEveyone; // Gives benefits to everyone but himself
    //                 creditsUsed = q.voteCredits;
    //             } else {
    //                 for (uint256 vi = 0; vi < voterVotes.length; vi++) {
    //                     if (voterVotes[vi] != 0)
    //                         revert quadraticVotingError("Voting for yourself not allowed", i, voterVotes[y]);
    //                     score += voterVotes[proposerIdx];
    //                     creditsUsed += voterVotes[proposerIdx] ** 2;
    //                 }
    //             }

    //             if (creditsUsed > q.voteCredits)
    //                 revert quadraticVotingError("Quadratic: vote credits overrun", q.voteCredits, creditsUsed);
    //         }
    //     }
    //     return score;
    // }

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
                    if (creditsUsed[vi] > q.voteCredits)
                        require(false, 'quadraticVotingError'); // revert quadraticVotingError("Quadratic: vote credits overrun", q.voteCredits, creditsUsed[vi]);
                }
            }
        }
        return scores;
    }
}
