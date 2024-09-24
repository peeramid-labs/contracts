import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, hardhatArguments } from 'hardhat';
import { ArguableVotingTournament, LibSemver__factory, PeeramidLabsDistributor } from '../types';
import { MAODistribution } from '../types';
import { LibSemver } from '../types/src/distributions/MAO.sol/MAODistribution';
import { activeContractsList } from '@aragon/osx-ethers';
import { CodeIndex } from '@peeramid-labs/eds/types';
import CodeIndexAbi from '@peeramid-labs/eds/abi/src/CodeIndex.sol/CodeIndex.json';
import { MintSettingsStruct } from '../types/src/tokens/DistributableGovernanceERC20.sol/DistributableGovernanceERC20';
console.log('network', hardhatArguments);
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  hre.tracer.enabled = true;
  console.log('deploying MAO');
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const network: keyof typeof activeContractsList =
    process.env.NODE_ENV === 'TEST' ? 'arbitrum' : (hardhatArguments.network as keyof typeof activeContractsList);
  console.log('network', network, process.env.NODE_ENV);
  if (!network) throw new Error('Network not provided');
  const { deployer, owner } = await getNamedAccounts();

  const codeIndexContract = (await ethers.getContractAt(
    CodeIndexAbi,
    '0xc0D31d398c5ee86C5f8a23FA253ee8a586dA03Ce',
  )) as CodeIndex;

  let _tokenVotingPluginRepo = activeContractsList[network]['token-voting-repo'];
  let _daoFactory = activeContractsList[network].DAOFactory;
  //   let govBase = activeContractsList[network].g
  let _trustedForwarder = ethers.constants.AddressZero;
  let _distributionName = ethers.utils.formatBytes32String('MAO');
  let _distributionVersion: LibSemver.VersionStruct = {
    major: 0,
    minor: 1,
    patch: 0,
  };

  const SACMDeployment = await deployments.get('SimpleAccessManager');
  const accessManagerCode = await hre.ethers.provider.getCode(SACMDeployment.address);
  const accessManagerId = ethers.utils.keccak256(accessManagerCode);
  console.log('accessManagerId:', accessManagerId);

  const rankTokenDeployment = await deployments.deploy('RankToken', {
    from: deployer,
    skipIfAlreadyDeployed: true,
    args: [
      'https://assets.vote4best.app/rank',
      'https://assets.vote4best.app/musicRankToken.json',
      ethers.constants.AddressZero,
    ],
  });
  console.log('RankToken deployed at', rankTokenDeployment.address);
  await codeIndexContract.register(rankTokenDeployment.address);
  const rankTokenCode = await hre.ethers.provider.getCode(rankTokenDeployment.address);
  const rankTokenCodeId = ethers.utils.keccak256(rankTokenCode);

  const initializerDeployment = await deploy('RankifyInstanceInit', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });
  console.log('RankifyInstanceInit deployed at', initializerDeployment.address);
  await (await codeIndexContract.register(initializerDeployment.address)).wait(1);

  const initializerCode = await hre.ethers.provider.getCode(initializerDeployment.address);
  const initializerAdr = initializerDeployment.address;

  console.log('initializerId', initializerAdr);
  const testInitAddr = ethers.constants.AddressZero;

  console.log('testInitAddr', testInitAddr);
  const initializerSelector = '0x00000000';
  console.log('initializerSelector', initializerSelector);

  const distributionName = ethers.utils.formatBytes32String('ArguableVotingTournament');
  const version = {
    major: 1,
    minor: 0,
    patch: 0,
  };
  console.log('deploying ArguableVotingTournament');
  const loupeFacetDeployment = await deploy('DiamondLoupeFacet', {
    from: deployer,
    skipIfAlreadyDeployed: true,
    gasLimit: 8000000,
  });
  console.log('LoupeFacet deployed at', loupeFacetDeployment.address);

  const inspectorFacetDeployment = await deploy('EIP712InspectorFacet', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });
  console.log('InspectorFacet deployed at', inspectorFacetDeployment.address);

  const RankifyMainFacetDeployment = await deploy('RankifyInstanceMainFacet', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });
  console.log('RankifyMainFacet deployed at', RankifyMainFacetDeployment.address);

  const RankifyReqsFacetDeployment = await deploy('RankifyInstanceRequirementsFacet', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });
  console.log('RankifyReqsFacet deployed at', RankifyReqsFacetDeployment.address);

  const RankifyGMFacetDeployment = await deploy('RankifyInstanceGameMastersFacet', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });
  console.log('RankifyGMFacet deployed at', RankifyGMFacetDeployment.address);

  const RankifyOwnerFacetDeployment = await deploy('RankifyInstanceGameOwnersFacet', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });
  console.log('RankifyOwnerFacet deployed at', RankifyOwnerFacetDeployment.address);

  const OwnershipFacetDeployment = await deploy('OwnershipFacet', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });
  console.log('OwnershipFacet deployed at', OwnershipFacetDeployment.address);

  const arguableVotingTournamentDeployment = await deploy('ArguableVotingTournament', {
    from: deployer,
    gasLimit: 8000000,
    estimatedGasLimit: 8000000,
    skipIfAlreadyDeployed: true,
    args: [
      initializerAdr,
      initializerSelector,
      distributionName,
      version,
      loupeFacetDeployment.address,
      inspectorFacetDeployment.address,
      RankifyMainFacetDeployment.address,
      RankifyReqsFacetDeployment.address,
      RankifyGMFacetDeployment.address,
      RankifyOwnerFacetDeployment.address,
      OwnershipFacetDeployment.address,
    ],
  });
  console.log('ArguableVotingTournament deployed at', arguableVotingTournamentDeployment.address);
  await codeIndexContract.register(arguableVotingTournamentDeployment.address);
  const arguableVotingTournamentCode = await hre.ethers.provider.getCode(arguableVotingTournamentDeployment.address);
  const arguableVotingTournamentCodeId = ethers.utils.keccak256(arguableVotingTournamentCode);

  const mintSettings: MintSettingsStruct = {
    amounts: [],
    receivers: [],
  };
  const govTokenDeployment = await deploy('DistributableGovernanceERC20', {
    from: deployer,
    skipIfAlreadyDeployed: true,
    args: [ethers.constants.AddressZero, 'TokenName', 'tkn', mintSettings, ethers.constants.AddressZero],
  });
  console.log('DistributableGovernanceERC20 deployed at', govTokenDeployment.address);
  await codeIndexContract.register(govTokenDeployment.address);
  const govTokenCode = await hre.ethers.provider.getCode(govTokenDeployment.address);
  const govTokenCodeId = ethers.utils.keccak256(govTokenCode);

  const result = await deploy('MAODistribution', {
    from: deployer,
    skipIfAlreadyDeployed: true,
    args: [
      _tokenVotingPluginRepo,
      _daoFactory,
      _trustedForwarder,
      rankTokenCodeId,
      arguableVotingTournamentCodeId,
      accessManagerId,
      govTokenCodeId,
      _distributionName,
      _distributionVersion,
    ],
  });
  console.log('MAODistribution deployed at', result.address);
  await codeIndexContract.register(result.address);
  const maoCode = await hre.ethers.provider.getCode(result.address);
  const maoCodeId = ethers.utils.keccak256(maoCode);

  const pDistributor = await deployments.get('PeeramidLabsDistributor');
  const pdContract = (await ethers.getContractAt('PeeramidLabsDistributor', pDistributor.address)).connect(
    await hre.ethers.getSigner(owner),
  ) as PeeramidLabsDistributor;
  await pdContract.addDistribution(maoCodeId, ethers.constants.AddressZero);

  console.log('MAODistribution deployed at', result.address);
};

export default func;
func.dependencies = ['sacm', 'distributor', 'rankify'];
func.tags = ['MAO'];
