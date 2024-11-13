import { Distributor } from '../../types';
import { BytesLike } from 'ethers';
import { Signer } from '@ethersproject/abstract-signer';

export const instantiateMAO = async ({
  distributor,
  distributorsId,
  args,
  signer,
}: {
  distributor: Distributor;
  distributorsId: string;
  signer: Signer;
  args: BytesLike;
}) => {
  (await distributor.connect(signer).instantiate(distributorsId, args)).wait();

  const filter = distributor.filters.Instantiated(distributorsId);
  const evts = await distributor.queryFilter(filter);
  if (evts.length === 0) throw new Error('No Instantiated event found');
  if (evts.length > 1) throw new Error('Multiple Instantiated events found');
  const instances = evts[0].args.instances;

  return {
    daoAddress: instances[0],
    govToken: instances[1],
    govTokenAccessManager: instances[2],
    ACIDInstance: instances[3],
    ACIDAccessManager: instances[12],
    rankToken: instances[13],
    instanceId: evts[0].args.newInstanceId,
    distributorsId: evts[0].args.distributionId,
  };
};

export default instantiateMAO;
