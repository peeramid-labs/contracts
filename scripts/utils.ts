/**
 * Utility functions and types for the Rankify game system
 */

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import aes from 'crypto-js/aes';
import { HttpNetworkHDAccountsConfig } from 'hardhat/types';
import {
  Rankify,
  MockERC1155,
  MockERC20,
  MockERC721,
  RankToken,
  MAODistribution,
  DAODistributor,
  ArguableVotingTournament,
  RankifyInstanceGameMastersFacet,
  RankifyDiamondInstance,
} from '../types';
import { BigNumberish, BytesLike, TypedDataField, Wallet, BigNumber, constants, utils } from 'ethers';
// @ts-ignore
import { assert } from 'console';
import { Deployment } from 'hardhat-deploy/types';
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDiscussionForTurn } from './discussionTopics';
import { buildPoseidon } from 'circomlibjs';
import { sharedSigner } from './sharedKey';
import { generateDeterministicPermutation, generateEndTurnIntegrity } from './proofs';

/**
 * Calculates the interface ID for a contract by XORing all function selectors
 * @param contractInterface - The contract interface to calculate ID for
 * @returns The calculated interface ID as a BigNumber
 */
export function getInterfaceID(contractInterface: any) {
  let interfaceID: BigNumber = constants.Zero;
  const functions: string[] = Object.keys(contractInterface.functions);
  for (let i = 0; i < functions.length; i++) {
    interfaceID = interfaceID.xor(contractInterface.getSighash(functions[i]));
  }

  return interfaceID;
}

/**
 * Transfers ownership of a diamond contract to a new address
 * @param hre - Hardhat Runtime Environment
 * @param signer - The current owner's wallet
 * @param newOwnerAddress - Address of the new owner
 * @param diamondAddress - Address of the diamond contract
 * @throws Error if transfer fails
 */
