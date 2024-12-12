# rankify-contracts

## 0.10.0

### Minor Changes

- [#82](https://github.com/peeramid-labs/contracts/pull/82) [`c53987d3423287f11af3e41e5f83fe1a13fa9f48`](https://github.com/peeramid-labs/contracts/commit/c53987d3423287f11af3e41e5f83fe1a13fa9f48) Thanks [@peersky](https://github.com/peersky)! - # Changeset for branch 64-principal-game-cost-time-parameters

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

- [#57](https://github.com/peeramid-labs/contracts/pull/57) [`5360ba4fbc5029dc572b78fb330a69a6df903826`](https://github.com/peeramid-labs/contracts/commit/5360ba4fbc5029dc572b78fb330a69a6df903826) Thanks [@peersky](https://github.com/peersky)! - eslint major verison change

- [#50](https://github.com/peeramid-labs/contracts/pull/50) [`80e2198289cf6fafae910d5a4f1d3442afabbbfb`](https://github.com/peeramid-labs/contracts/commit/80e2198289cf6fafae910d5a4f1d3442afabbbfb) Thanks [@peersky](https://github.com/peersky)! - Migration to v5

- [#48](https://github.com/peeramid-labs/contracts/pull/48) [`d449bb2174c3959447d717bb0d0d64f617467a45`](https://github.com/peeramid-labs/contracts/commit/d449bb2174c3959447d717bb0d0d64f617467a45) Thanks [@peersky](https://github.com/peersky)! - changed documentation generation system to be more readable and per file separated

- [#86](https://github.com/peeramid-labs/contracts/pull/86) [`5a4493123798682b7cbd3eeddf277dc11cd023da`](https://github.com/peeramid-labs/contracts/commit/5a4493123798682b7cbd3eeddf277dc11cd023da) Thanks [@peersky](https://github.com/peersky)! - added playbooks for adding distribution and creating subject, removed old multipass playbook

- [#61](https://github.com/peeramid-labs/contracts/pull/61) [`db186f717e1babebf6c1653afb7862d2120e545e`](https://github.com/peeramid-labs/contracts/commit/db186f717e1babebf6c1653afb7862d2120e545e) Thanks [@peersky](https://github.com/peersky)! - Updated readme

- [#53](https://github.com/peeramid-labs/contracts/pull/53) [`999e9339e318723137ddc2f9d640c54f157e67b9`](https://github.com/peeramid-labs/contracts/commit/999e9339e318723137ddc2f9d640c54f157e67b9) Thanks [@peersky](https://github.com/peersky)! - added playbook functionality to execute state emulation

- [#66](https://github.com/peeramid-labs/contracts/pull/66) [`40e4f88c1b27d2d1e3c4f915337779f8cfb0ed35`](https://github.com/peeramid-labs/contracts/commit/40e4f88c1b27d2d1e3c4f915337779f8cfb0ed35) Thanks [@peersky](https://github.com/peersky)! - moved eds as dependency

- [#50](https://github.com/peeramid-labs/contracts/pull/50) [`80e2198289cf6fafae910d5a4f1d3442afabbbfb`](https://github.com/peeramid-labs/contracts/commit/80e2198289cf6fafae910d5a4f1d3442afabbbfb) Thanks [@peersky](https://github.com/peersky)! - Migrated to oz contracts v5

- [#55](https://github.com/peeramid-labs/contracts/pull/55) [`73ea44f3e83cd3eab3d8f9db1a605606cfcfed21`](https://github.com/peeramid-labs/contracts/commit/73ea44f3e83cd3eab3d8f9db1a605606cfcfed21) Thanks [@peersky](https://github.com/peersky)! - generic diamond factory implementation via Ethereum Distribution System

- [#62](https://github.com/peeramid-labs/contracts/pull/62) [`0c4f23cca04fa78564877cbb971ade0a96603314`](https://github.com/peeramid-labs/contracts/commit/0c4f23cca04fa78564877cbb971ade0a96603314) Thanks [@peersky](https://github.com/peersky)! - ## Addition of Ethereum Distribution System (EDS)

  - **Feature**: Integrated the Ethereum Distribution System (EDS) for distributing Rankify contracts.
  - **Description**: Rankify contracts are now distributed via the Ethereum Distribution System, enhancing the efficiency and security of the distribution process.

  ## Redesign of Contracts

  - **Feature**: Redesigned contracts to work seamlessly as part of the Ethereum Distribution System.
  - **Description**: The contracts have been restructured and optimized to ensure compatibility and smooth operation within the EDS framework. This redesign includes:
    - Improved contract architecture for better integration with EDS.
    - Enhanced security measures to protect against potential vulnerabilities.
    - Optimized performance to handle the distribution process more efficiently.

  ## Impact

  - **Users**:
    - Can create new subjects that are called Meritocratic Autonomous Organizations (MAOs).
    - Will benefit from a more secure and efficient distribution process.
  - **Developers**: Developers will need to familiarize themselves with the new contract architecture and EDS integration.
  - **Operations**: The distribution process will be streamlined, reducing the potential for errors and improving overall system reliability.

  ## Next Steps

  - **Documentation**: Update the documentation to include details on the new EDS integration and contract redesign.
  - **Testing**: Conduct thorough testing to ensure the new system operates as expected.
  - **Deployment**: Plan and execute the deployment of the updated contracts and distribution system.

- [#84](https://github.com/peeramid-labs/contracts/pull/84) [`26bcabd15ced84405dc20009b89edd572bbf0128`](https://github.com/peeramid-labs/contracts/commit/26bcabd15ced84405dc20009b89edd572bbf0128) Thanks [@peersky](https://github.com/peersky)! - # Changeset Summary

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

- [#81](https://github.com/peeramid-labs/contracts/pull/81) [`3cfd71fc9c15c11d6a357aa7ec42607d4cde8387`](https://github.com/peeramid-labs/contracts/commit/3cfd71fc9c15c11d6a357aa7ec42607d4cde8387) Thanks [@peersky](https://github.com/peersky)! - renamed distributor contract to DAO distributor and used TokenizedDistributor instead of casual one

- [#60](https://github.com/peeramid-labs/contracts/pull/60) [`55fc1a6ed9f1b7fc4520c3ec6fab5c7f7ae7a3b5`](https://github.com/peeramid-labs/contracts/commit/55fc1a6ed9f1b7fc4520c3ec6fab5c7f7ae7a3b5) Thanks [@theKosmoss](https://github.com/theKosmoss)! - Created new playbook scenario 'gameCreated' and some general playbooks refactors

- [#31](https://github.com/peeramid-labs/contracts/pull/31) [`3da696b43f43af8b3130bf7aa2d93575b656d66f`](https://github.com/peeramid-labs/contracts/commit/3da696b43f43af8b3130bf7aa2d93575b656d66f) Thanks [@peersky](https://github.com/peersky)! - Introduced installer interfaces

- [#87](https://github.com/peeramid-labs/contracts/pull/87) [`27e1c1af2d139479a5e4d1db26ad076ffdb237db`](https://github.com/peeramid-labs/contracts/commit/27e1c1af2d139479a5e4d1db26ad076ffdb237db) Thanks [@peersky](https://github.com/peersky)! - fixed createGame playbook

- [#91](https://github.com/peeramid-labs/contracts/pull/91) [`df675d896269218e2d5a6742eb6ed3423f8789b4`](https://github.com/peeramid-labs/contracts/commit/df675d896269218e2d5a6742eb6ed3423f8789b4) Thanks [@peersky](https://github.com/peersky)! - - added deployment artifacts for 0.10.0 release
  - added getGameState getter to rankify main facet
  - added helper functions in scripts
  - implemented named distributions from newest EDS release
  - added more documentation strings

### Patch Changes

- [#54](https://github.com/peeramid-labs/contracts/pull/54) [`569fb0f7cc0cd7a99065fae3873296378b8ffd1a`](https://github.com/peeramid-labs/contracts/commit/569fb0f7cc0cd7a99065fae3873296378b8ffd1a) Thanks [@peersky](https://github.com/peersky)! - corrected interface file names

- [#67](https://github.com/peeramid-labs/contracts/pull/67) [`da9978ee38b136e5e7cf8a1f68fcb101ede9eae2`](https://github.com/peeramid-labs/contracts/commit/da9978ee38b136e5e7cf8a1f68fcb101ede9eae2) Thanks [@peersky](https://github.com/peersky)! - improved documentation generation for mkdocs compatible markdown outputs

- [#49](https://github.com/peeramid-labs/contracts/pull/49) [`ae43df3f35fdcd49d33d76eaf9b452dbe453e202`](https://github.com/peeramid-labs/contracts/commit/ae43df3f35fdcd49d33d76eaf9b452dbe453e202) Thanks [@peersky](https://github.com/peersky)! - Fixed linter errors on docs templates directory

- [#85](https://github.com/peeramid-labs/contracts/pull/85) [`9246d9faac56d6897912934259212558ca0ad975`](https://github.com/peeramid-labs/contracts/commit/9246d9faac56d6897912934259212558ca0ad975) Thanks [@peersky](https://github.com/peersky)! - # Documentation updated

  - All source code signatures now are exported during release to docs/selectors.md
  - fixed typos
  - Removed obsolete documentation

- [`a719bf84721521f733227f703d4787ec779d74e7`](https://github.com/peeramid-labs/contracts/commit/a719bf84721521f733227f703d4787ec779d74e7) Thanks [@peersky](https://github.com/peersky)! - added deployment to anvil artifacts; ensured deploy scripts do not fail if deployment artifacts already registred on index

- [#93](https://github.com/peeramid-labs/contracts/pull/93) [`be671ff81117bcc3ccb6af3408c1198532c31317`](https://github.com/peeramid-labs/contracts/commit/be671ff81117bcc3ccb6af3408c1198532c31317) Thanks [@peersky](https://github.com/peersky)! - added viem compatible abi exports as typescript

- [#89](https://github.com/peeramid-labs/contracts/pull/89) [`f5aa8c956528ed1db83a1872ae5dfa8a29b4f3c6`](https://github.com/peeramid-labs/contracts/commit/f5aa8c956528ed1db83a1872ae5dfa8a29b4f3c6) Thanks [@peersky](https://github.com/peersky)! - ensured rank token gets env from setup results & minor improvements

- [`a719bf84721521f733227f703d4787ec779d74e7`](https://github.com/peeramid-labs/contracts/commit/a719bf84721521f733227f703d4787ec779d74e7) Thanks [@peersky](https://github.com/peersky)! - removed rankify instance from deployment artifacts in favor of MAODistribution

- [#69](https://github.com/peeramid-labs/contracts/pull/69) [`be9d58a44f4d8f97aeae83e904d2d72a485ae169`](https://github.com/peeramid-labs/contracts/commit/be9d58a44f4d8f97aeae83e904d2d72a485ae169) Thanks [@peersky](https://github.com/peersky)! - doc generation template improvements

- [#44](https://github.com/peeramid-labs/contracts/pull/44) [`55c3a8531a053905a94fc4626c0dd9c897ff46fe`](https://github.com/peeramid-labs/contracts/commit/55c3a8531a053905a94fc4626c0dd9c897ff46fe) Thanks [@peersky](https://github.com/peersky)! - moved to using newer pnpm version in ci and lockfile

## 0.9.4

### Patch Changes

- [`e79d0bf`](https://github.com/rankify-it/contracts/commit/e79d0bf398556e0fa0adf78063c46efa840c85d8) Thanks [@peersky](https://github.com/peersky)! - code cleanup, libquadratic improvements, bug fixes

## 0.9.3

### Patch Changes

- [`8e5af9b`](https://github.com/rankify-it/contracts/commit/8e5af9b8b2ccb3c21473b6b57b094d0824003628) Thanks [@peersky](https://github.com/peersky)! - bug fix preventing compilation

- [`7f18108`](https://github.com/rankify-it/contracts/commit/7f18108cf74f62053c7ef62722d53f55af5f81b3) Thanks [@peersky](https://github.com/peersky)! - add more test cases

- [`8e5af9b`](https://github.com/rankify-it/contracts/commit/8e5af9b8b2ccb3c21473b6b57b094d0824003628) Thanks [@peersky](https://github.com/peersky)! - update deployment artifacts

## 0.9.2

### Patch Changes

- [`4239be3`](https://github.com/rankify-it/contracts/commit/4239be32c8d8960b76bdae46ca3fd7f03533be39) Thanks [@peersky](https://github.com/peersky)! - added view method for player moves and player did voted

## 0.9.1

### Patch Changes

- [#38](https://github.com/rankify-it/contracts/pull/38) [`b634091`](https://github.com/rankify-it/contracts/commit/b634091eea5feaec4043234b891b4f8fd8374ed9) Thanks [@peersky](https://github.com/peersky)! - added multipass deployments

## 0.9.0

### Minor Changes

- [#36](https://github.com/rankify-it/contracts/pull/36) [`bd177c8`](https://github.com/rankify-it/contracts/commit/bd177c89edd630be5f6b1b8954ebfba65d36799a) Thanks [@peersky](https://github.com/peersky)! - beta network contracts deployment

## 0.8.0

### Minor Changes

- [`1011382`](https://github.com/rankify-it/contracts/commit/1011382c54a5530a6149d4f78102839edac5e2bd) Thanks [@peersky](https://github.com/peersky)! - Deployed multipass on anvil

## 0.7.2

### Patch Changes

- [`835c821`](https://github.com/rankify-it/contracts/commit/835c82142d441b8f66e788ed754a361878029cbe) Thanks [@peersky](https://github.com/peersky)! - Use local multipass library to avoid circular deps

## 0.7.1

### Patch Changes

- [`fbcf1ce`](https://github.com/rankify-it/contracts/commit/fbcf1ce9c517c2280bd1c398102c35d054334163) Thanks [@peersky](https://github.com/peersky)! - named import for multipass from sdk

## 0.7.0

### Minor Changes

- [#11](https://github.com/rankify-it/contracts/pull/11) [`c9eb6b5`](https://github.com/rankify-it/contracts/commit/c9eb6b540a6f2fe780984eb4e979753f56a6bf88) Thanks [@peersky](https://github.com/peersky)! - Adding multipass contracts

## 0.6.0

### Minor Changes

- [`230b856`](https://github.com/rankify-it/contracts/commit/230b856f9b5246a73daad34c3c1eff4bdd8dd3e3) Thanks [@peersky](https://github.com/peersky)! - Minor contracts upgrade

## 0.5.0

### Minor Changes

- [`5d85c92`](https://github.com/rankify-it/contracts/commit/5d85c92b647c2fbcb2c2ce9fa3fb5b853329f1c3) Thanks [@peersky](https://github.com/peersky)! - Re-deploy contracts and update token metadata to correspond to music challenge of first game

## 0.4.1

### Patch Changes

- [`44d9e77`](https://github.com/rankify-it/contracts/commit/44d9e77826fa29c0671bca4fd98afa79c611df13) Thanks [@peersky](https://github.com/peersky)! - use md files

## 0.4.0

### Minor Changes

- [`fe91476`](https://github.com/rankify-it/contracts/commit/fe91476f6e4f6b39819422d23085a0b823e53728) Thanks [@peersky](https://github.com/peersky)! - docs only as single file

## 0.3.2

### Patch Changes

- [`9f35eac`](https://github.com/rankify-it/contracts/commit/9f35eac5160332855dd87d9134c5ff6998326a7d) Thanks [@peersky](https://github.com/peersky)! - use absolute readme links

## 0.3.1

### Patch Changes

- [`5113431`](https://github.com/rankify-it/contracts/commit/51134318d9b91bb73e33e3465d93807a886f2542) Thanks [@peersky](https://github.com/peersky)! - changed docgen format

## 0.3.0

### Minor Changes

- [`f291dad`](https://github.com/rankify-it/contracts/commit/f291dad6117880789b45c972e82bb12fb7942868) Thanks [@peersky](https://github.com/peersky)! - Deployed latest changes to testnet

## 0.2.3

### Patch Changes

- [`d88f83a`](https://github.com/rankify-it/contracts/commit/d88f83a65e15254bbf5ed750c645cfbe00d601ca) Thanks [@peersky](https://github.com/peersky)! - adding typing files
