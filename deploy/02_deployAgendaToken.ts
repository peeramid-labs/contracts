import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deploymentName = process.env.ATOKEN_NAME;
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (!deploymentName && process.env.NODE_ENV !== 'TEST') throw new Error('ATOKEN_NAME not exported');
  const { deployments, getNamedAccounts } = hre;
  const { deploy, diamond } = deployments;

  const { deployer, owner } = await getNamedAccounts();
  const tokenArtifact = await deployments.getArtifact('Agenda');
  await deploy('Agenda', {
    contract: tokenArtifact,
    from: deployer,
    args: [owner],
    skipIfAlreadyDeployed: true,
  });
};

export default func;
func.tags = ['agenda'];
