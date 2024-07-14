import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';




const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  const bigIntValue = BigInt('32093041992771041886105036204868453160172577249982933515490170998396430950365');
  // Convert to a hexadecimal string
  const hexValue = "0x" + bigIntValue.toString(16);
//   console.log(hexValue);
  const result = await deploy('CodeIndex', {
    deterministicDeployment: hexValue,
    from: deployer,
    skipIfAlreadyDeployed: true,
  });
  console.log('CodeIndex deployed at', result.address);

};

export default func;
func.tags = ['code_index', 'rankify'];
