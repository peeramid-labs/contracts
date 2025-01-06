import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, hardhatArguments } from 'hardhat';
import { LibSemver } from '../types/src/distributions/MAODistribution';
import { CodeIndex } from '@peeramid-labs/eds/types';
import CodeIndexAbi from '@peeramid-labs/eds/abi/src/CodeIndex.sol/CodeIndex.json';
import { MintSettingsStruct } from '../types/src/tokens/DistributableGovernanceERC20.sol/DistributableGovernanceERC20';
import { ArguableVotingTournament } from '../types/src/distributions/ArguableVotingTournament';
import { RInstance_MIN_PLAYERS } from '../test/utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer, DAO } = await getNamedAccounts();
  const codeIndexContract = (await ethers.getContractAt(
    CodeIndexAbi,
    '0xc0D31d398c5ee86C5f8a23FA253ee8a586dA03Ce',
  )) as CodeIndex;

  let _trustedForwarder = ethers.constants.AddressZero;
  let _distributionName = ethers.utils.formatBytes32String('MAO');
  let _distributionVersion: LibSemver.VersionStruct = {
    major: 0,
    minor: 1,
    patch: 0,
  };

  const log = (message: string) => {
    if (process.env.NODE_ENV !== 'TEST') {
      console.log(`[MAO Deploy] ${message}`);
    }
  };

  log('Starting MAO deployment...');

  const SACMDeployment = await deployments.get('SimpleAccessManager');
  const accessManagerCode = await hre.ethers.provider.getCode(SACMDeployment.address);
  const accessManagerId = ethers.utils.keccak256(accessManagerCode);

  const rankTokenDeployment = await deployments.deploy('RankToken', {
    from: deployer,
    skipIfAlreadyDeployed: true,
    args: [
      'https://assets.vote4best.app/rank',
      'https://assets.vote4best.app/musicRankToken.json',
      ethers.constants.AddressZero,
    ],
  });

  log('RankToken deployed, registering code...');

  const rankTokenCode = await hre.ethers.provider.getCode(rankTokenDeployment.address);
  const rankTokenCodeId = ethers.utils.keccak256(rankTokenCode);
  const registerAddress = await codeIndexContract.get(rankTokenCodeId);
  if (registerAddress === ethers.constants.AddressZero) {
    log('Registering RankToken in CodeIndex...');
    (await codeIndexContract.register(rankTokenDeployment.address)).wait(1);
  } else {
    log('RankToken already registered in CodeIndex');
  }

  const initializerDeployment = await deploy('RankifyInstanceInit', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });

  log('Deploying RankifyInstanceInit...');

  const initializerDeploymentCode = await hre.ethers.provider.getCode(initializerDeployment.address);
  const initializerDeploymentCodeId = ethers.utils.keccak256(initializerDeploymentCode);
  const initializerDeploymentCodeIdAddress = await codeIndexContract.get(initializerDeploymentCodeId);
  if (initializerDeploymentCodeIdAddress === ethers.constants.AddressZero) {
    await (await codeIndexContract.register(initializerDeployment.address)).wait(1);
  } else {
    log('Initializer already registered in CodeIndex');
  }

  const initializerAdr = initializerDeployment.address;
  const initializerSelector = '0x00000000';

  const distributionName = ethers.utils.formatBytes32String('ArguableVotingTournament');
  const version = {
    major: 1,
    minor: 0,
    patch: 0,
  };
  const loupeFacetDeployment = await deploy('DiamondLoupeFacet', {
    from: deployer,
    skipIfAlreadyDeployed: true,
    gasLimit: 8000000,
  });

  const inspectorFacetDeployment = await deploy('EIP712InspectorFacet', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });

  const RankifyMainFacetDeployment = await deploy('RankifyInstanceMainFacet', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });

  const RankifyReqsFacetDeployment = await deploy('RankifyInstanceRequirementsFacet', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });

  const RankifyGMFacetDeployment = await deploy('RankifyInstanceGameMastersFacet', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });

  const OwnershipFacetDeployment = await deploy('OwnershipFacet', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });

  const addresses: ArguableVotingTournament.ArguableTournamentAddressesStruct = {
    loupeFacet: loupeFacetDeployment.address,
    inspectorFacet: inspectorFacetDeployment.address,
    RankifyMainFacet: RankifyMainFacetDeployment.address,
    RankifyReqsFacet: RankifyReqsFacetDeployment.address,
    RankifyGMFacet: RankifyGMFacetDeployment.address,
    OwnershipFacet: OwnershipFacetDeployment.address,
  };

  const arguableVotingTournamentDeployment = await deploy('ArguableVotingTournament', {
    from: deployer,
    gasLimit: 8000000,
    estimatedGasLimit: 8000000,
    skipIfAlreadyDeployed: true,
    args: [initializerAdr, initializerSelector, distributionName, version, addresses],
  });

  log('Deploying ArguableVotingTournament...');

  const arguableVotingTournamentDeploymentCode = await hre.ethers.provider.getCode(
    arguableVotingTournamentDeployment.address,
  );
  const arguableVotingTournamentDeploymentCodeId = ethers.utils.keccak256(arguableVotingTournamentDeploymentCode);
  const arguableVotingTournamentDeploymentRegisterAddress = await codeIndexContract.get(
    arguableVotingTournamentDeploymentCodeId,
  );
  if (arguableVotingTournamentDeploymentRegisterAddress === ethers.constants.AddressZero) {
    log('Registering ArguableVotingTournament in CodeIndex...');
    await (await codeIndexContract.register(arguableVotingTournamentDeployment.address)).wait(1);
  } else {
    log('ArguableVotingTournament already registered in CodeIndex');
  }

  const arguableVotingTournamentCode = await hre.ethers.provider.getCode(arguableVotingTournamentDeployment.address);
  const arguableVotingTournamentCodeId = ethers.utils.keccak256(arguableVotingTournamentCode);
  const mintSettings: MintSettingsStruct = {
    amounts: [],
    receivers: [],
  };
  const govTokenDeployment = await deploy('DistributableGovernanceERC20', {
    from: deployer,
    skipIfAlreadyDeployed: true,
    args: ['TokenName', 'tkn', mintSettings, ethers.constants.AddressZero],
  });

  log('Deploying GovernanceToken...');

  const govTokenDeploymentCode = await hre.ethers.provider.getCode(govTokenDeployment.address);
  const govTokenDeploymentCodeId = ethers.utils.keccak256(govTokenDeploymentCode);
  const govTokenDeploymentCodeIdAddress = await codeIndexContract.get(govTokenDeploymentCodeId);
  if (govTokenDeploymentCodeIdAddress === ethers.constants.AddressZero) {
    log('Registering GovernanceToken in CodeIndex...');
    await (await codeIndexContract.register(govTokenDeployment.address)).wait(1);
  } else {
    log('GovernanceToken already registered in CodeIndex');
  }

  const rankifyToken = await deployments.get('Rankify');
  const result = await deploy('MAODistribution', {
    from: deployer,
    skipIfAlreadyDeployed: true,
    args: [
      _trustedForwarder,
      rankifyToken.address,
      DAO,
      rankTokenCodeId,
      arguableVotingTournamentCodeId,
      accessManagerId,
      govTokenDeploymentCodeId,
      _distributionName,
      _distributionVersion,
      RInstance_MIN_PLAYERS,
    ],
  });

  log('Deploying MAODistribution...');

  const MaoDistrCode = await hre.ethers.provider.getCode(result.address);
  const MaoDistrCodeId = ethers.utils.keccak256(MaoDistrCode);
  const MaoDistrCodeIdAddress = await codeIndexContract.get(MaoDistrCodeId);
  if (MaoDistrCodeIdAddress === ethers.constants.AddressZero) {
    log('Registering MAODistribution in CodeIndex...');
    await (await codeIndexContract.register(result.address)).wait(1);
  } else {
    log('MAODistribution already registered in CodeIndex');
  }

  log('MAO deployment completed successfully!');

  return;
};

export default func;
func.dependencies = ['sacm', 'distributor', 'rankify'];
func.tags = ['MAO'];
