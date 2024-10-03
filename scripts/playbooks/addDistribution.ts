import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ethers } from 'hardhat';
import { Signer } from '@ethersproject/abstract-signer';
import { PeeramidLabsDistributor } from '../../types';

export const addDistributionNoChecks =
  (hre: HardhatRuntimeEnvironment) => async (distrId: string, signer: Signer, initializer?: string) => {
    const { deployments } = hre;
    const PeeramidLabsDistributor = await deployments.get('PeeramidLabsDistributor');
    const distributorContract = new ethers.Contract(
      PeeramidLabsDistributor.address,
      PeeramidLabsDistributor.abi,
      signer,
    );
    return distributorContract.addDistribution(distrId, initializer ?? ethers.constants.AddressZero);
  };

export const addDistribution =
  (hre: HardhatRuntimeEnvironment) => async (distrId: string, signer: Signer, initializer?: string) => {
    const { deployments } = hre;
    const PeeramidLabsDistributor = await deployments.get('PeeramidLabsDistributor');
    const distributorContract = new ethers.Contract(
      PeeramidLabsDistributor.address,
      PeeramidLabsDistributor.abi,
      signer,
    ) as PeeramidLabsDistributor;
    const distributionsLengthBefore = (await distributorContract.getDistributions()).length;
    const receipt = await distributorContract['addDistribution(bytes32,address)'](
      distrId,
      initializer ?? ethers.constants.AddressZero,
    );

    const distributorsId = await distributorContract.getDistributions();
    if (distributorsId.length !== distributionsLengthBefore + 1)
      throw new Error(
        `Unexpected distribution id increment: got ${distributorsId.length}, expected ${distributionsLengthBefore + 1}`,
      );
    return {
      receipt,
      distributor: distributorContract,
      distributorsId,
    };
  };

export default addDistribution;
