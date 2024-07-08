import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { expect } from 'chai';

describe('CloneDistributor', function () {
  let cloneDistributor: any;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  beforeEach(async function () {
    const CloneDistributor = await ethers.getContractFactory('MockCloneDistributor');
    [owner, addr1, addr2] = await ethers.getSigners();
    cloneDistributor = await CloneDistributor.deploy();
    await cloneDistributor.deployed();
  });

  it('should emit Distributed event', async function () {
    expect(await cloneDistributor.instantiate()).to.emit(cloneDistributor, 'Distributed');
  });

  it('Should read metadata', async function () {
    const metadata = await cloneDistributor.getMetadata();
    expect(metadata).to.equal('MockCloneDistributor');
  });
});
