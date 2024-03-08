import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ManagedAssetsFactory, RankifyDiamondInstance } from '../types';
import { ethers } from 'hardhat';
import { getProcessEnv } from '../scripts/libraries/utils';
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer, owner } = await getNamedAccounts();
  const managedAssetsFactoryArtifact = await deployments.getArtifact('ManagedAssetsFactory');
  const deployment = await deploy('ManagedAssetsFactory', {
    log: true,
    contract: managedAssetsFactoryArtifact,
    from: deployer,
    args: [deployer],
    skipIfAlreadyDeployed: true,
  });
  const deploymentArgs =
    process.env.NODE_ENV === 'TEST'
      ? {
          assetTemplateUri: 'test test template asset',
          managerTemplateUri: 'test test templated manager',
          assetUri: 'test test subject',
          managerUri: 'test test manager',
        }
      : {
          assetTemplateUri: getProcessEnv(false, 'NEW_ASSET_TEMPLATE_URI'),
          managerTemplateUri: getProcessEnv(false, 'NEW_MANAGER_TEMPLATE_URI'),
          assetUri: getProcessEnv(false, 'NEW_ASSET_MANAGER_URI'),
          managerUri: getProcessEnv(false, 'NEW_MANAGER_URI'),
        };
  const rankFactory = (await ethers.getContractAt(deployment.abi, deployment.address)) as ManagedAssetsFactory;
  const rankTokenDeployment = await deployments.get('RankToken');
  const rankifyInstanceDeployment = await deployments.get('RankifyInstance');
  await rankFactory
    .connect(owner)
    .addAssetTemplate(rankTokenDeployment.address, deploymentArgs.assetTemplateUri, 'init()');
  const instanceContract = new ethers.Contract(
    rankifyInstanceDeployment.address,
    rankifyInstanceDeployment.abi,
    hre.ethers.provider.getSigner(deployer),
  ) as RankifyDiamondInstance;
  const initializerFn =
    instanceContract.interface.functions[
      'init(string,string,(uint256,uint256,uint256,address,uint256,uint256,uint256,uint256,uint256,uint256,string,address))'
    ];
  await rankFactory
    .connect(owner)
    .addManagementTemplate(
      rankifyInstanceDeployment.address,
      deploymentArgs.managerTemplateUri,
      ethers.utils.Interface.getSighash(initializerFn),
    );

  await rankFactory.connect(owner).deployAsset(deploymentArgs.assetTemplateUri, deploymentArgs.assetUri,);
};

export default func;
func.tags = ['managed_asset_factory', 'rankify'];
