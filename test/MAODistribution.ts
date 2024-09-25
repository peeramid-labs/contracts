/* global  ethers */

import { deployments, ethers } from 'hardhat';
import hre from 'hardhat';
import { expect } from 'chai';
import { MAODistribution, PeeramidLabsDistributor, Rankify } from '../types';
import { DistributorArgumentsStruct } from '../types/src/distributions/MAODistribution.sol/MAODistribution';
import utils, { setupTest } from './utils';
describe('MAODistribution', async function () {
  let contract: MAODistribution;
  let distributorContract: PeeramidLabsDistributor;
  let maoId: string;
  let rankify: Rankify;
  beforeEach(async function () {
    const setup = await setupTest();
    contract = setup.env.maoDistribution;
    const maoCode = await hre.ethers.provider.getCode(contract.address);
    maoId = ethers.utils.keccak256(maoCode);
    distributorContract = setup.env.distributor;
    rankify = setup.env.rankifyToken;
  });
  it('Can instantiate a distribution', async () => {
    // Define the arguments for the instantiate function
    const distributorArguments: DistributorArgumentsStruct = {
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
    // const abi = import('../abi/src/distributions/MAODistribution.sol/MAODistribution.json');
    // Encode the arguments
    const data = ethers.utils.defaultAbiCoder.encode(
      [
        'tuple(tuple(string daoURI, string subdomain, bytes metadata, string tokenName, string tokenSymbol) DAOSEttings, tuple(uint256 timePerTurn, uint256 maxPlayersSize, uint256 minPlayersSize, uint256 timeToJoin, uint256 maxTurns, uint256 voteCredits, uint256 gamePrice, address paymentToken, uint256 joinGamePrice, string metadata, string rankTokenURI, string RankTokenContractURI) ACIDSettings)',
      ],
      [distributorArguments],
    );
    // const tx = contract.instantiate(data);
    const distributorsDistId = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(['bytes32', 'address'], [maoId, ethers.constants.AddressZero]),
    );
    const tx = distributorContract.instantiate(distributorsDistId, data);
    const receipt = await (await tx).wait(1);
    await expect(tx).not.reverted;
    expect((await distributorContract.functions.getDistributions()).length).to.equal(1);

    const superInterface = utils.getSuperInterface();
    const knownTopicHashes = new Set<string>();
    for (const fragment of Object.values(superInterface.fragments)) {
      if (fragment.type === 'event') {
        knownTopicHashes.add(superInterface.getEventTopic(fragment as any));
      }
    }
    const parsed = receipt.logs
      .filter(log => knownTopicHashes.has(log.topics[0]))
      .map(log => ({
        rawLog: log,
        ...superInterface.parseLog(log),
      }));
    console.log(parsed);

    // const x = await distributorContract.functions.
  });
  describe('when distribution is instantiated', async () => {
    it('');
  });
});
