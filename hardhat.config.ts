import { task, subtask } from 'hardhat/config';
import { TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS } from 'hardhat/builtin-tasks/task-names';
import { join } from 'path';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { inspect } from 'util';
import '@solarity/hardhat-zkit';
import '@solarity/chai-zkit';
import '@nomicfoundation/hardhat-chai-matchers';
import 'hardhat-diamond-abi';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-abi-exporter';
import { toSignature, isIncluded } from './scripts/diamond';
import 'hardhat-gas-reporter';
import 'hardhat-contract-sizer';
import 'hardhat-deploy';
import 'hardhat-tracer';
import 'solidity-docgen';
import './playbook';
import getSuperInterface from './scripts/getSuperInterface';
import { FormatTypes } from '@ethersproject/abi';
import './scripts/generateSelectorDocs';
import fs from 'fs';
type ContractMap = Record<string, { abi: object }>;

subtask(TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS).setAction(async (args, env, next) => {
  const output = await next();
  const promises = Object.entries(args.output.contracts).map(async ([sourceName, contract]) => {
    // Extract the contract name from the full path
    const contractName = sourceName.split('/').pop()?.replace('.sol', '') || '';
    const dirPath = join('./abi', sourceName);
    await mkdir(dirPath, { recursive: true });
    const file = join(dirPath, `${contractName}.ts`);
    const { abi } = Object.values(contract as ContractMap)[0];
    if (JSON.stringify(abi).length > 2) {
      const data = `export const abi = ${inspect(abi, false, null)} as const; export default abi;`;
      await writeFile(file, data);
    }
  });
  await Promise.all(promises);
  getSuperInterface('./abi/super-interface.json');
  env.run('getSuperInterface', { outputPathAbi: './all-signatures.json' });
  return output;
});

task('diamond-abi-viem-export', 'Generates the rankify diamond viem abi file').setAction(async (_, hre) => {
  try {
    const diamondDirpath = join('./abi/hardhat-diamond-abi/HardhatDiamondABI.sol');
    await mkdir(diamondDirpath, { recursive: true });
    const diamondAbiPath = join(diamondDirpath, 'RankifyDiamondInstance.json');
    const diamondAbiContent = await readFile(diamondAbiPath, 'utf-8');
    const abi = JSON.parse(diamondAbiContent);
    if (abi) {
      const data = `export const abi = ${inspect(abi, false, null)} as const; export default abi;`;
      await writeFile(join(diamondDirpath, 'RankifyDiamondInstance.ts'), data);
    }
  } catch (error) {
    console.warn('Failed to generate diamond ABI:', error);
  }
});

task('defaultDistributionId', 'Prints the default distribution id', async (taskArgs: { print: boolean }, hre) => {
  const id = hre.ethers.utils.formatBytes32String(process.env.DEFAULT_DISTRIBUTION_NAME ?? 'MAO Distribution');
  if (taskArgs.print) console.log(id);
  return id;
}).addFlag('print', 'Prints the default distribution id');

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task('getSuperInterface', 'Prints the super interface of a contract')
  .setAction(async (taskArgs: { outputPathAbi: string }, hre) => {
    const su = getSuperInterface();
    let return_value: Record<string, string> = {};
    const originalConsoleLog = console.log;
    console.log = () => {};
    Object.values(su.functions).forEach(x => {
      return_value[su.getSighash(x.format())] = x.format(FormatTypes.full);
    });
    Object.values(su.events).forEach(x => {
      return_value[su.getEventTopic(x)] = x.format(FormatTypes.full);
    });
    Object.values(su.errors).forEach(x => {
      return_value[su.getSighash(x)] = x.format(FormatTypes.full);
    });
    fs.writeFileSync(taskArgs.outputPathAbi, JSON.stringify(return_value, null, 2));
    console.log = originalConsoleLog;
  })
  .addParam('outputPathAbi', 'The path to the abi file');

