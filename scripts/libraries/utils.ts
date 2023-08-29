// import { ethers } from "ethers";
import { ethers } from "hardhat";
import { Wallet, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export function getInterfaceID(contractInterface: any) {
  let interfaceID: BigNumber = ethers.constants.Zero;
  const functions: string[] = Object.keys(contractInterface.functions);
  for (let i = 0; i < functions.length; i++) {
    interfaceID = interfaceID.xor(contractInterface.getSighash(functions[i]));
  }

  return interfaceID;
}

export async function transferOwnership(
  signer: Wallet | SignerWithAddress,
  newOwnerAddress: string,
  diamondAddress: string
) {
  const ownershipFacet = await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  );
  const tx = await ownershipFacet
    .connect(signer)
    .transferOwnership(newOwnerAddress);
  // console.log("Diamond cut tx: ", tx.hash);
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Transfer ownership failed: ${tx.hash}`);
  }
}
