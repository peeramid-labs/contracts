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

3. Compile the smart contracts:

   ```sh
   pnpm hardhat compile
   ```

4. Deploy the smart contracts:
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
import {  MAODistribution } from 'rankify-contracts/types';
const distributorArguments: MAODistribution.DistributorArgumentsStruct = {
        DAOSEttings: {
          daoURI: 'https://example.com/dao',
          subdomain: 'example',
          metadata: ethers.utils.hexlify(ethers.utils.toUtf8Bytes('metadata')),
          tokenName: 'tokenName',
          tokenSymbol: 'tokenSymbol',
        },
        ACIDSettings: {
          RankTokenContractURI: 'https://example.com/rank',
          gamePrice: 1,
          joinGamePrice: 1,
          maxPlayersSize: 16,
          maxTurns: 1,
          metadata: ethers.utils.hexlify(ethers.utils.toUtf8Bytes('metadata')),
          minPlayersSize: 4,
          paymentToken: rankify.address,
          rankTokenURI: 'https://example.com/rank',
          timePerTurn: 1,
          timeToJoin: 1,
          voteCredits: 14,
        },
      };
const data = ethers.utils.defaultAbiCoder.encode(
        [
          'tuple(tuple(string daoURI, string subdomain, bytes metadata, string tokenName, string tokenSymbol) DAOSEttings, tuple(uint256 timePerTurn, uint256 maxPlayersSize, uint256 minPlayersSize, uint256 timeToJoin, uint256 maxTurns, uint256 voteCredits, uint256 gamePrice, address paymentToken, uint256 joinGamePrice, string metadata, string rankTokenURI, string RankTokenContractURI) ACIDSettings)',
        ],
        [distributorArguments],
      );
      const distributorsDistId = process.env.DISTRIBUTOR_DIST_ID;
      const tx = await distributorContract.instantiate(distributorsDistId, data);

```

In order to get `distributorsDistId` you can call `getDistributions` at `PeeramidLabsDistributor` contract and look for. We will host a public API to get the list of distributions soon.


### ACID distribution

[ArguableVotingTournament.sol](./src/distributions/ArguableVotingTournament.sol) is used to distribute governance tokens to the participants of the MAO by conducting autonomous competence identification tournaments.

This distribution deploys the Diamond Proxy that contains the following facets:

- [EIP712InspectorFacet](./src/facets/EIP712InspectorFacet.sol) - Facet that contains the main logic of the distribution.
- [RankifyInstanceMainFacet](./src/facets//RankifyInstanceMainFacet.sol) - Facet that contains the main logic of the distribution.
- [RankifyGameMastersFacetFacet](./src/facets/RankifyInstanceGameMastersFacet.sol) - Facet that contains the main logic of the distribution.
- [RankifyInstanceGameOwnersFacet](./src/facets/RankifyInstanceGameOwnersFacet.sol) - Facet that contains the ownable logic of the distribution. (NB this will be deprecated)
- [RankifyInstanceRequirementsFacet](./src/facets/RankifyInstanceRequirementsFacet.sol) - Facet that contains the requirements logic of the distribution.

To understand how it works further please refer to [docs.rankify.it](https://docs.rankify.it/governance) or ask us a question in [Discord](https://discord.gg/EddGgGUuWC)


## Contributing

We welcome contributions to improve the Rankify smart contracts. Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.
