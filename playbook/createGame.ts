import { task, types } from 'hardhat/config';
import { RankifyDiamondInstance, Rankify } from '../types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { RegisterMessage, MultipassJs } from '../utils/multipass';
import { LibMultipass } from '../types/src/facets/DNSFacet';
import crypto from "crypto";
import { BigNumber, BigNumberish, Wallet } from 'ethers';
import { IRankifyInstanceCommons } from '../types/src/facets/RankifyInstanceMainFacet';

task('createGame', 'Create new game')
  .addOptionalParam('registrarAddress', 'Registrar address')
  .addOptionalParam('domain', 'Domain name to register', 'Rankify.it')
  .setAction(
    async (
      {
        domain,
        registrarAddress,
      }: { domain: string; string; registrarAddress: string; },
      hre,
    ) => {
      const { deployments, getNamedAccounts } = hre;
      const player = '0xF52E5dF676f51E410c456CC34360cA6F27959420';
      const rankifyDeployment = await deployments.get('Rankify');
      const rankifyInstanceDeployment = await deployments.get('RankifyInstance');
      
      const { owner, registrar } = await getNamedAccounts();
      const rankifyContract = new hre.ethers.Contract(
        rankifyDeployment.address,
        rankifyDeployment.abi,
        hre.ethers.provider.getSigner(owner),
      ) as Rankify;

      //let tx = await rankifyContract
      //.mint(player, hre.ethers.utils.parseEther('1000'));

      //console.log(await tx.wait().then((r: any) => r.logs));

      const rankifyInstanceContract = new hre.ethers.Contract(
        rankifyInstanceDeployment.address,
        rankifyInstanceDeployment.abi,
        hre.ethers.provider.getSigner(player),
      ) as RankifyDiamondInstance;

      let tx = await rankifyInstanceContract
      ['createGame(address,uint256)'](registrar, 1);

      console.log(rankifyInstanceContract.interface)
    
      console.log(await tx.wait().then((r: any) => r.logs));

      //await createGame(env.rankifyInstance, adr.gameCreator1, adr.gameMaster1.wallet.address, 1);
      
    },
  );

  const createGame = async (
    gameContract: RankifyDiamondInstance,
    signer: Wallet,
    gameMaster: string,
    gameRank: BigNumberish,
    openNow?: boolean,
  ) => {
    await gameContract.connect(signer)['createGame(address,uint256)'](gameMaster, gameRank);
    const gameId = await gameContract
      .getContractState()
      .then((state: IRankifyInstanceCommons.RInstanceStateStructOutput) => state.BestOfState.numGames);
    if (openNow) await gameContract.connect(signer).openRegistration(gameId);
    return gameId;
  };
  
  
export default {};
