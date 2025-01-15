import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { Rankify } from '../types';
import { ethers } from 'hardhat';
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer, owner } = await getNamedAccounts();
  const tokenArtifact = await deployments.getArtifact('Rankify');
  const deployment = await deploy('Rankify', {
    contract: tokenArtifact,
    from: deployer,
    args: [owner],
    skipIfAlreadyDeployed: true,
  });

  const rankifyContract = (await ethers.getContractAt(deployment.abi, deployment.address)) as Rankify;
  const signer = await ethers.getSigner(owner);
  await rankifyContract.connect(signer).mint(owner, ethers.utils.parseEther('10000'));
};

export default func;
func.tags = ['rankify'];
