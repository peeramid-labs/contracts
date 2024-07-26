import { task } from 'hardhat/config';
import { RankifyDiamondInstance, Rankify } from '../types';
import { IRankifyInstanceCommons } from '../types/src/facets/RankifyInstanceMainFacet';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

task('createGame', 'Create new game')
  .addOptionalParam('gameCreator', 'Player address who will create game')
  .setAction(
    async ({
      gameCreator,
    }: { gameCreator: string;},
     hre: HardhatRuntimeEnvironment) => {
      const { deployments, getNamedAccounts } = hre;
      const rankifyDeployment = await deployments.get('Rankify');
      const rankifyInstanceDeployment = await deployments.get('RankifyInstance');
      const { owner, registrar, defaultPlayer } = await getNamedAccounts();
      gameCreator = gameCreator ?? defaultPlayer;

      await mintTokensToGameCreator(rankifyDeployment, gameCreator, owner, hre);
      await approveTokensUse(rankifyDeployment, rankifyInstanceDeployment, gameCreator, hre);
      await createGame(rankifyInstanceDeployment, gameCreator, registrar, hre);
    },
  );

export const mintTokensToGameCreator = async (
  rankifyDeployment: any,
  gameCreator: string,
  owner: string,
  hre: HardhatRuntimeEnvironment
) => {
  const rankifyContract = new hre.ethers.Contract(
    rankifyDeployment.address,
    rankifyDeployment.abi,
    hre.ethers.provider.getSigner(owner),
  ) as Rankify;
  const tx = await rankifyContract
    .mint(gameCreator, hre.ethers.utils.parseEther('1000'));
  console.log(await tx.wait().then((r: any) => r.logs));
};

export const approveTokensUse = async (
  rankifyDeployment: any,
  rankifyInstanceDeployment: any,
  gameCreator: string,
  hre: HardhatRuntimeEnvironment
) => {
  const rankifyContract = new hre.ethers.Contract(
    rankifyDeployment.address,
    rankifyDeployment.abi,
    hre.ethers.provider.getSigner(gameCreator),
  ) as Rankify;

  const tx = await rankifyContract
    .approve(rankifyInstanceDeployment.address, hre.ethers.constants.MaxUint256);
  console.log(await tx.wait().then((r: any) => r.logs));
};

export const createGame = async (
  rankifyInstanceDeployment: any,
  gameCreator: string,
  registrar: string,
  hre: HardhatRuntimeEnvironment
) => {
  const rankifyInstanceContract = new hre.ethers.Contract(
    rankifyInstanceDeployment.address,
    rankifyInstanceDeployment.abi,
    hre.ethers.provider.getSigner(gameCreator),
  ) as RankifyDiamondInstance;

  const tx = await rankifyInstanceContract
  ['createGame(address,uint256)'](registrar, 1);
  console.log(await tx.wait().then((r: any) => r.logs));

  const gameId = await rankifyInstanceContract
    .getContractState()
    .then((state: IRankifyInstanceCommons.RInstanceStateStructOutput) => state.BestOfState.numGames);

  console.log('Game with id ' + gameId.toNumber() + ' created!');
};
export default {};
