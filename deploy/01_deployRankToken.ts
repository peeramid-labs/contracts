import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import path from 'path';
const ASSETS_PREFIX = 'https://assets.vote4best.app/';
const contractURI = ASSETS_PREFIX + 'musicRankToken.json';
const tURI = path.join(ASSETS_PREFIX, 'rank');

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  let URI: string, ContractURI: string;

  URI = tURI;
  ContractURI = contractURI;
  const owner = process.env.DAO_CONTRACT_ADDRESS || deployer;

  const result = await deploy('RankToken', {
    from: deployer,
    args: [URI, owner, ContractURI, ethers.BigNumber.from(3), [], []],
    skipIfAlreadyDeployed: true,
  });
  console.log('deployed rank token at', result.address);
};

export default func;
func.tags = ['rank_token', 'rankify'];
