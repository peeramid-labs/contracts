/* global  ethers */

import { deployments, ethers, getNamedAccounts } from 'hardhat';
import hre from 'hardhat';
import { expect } from 'chai';
import { MAODistribution, DAODistributor, Rankify, RankifyDiamondInstance } from '../types';
import { setupTest } from './utils';

import { getCodeIdFromArtifact } from '../scripts/getCodeId';
import addDistribution from '../scripts/addDistribution';
import { generateDistributorData } from '../scripts/libraries/generateDistributorData';
import { AdrSetupResult } from '../scripts/setupMockEnvironment';

describe('MAODistribution', async function () {
  let contract: MAODistribution;
  let distributorContract: DAODistributor;
  let maoId: string;
  let rankify: Rankify;
  let addr: AdrSetupResult;
  let distrId: string;
  beforeEach(async function () {
    const setup = await setupTest();
    addr = setup.adr;
    contract = setup.env.maoDistribution;
    const maoCode = await hre.ethers.provider.getCode(contract.address);
    maoId = ethers.utils.keccak256(maoCode);
    distributorContract = setup.env.distributor;

    rankify = setup.env.rankifyToken;

    distrId = await hre.run('defaultDistributionId');
    if (!distrId) throw new Error('Distribution name not found');
    if (typeof distrId !== 'string') throw new Error('Distribution name must be a string');
  });
  it('only owner can add distribution', async () => {
    await expect(
      distributorContract.addNamedDistribution(distrId, maoId, ethers.constants.AddressZero),
    ).to.revertedWithCustomError(distributorContract, 'AccessControlUnauthorizedAccount');
    await expect(
      distributorContract
        .connect(addr.gameOwner.wallet)
        .addNamedDistribution(distrId, maoId, ethers.constants.AddressZero),
    ).to.emit(distributorContract, 'DistributionAdded');
  });
  describe('when distribution was added', async () => {
    beforeEach(async () => {
      const { owner } = await hre.getNamedAccounts();
      const signer = await hre.ethers.getSigner(owner);
      await addDistribution(hre)({
        distrId: await getCodeIdFromArtifact(hre)('MAODistribution'),
        signer,
        name: distrId,
      });
    });
    it('Can instantiate a distribution', async () => {
      const distributorArguments: MAODistribution.DistributorArgumentsStruct = {
        tokenSettings: {
          tokenName: 'tokenName',
          tokenSymbol: 'tokenSymbol',
        },
        rankifySettings: {
          rankTokenContractURI: 'https://example.com/rank',
          rankTokenURI: 'https://example.com/rank',
          principalCost: 1,
          principalTimeConstant: 1,
        },
      };
      // Encode the arguments using generateDistributorData
      const data = generateDistributorData(distributorArguments);

      const token = await deployments.get('Rankify');
      const { owner } = await getNamedAccounts();
      const oSigner = await ethers.getSigner(owner);
      const tokenContract = new ethers.Contract(token.address, token.abi, oSigner) as Rankify;
      await tokenContract.mint(oSigner.address, ethers.utils.parseEther('100'));
      await tokenContract.approve(distributorContract.address, ethers.constants.MaxUint256);

      const tx = await distributorContract.connect(oSigner).instantiate(distrId, data);
      await expect(tx).not.reverted;
      expect((await distributorContract.functions.getDistributions()).length).to.equal(1);
      const filter = distributorContract.filters.Instantiated();
      const evts = await distributorContract.queryFilter(filter);
      expect(evts.length).to.equal(1);

      const ACIDContract = (await ethers.getContractAt(
        'RankifyDiamondInstance',
        evts[0].args.instances[2],
      )) as RankifyDiamondInstance;
      expect((await ACIDContract.functions['getGM(uint256)'](0))[0]).to.equal(ethers.constants.AddressZero);
    });
  });
});
