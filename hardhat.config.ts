import { task } from 'hardhat/config';
import { ethers } from 'hardhat';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomiclabs/hardhat-truffle5';
import '@nomiclabs/hardhat-web3';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-diamond-abi';
import '@nomicfoundation/hardhat-toolbox';
import '@typechain/hardhat';
import 'hardhat-abi-exporter';
import { toSignature, isIncluded } from './scripts/diamond';
import { cutFacets, replaceFacet } from './scripts/libraries/diamond';
// import * as ipfsUtils from "./utils/ipfs";
// import fs from "fs";
import 'hardhat-gas-reporter';
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
    pages: 'files',
    pageExtension: '.mdx',
    exclude: ['mocks', 'initializers', 'vendor', 'modifiers', 'fixtures', 'abstracts', 'facets'],
  },
  gasReporter: {
    currency: 'EUR',
    gasPrice: 21,
    enabled: false,
    coinmarketcap: process.env.COINMARKETCAP_KEY,
  },
  namedAccounts: {
    deployer: {
      default: '0x7231161f85637Dea4DCa51e30ff443eD508c3313',
    },
    gameOwner: {
      hardhat: '0xBfdF0Ee33BF4a2640D67f720Ae6594E81f8114d4',
      default: '0xE48BC6673B4EEBec6A230f9112Cb2c1ac17bc273',
    },
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      accounts: {
        mnemonic: 'describe ribbon asthma today achieve nut label uniform seed charge library away',
      }, // LOCALUSE ONLY BABE
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
        mnemonic: 'test test test test test test test test test test test junk',
      }, // LOCALUSE ONLY BABE
    },
    anvil: {
      url: process.env.ANVIL_RPC_URL ?? '',
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk',
      }, // LOCALUSE ONLY BABE
    },
  },
  paths: {
    sources: './src',
  },
  solidity: {
    compilers: [
      {
        version: '0.8.8',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        },
      },
      {
        version: '0.7.6',
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
      name: 'BestOfDiamond',
      include: [
        'BestOfFacet',
        'OwnershipFacet',
        'DiamondLoupeFacet',
        'RequirementsFacet',
        'GameMastersFacet',
        'EIP712InspectorFacet',
      ],
      strict: true,
      filter(abiElement: unknown, index: number, abi: unknown[], fullyQualifiedName: string) {
        const signature = toSignature(abiElement);
        return isIncluded(fullyQualifiedName, signature);
      },
    },
  ],
  typechain: {
    outDir: 'types/typechain',
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
