import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { expect } from 'chai';
import { Diamond, DiamondDistribution, DiamondDistribution__factory } from '../../types';

describe('DiamondDistribution', function () {
  let diamondDistribution: DiamondDistribution;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  beforeEach(async function () {
    const DiamondDistribution = (await ethers.getContractFactory(
      'DiamondDistribution',
    )) as DiamondDistribution__factory;
    [owner, addr1, addr2] = await ethers.getSigners();
    diamondDistribution = await DiamondDistribution.deploy(await owner.getAddress());
    await diamondDistribution.deployed();
  });

  it('should emit Distributed event', async function () {
    expect(await diamondDistribution.instantiate()).to.emit(diamondDistribution, 'Distributed');
  });

  it('returned address shall be diamond proxy contract', async () => {
    const tx = await diamondDistribution.instantiate();

    const receipt = await tx.wait(1);
    const logs = receipt.logs;
    for (const log of logs) {
      const event = diamondDistribution.interface.parseLog(log);
      if (event.name === 'Distributed') {
        const ownerAddress = event.args[0];
        const diamondAddress = event.args[1][0];
        expect(ownerAddress).to.be.eq(await owner.getAddress());
        const dContract = await ethers.getContractAt('Diamond', diamondAddress);
        expect(await dContract['foo']).to.be.revertedWith('Diamond: Function does not exist');
        break;
      }
      expect(false).to.be.true;
    }
  });

  it('should read sources', async function () {});
  it('Should read metadata', async function () {
    const metadata = await diamondDistribution.getMetadata();
    expect(metadata).to.equal('Diamond Distributor');
  });
});
