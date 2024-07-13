import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { expect } from 'chai';

describe('CloneDistribution', function () {
  let CloneDistribution: any;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  beforeEach(async function () {
    const CloneDistribution = await ethers.getContractFactory('MockCloneDistribution');
    [owner, addr1, addr2] = await ethers.getSigners();
    CloneDistribution = await CloneDistribution.deploy();
    await CloneDistribution.deployed();
  });

  it('should emit Distributed event', async function () {
    expect(await CloneDistribution.instantiate()).to.emit(CloneDistribution, 'Distributed');
  });

  it('Should read metadata', async function () {
    const metadata = await CloneDistribution.getMetadata();
    expect(metadata).to.equal('MockCloneDistribution');
  });
});
