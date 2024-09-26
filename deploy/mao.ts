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

  const rankTokenDeployment = await deployments.deploy('RankToken', {
    from: deployer,
    skipIfAlreadyDeployed: true,
    args: [
      'https://assets.vote4best.app/rank',
      'https://assets.vote4best.app/musicRankToken.json',
      ethers.constants.AddressZero,
    ],
  });
  await codeIndexContract.register(rankTokenDeployment.address);
  const rankTokenCode = await hre.ethers.provider.getCode(rankTokenDeployment.address);
  const rankTokenCodeId = ethers.utils.keccak256(rankTokenCode);

  const initializerDeployment = await deploy('RankifyInstanceInit', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });
  await (await codeIndexContract.register(initializerDeployment.address)).wait(1);
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

  const RankifyOwnerFacetDeployment = await deploy('RankifyInstanceGameOwnersFacet', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });

  const OwnershipFacetDeployment = await deploy('OwnershipFacet', {
    from: deployer,
    skipIfAlreadyDeployed: true,
  });

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
  await codeIndexContract.register(result.address);
  const code = await hre.ethers.provider.getCode(result.address);
  const codeId = ethers.utils.keccak256(code);
  console.log('MAO deployed at', result.address, 'codeId', codeId);
  return;
};

export default func;
func.dependencies = ['sacm', 'distributor', 'rankify'];
func.tags = ['MAO'];
