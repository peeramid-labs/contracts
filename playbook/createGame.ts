import { task } from 'hardhat/config';
import { RankifyDiamondInstance, Rankify, PeeramidLabsDistributor } from '../types';
import { IRankifyInstanceCommons } from '../types/src/facets/RankifyInstanceMainFacet';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

task('gameCreated', 'Create new game')
  .addOptionalParam('gameCreator', 'Player address who will create game')
  .addParam('contractAddress', 'Address of the contract')
  .setAction(
    async (
      { contractAddress, gameCreator }: { contractAddress: string; gameCreator: string },
      hre: HardhatRuntimeEnvironment,
    ) => {
      const { deployments, getNamedAccounts } = hre;
      const rankifyDeployment = await deployments.get('Rankify');
      //   const rankifyInstanceDeployment = await deployments.get('RankifyInstance');
      const { owner, registrar, defaultPlayer } = await getNamedAccounts();
      gameCreator = gameCreator ?? defaultPlayer;

      await mintTokensToGameCreator(rankifyDeployment, gameCreator, owner, hre);
      await approveTokensUse(rankifyDeployment, contractAddress, gameCreator, hre);
      await createGame(contractAddress, gameCreator, registrar, hre);
    },
  );

export const mintTokensToGameCreator = async (
  rankifyDeployment: any,
  gameCreator: string,
  owner: string,
  hre: HardhatRuntimeEnvironment,
) => {
  const rankifyContract = new hre.ethers.Contract(
    rankifyDeployment.address,
    rankifyDeployment.abi,
    hre.ethers.provider.getSigner(owner),
  ) as Rankify;
  const tx = await rankifyContract.mint(gameCreator, hre.ethers.utils.parseEther('1000'));
};

export const approveTokensUse = async (
  rankifyDeployment: any,
  rankifyInstanceDeployment: any,
  gameCreator: string,
  hre: HardhatRuntimeEnvironment,
) => {
  const rankifyContract = new hre.ethers.Contract(
    rankifyDeployment.address,
    rankifyDeployment.abi,
    hre.ethers.provider.getSigner(gameCreator),
  ) as Rankify;

  const tx = await rankifyContract.approve(rankifyInstanceDeployment.address, hre.ethers.constants.MaxUint256);
};

export const createGame = async (
  contractAddress: string,
  gameCreator: string,
  registrar: string,
  hre: HardhatRuntimeEnvironment,
) => {
  const abi = require('./deployments/localhost/RankifyInstanceMainFacet.json');
  const rankifyInstanceContract = new hre.ethers.Contract(
    contractAddress,
    abi,
    hre.ethers.provider.getSigner(gameCreator),
  ) as RankifyDiamondInstance;

  const tx = await rankifyInstanceContract['createGame(address,uint256)'](registrar, 1);

  const gameId = await rankifyInstanceContract
    .getContractState()
    .then((state: IRankifyInstanceCommons.RInstanceStateStructOutput) => state.BestOfState.numGames);

  console.log('Game with id ' + gameId.toNumber() + ' created!');
};

export const getInstanceById = async (instanceId: string, hre: HardhatRuntimeEnvironment) => {
  const peeramidLabsDistributor = await hre.deployments.get('PeeramidLabsDistributor');
  const distributorContract = new hre.ethers.Contract(
    peeramidLabsDistributor.address,
    peeramidLabsDistributor.abi,
  ) as PeeramidLabsDistributor;
  const instantiatedFilter = distributorContract.filters.Instantiated(null, instanceId);
  const events = await distributorContract.queryFilter(instantiatedFilter);
  if (events.length === 0) {
    throw new Error('Instance not found');
  }
  return events[0].args.instances; //instances[3] should be the Rankify Game Instance,  This is hardcoded in MAODistribution logic
};

export default {};
