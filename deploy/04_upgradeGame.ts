import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  MULTIPASS_CONTRACT_VERSION,
  MULTIPASS_CONTRACT_NAME,
} from "../test/utils";
import { ethers } from "hardhat";
import { BestOfInit } from "../types/typechain/contracts/initializers/BestOfInit";
import { RankToken } from "../types/typechain/contracts/tokens/RankToken";
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, diamond, getOrNull } = deployments;

  const { deployer } = await getNamedAccounts();

  const deployment = await diamond.deploy("BestOfGame", {
    log: true,
    from: deployer,
    owner: deployer,

    facets: [
      "BestOfFacet",
      "GameMastersFacet",
      "RequirementsFacet",
      "EIP712InspectorFacet",
      "BestOfInit",
      "GameOwnersFacet",
    ],
  });
};

func.tags = ["upgrade_game"];
func.skip = () => Promise.resolve(process.env.NODE_ENV === "TEST");
export default func;
