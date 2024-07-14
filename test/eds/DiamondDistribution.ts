import { ethers, deployments } from 'hardhat';
import { Signer } from 'ethers';
import { expect } from 'chai';
import {
    CodeIndex,
  DiamondClonable,
  DiamondClonable__factory,
  DiamondCutFacet,
  DiamondCutFacet__factory,
  DiamondLoupeFacet,
  MockDiamondInitialize,
  MockDiamondInitialize__factory,
  MockDiamondDistribution,
  MockInitializedDiamondDistribution__factory,
  TestFacet,
} from '../../types';
import fs from 'fs';
import path from 'path';
import { JsonFragment } from '@ethersproject/abi';
import utils from "../utils"


describe('DiamondDistribution', function () {
  let initializerId: string;
  let initSelector: string;
  let testFacetId: string;
  let loupeFacetId: string
  let codeIndex: CodeIndex
  let superInterface = utils.getSuperInterface();
  let diamondId: string
  let deployer: Signer;
  let addr1: Signer;
  let addr2: Signer;

  beforeEach(async function () {
    await deployments.fixture('code_index'); // This is the key addition
    [deployer, addr1, addr2] = await ethers.getSigners();


    const CodeIndex = await ethers.getContractFactory('CodeIndex');
    const MockDiamondInitialize = (await ethers.getContractFactory(
        'MockDiamondInitialize',
    )) as MockDiamondInitialize__factory;
    const DiamondCutFacet = (await ethers.getContractFactory('DiamondCutFacet')) as DiamondCutFacet__factory;
    const Diamond = (await ethers.getContractFactory('DiamondClonable')) as DiamondClonable__factory;

    const initializerDeployment = await MockDiamondInitialize.deploy()
    const testFacet = await ((await ethers.getContractFactory('TestFacet')).deploy()) as TestFacet;
    const loupeFacet = await ((await ethers.getContractFactory('DiamondLoupeFacet')).deploy()) as DiamondLoupeFacet;
    const cutFacet = await DiamondCutFacet.deploy() as DiamondCutFacet;


    await initializerDeployment.deployed();
    const initCode = await initializerDeployment.provider.getCode(initializerDeployment.address);
    const testFacetCode = await testFacet.provider.getCode(testFacet.address);
    const loupeFacetCode = await loupeFacet.provider.getCode(loupeFacet.address);



    const codeIndexDeployment = await deployments.get('CodeIndex')
    codeIndex =  new ethers.Contract(codeIndexDeployment.address, CodeIndex.interface).connect(deployer) as CodeIndex;
    await codeIndex.register(initializerDeployment.address);
    await codeIndex.register(testFacet.address);
    await codeIndex.register(loupeFacet.address);
    await codeIndex.register(cutFacet.address);
    testFacetId = ethers.utils.keccak256(testFacetCode);
    loupeFacetId = ethers.utils.keccak256(loupeFacetCode);
    initializerId = ethers.utils.keccak256(initCode);
    initSelector = initializerDeployment.interface.getSighash('init');



    const diamond = await Diamond.deploy(ethers.constants.AddressZero, cutFacet.address) as DiamondClonable;
    await codeIndex.register(diamond.address);
    const diamondCode = await diamond.provider.getCode(diamond.address);


    diamondId = ethers.utils.keccak256(diamondCode);

  });

  it('Should emit on initialized', async function () {
    const DiamondDistribution = (await ethers.getContractFactory(
      'MockDiamondDistribution',
    )) as MockInitializedDiamondDistribution__factory;

    const tx = await DiamondDistribution.deploy(
        diamondId,
      testFacetId, loupeFacetId,
      initializerId,
      initSelector
    );
    expect(tx).to.emit(tx.address, 'Initialized');
  });

  it('Should emit respond on facet requests', async function () {
    const DiamondDistribution = (await ethers.getContractFactory(
      'MockDiamondDistribution',
    )) as MockInitializedDiamondDistribution__factory;
    // mockDiamondInitialize;
    const tx = await DiamondDistribution.deploy(
        diamondId,
        testFacetId,loupeFacetId,
        initializerId,
        initSelector);
    await tx.deployed();
    const instantiation = await tx.instantiate();
    const { logs } = await instantiation.wait(1);
    const parsed = logs.map((log) => ({ rawLog: log, ...superInterface.parseLog(log) }));
    const distributionLog = parsed.find((log)=> log?.name === 'Distributed');
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
