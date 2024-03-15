import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ManagedAssetsFactory, RankToken, RankifyDiamondInstance, RankifyInstanceInit__factory } from '../types';
import { ethers } from 'hardhat';
import {
  RANKIFY_INSTANCE_CONTRACT_NAME,
  RANKIFY_INSTANCE_CONTRACT_VERSION,
  RInstance_TIME_PER_TURN,
  RInstance_MAX_PLAYERS,
  RInstance_MIN_PLAYERS,
  RInstance_MAX_TURNS,
  RInstance_TIME_TO_JOIN,
  RInstance_GAME_PRICE,
  RInstance_JOIN_GAME_PRICE,
  RInstance_NUM_WINNERS,
  RInstance_VOTE_CREDITS,
  RInstance_SUBJECT,
} from '../test/utils';

import { getProcessEnv } from '../scripts/libraries/utils';
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer, owner } = await getNamedAccounts();
  const managedAssetsFactoryArtifact = await deployments.getArtifact('ManagedAssetsFactory');
  const deployment = await deploy('ManagedAssetsFactory', {
    log: true,
    contract: managedAssetsFactoryArtifact,
    from: deployer,
    args: [deployer],
    skipIfAlreadyDeployed: true,
  });
  const deploymentArgs =
    process.env.NODE_ENV === 'TEST'
      ? {
          assetTemplateUri: 'test test template asset',
          managerTemplateUri: 'test test templated manager',
          assetUri: 'test test subject',
          managerUri: 'test test manager',

        }
      : {
          assetTemplateUri: getProcessEnv(false, 'NEW_ASSET_TEMPLATE_URI'),
          managerTemplateUri: getProcessEnv(false, 'NEW_MANAGER_TEMPLATE_URI'),
          assetUri: getProcessEnv(false, 'NEW_ASSET_MANAGER_URI'),
          managerUri: getProcessEnv(false, 'NEW_MANAGER_URI'),
        };
  const rankFactory = (await ethers.getContractAt(deployment.abi, deployment.address)).connect(
    owner,
  ) as ManagedAssetsFactory;
  const rankTokenDeployment = await deployments.get('RankToken');
  const rankifyTokenDeployment = await deployments.get('RankifyToken');
  const rankifyInstanceDeployment = await deployments.get('RankifyInstance');
  const rankContract = new ethers.Contract(rankTokenDeployment.address, rankTokenDeployment.abi) as RankToken;
  const rankTokenInitSelectors = [
    ethers.utils.Interface.getSighash(rankContract.interface.functions['setURI(string)']),
    ethers.utils.Interface.getSighash(rankContract.interface.functions['setContractURI(string)']),
  ];
  await rankFactory.addAssetTemplate(
    rankTokenDeployment.address,
    deploymentArgs.assetTemplateUri,
    rankTokenInitSelectors,
  );
  const instanceContract = new ethers.Contract(
    rankifyInstanceDeployment.address,
    rankifyInstanceDeployment.abi,
    hre.ethers.provider.getSigner(deployer),
  ) as RankifyDiamondInstance;
  const initializerFn =
    instanceContract.interface.functions[
      'init(string,string,(uint256,uint256,uint256,address,uint256,uint256,uint256,uint256,uint256,uint256,string,address))'
    ];

  const tokenURI = process.env.NODE_ENV === 'TEST' ? 'test test token uri' : getProcessEnv(false, 'RANKIFY_TOKEN_URI');
  const contractURI =
    process.env.NODE_ENV === 'TEST' ? 'test test contract uri' : getProcessEnv(false, 'RANKIFY_CONTRACT_URI');
  await rankFactory.addManagementTemplate(rankifyInstanceDeployment.address, deploymentArgs.managerTemplateUri, [
    ethers.utils.Interface.getSighash(initializerFn),
  ]);

  await rankFactory.deployAsset(deploymentArgs.assetTemplateUri, deploymentArgs.assetUri, [tokenURI, contractURI]);

  const assetAddress = await rankFactory.getAssetAddress(deploymentArgs.assetUri);
  const gameInitializer =
    process.env.NODE_ENV === 'TEST'
      ? {
          timePerTurn: RInstance_TIME_PER_TURN,
          maxPlayersSize: RInstance_MAX_PLAYERS,
          minPlayersSize: RInstance_MIN_PLAYERS,
          maxTurns: RInstance_MAX_TURNS,
          rankTokenAddress: assetAddress,
          timeToJoin: RInstance_TIME_TO_JOIN,
          gamePrice: RInstance_GAME_PRICE,
          joinGamePrice: RInstance_JOIN_GAME_PRICE,
          numWinners: RInstance_NUM_WINNERS,
          voteCredits: RInstance_VOTE_CREDITS,
          subject: RInstance_SUBJECT,
          rankifyToken: rankifyTokenDeployment.address,
        }
      : {
          timePerTurn: getProcessEnv(false, 'TIME_PER_TURN'),
          maxTurns: getProcessEnv(false, 'MAX_TURNS'),
          maxPlayersSize: getProcessEnv(false, 'MAX_PLAYERS'),
          minPlayersSize: getProcessEnv(false, 'MIN_PLAYERS'),
          rankTokenAddress: assetAddress,
          timeToJoin: getProcessEnv(false, 'TIME_TO_JOIN'),
          gamePrice: ethers.utils.parseEther(getProcessEnv(false, 'GAME_PRICE_ETH')),
          joinGamePrice: ethers.utils.parseEther(getProcessEnv(false, 'JOIN_GAME_PRICE_ETH')),
          numWinners: getProcessEnv(false, 'NUM_WINNERS'),
          voteCredits: getProcessEnv(false, 'VOTE_CREDITS'),
          subject: getProcessEnv(false, 'SUBJECT'),
          rankifyToken: rankifyTokenDeployment.address,
        };


        instanceContract.interface.encodeFunctionData("init", ["", "", gameInitializer]);

  const abiEncoder = new ethers.utils.AbiCoder().encode(initializerFn.inputs,gameInitializer)
  await rankFactory.deployAssetManager(deploymentArgs.assetUri, deploymentArgs.assetTemplateUri, [
    ethers.utils.(gameInitializer),
  ]);
};

export default func;
func.tags = ['managed_asset_factory', 'rankify'];
