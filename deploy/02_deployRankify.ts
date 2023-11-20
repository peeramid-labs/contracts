import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer, owner } = await getNamedAccounts();
  const tokenArtifact = await deployments.getArtifact('Rankify');
  await deploy('Rankify', {
    contract: tokenArtifact,
    from: deployer,
    args: [owner],
    skipIfAlreadyDeployed: true,
  });
};

export default func;
func.tags = ['rankify_token', 'rankify'];