export async function transferOwnership(
  hre: HardhatRuntimeEnvironment,
  signer: Wallet | SignerWithAddress,
  newOwnerAddress: string,
  diamondAddress: string,
) {
  const ownershipFacet = await hre.ethers.getContractAt('OwnershipFacet', diamondAddress);
  const tx = await ownershipFacet.connect(signer).transferOwnership(newOwnerAddress);
  // console.log("Diamond cut tx: ", tx.hash);
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Transfer ownership failed: ${tx.hash}`);
  }
}

/**
 * Safely retrieves an environment variable
 * @param print - If true, masks the value with 'X' characters
 * @param key - The environment variable key to retrieve
 * @returns The environment variable value or masked value
 * @throws Error if environment variable is not set
 */
export function getProcessEnv(print: boolean, key: string) {
  const ret = process.env[key];
  if (!ret) {
    throw new Error(key + ' must be exported in env');
  }
  return print ? 'X'.repeat(ret.length) : ret;
}

// Game constants
export const RANKIFY_INSTANCE_CONTRACT_NAME = 'RANKIFY_INSTANCE_NAME';
export const RANKIFY_INSTANCE_CONTRACT_VERSION = '0.0.1';
export const RInstance_TIME_PER_TURN = 2500;
export const RInstance_MAX_PLAYERS = 6;
export const RInstance_MIN_PLAYERS = 5;
export const RInstance_MAX_TURNS = 3;
export const RInstance_TIME_TO_JOIN = '200';
export const RInstance_GAME_PRICE = utils.parseEther('0.001');
export const RInstance_JOIN_GAME_PRICE = utils.parseEther('0.001');
export const RInstance_NUM_WINNERS = 3;
export const RInstance_VOTE_CREDITS = 14;
export const RInstance_SUBJECT = 'Best Music on youtube';

/**
 * Represents a signer's identity in the game
 */
export interface SignerIdentity {
  /** Display name of the signer */
  name: string;
  /** Unique identifier for the signer */
  id: string;
  /** Ethereum wallet associated with the signer */
  wallet: Wallet;
}

/**
 * Result of setting up addresses for testing/deployment
 * Contains all player, admin and special role identities
 */
export interface AdrSetupResult {
  contractDeployer: SignerIdentity;
  player1: SignerIdentity;
  player2: SignerIdentity;
  player3: SignerIdentity;
  player4: SignerIdentity;
  player5: SignerIdentity;
  player6: SignerIdentity;
  player7: SignerIdentity;
  player8: SignerIdentity;
  player9: SignerIdentity;
  player10: SignerIdentity;
  player11: SignerIdentity;
  player12: SignerIdentity;
  player13: SignerIdentity;
  player14: SignerIdentity;
  player15: SignerIdentity;
  player16: SignerIdentity;
  player17: SignerIdentity;
  player18: SignerIdentity;
  maliciousActor1: SignerIdentity;
  maliciousActor2: SignerIdentity;
  maliciousActor3: SignerIdentity;
  gameCreator1: SignerIdentity;
  gameCreator2: SignerIdentity;
  gameCreator3: SignerIdentity;
  gameMaster1: SignerIdentity;
  gameMaster2: SignerIdentity;
  gameMaster3: SignerIdentity;
  gameOwner: SignerIdentity;
}

/**
 * Result of setting up the game environment
 * Contains all contract instances needed for the game
 */
export interface EnvSetupResult {
  rankifyToken: Rankify;
  arguableVotingTournamentDistribution: ArguableVotingTournament;
  rankTokenBase: RankToken;
  mockERC20: MockERC20;
  mockERC1155: MockERC1155;
  mockERC721: MockERC721;
  maoDistribution: MAODistribution;
  distributor: DAODistributor;
}

/**
 * Creates a player name and ID from an index
 * @param idx - The player index
 * @returns Object containing generated name and ID
 */
export const addPlayerNameId = (idx: any) => {
  return { name: `player-${idx}`, id: `player-${idx}-id` };
};

/**
 * Sets up all addresses needed for testing and deployment
 * Creates wallets for contract deployer, players, game masters, and other roles
 * @param hre - Hardhat Runtime Environment
 * @returns A function that takes named accounts and ethers instance to complete setup
 */
export const setupAddresses =
  (hre: HardhatRuntimeEnvironment) =>
  async (
    getNamedAccounts: () => Promise<{
      [name: string]: string;
    }>,
    _eth: typeof import('ethers/lib/ethers') & HardhatEthersHelpers,
  ): Promise<AdrSetupResult> => {
    const { ethers } = hre;
    const [
      ,
      ,
      ,
      //Using first ones in hardhat deploy scripts
      _player1,
      _player2,
      _player3,
      _player4,
      _player5,
      _player6,
      _player7,
      _player8,
      _player9,
      _player10,
      _player11,
      _player12,
      _player13,
      _player14,
      _player15,
      _player16,
      _player17,
    ] = await ethers.getSigners();

    /**
     * Creates a random wallet identity and funds it with ETH
     * @param name - Name for the new identity
     * @returns A SignerIdentity with a funded wallet
     */
    const createRandomIdentityAndSeedEth = async (name: string) => {
      let newWallet = new _eth.Wallet(_eth.utils.solidityKeccak256(['string'], [name]));
      newWallet = newWallet.connect(_eth.provider);
      await _player1.sendTransaction({
        to: newWallet.address,
        value: ethers.utils.parseEther('10'),
      });

      const newIdentity: SignerIdentity = {
        wallet: newWallet,
        name: name,
        id: name + '-id',
      };
      return newIdentity;
    };

    const gameCreator1 = await createRandomIdentityAndSeedEth('gameCreator1');
    const gameCreator2 = await createRandomIdentityAndSeedEth('gameCreator2');
    const gameCreator3 = await createRandomIdentityAndSeedEth('gameCreator3');
    const maliciousActor1 = await createRandomIdentityAndSeedEth('maliciousActor');
    const gameMaster1 = await createRandomIdentityAndSeedEth('GM1');
    const gameMaster2 = await createRandomIdentityAndSeedEth('GM2');
    const gameMaster3 = await createRandomIdentityAndSeedEth('GM3');
    const maliciousActor2 = await createRandomIdentityAndSeedEth('MaliciousActor2');
    const maliciousActor3 = await createRandomIdentityAndSeedEth('MaliciousActor3');
    const player18 = await createRandomIdentityAndSeedEth('player18');

    //   if (hre.config.networks['localhost'].accounts instanceof HttpNetworkHDAccountsConfig)
    // throw new Error('Wrong config on localhost');
    const m = (hre.config.networks['localhost'].accounts as HttpNetworkHDAccountsConfig)['mnemonic'];
    //   const keychain = ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${i}`);
    //   ethers.getSigners();

    const contractDeployer: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${0}`).connect(hre.ethers.provider),
      name: 'contractDeployer',
      id: 'contractDeployer-id',
    };

    const gameOwner: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${1}`).connect(hre.ethers.provider),
      name: 'gameOwner',
      id: 'gameOwner-id',
    };
    const player1: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${2}`).connect(hre.ethers.provider),
      name: 'player1',
      id: 'player1-id',
    };
    const player2: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${3}`).connect(hre.ethers.provider),
      name: 'player2',
      id: 'player2-id',
    };
    const player3: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${4}`).connect(hre.ethers.provider),
      name: 'player3',
      id: 'player3-id',
    };
    const player4: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${5}`).connect(hre.ethers.provider),
      name: 'player4',
      id: 'player4-id',
    };
    const player5: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${6}`).connect(hre.ethers.provider),
      name: 'player5',
      id: 'player5-id',
    };
    const player6: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${7}`).connect(hre.ethers.provider),
      name: 'player6',
      id: 'player6-id',
    };
    const player7: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${8}`).connect(hre.ethers.provider),
      name: 'player7',
      id: 'player7-id',
    };
    const player8: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${9}`).connect(hre.ethers.provider),
      name: 'player8',
      id: 'player8-id',
    };
    const player9: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${10}`).connect(hre.ethers.provider),
      name: 'player9',
      id: 'player9-id',
    };
    const player10: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${11}`).connect(hre.ethers.provider),
      name: 'player10',
      id: 'player10-id',
    };
    const player11: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${12}`).connect(hre.ethers.provider),
      name: 'player11',
      id: 'player11-id',
    };
    const player12: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${13}`).connect(hre.ethers.provider),
      name: 'player12',
      id: 'player12-id',
    };
    const player13: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${14}`).connect(hre.ethers.provider),
      name: 'player13',
      id: 'player13-id',
    };
    const player14: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${15}`).connect(hre.ethers.provider),
      name: 'player14',
      id: 'player14-id',
    };
    const player15: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${16}`).connect(hre.ethers.provider),
      name: 'player15',
      id: 'player15-id',
    };
    const player16: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${17}`).connect(hre.ethers.provider),
      name: 'player16',
      id: 'player16-id',
    };
    const player17: SignerIdentity = {
      wallet: ethers.Wallet.fromMnemonic(m, `m/44'/60'/0'/0/${18}`).connect(hre.ethers.provider),
      name: 'player17',
      id: 'player17-id',
    };

    return {
      contractDeployer,
      player1,
      player2,
      player3,
      player4,
      player5,
      player6,
      player7,
      player8,
      player9,
      player10,
      player11,
      player12,
      player13,
      player14,
      player15,
      player16,
      player17,
      player18,
      maliciousActor1,
      gameCreator1,
      gameCreator2,
      gameCreator3,
      gameMaster1,
      gameMaster2,
      gameMaster3,
      maliciousActor2,
      maliciousActor3,
      gameOwner,
    };
  };

