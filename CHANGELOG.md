# rankify-contracts

## 0.10.0

### Minor Changes

- [#57](https://github.com/peeramid-labs/contracts/pull/57) [`5360ba4fbc5029dc572b78fb330a69a6df903826`](https://github.com/peeramid-labs/contracts/commit/5360ba4fbc5029dc572b78fb330a69a6df903826) Thanks [@peersky](https://github.com/peersky)! - eslint major verison change

- [#50](https://github.com/peeramid-labs/contracts/pull/50) [`80e2198289cf6fafae910d5a4f1d3442afabbbfb`](https://github.com/peeramid-labs/contracts/commit/80e2198289cf6fafae910d5a4f1d3442afabbbfb) Thanks [@peersky](https://github.com/peersky)! - Migration to v5

- [#48](https://github.com/peeramid-labs/contracts/pull/48) [`d449bb2174c3959447d717bb0d0d64f617467a45`](https://github.com/peeramid-labs/contracts/commit/d449bb2174c3959447d717bb0d0d64f617467a45) Thanks [@peersky](https://github.com/peersky)! - changed documentation generation system to be more readable and per file separated

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

- [#60](https://github.com/peeramid-labs/contracts/pull/60) [`55fc1a6ed9f1b7fc4520c3ec6fab5c7f7ae7a3b5`](https://github.com/peeramid-labs/contracts/commit/55fc1a6ed9f1b7fc4520c3ec6fab5c7f7ae7a3b5) Thanks [@theKosmoss](https://github.com/theKosmoss)! - Created new playbook scenario 'gameCreated' and some general playbooks refactors

- [#31](https://github.com/peeramid-labs/contracts/pull/31) [`3da696b43f43af8b3130bf7aa2d93575b656d66f`](https://github.com/peeramid-labs/contracts/commit/3da696b43f43af8b3130bf7aa2d93575b656d66f) Thanks [@peersky](https://github.com/peersky)! - Introduced installer interfaces

### Patch Changes

- [#54](https://github.com/peeramid-labs/contracts/pull/54) [`569fb0f7cc0cd7a99065fae3873296378b8ffd1a`](https://github.com/peeramid-labs/contracts/commit/569fb0f7cc0cd7a99065fae3873296378b8ffd1a) Thanks [@peersky](https://github.com/peersky)! - corrected interface file names

- [#67](https://github.com/peeramid-labs/contracts/pull/67) [`da9978ee38b136e5e7cf8a1f68fcb101ede9eae2`](https://github.com/peeramid-labs/contracts/commit/da9978ee38b136e5e7cf8a1f68fcb101ede9eae2) Thanks [@peersky](https://github.com/peersky)! - improved documentation generation for mkdocs compatible markdown outputs

- [#49](https://github.com/peeramid-labs/contracts/pull/49) [`ae43df3f35fdcd49d33d76eaf9b452dbe453e202`](https://github.com/peeramid-labs/contracts/commit/ae43df3f35fdcd49d33d76eaf9b452dbe453e202) Thanks [@peersky](https://github.com/peersky)! - Fixed linter errors on docs templates directory

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
