import aes from 'crypto-js/aes';
import { HttpNetworkHDAccountsConfig } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
    Rankify,
    MockERC1155,
    MockERC20,
    MockERC721,
    RankToken,
    MAODistribution,
    DAODistributor,
    ArguableVotingTournament,
} from '../types';
import { BigNumber, BigNumberish, BytesLike, TypedDataField, Wallet, ethers, utils } from 'ethers';
// @ts-ignore
import { assert } from 'console';
import { Deployment } from 'hardhat-deploy/types';
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDiscussionForTurn } from './instance/discussionTopics';
import { buildPoseidon } from 'circomlibjs';
import { sharedSigner } from '../scripts/sharedKey';
import { CalldataProposalsIntegrity18Groth16 } from 'zk';

export const RANKIFY_INSTANCE_CONTRACT_NAME = 'RANKIFY_INSTANCE_NAME';
export const RANKIFY_INSTANCE_CONTRACT_VERSION = '0.0.1';
export const RInstance_TIME_PER_TURN = 2500;
export const RInstance_MAX_PLAYERS = 6;
export const RInstance_MIN_PLAYERS = 5;
export const RInstance_MAX_TURNS = 3;
export const RInstance_TIME_TO_JOIN = '200';
export const RInstance_GAME_PRICE = ethers.utils.parseEther('0.001');
export const RInstance_JOIN_GAME_PRICE = ethers.utils.parseEther('0.001');
export const RInstance_NUM_WINNERS = 3;
export const RInstance_VOTE_CREDITS = 14;
export const RInstance_SUBJECT = 'Best Music on youtube';
export interface SignerIdentity {
  name: string;
  id: string;
  wallet: Wallet;
}
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
export const addPlayerNameId = (idx: any) => {
  return { name: `player-${idx}`, id: `player-${idx}-id` };
};

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

    const { deployer, owner } = await getNamedAccounts();

    const createRandomIdentityAndSeedEth = async (name: string) => {
      let newWallet = await _eth.Wallet.createRandom();
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
  // RInstance_NUM_ACTIONS_TO_TAKE,
};

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
  //   await env.rankifyToken
  //     .connect(adr.gameCreator1.wallet)
  //     .approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken
  //     .connect(adr.gameCreator2.wallet)
  //     .approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken
  //     .connect(adr.gameCreator3.wallet)
  //     .approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player1.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player2.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player3.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player4.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player5.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player6.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player7.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player8.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player9.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken.connect(adr.player10.wallet).approve(env.rankifyInstance.address, ethers.constants.MaxUint256);

  //   await env.rankifyToken
  //     .connect(adr.maliciousActor1.wallet)
  //     .approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken
  //     .connect(adr.maliciousActor2.wallet)
  //     .approve(env.rankifyInstance.address, ethers.constants.MaxUint256);
  //   await env.rankifyToken
  //     .connect(adr.maliciousActor3.wallet)
  //     .approve(env.rankifyInstance.address, ethers.constants.MaxUint256);

  return {
    adr,
    env,
  };
};
// export const setupTest = () => setupTest();
export const setupEnvironment = async (setup: {
  hre: HardhatRuntimeEnvironment;
  distributor: Deployment;
  mao: Deployment;
  RankifyToken: Deployment;
  RankTokenBase: Deployment;
  //   RankifyInstance: Deployment;
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
  proposerSignerId: SignerIdentity;
  proposalValue: bigint;
  randomnessValue: bigint;
}

export interface ProposalStruct {
  proposals: ProposalSubmission[];
  a: CalldataProposalsIntegrity18Groth16[0];
  b: CalldataProposalsIntegrity18Groth16[1];
  c: CalldataProposalsIntegrity18Groth16[2];
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

// In real environment this should be game master specific secret
const MOCK_SECRET = '123456';

export const getTurnSalt = ({ gameId, turn }: { gameId: BigNumberish; turn: BigNumberish }) => {
  return utils.solidityKeccak256(['string', 'uint256', 'uint256'], [MOCK_SECRET, gameId, turn]);
};

export const getTurnPlayersSalt = ({
  gameId,
  turn,
  player,
}: {
  gameId: BigNumberish;
  turn: BigNumberish;
  player: string;
}) => {
  return utils.solidityKeccak256(['address', 'bytes32'], [player, getTurnSalt({ gameId, turn })]);
};

// Add new function to sign votes
async function signVote(
  hre: any,
  verifierAddress: string,
  voter: string,
  gameId: BigNumberish,
  sealedBallotId: string,
  signer: SignerIdentity,
  ballotHash: string,
  isGM: boolean,
): Promise<string> {
  const domain = {
    name: RANKIFY_INSTANCE_CONTRACT_NAME,
    version: RANKIFY_INSTANCE_CONTRACT_VERSION,
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

  return signer.wallet._signTypedData(domain, types, value);
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
export const mockVote = async ({
  voter,
  gm,
  gameId,
  turn,
  vote,
  verifierAddress,
  hre,
}: {
  voter: SignerIdentity;
  gameId: BigNumberish;
  turn: BigNumberish;
  gm: SignerIdentity;
  vote: BigNumberish[];
  verifierAddress: string;
  hre: HardhatRuntimeEnvironment;
}): Promise<MockVote> => {
  const playerSalt = getTurnPlayersSalt({
    gameId,
    turn,
    player: voter.wallet.address,
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
  );
  const voterSignature = await signVote(
    hre,
    verifierAddress,
    voter.wallet.address,
    gameId,
    ballotId,
    voter,
    ballotHash,
    false,
  );
  return { vote, ballotHash, ballot, ballotId, gmSignature, voterSignature };
};
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

export const mockVotes = async ({
  hre,
  gm,
  gameId,
  turn,
  verifierAddress,
  players,
  distribution,
}: {
  hre: HardhatRuntimeEnvironment;
  gameId: BigNumberish;
  turn: BigNumberish;
  gm: SignerIdentity;
  verifierAddress: string;
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]];
  distribution: 'ftw' | 'semiUniform' | 'equal' | 'zeros';
}): Promise<MockVote[]> => {
  const votes: MockVote[] = [];
  for (let k = 0; k < players.length; k++) {
    let creditsLeft = RInstance_VOTE_CREDITS;
    let playerVote: BigNumberish[] = [];
    if (distribution == 'zeros') {
      playerVote = players.map(() => 0);
    }
    if (distribution == 'ftw') {
      playerVote = players.map((proposer, idx) => {
        if (k !== idx) {
          const voteWeight = Math.floor(Math.sqrt(creditsLeft));
          creditsLeft -= voteWeight * voteWeight;
          return voteWeight;
        } else {
          return 0;
        }
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
      playerVote = [...votesDistributed];
    } else if (distribution == 'equal') {
      const lowSide = k >= players.length / 2 ? false : true;
      let _votes = players.map((proposer, idx) => {
        const voteWeight = Math.floor(Math.sqrt(creditsLeft));
        if (players.length % 2 !== 0 && k !== Math.floor(players.length / 2)) {
          //Just skipp odd voter
          creditsLeft -= voteWeight * voteWeight;
          return voteWeight;
        } else return 0;
      });
      playerVote = lowSide ? [..._votes.reverse()] : [..._votes];
      console.assert(playerVote[k] == 0);
    }

    votes.push(
      await mockVote({
        hre,
        voter: players[k],
        gameId,
        turn,
        gm,
        verifierAddress,
        vote: playerVote,
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
): Promise<string> {
  const { chainId } = await hre.ethers.provider.getNetwork();

  const domain = {
    name: RANKIFY_INSTANCE_CONTRACT_NAME,
    version: RANKIFY_INSTANCE_CONTRACT_VERSION,
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

export const mockProposalSecrets = async ({
  gm,
  proposer,
  gameId,
  turn,
  verifierAddress,
  hre,
}: {
  gm: Wallet;
  proposer: SignerIdentity;
  gameId: BigNumberish;
  turn: BigNumberish;
  verifierAddress: string;
  hre: HardhatRuntimeEnvironment;
}): Promise<ProposalSubmission> => {
  const proposal = getDiscussionForTurn(Number(turn), proposer.id);
  const poseidon = await buildPoseidon();

  const encryptedProposal = aes.encrypt(proposal, gm.publicKey).toString();

  const pubKeyProposer = ethers.utils.recoverPublicKey(
    ethers.utils.hashMessage(proposal),
    await proposer.wallet.signMessage(proposal),
  );
  assert(ethers.utils.computeAddress(pubKeyProposer) === proposer.wallet.address, 'Proposer public key does not match');

  const sharedKey = sharedSigner({
    publicKey: pubKeyProposer,
    signer: gm,
    gameId,
    turn,
    contractAddress: verifierAddress,
    chainId: await hre.getChainId(),
  });

  // Convert proposal to numeric value using keccak256
  const proposalValue = BigInt(ethers.utils.solidityKeccak256(['string'], [proposal]));
  const randomnessValue = BigInt(sharedKey);

  // Calculate commitment using poseidon
  const hash = poseidon([proposalValue, randomnessValue]);
  const commitment = BigInt(poseidon.F.toObject(hash));

  // Get both GM and proposer signatures
  const gmSignature = await signProposal(
    hre,
    verifierAddress,
    proposer.wallet.address,
    gameId,
    encryptedProposal,
    commitment,
    gm,
    true,
  );

  const voterSignature = await signProposal(
    hre,
    verifierAddress,
    proposer.wallet.address,
    gameId,
    encryptedProposal,
    commitment,
    proposer.wallet,
    false,
  );

  const params: ProposalParams = {
    gameId,
    encryptedProposal,
    commitment,
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

export const mockProposals = async ({
  players,
  gameId,
  turn,
  verifierAddress,
  gm,
  hre,
  idlers,
}: {
  players: SignerIdentity[];
  gameId: BigNumberish;
  turn: BigNumberish;
  verifierAddress: string;
  gm: Wallet;
  hre: HardhatRuntimeEnvironment;
  idlers?: number[];
}): Promise<ProposalStruct> => {
  const chainId = await hre.getChainId();
  let proposals = [] as any as ProposalSubmission[];
  for (let i = 0; i < players.length; i++) {
    if (idlers?.includes(i)) {
      proposals.push({
        params: {
          gameId,
          encryptedProposal: '',
          commitment: 0n,
          proposer: players[i].wallet.address,
          gmSignature: '0x',
          voterSignature: '0x',
        },
        proposal: '',
        proposerSignerId: players[i],
        proposalValue: 0n,
        randomnessValue: 0n,
      });
    } else {
      let proposal = await mockProposalSecrets({
        gm,
        proposer: players[i],
        gameId,
        turn,
        verifierAddress,
        hre,
      });
      proposals.push(proposal);
    }
  }
  // Generate ZK proof for batch reveal
  const inputs = await createInputs({
    numActive: players.length,
    proposals: proposals.map(p => p.proposalValue),
    commitmentRandomnesses: proposals.map(p => p.randomnessValue),
  });

  const circuit = await hre.zkit.getCircuit('ProposalsIntegrity18');
  const proof = await circuit.generateProof(inputs);
  const callData = await circuit.generateCalldata(proof);

  return {
    proposals,
    // we need only a/b/c for the zk proof since proposals are treated as private inputs and verifier already knows commitment to them
    a: callData[0],
    b: callData[1],
    c: callData[2],
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

// https://datatracker.ietf.org/doc/html/rfc7919#appendix-A.1
const ffdhe2048 = {
  p: '0xFFFFFFFFFFFFFFFFADF85458A2BB4A9AAFDC5620273D3CF1D8B9C583CE2D3695A9E13641146433FBCC939DCE249B3EF97D2FE363630C75D8F681B202AEC4617AD3DF1ED5D5FD65612433F51F5F066ED0856365553DED1AF3B557135E7F57C935984F0C70E0E68B77E2A689DAF3EFE8721DF158A136ADE73530ACCA4F483A797ABC0AB182B324FB61D108A94BB2C8E3FBB96ADAB760D7F4681D4F42A3DE394DF4AE56EDE76372BB190B07A7C8EE0A6D709E02FCE1CDF7E2ECC03404CD28342F619172FE9CE98583FF8E4F1232EEF28183C3FE3B1B4C6FAD733BB5FCBC2EC22005C58EF1837D1683B2C6F34A26C1B2EFFA886B423861285C97FFFFFFFFFFFFFFFF',
  g: 2,
};

export default {
  setupAddresses,
  setupEnvironment,
  addPlayerNameId,
  baseFee,
  ffdhe2048,
};

// Helper to create test inputs
export const createInputs = async ({
  numActive,
  proposals,
  commitmentRandomnesses,
}: {
  numActive: number;
  proposals: bigint[];
  commitmentRandomnesses: bigint[];
}) => {
  const poseidon = await buildPoseidon();
  const maxSize = 18;
  const inputs = {
    commitmentHashes: Array(maxSize).fill(0n),
    proposals: Array(maxSize).fill(0n),
    commitmentRandomnesses: Array(maxSize).fill(0n),
  };

  // Calculate zero hash
  const zeroHash = BigInt(poseidon.F.toObject(poseidon([0n, 0n])));

  // Fill values for all slots
  for (let i = 0; i < maxSize; i++) {
    if (i < numActive) {
      // Active slots: use real values
      const proposal = proposals[i];
      const randomness = proposal != 0n ? commitmentRandomnesses[i] : 0n;
      const hash = poseidon([proposal, randomness]);
      const commitment = BigInt(poseidon.F.toObject(hash));

      inputs.proposals[i] = proposal;
      inputs.commitmentRandomnesses[i] = randomness;
      inputs.commitmentHashes[i] = commitment;
    } else {
      // Inactive slots: use zeros and zero hash
      inputs.proposals[i] = 0n;
      inputs.commitmentRandomnesses[i] = 0n;
      inputs.commitmentHashes[i] = zeroHash;
    }
  }

  return inputs;
};
