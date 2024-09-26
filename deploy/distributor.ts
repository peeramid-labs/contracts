import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { activeContractsList } from '@aragon/osx-ethers';

activeContractsList.baseMainnet.DAOFactory;
activeContractsList.baseMainnet.TokenVotingSetup;

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer, owner } = await getNamedAccounts();

  const { deploy } = deployments;

  await deploy('PeeramidLabsDistributor', {
    from: deployer,
    args: [owner],
    skipIfAlreadyDeployed: true,
  });
};

func.tags = ['distributor'];
export default func;
