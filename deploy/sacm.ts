import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import CodeIndexAbi from '@peeramid-labs/eds/abi/src/CodeIndex.sol/CodeIndex.json';
import { CodeIndex } from '@peeramid-labs/eds/types';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const PeeramidLabsDistributor = await deployments.get('PeeramidLabsDistributor');

  const { deployer } = await getNamedAccounts();

  const sacmDeployment = await deploy('SimpleAccessManager', {
    from: deployer,
    args: [],
    skipIfAlreadyDeployed: true,
  });

  const codeIndexContract = (await ethers.getContractAt(
    CodeIndexAbi,
    '0xc0D31d398c5ee86C5f8a23FA253ee8a586dA03Ce',
  )) as CodeIndex;

  await codeIndexContract.connect(await hre.ethers.getSigner(deployer)).register(sacmDeployment.address);
};

export default func;
func.dependencies = ['distributor'];
func.tags = ['sacm'];