const baseFee = 1 * 10 ** 18;

/**
 * Game settings and configuration values
 */
export const RInstanceSettings = {
  RInstance_TIME_PER_TURN,
  RInstance_MAX_PLAYERS,
  RInstance_MIN_PLAYERS,
  RInstance_MAX_TURNS,
  RInstance_TIME_TO_JOIN,
  RInstance_GAME_PRICE,
  RInstance_JOIN_GAME_PRICE,
  RInstance_NUM_WINNERS,
  RInstance_VOTE_CREDITS,
  RInstance_SUBJECT,
  PRINCIPAL_TIME_CONSTANT: 3600,
  RInstance_MIN_GAME_TIME: 360,
  PRINCIPAL_COST: utils.parseEther('1'),
};

/**
 * Sets up the complete playbook for testing including contracts and player accounts
 * @param hre - Hardhat Runtime Environment
 * @returns Object containing address setup and environment setup results
 */
export const setupPlaybook = async (hre: HardhatRuntimeEnvironment) => {
  const deployments = hre.deployments;
  await hre.run('deploy', {
    tags: 'MAO',
    network: 'localhost',
  });
  const { getNamedAccounts } = hre;
  const { ethers: _eth } = hre;
  //   await deployments.fixture(['MAO'], { keepExistingDeployments: true });
  const adr = await setupAddresses(hre)(getNamedAccounts, _eth);
  const { deployer, owner } = await hre.getNamedAccounts();

  await adr.contractDeployer.wallet.sendTransaction({
    to: deployer,
    value: _eth.utils.parseEther('1'),
  });
  await adr.contractDeployer.wallet.sendTransaction({
    to: owner,
    value: _eth.utils.parseEther('1'),
  });
  const MockERC20F = await _eth.getContractFactory('MockERC20', adr.contractDeployer.wallet);
  const mockERC20 = (await MockERC20F.deploy('Mock ERC20', 'MCK20', adr.contractDeployer.wallet.address)) as MockERC20;
  await mockERC20.deployed();

  const MockERC1155F = await _eth.getContractFactory('MockERC1155', adr.contractDeployer.wallet);
  const mockERC1155 = (await MockERC1155F.deploy('MOCKURI', adr.contractDeployer.wallet.address)) as MockERC1155;
  await mockERC1155.deployed();

  const MockERC721F = await _eth.getContractFactory('MockERC721', adr.contractDeployer.wallet);
  const mockERC721 = (await MockERC721F.deploy(
    'Mock ERC721',
    'MCK721',
    adr.contractDeployer.wallet.address,
  )) as MockERC721;
  await mockERC721.deployed();
  const env = await setupEnvironment({
    hre,
    distributor: await deployments.get('DAODistributor'),
    mao: await deployments.get('MAODistribution'),
    RankifyToken: await deployments.get('Rankify'),
    RankTokenBase: await deployments.get('RankToken'),
    // RankifyInstance: await deployments.get('RankifyInstance'),
    arguableVotingTournamentDistribution: await deployments.get('ArguableVotingTournament'),
    mockERC20: mockERC20,
    mockERC721: mockERC721,
    mockERC1155: mockERC1155,
    adr,
  });
  const { ethers } = hre;
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.gameCreator1.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.gameCreator2.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.gameCreator3.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player1.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player2.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player3.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player4.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player5.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player6.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player7.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player8.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player9.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.player10.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.maliciousActor1.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.maliciousActor2.wallet.address, ethers.utils.parseEther('1000000'));
  await env.rankifyToken
    .connect(adr.gameOwner.wallet)
    .mint(adr.maliciousActor3.wallet.address, ethers.utils.parseEther('1000000'));
  return {
    adr,
    env,
  };
};
// export const setupTest = () => setupTest();
/**
 * Sets up the game environment with all required contract instances
 * @param setup - Setup configuration including contract deployments and addresses
 * @returns Initialized contract instances needed for the game
 */
