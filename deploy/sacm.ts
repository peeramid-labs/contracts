import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import CodeIndexAbi from '@peeramid-labs/eds/abi/src/CodeIndex.sol/CodeIndex.json';
import { CodeIndex } from '@peeramid-labs/eds/types';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
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
  const code = await hre.ethers.provider.getCode(sacmDeployment.address);
  const codeId = ethers.utils.keccak256(code);
  const registerAddress = await codeIndexContract.get(codeId);
  if (registerAddress == ethers.constants.AddressZero) {
    console.warn('registering contract', registerAddress, sacmDeployment.address, codeId);
    await codeIndexContract.register(sacmDeployment.address);
  }
};

export default func;
func.dependencies = ['distributor'];
func.tags = ['sacm'];
