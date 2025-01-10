import { task } from 'hardhat/config';
import { Rankify } from '../types';

task('mintTokensTo', 'Mints tokens to owner')
.addOptionalParam('address', 'Address to mint tokens to', '0x1c43f2D1ff0Fcc12a351A50889813fE47f683607')
.setAction(async (taskArgs, hre) => {
    const { getNamedAccounts } = hre;
    const { owner } = await getNamedAccounts();
     const rankifyDeployment = await hre.deployments.get('Rankify');
     const rankifyContract = new hre.ethers.Contract(
       rankifyDeployment.address,
       rankifyDeployment.abi,
       await hre.ethers.getSigner(owner),
     ) as Rankify;

    const tx = await rankifyContract.mint(taskArgs.address, hre.ethers.utils.parseEther('10000'));
    await tx.wait();

    const balance = await rankifyContract.balanceOf(taskArgs.address);
    console.log('Balance after minting:', hre.ethers.utils.formatEther(balance));
});