export const setupEnvironment = async (setup: {
  hre: HardhatRuntimeEnvironment;
  distributor: Deployment;
  mao: Deployment;
  RankifyToken: Deployment;
  RankTokenBase: Deployment;
  mockERC20: MockERC20;
  mockERC721: MockERC721;
  mockERC1155: MockERC1155;
  adr: AdrSetupResult;
  arguableVotingTournamentDistribution: Deployment;
}): Promise<EnvSetupResult> => {
  const { ethers } = setup.hre;
  const rankTokenBase = (await ethers.getContractAt(setup.RankTokenBase.abi, setup.RankTokenBase.address)) as RankToken;
  const rankifyToken = (await ethers.getContractAt(setup.RankifyToken.abi, setup.RankifyToken.address)) as Rankify;
  //   const rankifyInstance = (await ethers.getContractAt(
  //     setup.RankifyInstance.abi,
  //     setup.RankifyInstance.address,
  //   )) as RankifyDiamondInstance;

  const maoDistribution = (await ethers.getContractAt(setup.mao.abi, setup.mao.address)) as MAODistribution;
  const distributor = (await ethers.getContractAt(setup.distributor.abi, setup.distributor.address)) as DAODistributor;

  const arguableVotingTournamentDistribution = (await ethers.getContractAt(
    setup.arguableVotingTournamentDistribution.abi,
    setup.arguableVotingTournamentDistribution.address,
  )) as ArguableVotingTournament;

  return {
    maoDistribution,
    distributor,
    rankifyToken,
    // rankifyInstance,
    rankTokenBase,
    mockERC1155: setup.mockERC1155,
    mockERC20: setup.mockERC20,
    mockERC721: setup.mockERC721,
    arguableVotingTournamentDistribution,
  };
};

interface ReferrerMessage {
  referrerAddress: string;
}
interface RegisterMessage {
  name: BytesLike;
  id: BytesLike;
  domainName: BytesLike;
  deadline: BigNumber;
  nonce: BigNumber;
}

type signatureMessage = ReferrerMessage | RegisterMessage;

/**
 * Mines a specified number of blocks for testing purposes
 * @param count - Number of blocks to mine
 * @param hre - Hardhat Runtime Environment
 */
export async function mineBlocks(count: any, hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  for (let i = 0; i < count; i += 1) {
    await ethers.provider.send('evm_mine', []);
  }
}

export interface ProposalParams {
  gameId: BigNumberish;
  encryptedProposal: string;
  commitment: BigNumberish;
  proposer: string;
  gmSignature: BytesLike;
  voterSignature: BytesLike;
}

export interface ProposalSubmission {
  params: ProposalParams;
  proposal: string;
  proposerSignerId?: SignerIdentity;
  proposalValue: bigint;
  randomnessValue: bigint;
}

export interface ProposalsIntegrity {
  newProposals: RankifyInstanceGameMastersFacet.BatchProposalRevealStruct;
  permutation: BigNumberish[];
  proposalsNotPermuted: string[];
  nullifier: bigint;
}

interface VoteMessage {
  vote1: BigNumberish;
  vote2: BigNumberish;
  vote3: BigNumberish;
  gameId: BigNumberish;
  turn: BigNumberish;
  salt: BytesLike;
}
interface PublicVoteMessage {
  vote1: BytesLike;
  vote2: BytesLike;
  vote3: BytesLike;
  gameId: BigNumberish;
  turn: BigNumberish;
}
const VoteTypes = {
  signVote: [
    {
      type: 'uint256',
      name: 'vote1',
    },
    {
      type: 'uint256',
      name: 'vote2',
    },
    {
      type: 'uint256',
      name: 'vote3',
    },
    {
      type: 'uint256',
      name: 'gameId',
    },
    {
      type: 'uint256',
      name: 'turn',
    },
    {
      type: 'bytes32',
      name: 'salt',
    },
  ],
};

