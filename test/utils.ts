/* eslint-disable no-undef */
/* eslint-disable arrow-body-style */
/* eslint-disable no-await-in-loop */
// import { time } from "@openzeppelin/test-helpers";
import hre, { deployments, config } from 'hardhat';
import aes from 'crypto-js/aes';
import { contract, ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BestOfDiamond } from '../types/typechain/hardhat-diamond-abi/HardhatDiamondABI.sol';
import { MockERC1155, MockERC20, MockERC721 } from '../types/typechain/';
import { ProposalTypes } from '../types';
const { ZERO_ADDRESS, ZERO_BYTES32 } = require('@openzeppelin/test-helpers/src/constants');
import { BigNumber, BigNumberish, Bytes, BytesLike, Wallet } from 'ethers';
// @ts-ignore
import { RankToken } from '../types/typechain/src/tokens/RankToken';
// import { BestOfInit } from "../types/typechain/src/initializers/BestOfInit";
import { assert } from 'console';
import { Deployment } from 'hardhat-deploy/types';
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types';
import { keccak256 } from 'ethers/lib/utils';

export interface SignerIdentity {
  name: string;
  id: string;
  wallet: Wallet | SignerWithAddress;
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
  registrar1: SignerIdentity;
}

export interface EnvSetupResult {
  bestOfGame: BestOfDiamond;
  rankToken: RankToken;
  mockERC20: MockERC20;
  mockERC1155: MockERC1155;
  mockERC721: MockERC721;
}
export const addPlayerNameId = (idx: any) => {
  return { name: `player-${idx}`, id: `player-${idx}-id` };
};

