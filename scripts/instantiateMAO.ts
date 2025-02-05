import { Distributor } from '../types';
import { BytesLike } from 'ethers';
import { Signer } from 'ethers';

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
    govToken: instances[0],
    govTokenAccessManager: instances[1],
    ACIDInstance: instances[2],
    ACIDAccessManager: instances[10],
    rankToken: instances[11],
    instanceId: evts[0].args.newInstanceId,
    distributorsId: evts[0].args.distributionId,
  };
};

export default instantiateMAO;
