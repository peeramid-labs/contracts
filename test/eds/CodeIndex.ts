import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { expect } from 'chai';
import { CodeIndex, TestFacet } from '../../types';

describe('CloneDistributor', function () {
  let codeIndex: CodeIndex;
  let testContract: TestFacet;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  beforeEach(async function () {
    const CodeIndex = await ethers.getContractFactory('CodeIndex');
    [owner, addr1, addr2] = await ethers.getSigners();
    codeIndex = await CodeIndex.deploy() as CodeIndex;
    const TestContract = await ethers.getContractFactory('TestFacet');
    testContract = await TestContract.deploy() as TestFacet;
    await codeIndex.deployed();

  });

  it('should emit Distributed event', async function () {
    const code = await testContract.provider.getCode(testContract.address);
    expect(await codeIndex.register(testContract.address)).to.emit(codeIndex, 'Indexed')
  });

  it('should return address for registered code hash', async function () {
    await codeIndex.register(testContract.address);
    const code = await testContract.provider.getCode(testContract.address);
    const codeHash = ethers.utils.keccak256(code);
    expect(await codeIndex.get(codeHash)).to.equal(testContract.address);
  });

  it('Should revert on registering same code hash', async function () {
    await codeIndex.register(testContract.address);
    await expect(codeIndex.register(testContract.address)).to.be.revertedWithCustomError(codeIndex, 'alreadyExists');
  });

});
