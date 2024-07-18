import { task, types } from 'hardhat/config';
import { MultipassDiamond } from '../types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { RegisterMessage, MultipassJs } from '../utils/multipass';
import { LibMultipass } from '../types/src/facets/DNSFacet';
import crypto from "crypto";

task('initializeDomain', 'Initialize domain name and activate it')
  .addOptionalParam('registrarAddress', 'Registrar address')
  .addOptionalParam('domain', 'Domain name to register', 'Rankify.it')
  .addOptionalParam('freeRegistrationsNumber', 'Free registration count number', '1000')
  .addOptionalParam('fee', 'Fee  amount in base currency of network', '0')
  .addOptionalParam('reward', 'Referral share in base currency of network', '0')
  .addOptionalParam('discount', 'Discount in base currency of network', '0')
  .addOptionalParam('activate', 'Discount in base currency of network', true, types.boolean)
  .addOptionalParam('username', 'Username to associate with account', '')
  .setAction(
    async (
      {
        domain,
        freeRegistrationsNumber,
        fee,
        reward,
        discount,
        registrarAddress,
        activate,
        username,
      }: { domain: string; freeRegistrationsNumber: string; fee: string; reward: string; discount: string; registrarAddress: string; activate: boolean; username: string },
      hre,
    ) => {
      const { deployments, getNamedAccounts } = hre;
      const { owner, registrar, player } = await getNamedAccounts();
      const multipassDeployment = await deployments.get('Multipass');
      registrarAddress = registrarAddress ?? registrar;
      const multipassContract = new hre.ethers.Contract(
        multipassDeployment.address,
        multipassDeployment.abi,
        hre.ethers.provider.getSigner(owner),
      ) as MultipassDiamond;
      /*const tx = await multipassContract.initializeDomain(
        registrarAddress,
        freeRegistrationsNumber,
        hre.ethers.utils.parseEther(fee),
        hre.ethers.utils.formatBytes32String(domain),
        hre.ethers.utils.parseEther(reward),
        hre.ethers.utils.parseEther(discount),
      );
      console.log(tx.wait(1));*/

      if(activate === true) {
        /*const tx = await multipassContract
          .activateDomain(hre.ethers.utils.formatBytes32String(domain));
        console.log(tx.wait(1));
        console.log('Domain name "' + domain + '" successfully initialized and activated!')*/
      }

      if(username) {
        const playerId = crypto.randomUUID().slice(0, 31);
        const registrarMessage = {
          name: hre.ethers.utils.formatBytes32String(username),
          id: hre.ethers.utils.formatBytes32String(playerId),
          domainName: hre.ethers.utils.formatBytes32String(domain),
          deadline: hre.ethers.BigNumber.from(9999),
          nonce: hre.ethers.BigNumber.from(0),
        };
        let signer =  await hre.ethers.getSigner(player);
    
        const validSignature = await signRegistrarMessage(registrarMessage, multipassDeployment.address, signer, hre);

        let applicantData: LibMultipass.RecordStruct = {
          name: hre.ethers.utils.formatBytes32String(username),
          id: hre.ethers.utils.formatBytes32String(playerId),
          wallet: player,
          nonce: 0,
          domainName: hre.ethers.utils.formatBytes32String(domain),
        };

        const emptyUserQuery: LibMultipass.NameQueryStruct = {
          name: hre.ethers.utils.formatBytes32String(''),
          id: hre.ethers.utils.formatBytes32String(''),
          domainName: hre.ethers.utils.formatBytes32String(''),
          wallet: hre.ethers.constants.AddressZero,
          targetDomain: hre.ethers.utils.formatBytes32String(''),
        };

        const tx = await multipassContract
            .connect(player)
            .register(
              applicantData,
              registrarMessage.domainName,
              validSignature,
              registrarMessage.deadline,
              emptyUserQuery,
              hre.ethers.constants.HashZero,
            )
         console.log(tx);   
      }
    },
  );

  export const signRegistrarMessage = async (
    message: RegisterMessage,
    verifierAddress: string,
    signer: SignerWithAddress,
    hre: any
  ) => {
    let { chainId } = await hre.ethers.provider.getNetwork();
    const multipassJs = new MultipassJs({
      chainId: chainId,
      contractName: 'MultipassDNS',
      version: '0.0.1',
      ...hre.network,
    });
    return await multipassJs.signRegistrarMessage(message, verifierAddress, signer);
  };
  
export default {};