const publicVoteTypes = {
  publicSignVote: [
    {
      type: 'uint256',
      name: 'gameId',
    },
    {
      type: 'uint256',
      name: 'turn',
    },
    {
      type: 'uint256',
      name: 'vote1',
    },
    {
      type: 'uint256',
      name: 'vote2',
    },
    {
      type: 'uint256',
      name: 'vote3',
    },
  ],
};

/**
 * Signs a vote message using EIP-712 typed data
 * @param message - The vote message to sign
 * @param verifierAddress - Address of the contract that will verify the signature
 * @param signer - The signer's identity
 * @param hre - Hardhat Runtime Environment
 * @returns The signature
 */
export const signVoteMessage = async (
  message: VoteMessage,
  verifierAddress: string,
  signer: SignerIdentity,
  hre: HardhatRuntimeEnvironment,
) => {
  const { ethers } = hre;
  let { chainId } = await ethers.provider.getNetwork();

  const domain = {
    name: RANKIFY_INSTANCE_CONTRACT_NAME,
    version: RANKIFY_INSTANCE_CONTRACT_VERSION,
    chainId,
    verifyingContract: verifierAddress,
  };
  const s = await signer.wallet._signTypedData(domain, VoteTypes, {
    ...message,
  });
  return s;
};

/**
 * Signs a public vote message using EIP-712 typed data
 * @param message - The public vote message to sign
 * @param verifierAddress - Address of the contract that will verify the signature
 * @param signer - The signer's identity
 * @param hre - Hardhat Runtime Environment
 * @returns The signature
 */
export const signPublicVoteMessage = async (
  message: PublicVoteMessage,
  verifierAddress: string,
  signer: SignerIdentity,
  hre: HardhatRuntimeEnvironment,
) => {
  const { ethers } = hre;
  let { chainId } = await ethers.provider.getNetwork();

  const domain = {
    name: RANKIFY_INSTANCE_CONTRACT_NAME,
    version: RANKIFY_INSTANCE_CONTRACT_VERSION,
    chainId,
    verifyingContract: verifierAddress,
  };
  const s = await signer.wallet._signTypedData(domain, publicVoteTypes, {
    ...message,
  });
  return s;
};

/**
 * Generates a deterministic salt for a player's vote
 * @param params - Parameters including gameId, turn, player address, and other configuration
 * @returns The generated salt as a hex string
 */
export const getPlayerVoteSalt = async ({
  gameId,
  turn,
  player,
  verifierAddress,
  chainId,
  gm,
  size,
}: {
  gameId: BigNumberish;
  turn: BigNumberish;
  player: string;
  verifierAddress: string;
  chainId: BigNumberish;
  gm: Wallet;
  size: number;
}) => {
  return generateDeterministicPermutation({
    gameId,
    turn: Number(turn) - 1,
    verifierAddress,
    chainId,
    gm,
    size,
  }).then(perm => {
    return utils.solidityKeccak256(['address', 'uint256'], [player, perm.secret]);
  });
};

// Add new function to sign votes
async function signVote(
  hre: any,
  verifierAddress: string,
  voter: string,
  gameId: BigNumberish,
  sealedBallotId: string,
  signer: Wallet,
  ballotHash: string,
  isGM: boolean,
  name: string,
  version: string,
): Promise<string> {
  const domain = {
    name,
    version,
    chainId: await hre.getChainId(),
    verifyingContract: verifierAddress,
  };

  const types: Record<string, TypedDataField[]> = isGM
    ? {
        SubmitVote: [
          { name: 'gameId', type: 'uint256' },
          { name: 'voter', type: 'address' },
          { name: 'sealedBallotId', type: 'string' },
          { name: 'ballotHash', type: 'bytes32' },
        ],
      }
    : {
        AuthorizeVoteSubmission: [
          { name: 'gameId', type: 'uint256' },
          { name: 'sealedBallotId', type: 'string' },
          { name: 'ballotHash', type: 'bytes32' },
        ],
      };

  const value = isGM
    ? {
        gameId: BigNumber.from(gameId),
        voter: voter,
        sealedBallotId: sealedBallotId,
        ballotHash: ballotHash,
      }
    : {
        gameId: BigNumber.from(gameId),
        sealedBallotId: sealedBallotId,
        ballotHash: ballotHash,
      };

  return signer._signTypedData(domain, types, value);
}
export interface MockVote {
  vote: BigNumberish[];
  ballotHash: string;
  ballot: {
    vote: BigNumberish[];
    salt: string;
  };
  ballotId: string;
  gmSignature: string;
  voterSignature: string;
}
/**
 * Creates and signs a vote for testing purposes
 * @param params - Parameters including voter, game info, and vote configuration
 * @returns A complete mock vote with signatures
 */
