import hre, { deployments } from 'hardhat';
import { ethers } from 'hardhat';
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
// @ts-ignore
import { Deployment } from 'hardhat-deploy/types';
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types';

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

export const setupAddresses = async (
  getNamedAccounts: () => Promise<{
    [name: string]: string;
  }>,
  _eth: typeof import('ethers/lib/ethers') & HardhatEthersHelpers,
): Promise<AdrSetupResult> => {
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

  const contractDeployer: SignerIdentity = {
    wallet: await hre.ethers.getSigner(deployer),
    name: 'contractDeployer',
    id: 'contractDeployer-id',
  };

  const gameOwner: SignerIdentity = {
    wallet: await hre.ethers.getSigner(owner),
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
    gameMaster1,
    gameMaster2,
    gameMaster3,
    maliciousActor2,
    maliciousActor3,
    gameOwner,
  };
};

const baseFee = 1 * 10 ** 18;

import {
  RANKIFY_INSTANCE_CONTRACT_NAME,
  RANKIFY_INSTANCE_CONTRACT_VERSION,
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
} from '../playbook/utils';
import { Wallet } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

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
  RInstance_MIN_GAME_TIME: 3600,
  PRINCIPAL_COST: ethers.utils.parseEther('1'),
  // RInstance_NUM_ACTIONS_TO_TAKE,
};

export const setupTest = deployments.createFixture(async ({ deployments, getNamedAccounts, ethers: _eth }, options) => {
  await deployments.fixture(['ERC7744', 'MAO']);
  const adr = await setupAddresses(getNamedAccounts, _eth);
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
});
// export const setupTest = () => setupTest();
export const setupEnvironment = async (setup: {
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
