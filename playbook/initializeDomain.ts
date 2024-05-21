import { task } from 'hardhat/config';
import { ethers } from 'ethers';


task('initializeDomain', 'Just a test task')
  .addOptionalParam('domain', 'Domain name to register')
  .addOptionalParam('fee', 'Fee  amount in base currency of network')
  .addOptionalParam('reward', 'Referral share in base currency of network')
  .addOptionalParam('discount', 'Discount in base currency of network')
  .setAction(async ({ domain, fee, reward , discount}, hre) => {
    hre.multipass
      .connect(hre.multipassOwner.wallet)
      .initializeDomain(
        hre.registrar1.wallet.address,
        1000,
        ethers.utils.parseEther(fee ?? '0'),
        ethers.utils.formatBytes32String(domain ?? 'localhost'),
        ethers.utils.parseEther(reward ?? '1'),
        ethers.utils.parseEther(discount ?? '1'),
      );
  });

export default {};