export const setupAddresses = async (
  getNamedAccounts: () => Promise<{
    [name: string]: string;
  }>,
  _eth: typeof import('/Users/t/GitHub/daocacao/node_modules/ethers/lib/ethers') & HardhatEthersHelpers,
): Promise<AdrSetupResult> => {
  const [
    _contractDeployer,
    _multipassOwner,
    ,
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

  const { gameOwner: gameOwnerAddress } = await getNamedAccounts();

  const createRandomIdentityAndSeedEth = async (name: string) => {
    let newWallet = await ethers.Wallet.createRandom();
    newWallet = newWallet.connect(ethers.provider);
    await _player1.sendTransaction({
      to: newWallet.address,
      value: ethers.utils.parseEther('1'),
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
  const registrar1 = await createRandomIdentityAndSeedEth('registrar1');
  const gameMaster1 = await createRandomIdentityAndSeedEth('GM1');
  const gameMaster2 = await createRandomIdentityAndSeedEth('GM2');
  const gameMaster3 = await createRandomIdentityAndSeedEth('GM3');
  const maliciousActor2 = await createRandomIdentityAndSeedEth('MaliciousActor2');
  const maliciousActor3 = await createRandomIdentityAndSeedEth('MaliciousActor3');
  const player18 = await createRandomIdentityAndSeedEth('player18');

  const contractDeployer: SignerIdentity = {
    wallet: _contractDeployer,
    name: 'contractDeployer',
    id: 'contractDeployer-id',
  };

  const accounts = config.networks.hardhat.accounts as any;
  const gameOwner: SignerIdentity = {
    wallet: ethers.Wallet.fromMnemonic(accounts.mnemonic, accounts.path + `/${2}`).connect(_eth.provider),
    name: 'gameOwner',
    id: 'gameOwner-id',
  };
  const player1: SignerIdentity = {
    wallet: _player1,
    name: 'player1',
    id: 'player1-id',
  };
  const player2: SignerIdentity = {
    wallet: _player2,
    name: 'player2',
    id: 'player2-id',
  };
  const player3: SignerIdentity = {
    wallet: _player3,
    name: 'player3',
    id: 'player3-id',
  };
  const player4: SignerIdentity = {
    wallet: _player4,
    name: 'player4',
    id: 'player4-id',
  };
  const player5: SignerIdentity = {
    wallet: _player5,
    name: 'player5',
    id: 'player5-id',
  };
  const player6: SignerIdentity = {
    wallet: _player6,
    name: 'player6',
    id: 'player6-id',
  };
  const player7: SignerIdentity = {
    wallet: _player7,
    name: 'player7',
    id: 'player7-id',
  };
  const player8: SignerIdentity = {
    wallet: _player8,
    name: 'player8',
    id: 'player8-id',
  };
  const player9: SignerIdentity = {
    wallet: _player9,
    name: 'player9',
    id: 'player9-id',
  };
  const player10: SignerIdentity = {
    wallet: _player10,
    name: 'player10',
    id: 'player10-id',
  };
  const player11: SignerIdentity = {
    wallet: _player11,
    name: 'player11',
    id: 'player11-id',
  };
  const player12: SignerIdentity = {
    wallet: _player12,
    name: 'player12',
    id: 'player12-id',
  };
  const player13: SignerIdentity = {
    wallet: _player13,
    name: 'player13',
    id: 'player13-id',
  };
  const player14: SignerIdentity = {
    wallet: _player14,
    name: 'player14',
    id: 'player14-id',
  };
  const player15: SignerIdentity = {
    wallet: _player15,
    name: 'player15',
    id: 'player15-id',
  };
  const player16: SignerIdentity = {
    wallet: _player16,
    name: 'player16',
    id: 'player16-id',
  };
  const player17: SignerIdentity = {
    wallet: _player17,
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
    registrar1,
    gameMaster1,
    gameMaster2,
    gameMaster3,
    maliciousActor2,
    maliciousActor3,
    gameOwner,
  };
};

const baseFee = 1 * 10 ** 18;
export const BESTOF_CONTRACT_NAME = 'BESTOFNAME';
export const BESTOF_CONTRACT_VERSION = '0.0.1';
export const BOG_BLOCKS_PER_TURN = '25';
export const BOG_MAX_PLAYERS = 5;
export const BOG_MIN_PLAYERS = 4;
export const BOG_MAX_TURNS = 3;
export const BOG_BLOCKS_TO_JOIN = '200';
export const BOG_GAME_PRICE = ethers.utils.parseEther('0.001');
export const BOG_JOIN_GAME_PRICE = ethers.utils.parseEther('0.001');
export const BOG_NUM_WINNERS = 3;
export const BOG_VOTE_CREDITS = 14;
export const BOG_SUBJECT = 'Best Music on youtube';
export const BOGSettings = {
  BOG_BLOCKS_PER_TURN,
  BOG_MAX_PLAYERS,
  BOG_MIN_PLAYERS,
  BOG_MAX_TURNS,
  BOG_BLOCKS_TO_JOIN,
  BOG_GAME_PRICE,
  BOG_JOIN_GAME_PRICE,
  BOG_NUM_WINNERS,
  BOG_VOTE_CREDITS,
  BOG_SUBJECT,
  // BOG_NUM_ACTIONS_TO_TAKE,
};

export const setupTest = deployments.createFixture(async ({ deployments, getNamedAccounts, ethers: _eth }, options) => {
  const adr = await setupAddresses(getNamedAccounts, _eth);
  const { deployer: hhdeploydeployer } = await hre.getNamedAccounts();

  await adr.contractDeployer.wallet.sendTransaction({
    to: hhdeploydeployer,
    value: _eth.utils.parseEther('1'),
  });
  await deployments.fixture(['ranktoken', 'gameofbest']);
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
    RankToken: await deployments.get('RankToken'),
    BestOfGame: await deployments.get('BestOfGame'),
    mockERC20: mockERC20,
    mockERC721: mockERC721,
    mockERC1155: mockERC1155,
    adr,
  });

  return {
    adr,
    env,
  };
});
// export const setupTest = () => setupTest();
export const setupEnvironment = async (setup: {
  RankToken: Deployment;
  BestOfGame: Deployment;
  mockERC20: MockERC20;
  mockERC721: MockERC721;
  mockERC1155: MockERC1155;
  adr: AdrSetupResult;
}): Promise<EnvSetupResult> => {
  const rankToken = (await ethers.getContractAt(setup.RankToken.abi, setup.RankToken.address)) as RankToken;

  const bestOfGame = (await ethers.getContractAt(setup.BestOfGame.abi, setup.BestOfGame.address)) as BestOfDiamond;

  return {
    bestOfGame,
    rankToken,
    mockERC1155: setup.mockERC1155,
    mockERC20: setup.mockERC20,
    mockERC721: setup.mockERC721,
  };
};

interface ReferrerMesage {
  referrerAddress: string;
}
interface RegisterMessage {
  name: BytesLike;
  id: BytesLike;
  domainName: BytesLike;
  deadline: BigNumber;
  nonce: BigNumber;
}

type signatureMessage = ReferrerMesage | RegisterMessage;

export default {
  setupAddresses,
  setupEnvironment,
  addPlayerNameId,
  baseFee,
};

export async function mineBlocks(count: any) {
  for (let i = 0; i < count; i += 1) {
    await ethers.provider.send('evm_mine', []);
  }
}

// interface VoteSubmittion {
//   gameId: string;
//   voterHidden: string;
//   votes: string[3];
//   proof: string;
// }

// const mockVote = ({
//   voter,
// }: {
//   voter: SignerIdentity;
//   gm: SignerIdentity;
//   voteText: string;
// }): VoteSubmittion => {
//   return

// };

export interface ProposalParams {
  gameId: BigNumberish;
  encryptedProposal: string;
  commitmentHash: BytesLike;
  proposer: string;
}

export interface ProposalSubmittion {
  proposal: string;
  params: ProposalParams;
  proposerSignerId: SignerIdentity;
}

// export const signProposalMessage = async (
//   message: ProposalMessage,
//   verifierAddress: string,
//   signer: SignerIdentity
// ) => {
//   let { chainId } = await ethers.provider.getNetwork();

//   const domain = {
//     name: BESTOF_CONTRACT_NAME,
//     version: BESTOF_CONTRACT_VERSION,
//     chainId,
//     verifyingContract: verifierAddress,
//   };
//   const s = await signer.wallet._signTypedData(domain, ProposalTypes, {
//     ...message,
//   });
//   return s;
// };

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

export const signVoteMessage = async (message: VoteMessage, verifierAddress: string, signer: SignerIdentity) => {
  let { chainId } = await ethers.provider.getNetwork();

  const domain = {
    name: BESTOF_CONTRACT_NAME,
    version: BESTOF_CONTRACT_VERSION,
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
) => {
  let { chainId } = await ethers.provider.getNetwork();

  const domain = {
    name: BESTOF_CONTRACT_NAME,
    version: BESTOF_CONTRACT_VERSION,
    chainId,
    verifyingContract: verifierAddress,
  };
  const s = await signer.wallet._signTypedData(domain, publicVoteTypes, {
    ...message,
  });
  return s;
};

const MOCK_SECRET = '123456';

export const getTurnSalt = ({ gameId, turn }: { gameId: BigNumberish; turn: BigNumberish }) => {
  return ethers.utils.solidityKeccak256(['string', 'uint256', 'uint256'], [MOCK_SECRET, gameId, turn]);
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
  return ethers.utils.solidityKeccak256(['address', 'bytes32'], [player, getTurnSalt({ gameId, turn })]);
};

export const mockVote = async ({
  voter,
  gm,
  gameId,
  turn,
  vote,
  verifierAddress,
}: {
  voter: SignerIdentity;
  gameId: BigNumberish;
  turn: BigNumberish;
  gm: SignerIdentity;
  vote: [BigNumberish, BigNumberish, BigNumberish];
  verifierAddress: string;
}): Promise<{
  proof: string;
  vote: [BigNumberish, BigNumberish, BigNumberish];
  voteHidden: [BytesLike, BytesLike, BytesLike];
  publicSignature: string;
}> => {
  const playerSalt = getTurnPlayersSalt({
    gameId,
    turn,
    player: voter.wallet.address,
  });

  const message = {
    vote1: vote[0],
    vote2: vote[1],
    vote3: vote[2],
    gameId,
    turn,
    salt: playerSalt,
  };

  const voteHidden: [BytesLike, BytesLike, BytesLike] = [
    ethers.utils.solidityKeccak256(['string', 'bytes32'], [vote[0], playerSalt]),
    ethers.utils.solidityKeccak256(['string', 'bytes32'], [vote[1], playerSalt]),
    ethers.utils.solidityKeccak256(['string', 'bytes32'], [vote[2], playerSalt]),
  ];
  const publicMessage = {
    vote1: voteHidden[0],
    vote2: voteHidden[1],
    vote3: voteHidden[2],
    gameId,
    turn,
  };
  const proof = await signVoteMessage(message, verifierAddress, gm);
  const publicSignature = await signPublicVoteMessage(publicMessage, verifierAddress, gm);
  return { proof, vote, voteHidden, publicSignature };
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

export type MockVotes = Array<{
  proof: string;
  vote: [BigNumberish, BigNumberish, BigNumberish];
  voteHidden: string;
  publicSignature: string;
}>;

export const mockVotes = async ({
  gm,
  gameId,
  turn,
  verifierAddress,
  players,
  distribution,
}: {
  gameId: BigNumberish;
  turn: BigNumberish;
  gm: SignerIdentity;
  verifierAddress: string;
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]];
  distribution: 'ftw' | 'semiUniform' | 'equal';
}): Promise<MockVotes> => {
  const votes: Array<{
    proof: string;
    vote: [BigNumberish, BigNumberish, BigNumberish];
    voteHidden: string;
    publicSignature: string;
  }> = [];
  for (let k = 0; k < players.length; k++) {
    let firstSelected = 0;
    let secondSelected = 0;
    let thirdSelected = 0;
    if (distribution == 'ftw') {
      if (k == 0) {
        firstSelected = 1;
        secondSelected = 2;
        thirdSelected = 3;
      } else if (k == 1) {
        firstSelected = 0;
        secondSelected = 2;
        thirdSelected = 3;
      } else if (k == 2) {
        firstSelected = 0;
        secondSelected = 1;
        thirdSelected = 3;
      } else {
        firstSelected = 0;
        secondSelected = 1;
        thirdSelected = 2;
      }
    } else if (distribution == 'semiUniform') {
      firstSelected = (Number(gameId) + Number(turn) + k) % players.length;
      firstSelected = firstSelected == k ? (firstSelected + 1) % players.length : firstSelected;

      secondSelected = (firstSelected + 1 * k) % players.length;
      while (secondSelected == k || firstSelected == secondSelected) {
        secondSelected = (secondSelected + 1) % players.length;
      }

      thirdSelected = (secondSelected + 1 * k) % players.length;
      while (thirdSelected == k || thirdSelected == secondSelected || thirdSelected == firstSelected) {
        thirdSelected = (thirdSelected + 1) % players.length;
      }
    } else {
      firstSelected = k;
      firstSelected = firstSelected == k ? (firstSelected + 1) % players.length : firstSelected;
      secondSelected = (firstSelected + 1) % players.length;
      secondSelected = secondSelected == k ? (secondSelected + 1) % players.length : secondSelected;
      thirdSelected = (secondSelected + 2) % players.length;
      thirdSelected = thirdSelected == k ? (thirdSelected + 1) % players.length : thirdSelected;
    }

    const { vote, voteHidden, proof, publicSignature } = await mockVote({
      voter: players[k],
      gameId,
      turn,
      gm,
      verifierAddress,
      vote: [firstSelected, secondSelected, thirdSelected],
    });
    votes[k] = { vote, voteHidden: keccak256(JSON.stringify(voteHidden)), proof, publicSignature };
  }
  return votes;
};

export const mockProposalSecrets = async ({
  gm,
  proposer,
  gameId,
  turn,
}: {
  gm: SignerIdentity;
  proposer: SignerIdentity;
  gameId: BigNumberish;
  turn: BigNumberish;
  verifierAddress: string;
}): Promise<ProposalSubmittion> => {
  const _gmW = gm.wallet as Wallet;
  const proposal = String(gameId) + String(turn) + proposer.id;
  const encryptedProposal = aes.encrypt(proposal, _gmW.privateKey).toString();
  const commitmentHash: string = ethers.utils.solidityKeccak256(['string'], [proposal]);
  const params: ProposalParams = {
    gameId,
    encryptedProposal,
    commitmentHash,
    proposer: proposer.wallet.address,
  };

  // const s = await signProposalMessage(message, verifierAddress, gm);

  return {
    params,
    proposal,
    proposerSignerId: proposer,
  };
};

export const mockProposals = async ({
  players,
  gameId,
  turn,
  verifierAddress,
  gm,
}: {
  players: SignerIdentity[];
  gameId: BigNumberish;
  turn: BigNumberish;
  verifierAddress: string;
  gm: SignerIdentity;
}) => {
  let proposals = [] as any as ProposalSubmittion[];
  for (let i = 0; i < players.length; i++) {
    let proposal = await mockProposalSecrets({
      gm,
      proposer: players[i],
      gameId,
      turn,
      verifierAddress,
    });
    proposals.push(proposal);
  }
  return proposals;
};
