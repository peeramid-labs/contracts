import { task, types } from 'hardhat/config';
import { MultipassDiamond } from '../types';

task('initializeDomain', 'Just a test task')
  .addOptionalParam('registraraddress', 'Registrar address')
  .addOptionalParam('domain', 'Domain name to register', 'Rankify.it')
  .addOptionalParam('fee', 'Fee  amount in base currency of network', '0')
  .addOptionalParam('reward', 'Referral share in base currency of network', '0')
  .addOptionalParam('discount', 'Discount in base currency of network', '0')
  .addOptionalParam('activate', 'Discount in base currency of network', true, types.boolean)
  .setAction(
    async (
      {
        domain,
        fee,
        reward,
        discount,
        registraraddress,
        activate,
      }: { domain: string; fee: string; reward: string; discount: string; registraraddress: string; activate: boolean },
      hre,
    ) => {
      const { deployments, getNamedAccounts } = hre;
      const { owner, registrar } = await getNamedAccounts();
      const multipassDeployment = await deployments.get('Multipass');
      registraraddress = registraraddress ?? registrar;
      const multipassContract = new hre.ethers.Contract(
        multipassDeployment.address,
        multipassDeployment.abi,
        hre.ethers.provider.getSigner(owner),
      ) as MultipassDiamond;
      const tx = await multipassContract.initializeDomain(
        '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
        1000,
        hre.ethers.utils.parseEther(fee),
        hre.ethers.utils.formatBytes32String(domain),
        hre.ethers.utils.parseEther(reward),
        hre.ethers.utils.parseEther(discount),
      );
      console.log(tx);

      if(activate === true) {
        const tx = await multipassContract
          .activateDomain(hre.ethers.utils.formatBytes32String(domain));
        console.log(tx);
        console.log('Domain name "' + domain + '" successfully initialized and activated!')
      }
    },
  );

export default {};
