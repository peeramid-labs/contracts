import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
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
import { ethers } from 'hardhat';
import { RankifyInstanceInit } from '../types/src/initializers/RankifyInstanceInit';
import { RankToken } from '../types/src/tokens/RankToken';
import { RankifyDiamondInstance } from '../types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { getProcessEnv } from '../scripts/libraries/utils';
import { Rankify } from '../types';
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, diamond, getOrNull } = deployments;
  const { deployer, owner } = await getNamedAccounts();
  if (process.env.NODE_ENV !== 'TEST') {
    if (!process.env.RANKIFY_INSTANCE_CONTRACT_VERSION || !process.env.RANKIFY_INSTANCE_CONTRACT_NAME)
      throw new Error('EIP712 intializer args not set');
  }

  const rankTokenDeployment = await deployments.get('RankToken');
  const rankifyTokenDeployment = await deployments.get('Rankify');
  const rankToken = new ethers.Contract(
    rankTokenDeployment.address,
    rankTokenDeployment.abi,
    hre.ethers.provider.getSigner(deployer),
  ) as RankToken;
  console.log('rankifyToken', rankifyTokenDeployment.address);
  const rankifyToken = new ethers.Contract(
    rankifyTokenDeployment.address,
    rankifyTokenDeployment.abi,
    hre.ethers.provider.getSigner(deployer),
  ) as Rankify;

  if (!rankToken) throw new Error('rank token not deployed');

  console.log('Deploying rankify instance under enviroment', process.env.NODE_ENV === 'TEST' ? 'TEST' : 'PROD');

  const settings: RankifyInstanceInit.ContractInitializerStruct =
    process.env.NODE_ENV === 'TEST'
      ? {
          timePerTurn: RInstance_TIME_PER_TURN,
          maxTurns: RInstance_MAX_TURNS,
          maxPlayersSize: RInstance_MAX_PLAYERS,
          minPlayersSize: RInstance_MIN_PLAYERS,
          rankTokenAddress: rankToken.address,
          timeToJoin: RInstance_TIME_TO_JOIN,
          gamePrice: RInstance_GAME_PRICE,
          joinGamePrice: RInstance_JOIN_GAME_PRICE,
          numWinners: RInstance_NUM_WINNERS,
          voteCredits: RInstance_VOTE_CREDITS,
          subject: RInstance_SUBJECT,
          rankifyToken: rankifyToken.address,
        }
      : {
          timePerTurn: getProcessEnv(false, 'TIME_PER_TURN'),
          maxTurns: getProcessEnv(false, 'MAX_TURNS'),
          maxPlayersSize: getProcessEnv(false, 'MAX_PLAYERS'),
          minPlayersSize: getProcessEnv(false, 'MIN_PLAYERS'),
          rankTokenAddress: rankToken.address,
          timeToJoin: getProcessEnv(false, 'TIME_TO_JOIN'),
          gamePrice: ethers.utils.parseEther(getProcessEnv(false, 'GAME_PRICE_ETH')),
          joinGamePrice: ethers.utils.parseEther(getProcessEnv(false, 'JOIN_GAME_PRICE_ETH')),
          numWinners: getProcessEnv(false, 'NUM_WINNERS'),
          voteCredits: getProcessEnv(false, 'VOTE_CREDITS'),
          subject: getProcessEnv(false, 'SUBJECT'),
          rankifyToken: rankifyToken.address,
        };

  const deployment = await diamond.deploy('RankifyInstance', {
    log: true,
    from: deployer,
    owner: deployer,

    facets: [
      'RankifyInstanceMainFacet',
      'RankifyInstanceGameMastersFacet',
      'RankifyInstanceRequirementsFacet',
      'EIP712InspectorFacet',
      'RankifyInstanceInit',
      'RankifyInstanceGameOwnersFacet',
    ],
    execute: {
      methodName: 'init',
      args: [
        process.env.NODE_ENV === 'TEST' ? RANKIFY_INSTANCE_CONTRACT_NAME : process.env.RANKIFY_INSTANCE_CONTRACT_NAME,
        process.env.NODE_ENV === 'TEST'
          ? RANKIFY_INSTANCE_CONTRACT_VERSION
          : process.env.RANKIFY_INSTANCE_CONTRACT_VERSION,
        settings,
      ],
    },
  });
  const rankifyInstance = (await ethers.getContractAt(deployment.abi, deployment.address)) as RankifyDiamondInstance;
  await rankifyInstance.connect(await hre.ethers.getSigner(deployer)).transferOwnership(owner);
  const rankingInstance = await rankToken.getRankingInstance();
  if (rankingInstance !== deployment.address) {
    await rankToken.updateRankingInstance(deployment.address);
  }
};

func.tags = ['gameofbest', 'gamediamond'];
func.dependencies = ['ranktoken', 'rankify'];
export default func;
