---
'rankify-contracts': minor
---

# Changeset for branch 64-principal-game-cost-time-parameters

## Summary
This branch introduces significant changes to game cost and time parameters, payment handling, and rank token mechanics, along with several code improvements and bug fixes.

## Changes

### Core Game Mechanics
- `LibRankify.sol`:
  - Introduced principal game cost calculation based on game time
  - Added minimum game time validation and constraints
  - Implemented 90/10 payment split: 90% burned, 10% to DAO
  - Removed payment refunds and game cancellation payments
  - Simplified rank token rewards to only top player
  - Added validation for turn count and game time parameters

### Libraries
- `LibTBG.sol`:
  - Added `startedAt` timestamp for minimum game time tracking
  - Renamed `getGameSettings()` to `getSettings(uint256 gameId)` for better clarity
  - Updated storage access patterns for overtime functionality
  - Simplified tie detection logic to only consider top 2 players
  - Fixed storage slot access patterns

### Tokens
- `DistributableGovernanceERC20.sol`:
  - Updated Solidity version from 0.8.20 to 0.8.28

- `RankToken.sol`:
  - Updated Solidity version from ^0.8.20 to =0.8.28
  - Added IERC165 import
  - Implemented burn function with ERC7746C middleware

### Vendor
- Renamed `DiamondCloneable.sol` to `DiamondClonable.sol`:
  - Fixed typo in error name from 'fucntionDoesNotExist' to 'functionDoesNotExist'

- `DiamondLoupeFacet.sol`:
  - Updated Solidity version to ^0.8.28

- `LibDiamond.sol`:
  - Added DuplicateSignature error definition

### Removed Files
- Deleted `test/DNSFacet.ts`
- Removed multipass sources:
  - `src/facets/DNSFacet.sol`
  - `src/initializers/MultipassInit.sol`
  - `src/libraries/LibMultipass.sol`
  - `src/interfaces/IMultipass.sol`

### Mocks
- `RankifyInstanceEventMock.sol`:
  - Fixed typo in parameter name from 'proposerIndicies' to 'proposerIndices'

## Breaking Changes
- Storage layout changes in LibTBG require careful migration
- Payment handling completely reworked:
  - Removed refunds functionality
  - Implemented burn mechanism for 90% of payments
  - Added DAO benefit for 10% of payments
- Rank token rewards simplified to only top player
- Solidity version updates may require dependency updates
- Renamed Diamond contract file requires build script updates
- Removed all multipass functionality

## Migration Guide
1. Update build scripts to reference new DiamondClonable filename
2. Verify storage layout compatibility after LibTBG changes
3. Update dependencies to support Solidity 0.8.28
4. Remove any references to multipass functionality
5. Update payment handling code to work with new burn mechanism
6. Adjust rank token distribution logic for single winner
7. Ensure game time parameters meet new constraints
