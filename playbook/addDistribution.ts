import { task } from 'hardhat/config';

import addDistribution from '../scripts/playbooks/addDistribution';
import { getCodeIdFromArtifact } from '../scripts/getCodeId';

task('addDistribution', 'Adds new distribution').setAction(async (_, hre) => {
  const { getNamedAccounts } = hre;
  const { DAO } = await getNamedAccounts();

  const oSigner = await hre.ethers.getSigner(DAO);
  const result = await addDistribution(hre)(await getCodeIdFromArtifact(hre)('MAODistribution'), oSigner);
  console.log('Distribution added, Distributors Id:', result.distributorsId);
  return result;
});
