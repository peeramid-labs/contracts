import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ethers } from 'hardhat';

export const addDistribution = (hre: HardhatRuntimeEnvironment) => async (distrId: string, initializer?: string) => {
  const { deployments, getNamedAccounts } = hre;
  const PeeramidLabsDistributor = await deployments.get('PeeramidLabsDistributor');
  const { owner } = await getNamedAccounts();
  const distributorContract = new ethers.Contract(
    PeeramidLabsDistributor.address,
    PeeramidLabsDistributor.abi,
    hre.ethers.provider.getSigner(owner),
  );
  const distributionsLengthBefore = (await distributorContract.getDistributions()).length;
  const tx = await distributorContract.addDistribution(distrId, initializer ?? ethers.constants.AddressZero);
  await tx.wait();
  const distributorsId = await distributorContract.getDistributions();
  if (distributorsId.length !== distributionsLengthBefore + 1)
    throw new Error(
      `Unexpected distribution id increment: got ${distributorsId.length}, expected ${distributionsLengthBefore + 1}`,
    );
  return { distributor: distributorContract, distributorsId };
};

export default addDistribution;
