import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer, owner } = await getNamedAccounts();

  const { deploy, get } = deployments;

  const token = await get('Rankify');

  await deploy('DAODistributor', {
    from: deployer,
    args: [owner, token.address, ethers.utils.parseEther('1')],
    skipIfAlreadyDeployed: true,
  });
};

func.tags = ['distributor'];
func.dependencies = ['rankify', 'ERC7744'];
export default func;