export const attestVote = async ({
  voter,
  gameId,
  turn,
  gm,
  vote,
  verifierAddress,
  hre,
  gameSize,
  name,
  version,
}: {
  voter: SignerIdentity;
  gameId: BigNumberish;
  turn: BigNumberish;
  gm: Wallet;
  vote: BigNumberish[];
  verifierAddress: string;
  hre: HardhatRuntimeEnvironment;
  gameSize: number;
  name: string;
  version: string;
}): Promise<MockVote> => {
  const chainId = await hre.getChainId();

  const playerSalt = await getPlayerVoteSalt({
    gameId,
    turn,
    player: voter.wallet.address,
    verifierAddress,
    chainId,
    gm,
    size: gameSize,
  });

  const ballot = {
    vote: vote,
    salt: playerSalt,
  };
  const ballotHash: string = utils.solidityKeccak256(['uint256[]', 'bytes32'], [vote, playerSalt]);
  const ballotId = ballotHash + '_encrypted';
  const gmSignature = await signVote(
    hre,
    verifierAddress,
    voter.wallet.address,
    gameId,
    ballotId,
    gm,
    ballotHash,
    true,
    name,
    version,
  );
  const voterSignature = await signVote(
    hre,
    verifierAddress,
    voter.wallet.address,
    gameId,
    ballotId,
    voter.wallet,
    ballotHash,
    false,
    name,
    version,
  );
  return { vote, ballotHash, ballot, ballotId, gmSignature, voterSignature };
};

/**
 * Gets a list of players for testing
 * @param adr - Address setup result containing all identities
 * @param numPlayers - Number of players to return
 * @param offset - Optional offset to start player selection from
 * @returns Array of player identities
 * @throws Error if requested players exceed available players
 */
export const getPlayers = (
  adr: AdrSetupResult,
  numPlayers: number,
  offset?: number,
): [SignerIdentity, SignerIdentity, ...SignerIdentity[]] => {
  const _offset = offset ?? 0;
  let players: SignerIdentity[] = [];
  for (let i = 1; i < numPlayers + 1; i++) {
    assert(i + _offset < 19, 'Such player does not exist in adr generation');
    let name = `player${i + _offset}` as any as keyof AdrSetupResult;
    players.push(adr[`${name}`]);
  }
  return players as any as [SignerIdentity, SignerIdentity, ...SignerIdentity[]];
};

function shuffle(array: any[]) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}

/**
 * Generates mock votes for testing
 * @param params - Parameters including game info and player configuration
 * @returns Array of mock votes
 */
export const mockVotes = async ({
  hre,
  gm,
  gameId,
  turn,
  verifier,
  players,
  distribution,
}: {
  hre: HardhatRuntimeEnvironment;
  gameId: BigNumberish;
  turn: BigNumberish;
  gm: Wallet;
  verifier: RankifyDiamondInstance;
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]];
  distribution: 'ftw' | 'semiUniform' | 'equal' | 'zeros';
}): Promise<MockVote[]> => {
  const chainId = await hre.getChainId();
  const eip712 = await verifier.inspectEIP712Hashes();
  const { permutation } = await generateDeterministicPermutation({
    gameId,
    turn: Number(turn) - 1,
    verifierAddress: verifier.address,
    chainId,
    gm,
    size: players.length,
  });
  const votes: MockVote[] = [];
  for (let k = 0; k < players.length; k++) {
    let creditsLeft = RInstance_VOTE_CREDITS;
    let playerVote: BigNumberish[] = [];
    if (distribution == 'zeros') {
      playerVote = players.map(() => 0);
    }
    if (distribution == 'ftw') {
      //   this is on smart contract -> votesSorted[proposer][permutation[candidate]] = votes[proposer][candidate];
      //   We need to prepare votes to be permuted so that sorting produces winner at minimal index k (skipping voting for himself)
      const votesToPermute = players.map((proposer, idx) => {
        if (k !== idx) {
          const voteWeight = Math.floor(Math.sqrt(creditsLeft));
          creditsLeft -= voteWeight * voteWeight;
          return voteWeight;
        } else {
          return 0;
        }
      });
      // now apply permutation to votesToPermute so that
      // on smart contract -> votesSorted[proposer][permutation[candidate]] = votesPermuted[proposer][candidate];
      // form [3,2,1,0,0] (skipping K==player)
      playerVote = votesToPermute.map((vote, idx) => {
        return votesToPermute[permutation[idx]];
      });
    } else if (distribution == 'semiUniform') {
      const votesToDistribute = players.map(() => {
        const voteWeight = Math.floor(Math.sqrt(creditsLeft));
        creditsLeft -= voteWeight * voteWeight;
        return voteWeight;
      });
      let votesDistributed = [];
      do {
        votesDistributed = shuffle(votesToDistribute);
      } while (votesDistributed[k] !== 0);
      playerVote = votesDistributed.map((vote, idx) => {
        return votesDistributed[permutation[idx]];
      });
    } else if (distribution == 'equal') {
      const lowSide = k >= players.length / 2 ? false : true;
      let _votes = players.map((proposer, idx) => {
        const voteWeight = Math.floor(Math.sqrt(creditsLeft));
        if (players.length % 2 !== 0 && permutation[k] !== Math.floor(players.length / 2)) {
          //Just skip odd voter
          creditsLeft -= voteWeight * voteWeight;
          return voteWeight;
        } else return 0;
      });
      playerVote = lowSide
        ? [..._votes.reverse().map((vote, idx) => _votes[permutation[idx]])]
        : [..._votes.map((vote, idx) => _votes[permutation[idx]])];
      console.assert(playerVote[permutation[k]] == 0);
    }

    votes.push(
      await attestVote({
        hre,
        voter: players[k],
        gameId,
        turn,
        gm,
        verifierAddress: verifier.address,
        vote: playerVote,
        gameSize: players.length,
        name: eip712._NAME,
        version: eip712._VERSION,
      }),
    );
  }
  return votes;
};

