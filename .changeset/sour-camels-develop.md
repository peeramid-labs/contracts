---
'rankify-contracts': minor
---

# Changeset Summary

## Overview
Added ability to end turns if there are inactive players without waiting for their move.

## Changes

### ArguableVotingTournament.sol
- Increased the size of `RankifyInstanceMainFacetSelectors` from 27 to 28.
- Added a new function selector `RankifyInstanceMainFacet.isActive.selector`.

### RankifyInstanceMainFacet.sol
- Added a new function `isActive` which takes a `gameId` and a `player` address and returns a boolean indicating if the game is active for the player.

### LibQuadraticVoting.sol
- Changed the parameter name from `voterVoted` to `isActive` in the `computeScoresByVPIndex` function.
- Moved the initialization of `notVotedGivesEveryone` to use `q.maxQuadraticPoints`.
- Updated the condition to check `!isActive[vi]` instead of `!voterVoted[vi]`.

### LibTurnBasedGame.sol
- Added a new `isActive` mapping to track active players.
- Introduced `numActivePlayers` to count the number of active players.
- Updated the `resetGame` function to initialize `isActive` to `false` for all players and reset `numActivePlayers`.
- Modified `addPlayer` to initialize `isActive` to `false` for new participants.
- Enhanced `canEndTurnEarly` to check if all active players have made their move before allowing an early turn end.
- Removed out the `_clearCurrentMoves` function
- Updated the `startGame` function to set all players as active initially.
- Modified `recordMove` to mark a player as active when they make a move and increment `numActivePlayers`.

## Summary of Changes
- **Functionality Enhancements**: Added a new `isActive` function in `RankifyInstanceMainFacet.sol` to check the active status of a game for a specific player.
- **Refactoring**: Renamed parameters and adjusted logic in `LibQuadraticVoting.sol` to align with the new active status checking mechanism.
- **Code Organization**: Updated selectors in `ArguableVotingTournament.sol` to accommodate the new functionality.
- **Game Management Enhancements**: Introduced active player tracking and management in `LibTurnBasedGame.sol`, enhancing game state management and turn-based logic.

These changes introduce new functionality to check the active status of a game, which likely impacts how games are managed and interacted with in your application.
