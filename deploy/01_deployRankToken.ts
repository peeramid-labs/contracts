import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { BestOfDiamond } from '../types/typechain/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { ethers } from 'hardhat';
// import {
//   MULTIPASS_CONTRACT_VERSION,
//   MULTIPASS_CONTRACT_NAME,
// } from "../../test/utils";
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, diamond } = deployments;

  const { deployer } = await getNamedAccounts();
  let URI: string, ContractURI: string;
  if (process.env.NODE_ENV !== 'TEST') {
    if (!process.env.IPFS_GATEWAY_URL || !process.env.RANK_TOKEN_PATH)
      throw new Error('env variables not set: export IPFS_GATEWAY_URL / RANK_TOKEN_PATH');
    URI = process.env.IPFS_GATEWAY_URL + process.env.RANK_TOKEN_PATH;
    ContractURI = process.env.IPFS_GATEWAY_URL + process.env.RANK_TOKEN_CONTRACT_PATH;
  } else {
    URI = 'URI';
    ContractURI = 'CURI';
  }
  const owner = process.env.DAO_CONTRACT_ADDRESS || deployer;

  const result = await deploy('RankToken', {
    from: deployer,
    args: [URI, owner, ContractURI, ethers.BigNumber.from(4)],
    skipIfAlreadyDeployed: true,
  });
  console.log('deployed rank token at', result.address);
};

export default func;
func.tags = ['ranktoken'];
