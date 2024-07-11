import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { expect } from 'chai';
import {
  DiamondLoupeFacet,
  MockDiamondInitialize,
  MockDiamondInitialize__factory,
  MockInitializedDiamondDistribution__factory,
  TestFacet,
} from '../../types';
import fs from 'fs';
import path from 'path';
import { JsonFragment } from '@ethersproject/abi';

const getSuperInterface = () => {
  let mergedArray: JsonFragment[] = [];
  function readDirectory(directory: string) {
    const files = fs.readdirSync(directory);

    files.forEach(file => {
      const fullPath = path.join(directory, file);
      if (fs.statSync(fullPath).isDirectory()) {
        readDirectory(fullPath); // Recurse into subdirectories
      } else if (path.extname(file) === '.json') {
        const fileContents = require('../../' + fullPath); // Load the JSON file
        if (Array.isArray(fileContents)) {
          mergedArray = mergedArray.concat(fileContents); // Merge the array from the JSON file
        }
      }
    });
  }
  const originalConsoleLog = console.log;
  readDirectory('./abi');
  console.log = () => {}; // avoid noisy output
  const result = new ethers.utils.Interface(mergedArray);
  console.log = originalConsoleLog;
  return result;
};

describe('InitializedDiamondDistribution', function () {
  const superInterface = getSuperInterface();
  let cuttedDiamondDistribution: any;
  let mockDiamondInitialize: MockDiamondInitialize;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  beforeEach(async function () {
    const MockDiamondInitialize = (await ethers.getContractFactory(
      'MockDiamondInitialize',
    )) as MockDiamondInitialize__factory;
    [owner, addr1, addr2] = await ethers.getSigners();
    mockDiamondInitialize = await MockDiamondInitialize.deploy();
    await mockDiamondInitialize.deployed();
  });

  it('Should emit on initialized', async function () {
    const CuttedDiamondDistribution = (await ethers.getContractFactory(
      'MockInitializedDiamondDistribution',
    )) as MockInitializedDiamondDistribution__factory;

    // mockDiamondInitialize;
    const tx = await CuttedDiamondDistribution.deploy(
      mockDiamondInitialize.address,
      mockDiamondInitialize.interface.getSighash('init'),
    );
    expect(tx).to.emit(tx.address, 'Initialized');
  });

  it('Should emit respond on facet requests', async function () {
    const CuttedDiamondDistribution = (await ethers.getContractFactory(
      'MockInitializedDiamondDistribution',
    )) as MockInitializedDiamondDistribution__factory;

    // mockDiamondInitialize;
    const tx = await CuttedDiamondDistribution.deploy(
      mockDiamondInitialize.address,
      mockDiamondInitialize.interface.getSighash(mockDiamondInitialize.interface.functions['init(bytes)']),
    );
    await tx.deployed();
    const instantiation = await tx.instantiate();
    const { logs } = await instantiation.wait(1);
    const parsed = logs.map(log => ({ rawLog: log, ...superInterface.parseLog(log) }));
    const distributionLog = parsed.find(log => log?.name === 'Distributed');
    expect(!!distributionLog).to.be.true;
    if (distributionLog) {
      expect(distributionLog.args.instances.length).to.be.equal(1);
      const diamondInstanceAddress = distributionLog.args.instances[0];

      const d = (await ethers.getContractAt('TestFacet', diamondInstanceAddress)) as TestFacet;
      const l = (await ethers.getContractAt('DiamondLoupeFacet', diamondInstanceAddress)) as DiamondLoupeFacet;

      expect(await d.ping()).to.be.equal('pong');
      expect((await l.facets()).length).to.be.equal(3);
    }
  });
});