const proposalTypes = {
  SubmitProposal: [
    { type: 'uint256', name: 'gameId' },
    { type: 'address', name: 'proposer' },
    { type: 'string', name: 'encryptedProposal' },
    { type: 'uint256', name: 'commitment' },
  ],
  AuthorizeProposalSubmission: [
    { type: 'uint256', name: 'gameId' },
    { type: 'string', name: 'encryptedProposal' },
    { type: 'uint256', name: 'commitment' },
  ],
};

async function signProposal(
  hre: HardhatRuntimeEnvironment,
  verifierAddress: string,
  proposer: string,
  gameId: BigNumberish,
  encryptedProposal: string,
  commitment: BigNumberish,
  signer: Wallet | SignerWithAddress,
  isGM: boolean,
  eip712: {
    name: string;
    version: string;
  },
): Promise<string> {
  const { chainId } = await hre.ethers.provider.getNetwork();

  const domain = {
    name: eip712.name,
    version: eip712.version,
    chainId,
    verifyingContract: verifierAddress,
  };

  // Match the exact types from the Solidity contract
  const type = isGM ? 'SubmitProposal' : 'AuthorizeProposalSubmission';
  const value = isGM
    ? {
        gameId,
        proposer,
        encryptedProposal,
        commitment,
      }
    : {
        gameId,
        encryptedProposal,
        commitment,
      };

  // Generate typed data hash matching Solidity's keccak256(abi.encode(...))
  const typedDataHash = await signer._signTypedData(domain, { [type]: proposalTypes[type] }, value);

  return typedDataHash;
}

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

/**
 * Generates mock proposal secrets for testing
 * @param params - Parameters including game info and proposer details
 * @returns A complete proposal submission with signatures and commitments
 */
export const mockProposalSecrets = async ({
  gm,
  proposer,
  gameId,
  turn,
  verifier,
  hre,
}: {
  gm: Wallet;
  proposer: SignerIdentity;
  gameId: BigNumberish;
  turn: BigNumberish;
  verifier: RankifyDiamondInstance;
  hre: HardhatRuntimeEnvironment;
}): Promise<ProposalSubmission> => {
  const proposal = getDiscussionForTurn(Number(turn), proposer.id);
  const poseidon = await buildPoseidon();

  const encryptedProposal = aes.encrypt(proposal, gm.publicKey).toString();

  const pubKeyProposer = utils.recoverPublicKey(
    utils.hashMessage(proposal),
    await proposer.wallet.signMessage(proposal),
  );
  assert(utils.computeAddress(pubKeyProposer) === proposer.wallet.address, 'Proposer public key does not match');

  const sharedKey = sharedSigner({
    publicKey: pubKeyProposer,
    signer: gm,
    gameId,
    turn,
    contractAddress: verifier.address,
    chainId: await hre.getChainId(),
  });

  // Convert proposal to numeric value using keccak256
  const proposalValue = BigInt(utils.solidityKeccak256(['string'], [proposal]));
  const randomnessValue = BigInt(utils.solidityKeccak256(['string'], [sharedKey]));

  // Calculate commitment using poseidon
  const hash = poseidon([proposalValue, randomnessValue]);
  const poseidonCommitment = BigInt(poseidon.F.toObject(hash));
  const eip712 = await verifier.inspectEIP712Hashes();
  // Get both GM and proposer signatures
  const gmSignature = await signProposal(
    hre,
    verifier.address,
    proposer.wallet.address,
    gameId,
    encryptedProposal,
    poseidonCommitment,
    gm,
    true,
    {
      name: eip712._NAME,
      version: eip712._VERSION,
    },
  );

  const voterSignature = await signProposal(
    hre,
    verifier.address,
    proposer.wallet.address,
    gameId,
    encryptedProposal,
    poseidonCommitment,
    proposer.wallet,
    false,
    {
      name: eip712._NAME,
      version: eip712._VERSION,
    },
  );

  const params: ProposalParams = {
    gameId,
    encryptedProposal,
    commitment: poseidonCommitment,
    proposer: proposer.wallet.address,
    gmSignature,
    voterSignature,
  };

  return {
    params,
    proposal,
    proposerSignerId: proposer,
    proposalValue,
    randomnessValue,
  };
};
const maxSize = 15;
// Update mockProposals to use deterministic permutation
export const mockProposals = async ({
  hre,
  players,
  gameId,
  turn,
  verifier,
  gm,
  idlers,
}: {
  hre: HardhatRuntimeEnvironment;
  players: SignerIdentity[];
  gameId: BigNumberish;
  turn: BigNumberish;
  verifier: RankifyDiamondInstance;
  gm: Wallet;
  idlers?: number[];
}): Promise<ProposalSubmission[]> => {
  const proposals: ProposalSubmission[] = [];

  for (let i = 0; i < maxSize; i++) {
    let proposal: ProposalSubmission;
    if (i < players.length && !idlers?.includes(i)) {
      proposal = await mockProposalSecrets({
        hre,
        gm,
        proposer: players[i],
        gameId,
        turn,
        verifier,
      });
    } else {
      proposal = {
        params: {
          gameId,
          encryptedProposal: '0x',
          commitment: 0,
          proposer: constants.AddressZero,
          gmSignature: '0x',
          voterSignature: '0x',
        },
        proposal: '',
        proposalValue: 0n,
        randomnessValue: 0n,
      };
    }
    proposals.push(proposal);
  }

  return proposals;
};

