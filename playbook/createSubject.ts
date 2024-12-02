import { task } from 'hardhat/config';

import { getCodeIdFromArtifact } from '../scripts/getCodeId';
import { DAODistributor, MAODistribution, Rankify } from '../types';
import generateDistributorData from '../scripts/libraries/generateDistributorData';
import { InstantiatedEvent } from '../types/src/distributors/DAODistributor';

task('createSubject', 'Creates a new subject with MAO distribution')
  .addOptionalParam('daoUri', 'URI for the DAO metadata', 'https://example.com/dao')
  .addOptionalParam('subdomain', 'Subdomain for the DAO. NB: Must be unique', 'example')
  .addOptionalParam('metadata', 'Metadata for the DAO', 'metadata')
  .addOptionalParam('tokenName', 'Name of the token', 'tokenName')
  .addOptionalParam('tokenSymbol', 'Symbol of the token', 'tokenSymbol')
  .addOptionalParam('rankTokenUri', 'URI for the rank token', 'https://example.com/rank')
  .addOptionalParam('rankTokenContractUri', 'URI for the rank token contract', 'https://example.com/rank')
  .addOptionalParam('principalCost', 'Principal cost for ranking', '1')
  .addOptionalParam('principalTimeConstant', 'Time constant for principal', '3600')
  .setAction(async (taskArgs, hre) => {
    const { getNamedAccounts } = hre;
    const distributorDeployment = await hre.deployments.get('DAODistributor');

    const distributorArguments: MAODistribution.DistributorArgumentsStruct = {
      DAOSEttings: {
        daoURI: taskArgs.daoUri,
        subdomain: taskArgs.subdomain,
        metadata: hre.ethers.utils.hexlify(hre.ethers.utils.toUtf8Bytes(taskArgs.metadata)),
        tokenName: taskArgs.tokenName,
        tokenSymbol: taskArgs.tokenSymbol,
      },
      RankifySettings: {
        RankTokenContractURI: taskArgs.rankTokenContractUri,
        metadata: hre.ethers.utils.hexlify(hre.ethers.utils.toUtf8Bytes(taskArgs.metadata)),
        rankTokenURI: taskArgs.rankTokenUri,
        principalCost: taskArgs.principalCost,
        principalTimeConstant: taskArgs.principalTimeConstant,
      },
    };

    const { DAO } = await getNamedAccounts();

    const distributorContract = new hre.ethers.Contract(
      distributorDeployment.address,
      distributorDeployment.abi,
      await hre.ethers.getSigner(DAO),
    ) as DAODistributor;

    const data = generateDistributorData(distributorArguments);

    const maoId = await getCodeIdFromArtifact(hre)('MAODistribution');
    const distributorsDistId = await distributorContract['calculateDistributorId(bytes32,address)'](
      maoId,
      hre.ethers.constants.AddressZero,
    );

    const token = await hre.deployments.get('Rankify');
    const { DAO: owner } = await hre.getNamedAccounts();
    const oSigner = await hre.ethers.getSigner(owner);
    const tokenContract = new hre.ethers.Contract(token.address, token.abi, oSigner) as Rankify;
    await tokenContract.mint(oSigner.address, hre.ethers.utils.parseEther('100'));
    await tokenContract.approve(distributorContract.address, hre.ethers.constants.MaxUint256);
    const instances = await distributorContract.numInstances();
    const tx = await distributorContract.connect(oSigner).instantiate(distributorsDistId, data);
    const receipt = await tx.wait();
    const filter = distributorContract.filters.Instantiated(distributorsDistId);
    const t = filter.topics && filter.topics[0];
    if (!t) throw new Error('Filter not found');
    const logs = receipt.logs.filter(log => log.topics[0] === t);
    const parsedLog = distributorContract.interface.parseLog(logs[0]);

    console.log('Subject created successfully!');
    console.log('Transaction hash:', tx.hash);
    console.log('DAO URI:', taskArgs.daoUri);
    console.log('Token Name:', taskArgs.tokenName);
    console.log('Token Symbol:', taskArgs.tokenSymbol);
    console.log('instances created', parsedLog.args.instances);
    console.log('instance id', parsedLog.args.newInstanceId);
    return {
      instances,
      newInstanceId: parsedLog.args.newInstanceId,
      receipt,
      instancesParsed: {
        rankToken: parsedLog.args.instances[12],
        rankifyInstance: parsedLog.args.instances[3],
        daoInstance: parsedLog.args.instances[0],
        govToken: parsedLog.args.instances[1],
        govTokenAccessManager: parsedLog.args.instances[2],
        acidInstance: parsedLog.args.instances[3],
        acidAccessManager: parsedLog.args.instances[11],
      },
    };
  });
