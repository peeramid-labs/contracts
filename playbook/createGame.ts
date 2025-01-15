import { task } from 'hardhat/config';
import { RankifyDiamondInstance, Rankify } from '../types';
import { IRankifyInstance } from '../types/src/facets/RankifyInstanceMainFacet';
import rankifyInstanceAbi from '../abi/hardhat-diamond-abi/HardhatDiamondABI.sol/RankifyDiamondInstance.json';

task('createGame', 'Create new game')
  .addOptionalParam('gameCreatorPK', 'Player private key who will create game')
  .addOptionalParam('gameMaster', 'Game master address')
  .addOptionalParam('gameRank', 'Game rank', '1')
  .addOptionalParam('maxPlayerCnt', 'Max player count', '9')
  .addOptionalParam('minPlayerCnt', 'Min player count', '5')
  .addOptionalParam('minGameTime', 'Minimum game time in seconds', '3600')
  .addOptionalParam('nTurns', 'Number of turns', '10')
  .addOptionalParam('timePerTurn', 'Time per turn in seconds', '1800')
  .addOptionalParam('voteCredits', 'Vote credits per player', '14')
  .addOptionalParam('timeToJoin', 'Time to join in seconds', '1800')
  .addParam('rankifyInstanceAddress', 'Rankify instance address')
  .setAction(
    async (
      {
        gameCreatorPK,
        gameMaster,
        gameRank,
        rankifyInstanceAddress,
        maxPlayerCnt,
        minPlayerCnt,
        minGameTime,
        nTurns,
        timePerTurn,
        voteCredits,
        timeToJoin,
      }: {
        gameCreatorPK: string;
        gameMaster: string;
        gameRank: string;
        rankifyInstanceAddress: string;
        maxPlayerCnt: string;
        minPlayerCnt: string;
        minGameTime: string;
        nTurns: string;
        timePerTurn: string;
        voteCredits: string;
        timeToJoin: string;
      },
      hre,
    ) => {
      const { ethers, getNamedAccounts } = hre;
      const { owner, gameMaster: defaultGameMaster, defaultPlayer } = await getNamedAccounts();

      const gameCreatorSigner = gameCreatorPK
        ? new hre.ethers.Wallet(gameCreatorPK, hre.ethers.provider)
        : await hre.ethers.getSigner(defaultPlayer);

      // Get game price
      const gameInstance = new ethers.Contract(
        rankifyInstanceAddress,
        rankifyInstanceAbi,
        gameCreatorSigner,
      ) as RankifyDiamondInstance;

      const gamePrice = await gameInstance.estimateGamePrice(minGameTime);
      console.log('Estimated game price:', ethers.utils.formatEther(gamePrice), 'tokens');

      // Mint tokens if needed
      const rankifyDeployment = await hre.deployments.get('Rankify');
      const rankifyContract = new hre.ethers.Contract(
        rankifyDeployment.address,
        rankifyDeployment.abi,
        await hre.ethers.getSigner(owner),
      ) as Rankify;

      const gameCreatorBalance = await rankifyContract.balanceOf(gameCreatorSigner.address);
      if (gameCreatorBalance.lt(gamePrice)) {
        console.log('Minting tokens for game creator...');
        const tx = await rankifyContract.mint(gameCreatorSigner.address, gamePrice);
        await tx.wait();
      }

      // Approve tokens
      const allowance = await rankifyContract.allowance(gameCreatorSigner.address, gameInstance.address);
      if (allowance.lt(gamePrice)) {
        console.log('Approving tokens for game instance...');
        const approveTx = await rankifyContract
          .connect(gameCreatorSigner)
          .approve(gameInstance.address, ethers.constants.MaxUint256);
        await approveTx.wait();
      }

      // Create game
      const params: IRankifyInstance.NewGameParamsInputStruct = {
        gameMaster: gameMaster || defaultGameMaster,
        gameRank: gameRank,
        maxPlayerCnt: maxPlayerCnt,
        minPlayerCnt: minPlayerCnt,
        minGameTime: minGameTime,
        nTurns: nTurns,
        timePerTurn: timePerTurn,
        voteCredits: voteCredits,
        timeToJoin: timeToJoin,
      };

      console.log('Creating game with params:', params);
      const tx = await gameInstance.createGame(params);
      const receipt = await tx.wait();

      const gameId = await gameInstance
        .connect(gameCreatorSigner)
        .getContractState()
        .then(state => state.numGames);
      console.log('Game with id ' + gameId.toNumber() + ' created!');
      return { gameId: gameId, receipt };
    },
  );

export default {};
