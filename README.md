# Rankify Contracts

Smart contract infrastructure for [rankify.it](https://rankify.it) - A platform for building bottom-up self-organized organizations with use of autonomous competence identification and continuous voting proposing protocols .


## Architecture

### Core Components

1. **Distribution System**
   - Main protocol entry point to start new community
   - Based on [Ethereum Distribution System](https://github.com/peeramid-labs/eds)
   - Enables decentralized infrastructure deployment
   - Main distributor: [MAODistributor.sol](./src/MAODistributor.sol)

2. **Token System**
   - [RankToken](./src/tokens/RankToken.sol): ERC1155 token for rank representation
   - [DistributableGovernanceERC20](./src/tokens/DistributableGovernanceERC20.sol): ERC20 token for governance
   - [Rankify Token](./src/tokens/Rankify.sol): ERC20 token implementing entrance gating

3. **Diamond Pattern Implementation**
   - **Core Facets:**
     - EIP712InspectorFacet: EIP-712 message signing and verification
     - RankifyInstanceMainFacet: Tournament core logic
     - RankifyInstanceGameMastersFacet: Voting and proposal mechanics
     - RankifyInstanceRequirementsFacet: Participation requirements
     - DiamondLoupeFacet: Facet introspection
     - OwnershipFacet: Contract ownership management

## Available Distributions

### 1. Meritocratic Autonomous Organization (MAO)

The MAO distribution ([MAODistribution.sol](./src/distributions/MAODistribution.sol)) creates a complete infrastructure for a Meritocratic Autonomous Organization, including:
- Rank and governance tokens
- ACID Distribution system
- Token voting capabilities

### 2. ACID Distribution

The Autonomous Competence Identification Distribution ([ArguableVotingTournament.sol](./src/distributions/ArguableVotingTournament.sol)) implements:
- Turn-based game mechanics
- Voting and proposal systems
- EIP-712 compliant message signing
- Modular architecture

## Development Setup

### Prerequisites

- Node.js (LTS version)
- pnpm package manager
- Git

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/rankify-it/contracts.git
   cd contracts
   ```

2. Install dependencies:
   ```sh
   pnpm install
   ```

3. Setup environment variables:
   ```sh
   mkdir .secrets
   cp dev.env.sample .secrets/dev.env
   vi .secrets/dev.env
   # ...
   . ./.secrets/dev.env
   ```

### Build and Test

1. Compile contracts:
   ```sh
   pnpm build
   ```

2. Run tests:
   ```sh
   pnpm test
   # or run tests in parallel
   pnpm test:parallel
   ```

3. Run linting:
   ```sh
   pnpm lint
   # fix linting issues
   pnpm lint:fix
   ```

### Deployment

1. Deployment:
   ```sh
   # deploy EDS dependency (only once per network)
   git clone https://github.com/peeramid-labs/eds.git
   cd eds
   latestTag=$(git describe --tags "$(git rev-list --tags --max-count=1)")
   git checkout $latestTag
   pnpm install && pnpm hardhat deploy --network <network> --tags code_index
   cd ..

   pnpm hardhat deploy --network <network> --tags <tags>
   # or
   pnpm anvil:deploy
   # or to run next step:
   ./playbook/utils/deploy-to-local-anvil.sh
   ```
## Interacting with Contracts

We provide helper tools in form of `playbooks` - small hardhat runtime scripts that can be used to set contract state for sake of testing and verification.

1. Running local playbooks:
   ```sh
   pnpm hardhat --network $NETWORK addDistribution
   pnpm hardhat --network $NETWORK createSubject --token-name xxx
   pnpm hardhat --network $NETWORK createGame --rankify-instance-address $INSTANCE_ADDRESS
   ```
2. Using viem to interact with contracts:

In (abi)[./abi] directory you can find generated abi files for all contracts, including .ts files to give viem/wagmi a better experience.

Copy these files to your working project and import them using `import { ... } from './abi/...';`

We provide this packaged within our sdk: [`@peeramid-labs/sdk`](https://github.com/peeramid-labs/sdk)

3. Get all interfaces and signatures:

You can get all of the function signatures to debug your application via the following command:
```
pnpm hardhat getSuperInterface > interface.json
```
This will generate a file called `interface.json` in the current directory.

You can also use script in `./scripts/getSuperInterface.ts` to get ethers js object


## Project Structure

```
contracts/
├── src/                    # Smart contract source files
│   ├── abstracts/         # Abstract contracts
│   ├── distributions/     # Distribution implementations
│   ├── facets/           # Diamond pattern facets
│   ├── interfaces/       # Contract interfaces
│   ├── libraries/        # Shared libraries
│   └── tokens/           # Token implementations
├── test/                  # Test files
├── scripts/              # Deployment and utility scripts
└── deployments/          # Deployment artifacts
```
## Documentation

Documentation is generated via docgen and is available at [docs.rankify.it](https://docs.rankify.it)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Add your changes, add changeset: `pnpm changeset`
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Create a Pull Request

## License

This project is licensed under the MIT License.

## Security

For security concerns, please email sirt@peeramid.xyz
