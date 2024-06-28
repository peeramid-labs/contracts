import { task, types } from 'hardhat/config';
import { MultipassDiamond } from '../types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

task('initializeDomain', 'Initialize domain name and activate it')
  .addOptionalParam('registrarAddress', 'Registrar address')
  .addOptionalParam('domain', 'Domain name to register', 'Rankify.it')
  .addOptionalParam('freeRegistrationsNumber', 'Free registration count number', '1000')
  .addOptionalParam('fee', 'Fee  amount in base currency of network', '0')
  .addOptionalParam('reward', 'Referral share in base currency of network', '0')
  .addOptionalParam('discount', 'Discount in base currency of network', '0')
  .addOptionalParam('activate', 'Discount in base currency of network', true, types.boolean)
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
      }: { domain: string; freeRegistrationsNumber: string; fee: string; reward: string; discount: string; registrarAddress: string; activate: boolean },
      hre,
    ) => {
      const { deployments, getNamedAccounts } = hre;
      const { owner, registrar } = await getNamedAccounts();
      const multipassDeployment = await deployments.get('Multipass');
      registrarAddress = registrarAddress ?? registrar;
      const multipassContract = new hre.ethers.Contract(
        multipassDeployment.address,
        multipassDeployment.abi,
        hre.ethers.provider.getSigner(owner),
      ) as MultipassDiamond;
      const tx = await multipassContract.initializeDomain(
        registrarAddress,
        freeRegistrationsNumber,
        hre.ethers.utils.parseEther(fee),
        hre.ethers.utils.formatBytes32String(domain),
        hre.ethers.utils.parseEther(reward),
        hre.ethers.utils.parseEther(discount),
      );
      console.log(tx.wait(1));

      if(activate === true) {
        const tx = await multipassContract
          .activateDomain(hre.ethers.utils.formatBytes32String(domain));
        console.log(tx.wait(1));
        console.log('Domain name "' + domain + '" successfully initialized and activated!')
      }
    },
  );

export default {};
