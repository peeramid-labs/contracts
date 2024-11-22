import { ethers } from 'ethers';
import { MAODistribution } from '../../types/src/distributions/MAODistribution';

export function generateDistributorData(args: MAODistribution.DistributorArgumentsStruct): string {
  const data = ethers.utils.defaultAbiCoder.encode(
    [
      'tuple(tuple(string daoURI, string subdomain, bytes metadata, string tokenName, string tokenSymbol) DAOSEttings, tuple(uint256 principalCost, uint256 principalTimeConstant, string metadata, string rankTokenURI, string RankTokenContractURI) RankifySettings)',
    ],
    [args],
  );
  return data;
}
export default generateDistributorData;
