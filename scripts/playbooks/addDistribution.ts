import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Signer } from '@ethersproject/abstract-signer';
import { DAODistributor } from '../../types';

export const addDistributionNoChecks =
  (hre: HardhatRuntimeEnvironment) => async (distrId: string, signer: Signer, initializer?: string) => {
    const { deployments } = hre;
    const DAODistributor = await deployments.get('DAODistributor');
    const distributorContract = new hre.ethers.Contract(DAODistributor.address, DAODistributor.abi, signer);
    return distributorContract.addDistribution(distrId, initializer ?? hre.ethers.constants.AddressZero);
  };

export const addDistribution =
  (hre: HardhatRuntimeEnvironment) => async (distrId: string, signer: Signer, initializer?: string) => {
    const { deployments } = hre;
    const DAODistributor = await deployments.get('DAODistributor');
    const distributorContract = new hre.ethers.Contract(
      DAODistributor.address,
      DAODistributor.abi,
      signer,
    ) as DAODistributor;
    const distributionsLengthBefore = (await distributorContract.getDistributions()).length;
    const receipt = await distributorContract['addDistribution(bytes32,address)'](
      distrId,
      initializer ?? hre.ethers.constants.AddressZero,
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
