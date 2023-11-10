import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import {
  BESTOF_CONTRACT_NAME,
  BESTOF_CONTRACT_VERSION,
  BOG_TIME_PER_TURN,
  BOG_MAX_PLAYERS,
  BOG_MIN_PLAYERS,
  BOG_MAX_TURNS,
  BOG_TIME_TO_JOIN,
  BOG_GAME_PRICE,
  BOG_JOIN_GAME_PRICE,
  BOG_NUM_WINNERS,
  BOG_VOTE_CREDITS,
  BOG_SUBJECT,
} from '../test/utils';
import { ethers } from 'hardhat';
import { BestOfInit } from '../types/src/initializers/BestOfInit';
import { RankToken } from '../types/src/tokens/RankToken';
import { BestOfDiamond } from '../types/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { getProcessEnv } from '../scripts/libraries/utils';
import { Agenda } from '../types';
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, diamond, getOrNull } = deployments;
  const { deployer, owner } = await getNamedAccounts();
  if (process.env.NODE_ENV !== 'TEST') {
    if (!process.env.BESTOF_CONTRACT_VERSION || !process.env.BESTOF_CONTRACT_NAME)
      throw new Error('EIP712 intializer args not set');
  }

  const rankTokenDeployment = await deployments.get('RankToken');
  const agendaTokenDeployment = await deployments.get('Agenda');
  const rankToken = new ethers.Contract(
    rankTokenDeployment.address,
    rankTokenDeployment.abi,
    hre.ethers.provider.getSigner(deployer),
  ) as RankToken;
  console.log('agendaToken', agendaTokenDeployment.address);
  const agendaToken = new ethers.Contract(
    agendaTokenDeployment.address,
    agendaTokenDeployment.abi,
    hre.ethers.provider.getSigner(deployer),
  ) as Agenda;

  if (!rankToken) throw new Error('rank token not deployed');

  console.log('Deploying best of game under enviroment', process.env.NODE_ENV === 'TEST' ? 'TEST' : 'PROD');

  const settings: BestOfInit.ContractInitializerStruct =
    process.env.NODE_ENV === 'TEST'
      ? {
          timePerTurn: BOG_TIME_PER_TURN,
          maxTurns: BOG_MAX_TURNS,
          maxPlayersSize: BOG_MAX_PLAYERS,
          minPlayersSize: BOG_MIN_PLAYERS,
          rankTokenAddress: rankToken.address,
          timeToJoin: BOG_TIME_TO_JOIN,
          gamePrice: BOG_GAME_PRICE,
          joinGamePrice: BOG_JOIN_GAME_PRICE,
          numWinners: BOG_NUM_WINNERS,
          voteCredits: BOG_VOTE_CREDITS,
          subject: BOG_SUBJECT,
          agendaToken: agendaToken.address,
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
          agendaToken: agendaToken.address,
        };

  const deployment = await diamond.deploy('BestOfGame', {
    log: true,
    from: deployer,
    owner: deployer,

    facets: [
      'BestOfFacet',
      'GameMastersFacet',
      'RequirementsFacet',
      'EIP712InspectorFacet',
      'BestOfInit',
      'GameOwnersFacet',
    ],
    execute: {
      methodName: 'init',
      args: [
        process.env.NODE_ENV === 'TEST' ? BESTOF_CONTRACT_NAME : process.env.BESTOF_CONTRACT_NAME,
        process.env.NODE_ENV === 'TEST' ? BESTOF_CONTRACT_VERSION : process.env.BESTOF_CONTRACT_VERSION,
        settings,
      ],
    },
  });
  const bestOfGame = (await ethers.getContractAt(deployment.abi, deployment.address)) as BestOfDiamond;
  await bestOfGame.connect(await hre.ethers.getSigner(deployer)).transferOwnership(owner);
  const rankingInstance = await rankToken.getRankingInstance();
  if (rankingInstance !== deployment.address) {
    await rankToken.updateRankingInstance(deployment.address);
  }
};

func.tags = ['gameofbest', 'gamediamond'];
func.dependencies = ['ranktoken', 'agenda'];
export default func;
