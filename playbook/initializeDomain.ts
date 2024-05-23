import { task } from 'hardhat/config';
import { MultipassDiamond } from '../types';

task('initializeDomain', 'Just a test task')
  .addOptionalParam('registrarAddress', 'Registrar address')
  .addOptionalParam('domain', 'Domain name to register')
  .addOptionalParam('fee', 'Fee  amount in base currency of network')
  .addOptionalParam('reward', 'Referral share in base currency of network')
  .addOptionalParam('discount', 'Discount in base currency of network')
  .setAction(
    async (
      {
        domain,
        fee,
        reward,
        discount,
        registrarAddress,
      }: { domain: string; fee: string; reward: string; discount: string; registrarAddress: string },
      hre,
    ) => {
      const { deployments, getNamedAccounts } = hre;
      const { owner, registrar } = await getNamedAccounts();
      const multipassDeployment = await deployments.get('Multipass');
      const multipassContract = new hre.ethers.Contract(
        multipassDeployment.address,
        multipassDeployment.abi,
        hre.ethers.provider.getSigner(owner),
      ) as MultipassDiamond;
      const tx = await multipassContract.initializeDomain(
        registrarAddress ?? registrar,
        1000,
        hre.ethers.utils.parseEther(fee ?? '0'),
        hre.ethers.utils.formatBytes32String(domain ?? 'rankify.it'),
        hre.ethers.utils.parseEther(reward ?? '0'),
        hre.ethers.utils.parseEther(discount ?? '0'),
      );
      console.log(tx);
    },
  );

export default {};
