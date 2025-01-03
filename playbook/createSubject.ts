import { task } from 'hardhat/config';

import { getCodeIdFromArtifact } from '../scripts/getCodeId';
import { DAODistributor, MAODistribution, Rankify } from '../types';
import { generateDistributorData } from '../scripts/libraries/generateDistributorData';
import { parseInstantiated } from '../scripts/parseInstantiated';

task('createSubject', 'Creates a new subject with MAO distribution')
  .addOptionalParam('metadata', 'Metadata for the rankify contract', 'metadata')
  .addOptionalParam('tokenName', 'Name of the token', 'tokenName')
  .addOptionalParam('tokenSymbol', 'Symbol of the token', 'tokenSymbol')
  .addOptionalParam('rankTokenUri', 'URI for the rank token', 'https://example.com/rank')
  .addOptionalParam('rankTokenContractUri', 'URI for the rank token contract', 'https://example.com/rank')
  .addOptionalParam('principalCost', 'Principal cost for ranking', '1')
  .addOptionalParam('principalTimeConstant', 'Time constant for principal', '3600')
  .addOptionalParam(
    'distributorsId',
    'Distributors ID to create game from, defaults to hardhat task defaultDistributionId',
  )
  .setAction(async (taskArgs, hre) => {
    const { getNamedAccounts } = hre;
    const distributorDeployment = await hre.deployments.get('DAODistributor');

    const distributorArguments: MAODistribution.DistributorArgumentsStruct = {
      tokenSettings: {
        tokenName: taskArgs.tokenName,
        tokenSymbol: taskArgs.tokenSymbol,
      },
      rankifySettings: {
        rankTokenContractURI: taskArgs.rankTokenContractUri,
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

    const distributorsID = taskArgs.distributorsId ?? (await hre.run('defaultDistributionId'));
    if (!distributorsID) {
      throw new Error('Distribution name not found');
    }

    const token = await hre.deployments.get('Rankify');
    const { DAO: owner } = await hre.getNamedAccounts();
    const oSigner = await hre.ethers.getSigner(owner);
    const tokenContract = new hre.ethers.Contract(token.address, token.abi, oSigner) as Rankify;
    await tokenContract.mint(oSigner.address, hre.ethers.utils.parseEther('100'));
    await tokenContract.approve(distributorContract.address, hre.ethers.constants.MaxUint256);
    const tx = await distributorContract.connect(oSigner).instantiate(distributorsID, data);
    const receipt = await tx.wait(1);
    const filter = distributorContract.filters.Instantiated(distributorsID);
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
    console.log('Receipt:', receipt);
    return {
      instances: parsedLog.args.instances,
      newInstanceId: parsedLog.args.newInstanceId,
      receipt,
      instancesParsed: parseInstantiated(parsedLog.args.instances),
    };
  });

task('makeDemoSubjects', 'Creates 4 demo subjects with different configurations')
  .setAction(async (_, { run }) => {
    console.log('Creating demo subjects...');

    await run('createSubject', {
      tokenName: 'Rankify inner discussion token',
      tokenSymbol: 'RKFD',
      rankTokenContractUri: '/nft/rankify-inner-discussions/metadata.json',
    });

    await run('createSubject', {
      tokenName: 'Rankify music token',
      tokenSymbol: 'RKFM',
      rankTokenContractUri: '/nft/music-challenge/metadata.json',
    });

    await run('createSubject', {
      tokenName: 'Rankify kids content token',
      tokenSymbol: 'RKFK',
      rankTokenContractUri: '/nft/kids-content/metadata.json',
    });

    await run('createSubject', {
      tokenName: 'Rankify book writers',
      tokenSymbol: 'RKFBW',
      rankTokenContractUri: '/nft/book-writers/metadata.json',
    });

    await run('createSubject', {
      tokenName: 'Rankify developers token',
      tokenSymbol: 'RKFD',
      rankTokenContractUri: '/nft/developers/metadata.json',
    });

    await run('createSubject', {
      tokenName: 'Rankify designers toker',
      tokenSymbol: 'RKFDG',
      rankTokenContractUri: '/nft/designers/metadata.json',
    });

    console.log('Successfully created 6 demo subjects!');
  });