/**
 * Gets proposal integrity data for testing
 * @param params - Parameters including game info and proposal data
 * @returns Proposal integrity information including permutations and proofs
 */
export const getProposalsIntegrity = async ({
  hre,
  players,
  gameId,
  turn,
  verifier,
  gm,
  idlers,
  proposalSubmissionData,
}: {
  hre: HardhatRuntimeEnvironment;
  players: SignerIdentity[];
  gameId: BigNumberish;
  turn: BigNumberish;
  verifier: RankifyDiamondInstance;
  gm: Wallet;
  idlers?: number[];
  proposalSubmissionData?: ProposalSubmission[];
}): Promise<ProposalsIntegrity> => {
  const proposals =
    proposalSubmissionData ||
    (await mockProposals({
      hre,
      players,
      gameId,
      turn,
      verifier,
      gm,
      idlers,
    }));

  const { commitment, nullifier, permutation, permutedProposals, a, b, c } = await generateEndTurnIntegrity({
    gameId,
    turn,
    verifierAddress: verifier.address,
    chainId: await hre.getChainId(),
    gm,
    size: players.length,
    proposals,
    hre,
  });

  return {
    newProposals: {
      a,
      b,
      c,
      proposals: permutedProposals,
      permutationCommitment: commitment,
    },
    permutation,
    proposalsNotPermuted: proposals.map(proposal => proposal.proposal),
    nullifier,
  };
};

const joinTypes = {
  AttestJoiningGame: [
    { type: 'address', name: 'instance' },
    { type: 'address', name: 'participant' },
    { type: 'uint256', name: 'gameId' },
    { type: 'bytes32', name: 'hiddenSalt' },
  ],
};
/**
 * Signs a message for joining a game
 * @param hre - Hardhat Runtime Environment
 * @param verifier - Address of the contract that will verify the signature
 * @param participant - Address of the participant joining
 * @param gameId - ID of the game to join
 * @param signer - The signer's identity
 * @returns Object containing signature and hidden salt
 */
export const signJoiningGame = async (
  hre: HardhatRuntimeEnvironment,
  verifier: string,
  participant: string,
  gameId: BigNumberish,
  signer: SignerIdentity,
) => {
  const { ethers } = hre;
  let { chainId } = await ethers.provider.getNetwork();
  const domain = {
    name: RANKIFY_INSTANCE_CONTRACT_NAME,
    version: RANKIFY_INSTANCE_CONTRACT_VERSION,
    chainId,
    verifyingContract: verifier,
  };
  const hiddenSalt = ethers.utils.hexZeroPad('0x123131231311', 32); // Pad to 32 bytes
  const signature = await signer.wallet._signTypedData(domain, joinTypes, {
    instance: verifier,
    participant,
    gameId,
    hiddenSalt: ethers.utils.keccak256(hiddenSalt), // Hash the padded value
  });
  return { signature, hiddenSalt };
};

export default {
  setupAddresses,
  setupEnvironment,
  addPlayerNameId,
  baseFee,
};
