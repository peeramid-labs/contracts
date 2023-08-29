import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BestOfDiamond } from "../types/typechain/hardhat-diamond-abi/HardhatDiamondABI.sol";
import { ethers } from "hardhat";
// import {
//   MULTIPASS_CONTRACT_VERSION,
//   MULTIPASS_CONTRACT_NAME,
// } from "../../test/utils";
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, diamond } = deployments;

  const { deployer } = await getNamedAccounts();
  if (!process.env.IPFS_GATEWAY_URL || !process.env.RANK_TOKEN_PATH)
    throw new Error(
      "env variables not set: export IPFS_GATEWAY_URL / RANK_TOKEN_PATH"
    );
  const URI = process.env.IPFS_GATEWAY_URL + process.env.RANK_TOKEN_PATH;
  const ContractURI =
    process.env.IPFS_GATEWAY_URL + process.env.RANK_TOKEN_CONTRACT_PATH;
  await deploy("RankToken", {
    from: deployer,
    args: [URI, deployer, ContractURI],
    skipIfAlreadyDeployed: true,
  });
};

export default func;
func.tags = ["ranktoken"];
