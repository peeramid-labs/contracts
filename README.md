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

3. Setup environment variables

   ```sh
   mkdir .secrets
   cp dev.env.sample .secrets/dev.env
   vi .secrets/dev.env
   ```

4. Compile the smart contracts:

   ```sh
   pnpm hardhat compile
   ```

5. Deploy the smart contracts:
   ```sh
   pnpm hardhat deploy --network <network> --tags <tags>
   ```

## Available Distributions

We are using [Ethereum Distribution System](https://github.com/peeramid-labs/eds) to enable users to deploy their own infrastructure in transparent and decentralized way.

In order to be out of box compatible with the interfaces & notifications of the Rankify platform, any deployment should should be done from the Peeramid Labs Distributor contract ([PeeramidLabsDistributor.sol](./src/distributors/PeeramidLabsDistributor.sol)).

Specific address for distributor deployment can be found in the [deployments](./deployments) folder.

### Meritocratic Autonomous Organization (MAO)

[MAODistribution.sol](./src/distributions/MAODistribution.sol) is used to create a new Meritocratic Autonomous Organization (MAO).

This deployment will create following infrastructure:

- [RankToken](./src/tokens/RankToken.sol) - ERC1155 token used to represent the ranks in the MAO.
- [Governance token](./src/tokens/DistributableGovernanceERC20.sol) - ERC20 token used to represent the governance in the MAO.
- [ACID Distribution](./src/distributions/ArguableVotingTournament.sol) - Arguable Voting Tournament contract used to distribute governance tokens.
- [Aragon OSx DAO](https://aragon.org/) - Aragon DAO used as wrapped smart account that represents the MAO.
- [Aragon Token Voting Plugin](https://github.com/aragon/token-voting-plugin) - Aragon plugin used to vote on proposals within the DAO.

#### How to instantiate

In order to instantiate the MAO distribution, you don't need to deploy a thing. You just need to call the `instantiate` function of the the [PeeramidLabsDistributor.sol](./src/distributors/PeeramidLabsDistributor.sol) contract and specify proper distribution Id and arguments.

```ts
import { MAODistribution } from 'rankify-contracts/types';
const distributorArguments: MAODistribution.DistributorArgumentsStruct = {
  DAOSEttings: {
    daoURI: 'https://example.com/dao',
    subdomain: 'example',
    metadata: ethers.utils.hexlify(ethers.utils.toUtf8Bytes('metadata')),
    tokenName: 'tokenName',
    tokenSymbol: 'tokenSymbol',
  },
  RankifySettings: {
    RankTokenContractURI: 'https://example.com/rank',
    principalCost: RInstanceSettings.PRINCIPAL_COST,
    principalTimeConstant: RInstanceSettings.PRINCIPAL_TIME_CONSTANT,
    metadata: ethers.utils.hexlify(ethers.utils.toUtf8Bytes('metadata')),
    rankTokenURI: 'https://example.com/rank',
  },
};
// const abi = import('../abi/src/distributions/MAODistribution.sol/MAODistribution.json');
// Encode the arguments
const data = ethers.utils.defaultAbiCoder.encode(
  [
    'tuple(tuple(string daoURI, string subdomain, bytes metadata, string tokenName, string tokenSymbol) DAOSEttings, tuple(uint256 principalCost, uint256 principalTimeConstant, string metadata, string rankTokenURI, string RankTokenContractURI) RankifySettings)',
  ],
  [distributorArguments],
);
const distributorsDistId = process.env.DISTRIBUTOR_DIST_ID;
const tx = await distributorContract.instantiate(distributorsDistId, data);
```

In order to get `distributorsDistId` you can call `getDistributions` at `PeeramidLabsDistributor` contract and look for. We will host a public API to get the list of distributions soon.

### ACID Distribution (Autonomous Competence Identification Distribution)

[ArguableVotingTournament.sol](./src/distributions/ArguableVotingTournament.sol) implements a sophisticated tournament system for autonomous competence identification. It uses the Diamond pattern to provide a modular and upgradeable smart contract architecture.

#### Core Components

The distribution deploys a Diamond Proxy with the following facets:

- **EIP712InspectorFacet**: Handles message signing and verification using EIP-712 standard
- **RankifyInstanceMainFacet**: Core tournament logic including game creation, joining, and management
- **RankifyInstanceGameMastersFacet**: Manages voting and proposal submission mechanics
- **RankifyInstanceRequirementsFacet**: Handles participation requirements and constraints
- **DiamondLoupeFacet**: Standard Diamond pattern implementation for facet introspection
- **OwnershipFacet**: Manages contract ownership and permissions

#### Key Features

- Turn-based game mechanics with voting and proposal systems
- EIP-712 compliant message signing for secure interactions
- Modular architecture allowing for future upgrades
- Built-in reentrancy protection
- Integrated with the Rankify protocol for rank token management

## Contributing

We welcome contributions to improve the Rankify smart contracts. Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.