export default {
  zkit: {
    compilerVersion: '2.2.0',
    circuitsDir: 'circuits',
    compilationSettings: {
      artifactsDir: 'zk_artifacts',
      onlyFiles: [],
      skipFiles: [],
      c: false,
      json: false,
      optimization: 'O1',
    },
    setupSettings: {
      contributionSettings: {
        provingSystem: 'groth16', // or "plonk"
        contributions: 2,
      },
      onlyFiles: [],
      skipFiles: [],
      ptauDownload: true,
    },
    verifiersSettings: {
      verifiersDir: 'src/verifiers',
      verifiersType: 'sol', // or "vy"
    },
    typesDir: 'types/zk',
    quiet: false,
  },
  docgen: {
    outputDir: './docs/contracts',
    pages: 'files',
    templates: 'docs/templates',
    sourcesDir: './src',
    pageExtension: '.md',
    exclude: ['mocks', 'initializers', 'vendor', 'modifiers', 'fixtures'],
  },
  gasReporter: {
    currency: 'EUR',
    gasPrice: 21,
    token: 'MATIC',
    gasPriceApi: 'https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice',
    enabled: false,
    coinmarketcap: process.env.COINMARKETCAP_KEY,
  },
  namedAccounts: {
    deployer: {
      hardhat: '0xF52E5dF676f51E410c456CC34360cA6F27959420',
      anvil: '0x6Cf8d74C7875de8C2FfB09228F4bf2A21b25e583',
      default: '0xF52E5dF676f51E410c456CC34360cA6F27959420', //TODO this must be set for networks
    },
    owner: {
      default: '0x520E00225C4a43B6c55474Db44a4a44199b4c3eE',
      anvil: '0x507c2d32185667156de5B4C440FEEf3800078bDb',
    },
    gameMaster: {
      localhost: '0xaA63aA2D921F23f204B6Bcb43c2844Fb83c82eb9',
    },
    defaultPlayer: {
      localhost: '0xF52E5dF676f51E410c456CC34360cA6F27959420',
    },
    DAO: {
      default: '0x520E00225C4a43B6c55474Db44a4a44199b4c3eE',
    },
    player1: {
      default: '0xFE87428cC8C72A3a79eD1cC7e2B5892c088d0af0',
    },
  },
  mocha: {
    timeout: 400000,
  },
  defaultNetwork: 'hardhat',
  networks: {
    buildbear: {
      name: 'buildbear',
      accounts: {
        mnemonic: process.env.BUILDBEAR_MNEMONIC ?? 'x',
      },
      url: process.env.BUILDBEAR_RPC_URL ?? '',
    },
    hardhat: {
      name: 'hardhat',
      accounts: {
        mnemonic: 'casual vacant letter raw trend tool vacant opera buzz jaguar bridge myself',
      }, // ONLY LOCAL
      tags: ['ERC7744'],
    },
    localhost: {
      name: 'localhost',
      url: 'http://127.0.0.1:8545',
      accounts: {
        mnemonic: 'casual vacant letter raw trend tool vacant opera buzz jaguar bridge myself',
      }, // ONLY LOCAL
      tags: ['ERC7744'],
    },
    devnet: {
      name: 'devnet',
      url: process.env.DEVNET_RPC_URL ?? '',
      accounts: {
        mnemonic: process.env.DEVNET_MNEMONIC ?? 'x',
      },
    },
  },
  paths: {
    sources: './src',
  },
  solidity: {
    compilers: [
      {
        version: '0.8.28',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        },
      },
      {
        version: '0.8.20',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        },
      },
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        },
      },
    ],
  },
  diamondAbi: [
    {
      name: 'RankifyDiamondInstance',
      include: [
        'DiamondLoupeFacet',
        'EIP712InspectorFacet',
        'OwnershipFacet',
        'RankifyInstanceMainFacet',
        'RankifyInstanceRequirementsFacet',
        'RankifyInstanceGameMastersFacet',
      ],
      strict: false,
      filter(abiElement: unknown, index: number, abi: unknown[], fullyQualifiedName: string) {
        const signature = toSignature(abiElement);
        return isIncluded(fullyQualifiedName, signature);
      },
    },
  ],
  typechain: {
    outDir: 'types',
    target: 'ethers-v5',
    alwaysGenerateOverloads: true, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    // externalArtifacts: ["externalArtifacts/*.json"], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: true,
  },

  abiExporter: {
    path: './abi',
    runOnCompile: true,
    clear: true,
    format: 'json',
    // flat: true,
    // only: [":ERC20$"],
    spacing: 2,
    pretty: false,
  },
  external: {
    contracts: [
      {
        artifacts: 'node_modules/@peeramid-labs/eds/artifacts',
        deploy: 'node_modules/@peeramid-labs/eds/deploy',
      },
    ],
  },
};
