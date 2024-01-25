import { task } from 'hardhat/config';
import { ethers } from 'hardhat';
import '@nomicfoundation/hardhat-chai-matchers';
import 'hardhat-diamond-abi';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-abi-exporter';
import { toSignature, isIncluded } from './scripts/diamond';
import { cutFacets, replaceFacet } from './scripts/libraries/diamond';
import 'hardhat-gas-reporter';
// import * as ipfsUtils from "./utils/ipfs";
// import fs from "fs";
import 'hardhat-contract-sizer';
import 'hardhat-deploy';
import 'solidity-docgen';
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// task("upload2IPFS", "Uploads files to ipfs")
//   .addParam("path", "file path")
//   .setAction(async (taskArgs) => {
//     const data = fs.readFileSync(taskArgs.path);
//     await ipfsUtils.upload2IPFS(data);
//   });

// task("uploadDir2IPFS", "Uploads directory to ipfs")
//   .addParam("path", "path")
//   .setAction(async (taskArgs) => {
//     await ipfsUtils.uploadDir2IPFS(taskArgs.path);
//   });

task('replaceFacet', 'Upgrades facet')
  .addParam('facet', 'facet')
  .addParam('address', 'contract address')
  .setAction(async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();
    const response = await replaceFacet(taskArgs.address, taskArgs.facet, accounts[0]);
  });

task('addFacet', 'adds a facet')
  .addParam('facet', 'facet')
  .addParam('address', 'contract address')
  .setAction(async (taskArgs, hre) => {
    const Facet = await hre.ethers.getContractFactory(taskArgs.facet);
    const accounts = await hre.ethers.getSigners();
    const facet = await Facet.deploy();
    await facet.deployed();

    const response = await cutFacets({
      facets: [facet],
      diamondAddress: taskArgs.address,
      signer: accounts[0],
    });
  });

// task("PublishIPNS", "Publishes IPNS with new pointer")
//   .addParam("value")
//   .setAction(async (taskArgs) => {
//     await ipfsUtils.publish(`${taskArgs.value}`);
//   });

export default {
  docgen: {
    outputDir: './docs/contracts',
    pages: 'single',
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
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      accounts: {
        mnemonic: 'casual vacant letter raw trend tool vacant opera buzz jaguar bridge myself',
      }, // ONLY LOCAL
    },
    mumbai: {
      url: 'https://matic-mumbai.chainstacklabs.com',
      accounts: process.env.PRIVATE_KEY && [process.env.PRIVATE_KEY],
    },
    matic: {
      url: process.env.RPC_URL ?? '',
      accounts: process.env.PRIVATE_KEY && [process.env.PRIVATE_KEY],
    },
    ganache: {
      url: process.env.GANACHE_RPC_URL ?? '',
      accounts: process.env.PRIVATE_KEY && [process.env.PRIVATE_KEY],
    },
    goerli: {
      url: process.env.RPC_URL ?? '',
      accounts: process.env.PRIVATE_KEY && [process.env.PRIVATE_KEY],
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      accounts: {
        mnemonic: 'casual vacant letter raw trend tool vacant opera buzz jaguar bridge myself',
      }, // ONLY LOCAL
    },
    anvil: {
      url: process.env.ANVIL_RPC_URL ?? '',
      accounts: {
        mnemonic: process.env.ANVIL_MNEMONIC ?? 'x',
      },
    },
  },
  paths: {
    sources: './src',
  },
  solidity: {
    compilers: [
      {
        version: '0.8.20',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200000,
          },
        },
      },
    ],
  },
  diamondAbi: [
    {
      // (required) The name of your Diamond ABI
      name: 'MultipassDiamond',
      include: ['DNSFacet', 'OwnershipFacet', 'DiamondLoupeFacet', 'EIP712InspectorFacet'],
      // We explicitly set `strict` to `true` because we want to validate our facets don't accidentally provide overlapping functions
      strict: true,
      // We use our diamond utils to filter some functions we ignore from the combined ABI
      filter(abiElement: unknown, index: number, abi: unknown[], fullyQualifiedName: string) {
        // const changes = new diamondUtils.DiamondChanges();
        const signature = toSignature(abiElement);
        return isIncluded(fullyQualifiedName, signature);
      },
    },
    {
      name: 'RankifyDiamondInstance',
      include: [
        'DiamondLoupeFacet',
        'EIP712InspectorFacet',
        'OwnershipFacet',
        'RankifyInstanceMainFacet',
        'RankifyInstanceRequirementsFacet',
        'RankifyInstanceGameMastersFacet',
        'RankifyInstanceGameOwnersFacet',
      ],
      strict: true,
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
};
