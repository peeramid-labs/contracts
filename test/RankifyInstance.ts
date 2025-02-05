import {
  AdrSetupResult,
  RInstance_MAX_PLAYERS,
  RInstance_MIN_PLAYERS,
  EnvSetupResult,
  MockVote,
  SignerIdentity,
  RInstance_MAX_TURNS,
  RANKIFY_INSTANCE_CONTRACT_NAME,
  RANKIFY_INSTANCE_CONTRACT_VERSION,
  signJoiningGame,
  getProposalsIntegrity,
  ProposalSubmission,
} from '../scripts/utils';
import { setupTest } from './utils';
import { RInstanceSettings, mineBlocks, mockProposals, mockVotes, getPlayers } from '../scripts/utils';
import { expect } from 'chai';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import { DistributableGovernanceERC20, Rankify, RankifyDiamondInstance, RankToken } from '../types/';
import { LibCoinVending } from '../types/src/facets/RankifyInstanceRequirementsFacet';
import { IRankifyInstance } from '../types/src/facets/RankifyInstanceMainFacet';
import { deployments, ethers as ethersDirect } from 'hardhat';
import { BigNumber, BigNumberish } from 'ethers';
import { assert } from 'console';
import addDistribution from '../scripts/addDistribution';
import hre from 'hardhat';
const path = require('path');

const scriptName = path.basename(__filename);

import { getCodeIdFromArtifact } from '../scripts/getCodeId';
import { MAODistribution } from '../types/src/distributions/MAODistribution';
import { generateDistributorData } from '../scripts/libraries/generateDistributorData';
import { generateDeterministicPermutation } from '../scripts/proofs';
import { HardhatEthersHelpers } from 'hardhat/types';
import { Address } from 'hardhat-deploy/types';

let votes: MockVote[];
let proposals: ProposalSubmission[];
let adr: AdrSetupResult;
let votersAddresses: string[];
let env: EnvSetupResult;
let rankifyInstance: RankifyDiamondInstance;
let rankToken: RankToken;
let govtToken: DistributableGovernanceERC20;

const createGame = async (
  minGameTime: BigNumberish,
  gameContract: RankifyDiamondInstance,
  signer: SignerIdentity,
  gameMaster: string,
  gameRank: BigNumberish,
  openNow?: boolean,
) => {
  await env.rankifyToken.connect(signer.wallet).approve(gameContract.address, ethersDirect.constants.MaxUint256);
  const expectedGameId = (await gameContract.getContractState().then(state => state.numGames)).add(1);
  const params: IRankifyInstance.NewGameParamsInputStruct = {
    gameMaster: gameMaster,
    gameRank: gameRank,
    maxPlayerCnt: RInstance_MAX_PLAYERS,
    minPlayerCnt: RInstance_MIN_PLAYERS,
    timePerTurn: RInstanceSettings.RInstance_TIME_PER_TURN,
    timeToJoin: RInstanceSettings.RInstance_TIME_TO_JOIN,
    nTurns: RInstance_MAX_TURNS,
    voteCredits: RInstanceSettings.RInstance_VOTE_CREDITS,
    minGameTime: minGameTime,
  };
  await gameContract.connect(signer.wallet).createGame(params);
  const gameId = await gameContract.getContractState().then(state => state.numGames);
  assert(gameId.eq(expectedGameId), 'Game ID mismatch');
  if (openNow) await gameContract.connect(signer.wallet).openRegistration(gameId);
  return gameId;
};

// Update endTurn function
const endTurn = async (gameId: BigNumberish, gameContract: RankifyDiamondInstance, idlers?: number[]) => {
  const turn = await gameContract.getTurn(gameId);
  const chainId = await hre.getChainId();
  const players = await rankifyInstance.getPlayers(gameId);

  const { newProposals, permutation, nullifier } = await getProposalsIntegrity({
    hre,
    players: getPlayers(adr, players.length),
    gameId,
    turn: Number(turn),
    verifierAddress: gameContract.address,
    gm: adr.gameMaster1.wallet,
    idlers,
  });

  await gameContract.connect(adr.gameMaster1.wallet).endTurn(
    gameId,
    (
      await mockValidVotes(
        getPlayers(adr, players.length),
        gameContract,
        gameId,
        adr.gameMaster1,
        turn.eq(1) ? false : true,
        'ftw',
      )
    ).map(vote => {
      return vote.vote;
    }),
    newProposals,
    permutation,
    nullifier,
  );
};

// Update runToTheEnd function
const runToTheEnd = async (
  gameId: BigNumberish,
  gameContract: RankifyDiamondInstance,
  gameMaster: SignerIdentity,
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
  distribution: 'ftw' | 'semiUniform' | 'equal' = 'ftw',
) => {
  let isGameOver = await rankifyInstance.isGameOver(gameId);
  let isLastTurn = await rankifyInstance.isLastTurn(gameId);
  while (!isGameOver) {
    isLastTurn = await rankifyInstance.isLastTurn(gameId);
    const turn = await rankifyInstance.getTurn(gameId).then(r => r.toNumber());
    if (turn !== 1) {
      votes = await mockValidVotes(players, gameContract, gameId, gameMaster, true, distribution);
    }

    const { newProposals, permutation, nullifier } = await getProposalsIntegrity({
      hre,
      players,
      gameId,
      turn,
      verifierAddress: gameContract.address,
      gm: gameMaster.wallet,
      proposalSubmissionData: await mockValidProposals({
        players,
        gameContract,
        gameMaster,
        gameId,
        submitNow: true,
      }),
    });

    if (isLastTurn) {
      const timeToEnd = await gameContract.getGameState(gameId).then(state => state.minGameTime);
      await time.increase(timeToEnd.toNumber() + 1);
    }

    // const shuffleSalt = await getTestShuffleSalt(gameId, turn, gameMaster);

    await gameContract
      .connect(gameMaster.wallet)
      .endTurn(gameId, turn == 1 ? [] : votes?.map(vote => vote.vote), newProposals, permutation, nullifier);
    isGameOver = await rankifyInstance.isGameOver(gameId);
  }
  const winner = await gameContract['gameWinner(uint256)'](gameId);
  if (distribution == 'ftw') assert(winner == players[0].wallet.address, 'winner is not the first player');
};

const endWithIntegrity = async ({
  gameId,
  gameContract,
  players,
  proposals,
  votes,
  gm,
  idlers,
}: {
  gameId: BigNumberish;
  gameContract: RankifyDiamondInstance;
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]];
  proposals?: ProposalSubmission[];
  votes: BigNumberish[][];
  gm: SignerIdentity;
  idlers?: number[];
}) => {
  const turn = await gameContract.getTurn(gameId);
  const { newProposals, permutation, nullifier } = await getProposalsIntegrity({
    hre: hre,
    players,
    gameId,
    turn,
    verifierAddress: gameContract.address,
    gm: gm.wallet,
    proposalSubmissionData: proposals,
    idlers,
  });
  return rankifyInstance.connect(gm.wallet).endTurn(gameId, votes, newProposals, permutation, nullifier);
};

const runToLastTurn = async (
  gameId: BigNumberish,
  gameContract: RankifyDiamondInstance,
  gm: SignerIdentity,
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
  distribution?: 'ftw' | 'semiUniform' | 'equal',
): Promise<void> => {
  const initialTurn = await rankifyInstance.getTurn(gameId);
  for (let turn = initialTurn.toNumber(); turn < RInstanceSettings.RInstance_MAX_TURNS; turn++) {
    if (turn !== 1) {
      votes = await mockValidVotes(players, gameContract, gameId, gm, true, distribution ?? 'ftw');
    } else {
      votes = [];
    }
    // const votes = await mockValidVotes(players, gameContract, gameId, gm, true, distribution ?? 'ftw');
    await endWithIntegrity({
      gameId,
      gameContract,
      players,
      proposals: await mockValidProposals({
        players,
        gameContract,
        gameId,
        gameMaster: gm,
        submitNow: true,
      }),
      votes: votes.map(vote => vote.vote),
      gm,
    });
  }
  const isLastTurn = await gameContract.isLastTurn(gameId);
  assert(isLastTurn, 'should be last turn');
};

// Update mockValidVotes function
const mockValidVotes = async (
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
  gameContract: RankifyDiamondInstance,
  gameId: BigNumberish,
  gm: SignerIdentity,
  submitNow?: boolean,
  distribution?: 'ftw' | 'semiUniform' | 'equal',
) => {
  const turn = await gameContract.getTurn(gameId);
  if (!turn.eq(1)) {
    votes = await mockVotes({
      hre: hre,
      gameId: gameId,
      turn: turn,
      verifierAddress: gameContract.address,
      players: players,
      gm: gm.wallet,
      distribution: distribution ?? 'semiUniform',
    });
    if (submitNow) {
      votersAddresses = players.map(player => player.wallet.address);
      for (let i = 0; i < players.length; i++) {
        const voted = await gameContract.getPlayerVotedArray(gameId);
        if (!voted[i]) {
          await gameContract
            .connect(gm.wallet)
            .submitVote(
              gameId,
              votes[i].ballotId,
              players[i].wallet.address,
              votes[i].gmSignature,
              votes[i].voterSignature,
              votes[i].ballotHash,
            );
        } else {
          //   console.warn('submit mock vote -> already voted');
        }
      }
    }
    return votes;
  } else {
    return [];
  }
};

const startGame = async (gameId: BigNumberish) => {
  const currentT = await time.latest();
  await time.setNextBlockTimestamp(currentT + Number(RInstanceSettings.RInstance_TIME_TO_JOIN) + 1);
  await mineBlocks(RInstanceSettings.RInstance_TIME_TO_JOIN + 1, hre);
  await rankifyInstance.connect(adr.gameMaster1.wallet).startGame(
    gameId,
    await generateDeterministicPermutation({
      gameId: gameId,
      turn: 0,
      verifierAddress: rankifyInstance.address,
      chainId: await hre.getChainId(),
      gm: adr.gameMaster1.wallet,
      size: await rankifyInstance.getPlayers(gameId).then(players => players.length),
    }).then(perm => perm.commitment),
  );
};

const mockValidProposals = async ({
  players,
  gameContract,
  gameMaster,
  gameId,
  submitNow,
  idlers,
  turn,
}: {
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]];
  gameContract: RankifyDiamondInstance;
  gameMaster: SignerIdentity;
  gameId: BigNumberish;
  submitNow?: boolean;
  idlers?: number[];
  turn?: number;
}) => {
  const _turn = turn ?? (await gameContract.getTurn(gameId)).toNumber();

  proposals = await mockProposals({
    hre: hre,
    players: players,
    gameId: gameId,
    turn: _turn,
    verifierAddress: gameContract.address,
    gm: gameMaster.wallet,
    idlers: idlers,
  });

  if (submitNow) {
    for (let i = 0; i < players.length; i++) {
      if (!idlers?.includes(i)) {
        const proposedFilter = gameContract.filters.ProposalSubmitted(gameId, _turn);
        const proposed = await gameContract.queryFilter(proposedFilter);
        if (!proposed.some(evt => evt.args.proposer === players[i].wallet.address)) {
          await gameContract.connect(gameMaster.wallet).submitProposal(proposals[i].params);
        }
      }
    }
  }

  return proposals;
};

const fillParty = async (
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
  gameContract: RankifyDiamondInstance,
  gameId: BigNumberish,
  shiftTime: boolean,
  gameMaster: SignerIdentity,
  startGame?: boolean,
) => {
  for (let i = 0; i < players.length; i++) {
    if (!env.rankTokenBase.address) throw new Error('Rank token undefined or unemployed');
    await rankToken.connect(players[i].wallet).setApprovalForAll(rankifyInstance.address, true);
    const { signature, hiddenSalt } = await signJoiningGame(
      hre,
      gameContract.address,
      players[i].wallet.address,
      gameId,
      gameMaster,
    );
    await gameContract.connect(players[i].wallet).joinGame(gameId, signature, hiddenSalt);
  }
  if (shiftTime) {
    const currentT = await time.latest();
    await time.setNextBlockTimestamp(currentT + Number(RInstanceSettings.RInstance_TIME_TO_JOIN) + 1);
    await mineBlocks(1, hre);
  }
  if (startGame && gameMaster) {
    await rankifyInstance.connect(gameMaster.wallet).startGame(
      gameId,
      await generateDeterministicPermutation({
        gameId: gameId,
        turn: 0,
        verifierAddress: rankifyInstance.address,
        chainId: await hre.getChainId(),
        gm: gameMaster.wallet,
        size: await rankifyInstance.getPlayers(gameId).then(players => players.length),
      }).then(perm => perm.commitment),
    );
  }
};
const setupMainTest = deployments.createFixture(async ({ deployments, getNamedAccounts, ethers }, options) => {
  const setup = await setupTest();
  adr = setup.adr;
  env = setup.env;
  await addDistribution(hre)({
    distrId: await getCodeIdFromArtifact(hre)('MAODistribution'),
    signer: adr.gameOwner.wallet,
  });
  const distributorArguments: MAODistribution.DistributorArgumentsStruct = {
    tokenSettings: {
      tokenName: 'tokenName',
      tokenSymbol: 'tokenSymbol',
    },
    rankifySettings: {
      rankTokenContractURI: 'https://example.com/rank',
      rankTokenURI: 'https://example.com/rank',
      principalCost: RInstanceSettings.PRINCIPAL_COST,
      principalTimeConstant: RInstanceSettings.PRINCIPAL_TIME_CONSTANT,
    },
  };
  const data = generateDistributorData(distributorArguments);
  const maoCode = await ethers.provider.getCode(env.maoDistribution.address);
  const maoId = ethers.utils.keccak256(maoCode);
  const distributorsDistId = await hre.run('defaultDistributionId');
  if (!distributorsDistId) throw new Error('Distribution name not found');
  if (typeof distributorsDistId !== 'string') throw new Error('Distribution name must be a string');

  const token = await deployments.get('Rankify');
  const { owner } = await getNamedAccounts();
  const oSigner = await ethers.getSigner(owner);
  const tokenContract = new ethers.Contract(token.address, token.abi, oSigner) as Rankify;
  await tokenContract.mint(oSigner.address, ethers.utils.parseEther('100'));
  await tokenContract.approve(env.distributor.address, ethers.constants.MaxUint256);
  await env.distributor.connect(oSigner).instantiate(distributorsDistId, data);

  const filter = env.distributor.filters.Instantiated();
  const evts = await env.distributor.queryFilter(filter);
  rankifyInstance = (await ethers.getContractAt(
    'RankifyDiamondInstance',
    evts[0].args.instances[2],
  )) as RankifyDiamondInstance;

  govtToken = (await ethers.getContractAt(
    'DistributableGovernanceERC20',
    evts[0].args.instances[0],
  )) as DistributableGovernanceERC20;

  await env.rankifyToken.connect(adr.gameCreator1.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
  await env.rankifyToken.connect(adr.gameCreator2.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
  await env.rankifyToken.connect(adr.gameCreator3.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
  await env.rankifyToken.connect(adr.player1.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
  await env.rankifyToken.connect(adr.player2.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
  await env.rankifyToken.connect(adr.player3.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
  await env.rankifyToken.connect(adr.player4.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
  await env.rankifyToken.connect(adr.player5.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
  await env.rankifyToken.connect(adr.player6.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
  await env.rankifyToken.connect(adr.player7.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
  await env.rankifyToken.connect(adr.player8.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
  await env.rankifyToken.connect(adr.player9.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
  await env.rankifyToken.connect(adr.player10.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);

  rankToken = (await ethers.getContractAt('RankToken', evts[0].args.instances[11])) as RankToken;
  const requirement: LibCoinVending.ConfigPositionStruct = {
    ethValues: {
      have: ethers.utils.parseEther('0.1'),
      burn: ethers.utils.parseEther('0.1'),
      pay: ethers.utils.parseEther('0.1'),
      bet: ethers.utils.parseEther('0.1'),
      lock: ethers.utils.parseEther('0.1'),
    },
    contracts: [],
  };
  requirement.contracts = [];
  requirement.contracts.push({
    contractAddress: env.mockERC20.address,
    contractId: '0',
    contractType: '0',
    contractRequirement: {
      lock: { amount: ethers.utils.parseEther('0.1'), data: '0x' },
      pay: { amount: ethers.utils.parseEther('0.1'), data: '0x' },
      bet: { amount: ethers.utils.parseEther('0.1'), data: '0x' },
      burn: { amount: ethers.utils.parseEther('0.1'), data: '0x' },
      have: { amount: ethers.utils.parseEther('0.1'), data: '0x' },
    },
  });
  requirement.contracts.push({
    contractAddress: env.mockERC1155.address,
    contractId: '1',
    contractType: '1',
    contractRequirement: {
      lock: { amount: ethers.utils.parseEther('0.1'), data: '0x' },
      pay: { amount: ethers.utils.parseEther('0.1'), data: '0x' },
      bet: { amount: ethers.utils.parseEther('0.1'), data: '0x' },
      burn: { amount: ethers.utils.parseEther('0.1'), data: '0x' },
      have: { amount: ethers.utils.parseEther('0.1'), data: '0x' },
    },
  });

  requirement.contracts.push({
    contractAddress: env.mockERC721.address,
    contractId: '1',
    contractType: '2',
    contractRequirement: {
      lock: { amount: ethers.utils.parseEther('0'), data: '0x' },
      pay: { amount: ethers.utils.parseEther('0'), data: '0x' },
      bet: { amount: ethers.utils.parseEther('0'), data: '0x' },
      burn: { amount: ethers.utils.parseEther('0'), data: '0x' },
      have: { amount: '1', data: '0x' },
    },
  });
  return { requirement, ethers, getNamedAccounts };
});
const setupFirstRankTest = deployments.createFixture(async () => {
  let initialCreatorBalance: BigNumber;
  let initialBeneficiaryBalance: BigNumber;
  let initialTotalSupply: BigNumber;
  let gamePrice: BigNumber;
  // Get initial balances
  initialCreatorBalance = await env.rankifyToken.balanceOf(adr.gameCreator1.wallet.address);
  initialBeneficiaryBalance = await env.rankifyToken.balanceOf(
    await rankifyInstance.getContractState().then(s => s.commonParams.beneficiary),
  );
  initialTotalSupply = await env.rankifyToken.totalSupply();

  // Get common params for price calculation
  const { commonParams } = await rankifyInstance.getContractState();
  const { principalTimeConstant } = commonParams;
  const minGameTime = principalTimeConstant; // Using same value for simplicity
  gamePrice = commonParams.principalCost.mul(principalTimeConstant).div(minGameTime);

  // Create the game
  await createGame(minGameTime, rankifyInstance, adr.gameCreator1, adr.gameMaster1.wallet.address, 1);
  return { initialCreatorBalance, initialBeneficiaryBalance, initialTotalSupply, gamePrice };
});

const setupOpenRegistrationTest = deployments.createFixture(async () => {
  await rankifyInstance.connect(adr.gameCreator1.wallet).openRegistration(1);
});

const filledPartyTest = deployments.createFixture(async () => {
  await fillParty(getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS), rankifyInstance, 1, false, adr.gameMaster1);
});

const startedGameTest = deployments.createFixture(async () => {
  await startGame(1);
});

const proposalsReceivedTest = deployments.createFixture(async () => {
  const playersCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
  proposals = await mockValidProposals({
    players: getPlayers(adr, playersCnt),
    gameContract: rankifyInstance,
    gameMaster: adr.gameMaster1,
    gameId: 1,
    submitNow: true,
  });
});

const proposalsMissingTest = deployments.createFixture(async () => {
  await endTurn(1, rankifyInstance);

  const playersCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
  const players = getPlayers(adr, playersCnt);
  votes = await mockValidVotes(players, rankifyInstance, 1, adr.gameMaster1, true, 'ftw');
});

const firstTurnMadeTest = deployments.createFixture(async () => {
  const playersCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
  const players = getPlayers(adr, playersCnt);

  await endWithIntegrity({
    gameId: 1,
    gameContract: rankifyInstance,
    players,
    proposals,
    votes: [],
    gm: adr.gameMaster1,
    idlers: [0],
  });
});

const allPlayersVotedTest = deployments.createFixture(async () => {
  const playersCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
  const players = getPlayers(adr, playersCnt);
  const votes = await mockValidVotes(players, rankifyInstance, 1, adr.gameMaster1, true);
  return { votes };
});
const notEnoughPlayersTest = deployments.createFixture(async () => {
  await fillParty(getPlayers(adr, RInstance_MIN_PLAYERS - 1), rankifyInstance, 1, true, adr.gameMaster1);
});

const lastTurnEqualScoresTest = deployments.createFixture(async () => {
  await rankifyInstance.connect(adr.gameCreator1.wallet).openRegistration(1);
  await fillParty(
    getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
    rankifyInstance,
    1,
    true,
    adr.gameMaster1,
    true,
  );
  await runToLastTurn(
    1,
    rankifyInstance,
    adr.gameMaster1,
    getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
    'equal',
  );
});
const inOvertimeTest = deployments.createFixture(async () => {
  const playerCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
  await mockValidVotes(getPlayers(adr, playerCnt), rankifyInstance, 1, adr.gameMaster1, true, 'equal');
  await mockValidProposals({
    players: getPlayers(adr, playerCnt),
    gameContract: rankifyInstance,
    gameMaster: adr.gameMaster1,
    gameId: 1,
    submitNow: true,
  });

  return endWithIntegrity({
    gameId: 1,
    gameContract: rankifyInstance,
    players: getPlayers(adr, playerCnt),
    proposals,
    votes: votes.map(vote => vote.vote),
    gm: adr.gameMaster1,
  });
});

const gameOverTest = deployments.createFixture(async ({ deployments, getNamedAccounts, ethers }, options) => {
  await runToTheEnd(1, rankifyInstance, adr.gameMaster1, getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS));
});

const multipleFirstRankGamesTest = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
    for (let numGames = 0; numGames < RInstanceSettings.RInstance_MAX_PLAYERS; numGames++) {
      const gameId = await createGame(
        RInstanceSettings.RInstance_MIN_GAME_TIME,
        rankifyInstance,
        adr.gameCreator1,
        adr.gameMaster1.wallet.address,
        1,
        true,
      );
      await fillParty(
        getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS, numGames),
        rankifyInstance,
        gameId,
        true,
        adr.gameMaster1,
        true,
      );
      await runToTheEnd(
        gameId,
        rankifyInstance,
        adr.gameMaster1,
        getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS, numGames),
        'ftw',
      );
    }
  },
);
const nextRankTest = deployments.createFixture(async ({ deployments, getNamedAccounts, ethers }, options) => {
  await createGame(
    RInstanceSettings.RInstance_MIN_GAME_TIME,
    rankifyInstance,
    adr.player1,
    adr.gameMaster1.wallet.address,
    2,
    true,
  );
});

const nextRankGameOver = deployments.createFixture(async ({ deployments, getNamedAccounts, ethers }, options) => {
  let balancesBeforeJoined: BigNumber[] = [];
  const players = getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS, 0);
  const lastCreatedGameId = await rankifyInstance.getContractState().then(r => r.numGames);
  for (let i = 0; i < players.length; i++) {
    balancesBeforeJoined[i] = await rankToken.unlockedBalanceOf(players[i].wallet.address, 2);
  }
  await fillParty(players, rankifyInstance, lastCreatedGameId, true, adr.gameMaster1, true);

  await runToTheEnd(
    lastCreatedGameId,
    rankifyInstance,
    adr.gameMaster1,
    getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
    'ftw',
  );
  return { balancesBeforeJoined };
});

describe(scriptName, () => {
  let requirement: LibCoinVending.ConfigPositionStruct = {
    ethValues: {
      have: ethersDirect.utils.parseEther('0.1'),
      burn: ethersDirect.utils.parseEther('0.1'),
      pay: ethersDirect.utils.parseEther('0.1'),
      bet: ethersDirect.utils.parseEther('0.1'),
      lock: ethersDirect.utils.parseEther('0.1'),
    },
    contracts: [],
  };
  let eth: typeof ethersDirect & HardhatEthersHelpers;
  let getNamedAccounts: () => Promise<{
    [name: string]: Address;
  }>;
  beforeEach(async () => {
    const setup = await setupMainTest();
    requirement = setup.requirement;
    eth = setup.ethers;
    getNamedAccounts = setup.getNamedAccounts;
  });
  it('Has correct initial settings', async () => {
    const { DAO } = await getNamedAccounts();
    const state = await rankifyInstance.connect(adr.gameCreator1.wallet).getContractState();
    expect(state.commonParams.principalTimeConstant).to.be.equal(RInstanceSettings.PRINCIPAL_TIME_CONSTANT);
    expect(state.commonParams.principalCost).to.be.equal(RInstanceSettings.PRINCIPAL_COST);
    expect(state.commonParams.beneficiary).to.be.equal(DAO);
    expect(state.commonParams.rankTokenAddress).to.be.equal(rankToken.address);
  });
  it('Ownership is renounced', async () => {
    expect(await rankifyInstance.owner()).to.be.equal(eth.constants.AddressZero);
    await expect(
      rankifyInstance.connect(adr.maliciousActor1.wallet).transferOwnership(adr.gameCreator1.wallet.address),
    ).to.revertedWith('LibDiamond: Must be contract owner');
  });
  it('has rank token assigned', async () => {
    const state = await rankifyInstance.getContractState();
    expect(state.commonParams.rankTokenAddress).to.be.equal(rankToken.address);
  });
  it('Can create game only with valid payments', async () => {
    await env.rankifyToken.connect(adr.gameCreator1.wallet).approve(rankifyInstance.address, 0);
    const params: IRankifyInstance.NewGameParamsInputStruct = {
      gameMaster: adr.gameMaster1.wallet.address,
      gameRank: 1,
      maxPlayerCnt: RInstance_MAX_PLAYERS,
      minPlayerCnt: RInstance_MIN_PLAYERS,
      timePerTurn: RInstanceSettings.RInstance_TIME_PER_TURN,
      timeToJoin: RInstanceSettings.RInstance_TIME_TO_JOIN,
      nTurns: RInstance_MAX_TURNS,
      voteCredits: RInstanceSettings.RInstance_VOTE_CREDITS,
      minGameTime: RInstanceSettings.RInstance_MIN_GAME_TIME,
    };

    await expect(rankifyInstance.connect(adr.gameCreator1.wallet).createGame(params)).to.be.revertedWithCustomError(
      env.rankifyToken,
      'ERC20InsufficientAllowance',
    );
    await env.rankifyToken.connect(adr.gameCreator1.wallet).approve(rankifyInstance.address, eth.constants.MaxUint256);
    await expect(rankifyInstance.connect(adr.gameCreator1.wallet).createGame(params)).to.emit(
      rankifyInstance,
      'gameCreated',
    );
    await env.rankifyToken
      .connect(adr.gameCreator1.wallet)
      .burn(await env.rankifyToken.balanceOf(adr.gameCreator1.wallet.address));
    await expect(rankifyInstance.connect(adr.gameCreator1.wallet).createGame(params)).to.revertedWithCustomError(
      env.rankifyToken,
      'ERC20InsufficientBalance',
    );
  });

  it('Cannot perform actions on games that do not exist', async () => {
    const s1 = await signJoiningGame(hre, rankifyInstance.address, adr.gameCreator1.wallet.address, 1, adr.gameMaster1);
    await expect(
      rankifyInstance.connect(adr.gameCreator1.wallet).joinGame(1, s1.signature, s1.hiddenSalt),
    ).to.be.revertedWith('game not found');
    let proposals = await mockProposals({
      hre: hre,
      players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
      gameId: 1,
      turn: 1,
      verifierAddress: rankifyInstance.address,
      gm: adr.gameMaster1.wallet,
    });
    await expect(
      rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(proposals[0].params),
    ).to.be.revertedWith('game not found');
    votersAddresses = getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS).map(player => player.wallet.address);
    votes = await mockVotes({
      hre: hre,
      gameId: 1,
      turn: 1,
      verifierAddress: rankifyInstance.address,
      players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
      gm: adr.gameMaster1.wallet,
      distribution: 'semiUniform',
    });
    await expect(
      rankifyInstance
        .connect(adr.gameMaster1.wallet)
        .submitVote(
          1,
          votes[0].ballotId,
          adr.player1.wallet.address,
          votes[0].gmSignature,
          votes[0].voterSignature,
          votes[0].ballotHash,
        ),
    ).to.be.revertedWith('game not found');
    await expect(rankifyInstance.connect(adr.gameMaster1.wallet).openRegistration(1)).to.be.revertedWith(
      'game not found',
    );

    let s2 = await signJoiningGame(hre, rankifyInstance.address, adr.gameMaster1.wallet.address, 1, adr.gameMaster1);

    await expect(
      rankifyInstance.connect(adr.gameMaster1.wallet).joinGame(0, s2.signature, s2.hiddenSalt),
    ).to.be.revertedWith('game not found');
    await expect(
      rankifyInstance.connect(adr.gameMaster1.wallet).startGame(
        0,
        await generateDeterministicPermutation({
          gameId: 0,
          turn: 0,
          verifierAddress: rankifyInstance.address,
          chainId: await hre.getChainId(),
          gm: adr.gameMaster1.wallet,
          size: await rankifyInstance.getPlayers(0).then(players => players.length),
        }).then(perm => perm.commitment),
      ),
    ).to.be.revertedWith('game not found');
    proposals = await mockProposals({
      hre: hre,
      players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
      gameId: 1,
      turn: 1,
      verifierAddress: rankifyInstance.address,
      gm: adr.gameMaster1.wallet,
    });
    await expect(
      endWithIntegrity({
        gameId: 1,
        gameContract: rankifyInstance,
        players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
        proposals,
        votes: votes.map(vote => vote.vote),
        gm: adr.gameMaster1,
      }),
    ).to.be.revertedWith('game not found');
    await expect(
      rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(proposals[0].params),
    ).to.be.revertedWith('game not found');
  });
  describe('When a game of first rank was created', () => {
    let initialCreatorBalance: BigNumber;
    let initialBeneficiaryBalance: BigNumber;
    let initialTotalSupply: BigNumber;
    let gamePrice: BigNumber;

    beforeEach(async () => {
      const setup = await setupFirstRankTest();
      initialCreatorBalance = setup.initialCreatorBalance;
      initialBeneficiaryBalance = setup.initialBeneficiaryBalance;
      initialTotalSupply = setup.initialTotalSupply;
      gamePrice = setup.gamePrice;
    });

    it('Should handle game creation costs and token distribution correctly', async () => {
      const finalCreatorBalance = await env.rankifyToken.balanceOf(adr.gameCreator1.wallet.address);
      const finalBeneficiaryBalance = await env.rankifyToken.balanceOf(
        await rankifyInstance.getContractState().then(s => s.commonParams.beneficiary),
      );
      const finalTotalSupply = await env.rankifyToken.totalSupply();

      // Check creator's balance is reduced by game cost
      expect(finalCreatorBalance).to.equal(
        initialCreatorBalance.sub(gamePrice),
        "Creator's balance should be reduced by game cost",
      );

      // Check beneficiary receives 10% of game cost
      const beneficiaryShare = gamePrice.mul(10).div(100);
      expect(finalBeneficiaryBalance).to.equal(
        initialBeneficiaryBalance.add(beneficiaryShare),
        'Beneficiary should receive 10% of game cost',
      );

      // Check 90% of game cost is burned
      const burnedAmount = gamePrice.mul(90).div(100);
      expect(finalTotalSupply).to.equal(initialTotalSupply.sub(burnedAmount), '90% of game cost should be burned');
    });
    it('can get game state', async () => {
      const state = await rankifyInstance.getGameState(1);
      expect(state.rank).to.be.equal(1);
      expect(state.minGameTime).to.be.equal(RInstanceSettings.PRINCIPAL_TIME_CONSTANT);
      expect(state.createdBy).to.be.equal(adr.gameCreator1.wallet.address);
      expect(state.numOngoingProposals).to.be.equal(0);
      expect(state.numPrevProposals).to.be.equal(0);
      expect(state.numCommitments).to.be.equal(0);
      expect(state.numVotesPrevTurn).to.be.equal(0);
      expect(state.currentTurn).to.be.equal(0);
      expect(state.turnStartedAt).to.be.equal(0);
      expect(state.registrationOpenAt).to.be.equal(0);
      expect(state.startedAt).to.be.equal(0);
      expect(state.hasStarted).to.be.equal(false);
      expect(state.hasEnded).to.be.equal(false);
      expect(state.numPlayersMadeMove).to.be.equal(0);
      expect(state.numActivePlayers).to.be.equal(0);
      expect(state.isOvertime).to.be.equal(false);
    });

    it('Should calculate game price correctly for different time parameters', async () => {
      const { commonParams } = await rankifyInstance.getContractState();

      // Test cases with different time parameters
      const testCases = [
        { minGameTime: commonParams.principalTimeConstant },
        { minGameTime: commonParams.principalTimeConstant.mul(2) },
        { minGameTime: commonParams.principalTimeConstant.div(2) },
      ];

      for (const testCase of testCases) {
        const expectedPrice = commonParams.principalCost
          .mul(commonParams.principalTimeConstant)
          .div(testCase.minGameTime);

        const params: IRankifyInstance.NewGameParamsInputStruct = {
          gameMaster: adr.gameMaster1.wallet.address,
          gameRank: 1,
          maxPlayerCnt: RInstanceSettings.RInstance_MAX_PLAYERS,
          minPlayerCnt: RInstanceSettings.RInstance_MIN_PLAYERS,
          timePerTurn: RInstanceSettings.RInstance_TIME_PER_TURN,
          timeToJoin: RInstanceSettings.RInstance_TIME_TO_JOIN,
          nTurns: RInstance_MAX_TURNS,
          voteCredits: RInstanceSettings.RInstance_VOTE_CREDITS,
          minGameTime: testCase.minGameTime,
        };
        const { DAO } = await getNamedAccounts();
        const totalSupplyBefore = await env.rankifyToken.totalSupply();
        await expect(rankifyInstance.connect(adr.gameCreator1.wallet).createGame(params)).changeTokenBalances(
          env.rankifyToken,
          [adr.gameCreator1.wallet.address, DAO],
          [expectedPrice.mul(-1), expectedPrice.mul(10).div(100)],
        );
        expect(await env.rankifyToken.totalSupply()).to.be.equal(totalSupplyBefore.sub(expectedPrice.mul(90).div(100)));
        // Get actual game price
        const actualPrice = await rankifyInstance.estimateGamePrice(testCase.minGameTime);

        // Allow for small rounding differences due to division
        const difference = expectedPrice.sub(actualPrice).abs();
        expect(difference.lte(1)).to.be.true;
      }
    });

    it('GM is correct', async () => {
      expect(await rankifyInstance.getGM(1)).to.be.equal(adr.gameMaster1.wallet.address);
    });
    it('Incremented number of games correctly', async () => {
      const state = await rankifyInstance.connect(adr.gameCreator1.wallet).getContractState();
      expect(state.numGames).to.be.equal(1);
    });
    it('Players cannot join until registration is open', async () => {
      await env.rankifyToken.connect(adr.player1.wallet).approve(rankifyInstance.address, eth.constants.MaxUint256);
      const gameId = await rankifyInstance.getContractState().then(s => s.numGames);
      const s1 = await signJoiningGame(hre, rankifyInstance.address, adr.player1.wallet.address, 1, adr.gameMaster1);
      await expect(
        rankifyInstance.connect(adr.player1.wallet).joinGame(gameId, s1.signature, s1.hiddenSalt),
      ).to.be.revertedWith('addPlayer->cant join now');
    });
    it('Allows only game creator to add join requirements', async () => {
      await expect(rankifyInstance.connect(adr.gameCreator1.wallet).setJoinRequirements(1, requirement)).to.be.emit(
        rankifyInstance,
        'RequirementsConfigured',
      );
      await expect(
        rankifyInstance.connect(adr.maliciousActor1.wallet).setJoinRequirements(1, requirement),
      ).to.be.revertedWith('Only game creator');
      await expect(
        rankifyInstance.connect(adr.maliciousActor1.wallet).setJoinRequirements(11, requirement),
      ).to.be.revertedWith('game not found');
    });
    it('Only game creator can open registration', async () => {
      await expect(rankifyInstance.connect(adr.gameCreator1.wallet).openRegistration(1)).to.be.emit(
        rankifyInstance,
        'RegistrationOpen',
      );
      await expect(rankifyInstance.connect(adr.maliciousActor1.wallet).openRegistration(1)).to.be.revertedWith(
        'Only game creator',
      );
    });
    describe('When registration was open without any additional requirements', () => {
      beforeEach(async () => {
        await setupOpenRegistrationTest();
      });
      it('Should reject join attempt with invalid signature', async () => {
        // Try with wrong signer
        const s1 = await signJoiningGame(hre, rankifyInstance.address, adr.player1.wallet.address, 1, adr.gameMaster2); // Using wrong game master
        await expect(
          rankifyInstance.connect(adr.player1.wallet).joinGame(1, s1.signature, s1.hiddenSalt),
        ).to.be.revertedWithCustomError(rankifyInstance, 'invalidECDSARecoverSigner');

        // Try with wrong gameId
        const s2 = await signJoiningGame(hre, rankifyInstance.address, adr.player1.wallet.address, 2, adr.gameMaster1); // Wrong gameId
        await expect(
          rankifyInstance.connect(adr.player1.wallet).joinGame(1, s2.signature, s2.hiddenSalt),
        ).to.be.revertedWithCustomError(rankifyInstance, 'invalidECDSARecoverSigner');

        // Try with wrong participant
        const s3 = await signJoiningGame(hre, rankifyInstance.address, adr.player2.wallet.address, 1, adr.gameMaster1); // Wrong participant
        await expect(
          rankifyInstance.connect(adr.player1.wallet).joinGame(1, s3.signature, s3.hiddenSalt),
        ).to.be.revertedWithCustomError(rankifyInstance, 'invalidECDSARecoverSigner');

        // Try with tampered hiddenSalt
        const s4 = await signJoiningGame(hre, rankifyInstance.address, adr.player1.wallet.address, 1, adr.gameMaster1);
        const tamperedSalt = eth.utils.hexZeroPad('0xdeadbeef', 32); // Different salt than what was signed
        await expect(
          rankifyInstance.connect(adr.player1.wallet).joinGame(1, s4.signature, tamperedSalt),
        ).to.be.revertedWithCustomError(rankifyInstance, 'invalidECDSARecoverSigner');
      });

      it('Should accept valid signature from correct game master', async () => {
        const s1 = await signJoiningGame(hre, rankifyInstance.address, adr.player1.wallet.address, 1, adr.gameMaster1);
        await expect(rankifyInstance.connect(adr.player1.wallet).joinGame(1, s1.signature, s1.hiddenSalt))
          .to.emit(rankifyInstance, 'PlayerJoined')
          .withArgs(1, adr.player1.wallet.address, s1.hiddenSalt);
      });

      it('Mutating join requirements is no longer possible', async () => {
        await expect(
          rankifyInstance.connect(adr.gameCreator1.wallet).setJoinRequirements(1, requirement),
        ).to.be.revertedWith('Cannot do when registration is open');
      });
      it('Qualified players can join', async () => {
        const s1 = await signJoiningGame(hre, rankifyInstance.address, adr.player1.wallet.address, 1, adr.gameMaster1);
        await expect(rankifyInstance.connect(adr.player1.wallet).joinGame(1, s1.signature, s1.hiddenSalt)).to.be.emit(
          rankifyInstance,
          'PlayerJoined',
        );
      });
      it('Game cannot be started until join block time has passed unless game is full', async () => {
        const s1 = await signJoiningGame(hre, rankifyInstance.address, adr.player1.wallet.address, 1, adr.gameMaster1);
        await rankifyInstance.connect(adr.player1.wallet).joinGame(1, s1.signature, s1.hiddenSalt);
        await expect(
          rankifyInstance.connect(adr.player1.wallet).startGame(
            1,
            await generateDeterministicPermutation({
              gameId: 1,
              turn: 0,
              verifierAddress: rankifyInstance.address,
              chainId: await hre.getChainId(),
              gm: adr.gameMaster1.wallet,
              size: await rankifyInstance.getPlayers(1).then(players => players.length),
            }).then(perm => perm.commitment),
          ),
        ).to.be.revertedWith('startGame->Not enough players');
        const s2 = await signJoiningGame(hre, rankifyInstance.address, adr.player2.wallet.address, 1, adr.gameMaster1);
        await rankifyInstance.connect(adr.player2.wallet).joinGame(1, s2.signature, s2.hiddenSalt);
        const s3 = await signJoiningGame(hre, rankifyInstance.address, adr.player3.wallet.address, 1, adr.gameMaster1);
        await rankifyInstance.connect(adr.player3.wallet).joinGame(1, s3.signature, s3.hiddenSalt);
        const s4 = await signJoiningGame(hre, rankifyInstance.address, adr.player4.wallet.address, 1, adr.gameMaster1);
        await rankifyInstance.connect(adr.player4.wallet).joinGame(1, s4.signature, s4.hiddenSalt);
        const s5 = await signJoiningGame(hre, rankifyInstance.address, adr.player5.wallet.address, 1, adr.gameMaster1);
        await rankifyInstance.connect(adr.player5.wallet).joinGame(1, s5.signature, s5.hiddenSalt);
        const s6 = await signJoiningGame(hre, rankifyInstance.address, adr.player6.wallet.address, 1, adr.gameMaster1);
        await rankifyInstance.connect(adr.player6.wallet).joinGame(1, s6.signature, s6.hiddenSalt);
        await expect(
          rankifyInstance.connect(adr.player1.wallet).startGame(
            1,
            await generateDeterministicPermutation({
              gameId: 1,
              turn: 0,
              verifierAddress: rankifyInstance.address,
              chainId: await hre.getChainId(),
              gm: adr.gameMaster1.wallet,
              size: await rankifyInstance.getPlayers(1).then(players => players.length),
            }).then(perm => perm.commitment),
          ),
        ).to.be.emit(rankifyInstance, 'GameStarted');
      });
      it('No more than max players can join', async () => {
        for (let i = 1; i < RInstanceSettings.RInstance_MAX_PLAYERS + 1; i++) {
          let name = `player${i}` as any as keyof AdrSetupResult;
          const s1 = await signJoiningGame(
            hre,
            rankifyInstance.address,
            adr[`${name}`].wallet.address,
            1,
            adr.gameMaster1,
          );
          await rankifyInstance.connect(adr[`${name}`].wallet).joinGame(1, s1.signature, s1.hiddenSalt);
        }
        await env.rankifyToken
          .connect(adr.maliciousActor1.wallet)
          .approve(rankifyInstance.address, eth.constants.MaxUint256);
        const s1 = await signJoiningGame(
          hre,
          rankifyInstance.address,
          adr.maliciousActor1.wallet.address,
          1,
          adr.gameMaster1,
        );
        await expect(
          rankifyInstance.connect(adr.maliciousActor1.wallet).joinGame(1, s1.signature, s1.hiddenSalt),
        ).to.be.revertedWith('addPlayer->party full');
      });
      it('Game methods beside join and start are inactive', async () => {
        const s1 = await signJoiningGame(hre, rankifyInstance.address, adr.player1.wallet.address, 1, adr.gameMaster1);
        await rankifyInstance.connect(adr.player1.wallet).joinGame(1, s1.signature, s1.hiddenSalt);
        proposals = await mockProposals({
          hre: hre,
          players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
          gameId: 1,
          turn: 1,
          verifierAddress: rankifyInstance.address,
          gm: adr.gameMaster1.wallet,
        });

        // const playerCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
        const players = getPlayers(adr, RInstance_MAX_PLAYERS);
        // const turnSalt = await getTestShuffleSalt(1, 1, adr.gameMaster1);
        await expect(
          endWithIntegrity({
            gameId: 1,
            gameContract: rankifyInstance,
            players,
            proposals,
            votes: players.map(() => players.map(() => 0)),
            gm: adr.gameMaster1,
          }),
        ).to.be.revertedWith('Game has not yet started');
        const votes = await mockValidVotes(players, rankifyInstance, 1, adr.gameMaster1, false);
        await expect(
          rankifyInstance
            .connect(adr.gameMaster1.wallet)
            .submitVote(
              1,
              votes[0].ballotId,
              adr.player1.wallet.address,
              votes[0].gmSignature,
              votes[0].voterSignature,
              votes[0].ballotHash,
            ),
        ).to.be.revertedWith('Game has not yet started');
        await expect(rankifyInstance.connect(adr.gameCreator1.wallet).openRegistration(1)).to.be.revertedWith(
          'Cannot do when registration is open',
        );
        await expect(
          rankifyInstance.connect(adr.gameCreator1.wallet).setJoinRequirements(1, requirement),
        ).to.be.revertedWith('Cannot do when registration is open');

        await expect(
          endWithIntegrity({
            gameId: 1,
            gameContract: rankifyInstance,
            players,
            proposals,
            votes: players.map(() => players.map(() => 0)),
            gm: adr.gameMaster1,
          }),
        ).to.be.revertedWith('Game has not yet started');
      });
      it('Cannot be started if not enough players', async () => {
        await mineBlocks(RInstanceSettings.RInstance_TIME_TO_JOIN + 1, hre);
        await expect(
          rankifyInstance.connect(adr.gameMaster1.wallet).startGame(
            1,
            await generateDeterministicPermutation({
              gameId: 1,
              turn: 0,
              verifierAddress: rankifyInstance.address,
              chainId: await hre.getChainId(),
              gm: adr.gameMaster1.wallet,
              size: await rankifyInstance.getPlayers(1).then(players => players.length),
            }).then(perm => perm.commitment),
          ),
        ).to.be.revertedWith('startGame->Not enough players');
      });
      describe('When there is minimal number and below maximum players in game', () => {
        beforeEach(async () => {
          await filledPartyTest();
        });
        it('Can start game after joining period is over', async () => {
          await expect(
            rankifyInstance.connect(adr.gameMaster1.wallet).startGame(
              1,
              await generateDeterministicPermutation({
                gameId: 1,
                turn: 0,
                verifierAddress: rankifyInstance.address,
                chainId: await hre.getChainId(),
                gm: adr.gameMaster1.wallet,
                size: await rankifyInstance.getPlayers(1).then(players => players.length),
              }).then(perm => perm.commitment),
            ),
          ).to.be.revertedWith('startGame->Not enough players');
          const currentT = await time.latest();
          await time.setNextBlockTimestamp(currentT + Number(RInstanceSettings.RInstance_TIME_TO_JOIN) + 1);
          await mineBlocks(1, hre);
          await expect(
            rankifyInstance.connect(adr.gameMaster1.wallet).startGame(
              1,
              await generateDeterministicPermutation({
                gameId: 1,
                turn: 0,
                verifierAddress: rankifyInstance.address,
                chainId: await hre.getChainId(),
                gm: adr.gameMaster1.wallet,
                size: await rankifyInstance.getPlayers(1).then(players => players.length),
              }).then(perm => perm.commitment),
            ),
          ).to.be.emit(rankifyInstance, 'GameStarted');
        });
        it('Game methods beside start are inactive', async () => {
          //TODO: add more methods here
          proposals = await mockProposals({
            hre: hre,
            players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
            gameId: 1,
            turn: 1,
            verifierAddress: rankifyInstance.address,
            gm: adr.gameMaster1.wallet,
          });
          await expect(
            rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(proposals[0].params),
          ).to.be.revertedWith('Game has not yet started');
          votes = await mockVotes({
            hre: hre,
            gameId: 1,
            turn: 1,
            verifierAddress: rankifyInstance.address,
            players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
            gm: adr.gameMaster1.wallet,
            distribution: 'semiUniform',
          });
          votersAddresses = getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS).map(
            player => player.wallet.address,
          );
          // const turnSalt = await getTestShuffleSalt(1, 1, adr.gameMaster1);
          const integrity = await getProposalsIntegrity({
            hre: hre,
            players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
            gameId: 1,
            turn: 1,
            verifierAddress: rankifyInstance.address,
            gm: adr.gameMaster1.wallet,
          });
          await expect(
            endWithIntegrity({
              gameId: 1,
              gameContract: rankifyInstance,
              players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
              proposals,
              votes: votes.map(vote => vote.vote),
              gm: adr.gameMaster1,
            }),
          ).to.be.revertedWith('Game has not yet started');
          await expect(
            rankifyInstance
              .connect(adr.gameMaster1.wallet)
              .submitVote(
                1,
                votes[0].ballotId,
                adr.player1.wallet.address,
                votes[0].gmSignature,
                votes[0].voterSignature,
                votes[0].ballotHash,
              ),
          ).to.be.revertedWith('Game has not yet started');
        });
        describe('When game has started', () => {
          beforeEach(async () => {
            await startedGameTest();
          });
          it('Can finish turn early if previous turn participant did not made a move', async () => {
            const playersCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
            const players = getPlayers(adr, playersCnt);
            proposals = await mockValidProposals({
              players,
              gameContract: rankifyInstance,
              gameMaster: adr.gameMaster1,
              gameId: 1,
              submitNow: true,
              idlers: [0],
            });

            await time.increase(Number(RInstanceSettings.RInstance_TIME_PER_TURN) + 1);
            votes = [];

            await endWithIntegrity({
              gameId: 1,
              gameContract: rankifyInstance,
              players,
              proposals,
              votes: votes.map(vote => vote.ballot.vote),
              gm: adr.gameMaster1,
              idlers: [0],
            });

            const newProposals = await mockValidProposals({
              players,
              gameContract: rankifyInstance,
              gameMaster: adr.gameMaster1,
              gameId: 1,
              submitNow: true,
              idlers: [0],
            });

            votes = await mockValidVotes(players, rankifyInstance, 1, adr.gameMaster1, false);

            for (let i = 0; i < votes.length; i++) {
              if (i !== 0) {
                await rankifyInstance
                  .connect(adr.gameMaster1.wallet)
                  .submitVote(
                    1,
                    votes[i].ballotId,
                    players[i].wallet.address,
                    votes[i].gmSignature,
                    votes[i].voterSignature,
                    votes[i].ballotHash,
                  );
              }
            }

            await time.increase(Number(RInstanceSettings.RInstance_TIME_PER_TURN) + 1);
            await expect(
              endWithIntegrity({
                gameId: 1,
                gameContract: rankifyInstance,
                players,
                proposals: newProposals,
                votes: votes.map(vote => vote.ballot.vote),
                gm: adr.gameMaster1,
                idlers: [0],
              }),
            ).to.emit(rankifyInstance, 'TurnEnded');
            votes = await mockValidVotes(players, rankifyInstance, 1, adr.gameMaster1, true);
            expect(await rankifyInstance.isActive(1, proposals[0].params.proposer)).to.be.false;
            const newestProposals = await mockValidProposals({
              players,
              gameContract: rankifyInstance,
              gameMaster: adr.gameMaster1,
              gameId: 1,
              submitNow: true,
              idlers: [1],
            });
            expect(await rankifyInstance.isActive(1, proposals[0].params.proposer)).to.be.true;
            await expect(
              endWithIntegrity({
                gameId: 1,
                gameContract: rankifyInstance,
                players,
                proposals: newestProposals,
                votes: votes.map(vote => vote.ballot.vote),
                gm: adr.gameMaster1,
                idlers: [1],
              }),
            ).to.be.revertedWith('nextTurn->CanEndEarly');
          });
          it('First turn has started', async () => {
            expect(await rankifyInstance.connect(adr.player1.wallet).getTurn(1)).to.be.equal(1);
          });
          it('Cannot end game before minimum game time', async () => {
            const playerCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
            const players = getPlayers(adr, playerCnt);
            await runToLastTurn(1, rankifyInstance, adr.gameMaster1, players);
            await mockValidVotes(players, rankifyInstance, 1, adr.gameMaster1, true, 'ftw');
            const canEnd = await rankifyInstance.canEndTurn(1);
            expect(canEnd).to.be.equal(false);
            await mockValidProposals({
              players,
              gameContract: rankifyInstance,
              gameMaster: adr.gameMaster1,
              gameId: 1,
              submitNow: true,
            });

            await expect(endTurn(1, rankifyInstance)).to.be.revertedWith(
              'Game duration less than minimum required time',
            );
            await time.setNextBlockTimestamp((await time.latest()) + RInstanceSettings.RInstance_MIN_GAME_TIME - 100);
            await expect(endTurn(1, rankifyInstance)).to.be.revertedWith(
              'Game duration less than minimum required time',
            );
            await time.increase(await rankifyInstance.getGameState(1).then(state => state.minGameTime));
            await expect(endTurn(1, rankifyInstance)).to.not.be.reverted;
          });
          it('Accepts only proposals and no votes', async () => {
            const proposals = await mockProposals({
              hre: hre,
              players: getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
              gameId: 1,
              turn: 1,
              verifierAddress: rankifyInstance.address,
              gm: adr.gameMaster1.wallet,
            });
            await expect(
              rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(proposals[0].params),
            ).to.be.emit(rankifyInstance, 'ProposalSubmitted');
            votes = await mockVotes({
              hre: hre,
              gameId: 1,
              turn: 1,
              verifierAddress: rankifyInstance.address,
              players: getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
              gm: adr.gameMaster1.wallet,
              distribution: 'semiUniform',
            });
            votersAddresses = getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS).map(
              player => player.wallet.address,
            );

            await expect(
              rankifyInstance
                .connect(adr.gameMaster1.wallet)
                .submitVote(
                  1,
                  votes[0].ballotId,
                  votersAddresses[0],
                  votes[0].gmSignature,
                  votes[0].voterSignature,
                  votes[0].ballotHash,
                ),
            ).to.be.revertedWith('No proposals exist at turn 1: cannot vote');
          });
          it('Can end turn if timeout reached with zero scores', async () => {
            const playerCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
            proposals = await mockValidProposals({
              players: getPlayers(adr, playerCnt),
              gameContract: rankifyInstance,
              gameMaster: adr.gameMaster1,
              gameId: 1,
              submitNow: true,
            });
            await time.increase(RInstanceSettings.RInstance_TIME_PER_TURN + 1);
            await expect(
              endWithIntegrity({
                gameId: 1,
                gameContract: rankifyInstance,
                players: getPlayers(adr, playerCnt),
                proposals,
                votes: await mockValidVotes(
                  getPlayers(adr, playerCnt),
                  rankifyInstance,
                  1,
                  adr.gameMaster1,
                  false,
                  'ftw',
                ).then(votes => votes.map(vote => vote.vote.map(v => 0))),
                gm: adr.gameMaster1,
              }),
            )
              .to.be.emit(rankifyInstance, 'TurnEnded')
              .withArgs(
                1,
                1,
                getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS).map(identity => identity.wallet.address),
                getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS).map(() => '0'),
                [],
                [],
                [],
              );
          });
          describe('When all proposals received', () => {
            beforeEach(async () => {
              await proposalsReceivedTest();
            });
            it('Can end turn', async () => {
              const playersCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
              await expect(
                endWithIntegrity({
                  gameId: 1,
                  gameContract: rankifyInstance,
                  players: getPlayers(adr, playersCnt),
                  proposals,
                  votes: [],
                  gm: adr.gameMaster1,
                }),
              ).to.be.emit(rankifyInstance, 'TurnEnded');
            });
            describe('When turn is over and there is one proposal missing', async () => {
              beforeEach(async () => {
                await proposalsMissingTest();
              });
              it('Can end next turn ', async () => {
                // ToDo: add "with correct scores" to the end of the test
                const playersCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
                const players = getPlayers(adr, playersCnt);
                const turn = await rankifyInstance.getTurn(1);
                // const turnSalt = await getTestShuffleSalt(1, turn, adr.gameMaster1);
                const integrity = await getProposalsIntegrity({
                  hre: hre,
                  players,
                  gameId: 1,
                  turn: turn,
                  verifierAddress: rankifyInstance.address,
                  gm: adr.gameMaster1.wallet,
                  proposalSubmissionData: await mockValidProposals({
                    players,
                    gameContract: rankifyInstance,
                    gameMaster: adr.gameMaster1,
                    gameId: 1,
                    submitNow: true,
                    idlers: [0],
                  }),
                  idlers: [0],
                });
                await time.increase(Number(RInstanceSettings.RInstance_TIME_PER_TURN) + 1);
                await expect(
                  rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
                    1,
                    votes.map(v => v.vote),
                    integrity.newProposals,
                    integrity.permutation,
                    integrity.nullifier,
                  ),
                ).to.be.emit(rankifyInstance, 'TurnEnded');
              });
            });
            describe('When first turn was made', () => {
              beforeEach(async () => {
                await firstTurnMadeTest();
              });

              it('throws if player votes twice', async () => {
                await mockValidVotes(
                  getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
                  rankifyInstance,
                  1,
                  adr.gameMaster1,
                  true,
                );
                await mockValidProposals({
                  players: getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
                  gameContract: rankifyInstance,
                  gameMaster: adr.gameMaster1,
                  gameId: 1,
                  submitNow: true,
                });

                await expect(
                  rankifyInstance
                    .connect(adr.gameMaster1.wallet)
                    .submitVote(
                      1,
                      votes[0].ballotId,
                      adr.player1.wallet.address,
                      votes[0].gmSignature,
                      votes[0].voterSignature,
                      votes[0].ballotHash,
                    ),
                ).to.be.revertedWith('Already voted');
              });
              it('shows no players made a turn', async () => {
                expect(await rankifyInstance.getPlayersMoved(1)).to.deep.equal([
                  getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS).map(() => false),
                  eth.BigNumber.from('0'),
                ]);
              });
              it('shows no players made a turn even after player send proposal', async () => {
                const proposals = await mockValidProposals({
                  players: getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
                  gameContract: rankifyInstance,
                  gameMaster: adr.gameMaster1,
                  gameId: 1,
                  submitNow: false,
                });
                await rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(proposals[0].params);
                await rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(proposals[1].params);
                expect(await rankifyInstance.getPlayersMoved(1)).to.deep.equal([
                  getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS).map(() => false),
                  eth.BigNumber.from('0'),
                ]);
              });
              describe('When all players voted', () => {
                beforeEach(async () => {
                  const result = await allPlayersVotedTest();
                  votes = result.votes;
                });
                it('cannot end turn because players still have time to propose', async () => {
                  const playersCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
                  const players = getPlayers(adr, playersCnt);
                  await expect(
                    endWithIntegrity({
                      gameId: 1,
                      gameContract: rankifyInstance,
                      players,
                      proposals: await mockValidProposals({
                        players,
                        gameContract: rankifyInstance,
                        gameMaster: adr.gameMaster1,
                        gameId: 1,
                        submitNow: false,
                        idlers: players.map((_, i) => i),
                      }),
                      votes: votes.map(vote => vote.vote),
                      gm: adr.gameMaster1,
                      idlers: players.map((_, i) => i),
                    }),
                  ).to.be.revertedWith('nextTurn->CanEndEarly');
                });
                it('Can end turn if timeout reached', async () => {
                  const currentT = await time.latest();

                  const playersCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
                  const players = getPlayers(adr, playersCnt);
                  const expectedScores: number[] = players.map(v => 0);

                  const turn = await rankifyInstance.getTurn(1);
                  // const turnSalt = await getTestShuffleSalt(1, turn, adr.gameMaster1);

                  const integrity = await getProposalsIntegrity({
                    hre: hre,
                    players,
                    gameId: 1,
                    turn,
                    verifierAddress: rankifyInstance.address,
                    gm: adr.gameMaster1.wallet,
                    proposalSubmissionData: await mockValidProposals({
                      players,
                      gameContract: rankifyInstance,
                      gameMaster: adr.gameMaster1,
                      gameId: 1,
                      submitNow: true,
                      idlers: players.map((_, i) => i),
                    }),
                    idlers: players.map((_, i) => i),
                  });
                  for (let participant = 0; participant < players.length; participant++) {
                    if (votes.length > participant) {
                      for (let candidate = 0; candidate < players.length; candidate++) {
                        expectedScores[candidate] += Number(
                          votes[participant].vote[Number(integrity.permutation[candidate])],
                        );
                      }
                    } else {
                      //somebody did not vote at all
                    }
                  }
                  await time.setNextBlockTimestamp(currentT + Number(RInstanceSettings.RInstance_TIME_PER_TURN) + 1);
                  expect(await rankifyInstance.getTurn(1)).to.be.equal(2);
                  await expect(
                    await rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
                      1,
                      votes.map(vote => vote.vote),
                      integrity.newProposals,
                      integrity.permutation,
                      integrity.nullifier,
                    ),
                  ).to.be.emit(rankifyInstance, 'TurnEnded');
                });
                it('Rejects attempts to shuffle votes due to ballot integrity check', async () => {
                  const playerCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
                  const currentT = await time.latest();
                  await time.setNextBlockTimestamp(currentT + Number(RInstanceSettings.RInstance_TIME_PER_TURN) + 1);
                  expect(await rankifyInstance.getTurn(1)).to.be.equal(2);
                  const players = getPlayers(adr, playerCnt);
                  const expectedScores: number[] = players.map(v => 0);
                  for (let i = 0; i < players.length; i++) {
                    if (votes.length > i) {
                      votes[i].vote.forEach((vote, idx) => {
                        expectedScores[idx] += Number(vote);
                      });
                    } else {
                      //somebody did not vote at all
                    }
                  }
                  const shuffle = <T>(array: T[]): T[] => {
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
                  };
                  const proposerIndex = shuffle(votersAddresses.map((p, idx) => idx));
                  const votesShuffled: BigNumberish[][] = [];
                  votes.forEach(({ vote }, i) => {
                    votesShuffled.push(Array(votersAddresses.length).fill(0));
                    vote.forEach((points, votedForIdx) => {
                      votesShuffled[i][proposerIndex[votedForIdx]] = points;
                    });
                  });

                  await expect(
                    endWithIntegrity({
                      gameId: 1,
                      gameContract: rankifyInstance,
                      players,
                      proposals,
                      votes: votesShuffled,
                      gm: adr.gameMaster1,
                    }),
                  ).to.be.revertedWithCustomError(rankifyInstance, 'ballotIntegrityCheckFailed');
                });
                it('Emits correct ProposalScore event values', async () => {
                  const currentT = await time.latest();
                  //   await time.setNextBlockTimestamp(currentT + Number(RInstanceSettings.RInstance_TIME_PER_TURN) + 1);
                  expect(await rankifyInstance.getTurn(1)).to.be.equal(2);
                  const playerCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
                  const players = getPlayers(adr, playerCnt);

                  const turn = await rankifyInstance.getTurn(1);
                  // const turnSalt = await getTestShuffleSalt(1, turn, adr.gameMaster1);
                  const mockProposals = await mockValidProposals({
                    players: players,
                    gameContract: rankifyInstance,
                    gameMaster: adr.gameMaster1,
                    gameId: 1,
                    submitNow: true,
                    // idlers: players.map((_, i) => i),
                  });
                  const integrity = await getProposalsIntegrity({
                    hre: hre,
                    players: players,
                    gameId: 1,
                    turn,
                    verifierAddress: rankifyInstance.address,
                    gm: adr.gameMaster1.wallet,
                    proposalSubmissionData: mockProposals,
                    // idlers: players.map((_, i) => i),
                  });

                  const sortedVotes: BigNumberish[][] = [];
                  for (let i = 0; i < players.length; i++) {
                    sortedVotes.push(Array(players.length).fill(0));
                    for (let j = 0; j < players.length; j++) {
                      sortedVotes[i][Number(integrity.permutation[j])] = votes[i].vote[j];
                    }
                  }
                  //   console.log(sortedVotes);

                  const expectedScores: number[] = players.map(v => 0);
                  for (let participant = 0; participant < players.length; participant++) {
                    if (votes.length > participant) {
                      for (let candidate = 0; candidate < players.length; candidate++) {
                        expectedScores[candidate] += Number(sortedVotes[participant][candidate]);
                      }
                    } else {
                      //somebody did not vote at all
                    }
                  }
                  await rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
                    1,
                    votes.map(vote => vote.vote),
                    integrity.newProposals,
                    integrity.permutation,
                    integrity.nullifier,
                  );
                  const turnEndedEvts = await rankifyInstance.queryFilter(rankifyInstance.filters.TurnEnded(1, turn));

                  expect(turnEndedEvts[0].args.scores.map(s => s.toString())).to.deep.equal(
                    expectedScores.map(s => s.toString()),
                  );

                  const evts = (await rankifyInstance.queryFilter(rankifyInstance.filters.ProposalScore(1, turn))).map(
                    e => e.args,
                  );
                  const { proposalsNotPermuted: prevProposalsNotPermuted } = await getProposalsIntegrity({
                    hre: hre,
                    players: players,
                    gameId: 1,
                    turn: Number(turn) - 1,
                    verifierAddress: rankifyInstance.address,
                    gm: adr.gameMaster1.wallet,
                    proposalSubmissionData: await mockValidProposals({
                      players,
                      gameContract: rankifyInstance,
                      gameMaster: adr.gameMaster1,
                      gameId: 1,
                      submitNow: false,
                      turn: Number(turn) - 1,
                      // idlers: players.map((_, i) => i),
                    }),
                    // idlers: players.map((_, i) => i),
                  });

                  //   expect(evts[0].proposal).to.be.equal(prevProposals[0].proposal);
                  const firstPlayerProposal = prevProposalsNotPermuted[0];
                  const evt = evts.find(p => p.proposal == firstPlayerProposal);
                  expect(evt).to.not.be.undefined;
                  expect(evt && evt.score.toString()).to.be.equal(expectedScores[0].toString());
                });
              });
            });
          });
        });
        describe('When another game  of first rank is created', () => {
          beforeEach(async () => {
            await createGame(
              RInstanceSettings.RInstance_MIN_GAME_TIME,
              rankifyInstance,
              adr.gameCreator1,
              adr.gameMaster2.wallet.address,
              1,
              true,
            );
          });
          it('Reverts if players from another game tries to join', async () => {
            const s1 = await signJoiningGame(
              hre,
              rankifyInstance.address,
              adr.player1.wallet.address,
              2,
              adr.gameMaster1,
            );
            await expect(
              rankifyInstance.connect(adr.player1.wallet).joinGame(2, s1.signature, s1.hiddenSalt),
            ).to.be.revertedWith('addPlayer->Player in game');
          });
        });
      });
      describe('When there is not enough players and join time is out', () => {
        beforeEach(async () => {
          await notEnoughPlayersTest();
        });
        it('It throws on game start', async () => {
          await expect(
            rankifyInstance.connect(adr.gameCreator1.wallet).startGame(
              1,
              await generateDeterministicPermutation({
                gameId: 1,
                turn: 0,
                verifierAddress: rankifyInstance.address,
                chainId: await hre.getChainId(),
                gm: adr.gameMaster1.wallet,
                size: 15,
              }).then(perm => perm.commitment),
            ),
          ).to.be.revertedWith('startGame->Not enough players');
        });
        it('Allows creator can close the game', async () => {
          await expect(rankifyInstance.connect(adr.gameCreator1.wallet).cancelGame(1)).to.emit(
            rankifyInstance,
            'GameClosed',
          );
        });
        it('Allows player to leave the game', async () => {
          await expect(rankifyInstance.connect(adr.player1.wallet).leaveGame(1)).to.emit(rankifyInstance, 'PlayerLeft');
        });
      });
    });
    describe('When it is last turn and equal scores', () => {
      beforeEach(async () => {
        await lastTurnEqualScoresTest();
      });
      it('Next turn without winner brings Game is in overtime conditions', async () => {
        const playerCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
        let isGameOver = await rankifyInstance.isGameOver(1);
        expect(isGameOver).to.be.false;
        await mockValidProposals({
          players: getPlayers(adr, playerCnt),
          gameContract: rankifyInstance,
          gameMaster: adr.gameMaster1,
          gameId: 1,
          submitNow: true,
        });
        const votes = await mockValidVotes(
          getPlayers(adr, playerCnt),
          rankifyInstance,
          1,
          adr.gameMaster1,
          true,
          'equal',
        );

        // const turnSalt = await getTestShuffleSalt(1, await rankifyInstance.getTurn(1), adr.gameMaster1);
        await endWithIntegrity({
          gameId: 1,
          gameContract: rankifyInstance,
          players: getPlayers(adr, playerCnt),
          votes: votes.map(vote => vote.vote),
          gm: adr.gameMaster1,
        });

        expect(await rankifyInstance.isOvertime(1)).to.be.true;
      });
      describe('when is overtime', () => {
        beforeEach(async () => {
          await inOvertimeTest();
          const isOvertime = await rankifyInstance.isOvertime(1);
          assert(isOvertime, 'game is not overtime');
        });
        it('emits game Over when submitted votes result unique leaders', async () => {
          const playerCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
          votes = await mockValidVotes(getPlayers(adr, playerCnt), rankifyInstance, 1, adr.gameMaster1, true, 'ftw');
          const proposals = await mockValidProposals({
            players: getPlayers(adr, playerCnt),
            gameContract: rankifyInstance,
            gameMaster: adr.gameMaster1,
            gameId: 1,
            submitNow: true,
          });
          const timeToEnd = await rankifyInstance.getGameState(1).then(state => state.minGameTime);
          await time.increase(timeToEnd.toNumber() + 1);
          // const turnSalt = await getTestShuffleSalt(1, await rankifyInstance.getTurn(1), adr.gameMaster1);
          expect(
            await endWithIntegrity({
              gameId: 1,
              gameContract: rankifyInstance,
              players: getPlayers(adr, playerCnt),
              votes: votes.map(vote => vote.vote),
              gm: adr.gameMaster1,
              proposals,
            }),
          ).to.emit(rankifyInstance, 'GameOver');
        });
        it("Keeps game in overtime when submitted votes don't result unique leaders", async () => {
          const playerCnt = await rankifyInstance.getPlayers(1).then(players => players.length);
          await mockValidVotes(getPlayers(adr, playerCnt), rankifyInstance, 1, adr.gameMaster1, true, 'equal');
          const proposals = await mockValidProposals({
            players: getPlayers(adr, playerCnt),
            gameContract: rankifyInstance,
            gameMaster: adr.gameMaster1,
            gameId: 1,
            submitNow: true,
          });
          expect(await rankifyInstance.connect(adr.gameMaster1.wallet).isOvertime(1)).to.be.true;
          expect(await rankifyInstance.connect(adr.gameMaster1.wallet).isGameOver(1)).to.be.false;
        });
      });

      describe('When game is over', () => {
        beforeEach(async () => {
          await gameOverTest();
        });
        it('Throws on attempt to make another turn', async () => {
          const currentTurn = await rankifyInstance.getTurn(1);
          votes = await mockVotes({
            hre: hre,
            gameId: 1,
            turn: currentTurn,
            verifierAddress: rankifyInstance.address,
            players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
            gm: adr.gameMaster1.wallet,
            distribution: 'ftw',
          });
          proposals = await mockProposals({
            hre: hre,
            players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
            gameId: 1,
            turn: currentTurn,
            verifierAddress: rankifyInstance.address,
            gm: adr.gameMaster1.wallet,
          });

          for (let i = 0; i < RInstanceSettings.RInstance_MAX_PLAYERS; i++) {
            await expect(
              rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(proposals[i].params),
            ).to.be.revertedWith('Game over');

            await expect(
              rankifyInstance
                .connect(adr.gameMaster1.wallet)
                .submitVote(
                  1,
                  votes[i].ballotId,
                  getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS)[i].wallet.address,
                  votes[i].gmSignature,
                  votes[i].voterSignature,
                  votes[i].ballotHash,
                ),
            ).to.be.revertedWith('Game over');
          }
          // const turnSalt = await getTestShuffleSalt(1, await rankifyInstance.getTurn(1), adr.gameMaster1);
          const integrity = await getProposalsIntegrity({
            hre: hre,
            players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
            gameId: 1,
            turn: await rankifyInstance.getTurn(1),
            verifierAddress: rankifyInstance.address,
            gm: adr.gameMaster1.wallet,
            proposalSubmissionData: proposals,
          });
          await expect(
            rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
              1,
              votes.map(vote => vote.vote),
              integrity.newProposals,
              integrity.permutation,
              integrity.nullifier,
            ),
          ).to.be.revertedWith('Game over');
        });
        it('Gave rewards to winner', async () => {
          const gameWinner = await rankifyInstance.gameWinner(1);
          for (let i = 0; i < RInstanceSettings.RInstance_MAX_PLAYERS; i++) {
            const player = getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS)[i];
            if (player.wallet.address == gameWinner) {
              expect(await rankToken.balanceOf(player.wallet.address, 2)).to.be.equal(1);
            } else {
              expect(await rankToken.balanceOf(player.wallet.address, 2)).to.be.equal(0);
            }
          }
        });
        it('Allows winner to create game of next rank', async () => {
          const params: IRankifyInstance.NewGameParamsInputStruct = {
            gameMaster: adr.gameMaster1.wallet.address,
            gameRank: 2,
            maxPlayerCnt: RInstanceSettings.RInstance_MAX_PLAYERS,
            minPlayerCnt: RInstanceSettings.RInstance_MIN_PLAYERS,
            timeToJoin: RInstanceSettings.RInstance_TIME_TO_JOIN,
            minGameTime: RInstanceSettings.RInstance_MIN_GAME_TIME,
            voteCredits: RInstanceSettings.RInstance_VOTE_CREDITS,
            nTurns: RInstanceSettings.RInstance_MAX_TURNS,
            timePerTurn: RInstanceSettings.RInstance_TIME_PER_TURN,
          };
          await expect(rankifyInstance.connect(adr.player1.wallet).createGame(params)).to.emit(
            rankifyInstance,
            'gameCreated',
          );
        });

        it('should allow burning rank tokens for derived tokens', async () => {
          const rankId = 2;
          const amount = 1;
          const player = adr.player1;

          // Get initial balances
          const initialRankBalance = await rankToken.balanceOf(player.wallet.address, rankId);
          const initialDerivedBalance = await govtToken.balanceOf(player.wallet.address);

          // Calculate expected derived tokens
          const commonParams = await rankifyInstance.getCommonParams();
          const expectedDerivedTokens: BigNumber = commonParams.principalCost
            .mul(commonParams.minimumParticipantsInCircle.pow(rankId))
            .mul(amount);

          // Exit rank token
          await rankifyInstance.connect(player.wallet).exitRankToken(rankId, amount);

          // Check balances after exit
          const finalRankBalance = await rankToken.balanceOf(player.wallet.address, rankId);
          const finalDerivedBalance = await govtToken.balanceOf(player.wallet.address);
          expect(finalRankBalance).to.equal(initialRankBalance.sub(amount));
          expect(finalDerivedBalance).to.equal(initialDerivedBalance.add(expectedDerivedTokens));
        });

        it('should revert when trying to burn more tokens than owned', async () => {
          const rankId = 2;
          const player = adr.player1;
          const balance = await rankToken.balanceOf(player.wallet.address, rankId);
          await expect(
            rankifyInstance.connect(player.wallet).exitRankToken(rankId, balance.add(1)),
          ).to.be.revertedWithCustomError(rankToken, 'insufficient');
        });
        it('should not revert when trying to burn equal tokens owned', async () => {
          const rankId = 2;
          const player = adr.player1;
          const balance = await rankToken.balanceOf(player.wallet.address, rankId);
          await expect(
            rankifyInstance.connect(player.wallet).exitRankToken(rankId, balance),
          ).to.not.be.revertedWithCustomError(rankToken, 'insufficient');
          const newBalance = await rankToken.balanceOf(player.wallet.address, rankId);
          expect(newBalance).to.equal(0);
          await expect(rankifyInstance.connect(player.wallet).exitRankToken(rankId, 1)).to.be.revertedWithCustomError(
            rankToken,
            'insufficient',
          );
        });

        it('should emit RankTokenExited event', async () => {
          const rankId = 2;
          const amount = 1;
          const player = adr.player1;

          const commonParams = await rankifyInstance.getCommonParams();
          const expectedDerivedTokens: BigNumber = commonParams.principalCost
            .mul(commonParams.minimumParticipantsInCircle.pow(rankId))
            .mul(amount);

          await expect(rankifyInstance.connect(player.wallet).exitRankToken(rankId, amount))
            .to.emit(rankifyInstance, 'RankTokenExited')
            .withArgs(player.wallet.address, rankId, amount, expectedDerivedTokens);
        });

        describe('When game of next rank is created and opened', () => {
          beforeEach(async () => {
            const params: IRankifyInstance.NewGameParamsInputStruct = {
              gameMaster: adr.gameMaster1.wallet.address,
              gameRank: 2,
              maxPlayerCnt: RInstanceSettings.RInstance_MAX_PLAYERS,
              minPlayerCnt: RInstanceSettings.RInstance_MIN_PLAYERS,
              timeToJoin: RInstanceSettings.RInstance_TIME_TO_JOIN,
              minGameTime: RInstanceSettings.RInstance_MIN_GAME_TIME,
              voteCredits: RInstanceSettings.RInstance_VOTE_CREDITS,
              nTurns: RInstanceSettings.RInstance_MAX_TURNS,
              timePerTurn: RInstanceSettings.RInstance_TIME_PER_TURN,
            };
            await rankifyInstance.connect(adr.player1.wallet).createGame(params);
            await rankifyInstance.connect(adr.player1.wallet).openRegistration(2);
          });
          it('Can be joined only by rank token bearers', async () => {
            expect(await rankToken.balanceOf(adr.player1.wallet.address, 2)).to.be.equal(1);
            await rankToken.connect(adr.player1.wallet).setApprovalForAll(rankifyInstance.address, true);
            await rankToken.connect(adr.player2.wallet).setApprovalForAll(rankifyInstance.address, true);
            const s1 = await signJoiningGame(
              hre,
              rankifyInstance.address,
              adr.player1.wallet.address,
              2,
              adr.gameMaster1,
            );
            const s2 = await signJoiningGame(
              hre,
              rankifyInstance.address,
              adr.player2.wallet.address,
              2,
              adr.gameMaster1,
            );
            await expect(rankifyInstance.connect(adr.player1.wallet).joinGame(2, s1.signature, s1.hiddenSalt))
              .to.emit(rankifyInstance, 'PlayerJoined')
              .withArgs(2, adr.player1.wallet.address, s1.hiddenSalt);
            await expect(
              rankifyInstance.connect(adr.player2.wallet).joinGame(2, s2.signature, s2.hiddenSalt),
            ).to.be.revertedWithCustomError(rankToken, 'insufficient');
          });
        });
      });
    });
    describe('When a game was played till end', () => {
      beforeEach(async () => {
        const state = await rankifyInstance.getContractState();
        await rankifyInstance.connect(adr.gameCreator1.wallet).openRegistration(state.numGames);
        await fillParty(
          getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
          rankifyInstance,
          state.numGames,
          true,
          adr.gameMaster1,
          true,
        );
        await runToTheEnd(
          state.numGames,
          rankifyInstance,
          adr.gameMaster1,
          getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
        );
      });
      it('Allows players to join another game of same rank if they have rank token', async () => {
        const params: IRankifyInstance.NewGameParamsInputStruct = {
          gameMaster: adr.gameMaster1.wallet.address,
          gameRank: 2,
          maxPlayerCnt: RInstanceSettings.RInstance_MAX_PLAYERS,
          minPlayerCnt: RInstanceSettings.RInstance_MIN_PLAYERS,
          timeToJoin: RInstanceSettings.RInstance_TIME_TO_JOIN,
          minGameTime: RInstanceSettings.RInstance_MIN_GAME_TIME,
          voteCredits: RInstanceSettings.RInstance_VOTE_CREDITS,
          nTurns: RInstanceSettings.RInstance_MAX_TURNS,
          timePerTurn: RInstanceSettings.RInstance_TIME_PER_TURN,
        };
        const players = getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS);
        const winner = await rankifyInstance['gameWinner(uint256)'](1);
        const winnerPlayer = players.find(p => p.wallet.address == winner);
        if (!winnerPlayer) {
          throw new Error('Winner player not found');
        }
        await rankifyInstance.connect(winnerPlayer.wallet).createGame(params);
        const state = await rankifyInstance.getContractState();
        await rankifyInstance.connect(winnerPlayer.wallet).openRegistration(state.numGames);
        const s1 = await signJoiningGame(
          hre,
          rankifyInstance.address,
          winnerPlayer.wallet.address,
          state.numGames,
          adr.gameMaster1,
        );
        await rankifyInstance.connect(winnerPlayer.wallet).joinGame(state.numGames, s1.signature, s1.hiddenSalt);
        const currentT = await time.latest();
        await time.setNextBlockTimestamp(currentT + Number(RInstanceSettings.RInstance_TIME_TO_JOIN) + 1);
        const loser = players.find(p => p.wallet.address != winnerPlayer.wallet.address);
        if (!loser) {
          throw new Error('Loser player not found');
        }
        await rankToken.connect(loser.wallet).setApprovalForAll(rankifyInstance.address, true);

        const s2 = await signJoiningGame(
          hre,
          rankifyInstance.address,
          loser.wallet.address,
          state.numGames,
          adr.gameMaster1,
        );
        await expect(
          rankifyInstance.connect(loser.wallet).joinGame(state.numGames, s2.signature, s2.hiddenSalt),
        ).to.be.revertedWithCustomError(rankToken, 'insufficient');
      });
    });
  });
  describe('When there was multiple first rank games played so higher rank game can be filled', () => {
    beforeEach(async () => {
      await multipleFirstRankGamesTest();
    });
    it('Winners have reward tokens', async () => {
      const balances: number[] = [];
      balances[0] = await rankToken
        .balanceOf(adr.player1.wallet.address, 2)
        .then(balance => balances.push(balance.toNumber()));
      expect(await rankToken.balanceOf(adr.player1.wallet.address, 2)).to.be.equal(1);
      expect(await rankToken.balanceOf(adr.player3.wallet.address, 2)).to.be.equal(1);
      expect(await rankToken.balanceOf(adr.player2.wallet.address, 2)).to.be.equal(1);
      expect(await rankToken.balanceOf(adr.player4.wallet.address, 2)).to.be.equal(1);
      expect(await rankToken.balanceOf(adr.player5.wallet.address, 2)).to.be.equal(1);
      expect(await rankToken.balanceOf(adr.player6.wallet.address, 2)).to.be.equal(1);
      expect(await rankToken.balanceOf(adr.player7.wallet.address, 2)).to.be.equal(0);
      assert(RInstanceSettings.RInstance_MAX_PLAYERS == 6);
    });
    describe('When game of next rank is created', () => {
      beforeEach(async () => {
        await nextRankTest();
      });
      it('Can be joined only by bearers of rank token', async () => {
        const lastCreatedGameId = await rankifyInstance.getContractState().then(r => r.numGames);
        await rankToken.connect(adr.player1.wallet).setApprovalForAll(rankifyInstance.address, true);
        const s2 = await signJoiningGame(
          hre,
          rankifyInstance.address,
          adr.player2.wallet.address,
          lastCreatedGameId,
          adr.gameMaster1,
        );
        await expect(
          rankifyInstance.connect(adr.player2.wallet).joinGame(lastCreatedGameId, s2.signature, s2.hiddenSalt),
        ).to.emit(rankifyInstance, 'PlayerJoined');
        await rankToken.connect(adr.maliciousActor1.wallet).setApprovalForAll(rankifyInstance.address, true);
        const mal1s = await signJoiningGame(
          hre,
          rankifyInstance.address,
          adr.maliciousActor1.wallet.address,
          lastCreatedGameId,
          adr.gameMaster1,
        );
        await expect(
          rankifyInstance
            .connect(adr.maliciousActor1.wallet)
            .joinGame(lastCreatedGameId, mal1s.signature, mal1s.hiddenSalt),
        ).to.be.revertedWithCustomError(rankToken, 'insufficient');
      });
      it('Locks rank tokens when player joins', async () => {
        const balance = await rankToken.balanceOf(adr.player1.wallet.address, 2);
        const lastCreatedGameId = await rankifyInstance.getContractState().then(r => r.numGames);
        await rankToken.connect(adr.player1.wallet).setApprovalForAll(rankifyInstance.address, true);
        const s1 = await signJoiningGame(
          hre,
          rankifyInstance.address,
          adr.player1.wallet.address,
          lastCreatedGameId,
          adr.gameMaster1,
        );
        await rankifyInstance.connect(adr.player1.wallet).joinGame(lastCreatedGameId, s1.signature, s1.hiddenSalt);
        const balance2 = await rankToken.balanceOf(adr.player1.wallet.address, 2);
        expect(await rankToken.unlockedBalanceOf(adr.player1.wallet.address, 2)).to.be.equal(balance.toNumber() - 1);
      });
      it('Returns rank token if player leaves game', async () => {
        const lastCreatedGameId = await rankifyInstance.getContractState().then(r => r.numGames);
        await rankToken.connect(adr.player1.wallet).setApprovalForAll(rankifyInstance.address, true);
        const s1 = await signJoiningGame(
          hre,
          rankifyInstance.address,
          adr.player1.wallet.address,
          lastCreatedGameId,
          adr.gameMaster1,
        );
        await rankifyInstance.connect(adr.player1.wallet).joinGame(lastCreatedGameId, s1.signature, s1.hiddenSalt);
        expect(await rankToken.unlockedBalanceOf(adr.player1.wallet.address, 2)).to.be.equal(0);
        await rankifyInstance.connect(adr.player1.wallet).leaveGame(lastCreatedGameId);
        expect(await rankToken.unlockedBalanceOf(adr.player1.wallet.address, 2)).to.be.equal(1);
      });
      it('Returns rank token if was game closed', async () => {
        const lastCreatedGameId = await rankifyInstance.getContractState().then(r => r.numGames);
        await rankToken.connect(adr.player1.wallet).setApprovalForAll(rankifyInstance.address, true);
        await rankToken.connect(adr.player2.wallet).setApprovalForAll(rankifyInstance.address, true);
        const s1 = await signJoiningGame(
          hre,
          rankifyInstance.address,
          adr.player1.wallet.address,
          lastCreatedGameId,
          adr.gameMaster1,
        );
        const s2 = await signJoiningGame(
          hre,
          rankifyInstance.address,
          adr.player2.wallet.address,
          lastCreatedGameId,
          adr.gameMaster1,
        );
        await rankifyInstance.connect(adr.player1.wallet).joinGame(lastCreatedGameId, s1.signature, s1.hiddenSalt);
        await rankifyInstance.connect(adr.player2.wallet).joinGame(lastCreatedGameId, s2.signature, s2.hiddenSalt);
        let p1balance = await rankToken.unlockedBalanceOf(adr.player1.wallet.address, 2);
        p1balance = p1balance.add(1);

        let p2balance = await rankToken.unlockedBalanceOf(adr.player2.wallet.address, 2);
        p2balance = p2balance.add(1);
        await rankifyInstance.connect(adr.player1.wallet).cancelGame(lastCreatedGameId);
        expect(await rankToken.unlockedBalanceOf(adr.player1.wallet.address, 2)).to.be.equal(p1balance);
        expect(await rankToken.unlockedBalanceOf(adr.player2.wallet.address, 2)).to.be.equal(p2balance);
      });
      describe('when this game is over', () => {
        let balancesBeforeJoined: BigNumber[] = [];
        beforeEach(async () => {
          const result = await nextRankGameOver();
          balancesBeforeJoined = result.balancesBeforeJoined;
        });
        it('Winners have reward tokens', async () => {
          const balances: number[] = [];
          const players = getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS, 0);
          for (let i = 0; i < players.length; i++) {
            balances[i] = await rankToken.balanceOf(players[i].wallet.address, 3).then(bn => bn.toNumber());
          }
          expect(balances[0]).to.be.equal(1);
          expect(balances[1]).to.be.equal(0);
          expect(balances[2]).to.be.equal(0);
        });
        it('Returned locked rank tokens', async () => {
          const balances: BigNumberish[] = [];
          const players = getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS, 0);
          for (let i = 0; i < players.length; i++) {
            balances[i] = await rankToken.balanceOf(players[i].wallet.address, 2);
          }

          expect(balances[0]).to.be.equal(balancesBeforeJoined[0].sub(1));
          for (let i = 1; i < players.length; i++) {
            expect(balances[i]).to.be.equal(balancesBeforeJoined[i]);
          }
        });
      });
    });
  });
  it('should reject game creation with zero minimum time', async () => {
    const params: IRankifyInstance.NewGameParamsInputStruct = {
      gameMaster: adr.gameMaster1.wallet.address,
      gameRank: 1,
      maxPlayerCnt: RInstance_MAX_PLAYERS,
      minPlayerCnt: RInstance_MIN_PLAYERS,
      voteCredits: RInstanceSettings.RInstance_VOTE_CREDITS,
      nTurns: RInstance_MAX_TURNS,
      minGameTime: 0,
      timePerTurn: RInstanceSettings.RInstance_TIME_PER_TURN,
      timeToJoin: RInstanceSettings.RInstance_TIME_TO_JOIN,
    };

    await env.rankifyToken.connect(adr.gameCreator1.wallet).approve(rankifyInstance.address, eth.constants.MaxUint256);
    await expect(rankifyInstance.connect(adr.gameCreator1.wallet).createGame(params)).to.be.revertedWith(
      'LibRankify::newGame->Min game time zero',
    );
  });
  it('should validate minGameTime is divisible by number of turns', async () => {
    const params: IRankifyInstance.NewGameParamsInputStruct = {
      gameMaster: adr.gameMaster1.wallet.address,
      gameRank: 1,
      maxPlayerCnt: RInstance_MAX_PLAYERS,
      minPlayerCnt: RInstance_MIN_PLAYERS,
      voteCredits: RInstanceSettings.RInstance_VOTE_CREDITS,
      nTurns: 5,
      minGameTime: 3601, // Not divisible by 5
      timePerTurn: RInstanceSettings.RInstance_TIME_PER_TURN,
      timeToJoin: RInstanceSettings.RInstance_TIME_TO_JOIN,
    };

    await env.rankifyToken.connect(adr.gameCreator1.wallet).approve(rankifyInstance.address, eth.constants.MaxUint256);
    await expect(rankifyInstance.connect(adr.gameCreator1.wallet).createGame(params)).to.be.revertedWithCustomError(
      rankifyInstance,
      'NoDivisionReminderAllowed',
    );
  });

  it('should validate turn count is greater than 2', async () => {
    const params: IRankifyInstance.NewGameParamsInputStruct = {
      gameMaster: adr.gameMaster1.wallet.address,
      gameRank: 1,
      maxPlayerCnt: RInstance_MAX_PLAYERS,
      minPlayerCnt: RInstance_MIN_PLAYERS,
      voteCredits: RInstanceSettings.RInstance_VOTE_CREDITS,
      nTurns: 2,
      minGameTime: RInstanceSettings.RInstance_MIN_GAME_TIME,
      timePerTurn: RInstanceSettings.RInstance_TIME_PER_TURN,
      timeToJoin: RInstanceSettings.RInstance_TIME_TO_JOIN,
    };

    await env.rankifyToken.connect(adr.gameCreator1.wallet).approve(rankifyInstance.address, eth.constants.MaxUint256);
    await expect(rankifyInstance.connect(adr.gameCreator1.wallet).createGame(params)).to.be.revertedWithCustomError(
      rankifyInstance,
      'invalidTurnCount',
    );
  });

  describe('Game creation with minimum participants', () => {
    it('should revert when minPlayerCnt is less than minimumParticipantsInCircle', async () => {
      const commonParams = await rankifyInstance.getCommonParams();
      const invalidMinPlayers = commonParams.minimumParticipantsInCircle.sub(1);

      const params = {
        gameMaster: adr.gameMaster1.wallet.address,
        gameRank: 1,
        maxPlayerCnt: RInstance_MAX_PLAYERS,
        minPlayerCnt: invalidMinPlayers,
        minGameTime: 1000,
        maxGameTime: 2000,
        registrationTime: 1000,
        nTurns: 10,
        voteCredits: RInstanceSettings.RInstance_VOTE_CREDITS,
        timePerTurn: RInstanceSettings.RInstance_TIME_PER_TURN,
        timeToJoin: RInstanceSettings.RInstance_TIME_TO_JOIN,
        votingTime: 1000,
        proposalTime: 1000,
        gameDescription: 'Test Game',
      };

      await expect(rankifyInstance.connect(adr.gameCreator1.wallet).createGame(params)).to.be.revertedWith(
        'Min player count too low',
      );
    });
  });

  // Add this test to the existing describe block
  describe('EIP712 Domain', () => {
    it('should have consistent domain separator parameters', async () => {
      const {
        _HASHED_NAME,
        _HASHED_VERSION,
        _CACHED_CHAIN_ID,
        _CACHED_THIS,
        _TYPE_HASH,
        _CACHED_DOMAIN_SEPARATOR,
        _NAME,
        _VERSION,
      } = await rankifyInstance.inspectEIP712Hashes();
      // Verify name and version
      expect(_NAME).to.equal(RANKIFY_INSTANCE_CONTRACT_NAME);
      expect(_VERSION).to.equal(RANKIFY_INSTANCE_CONTRACT_VERSION);

      // Verify hashed components
      expect(_HASHED_NAME).to.equal(eth.utils.solidityKeccak256(['string'], [_NAME]));
      expect(_HASHED_VERSION).to.equal(eth.utils.solidityKeccak256(['string'], [_VERSION]));
      expect(_CACHED_CHAIN_ID).to.equal(await rankifyInstance.currentChainId());
      expect(_CACHED_THIS.toLowerCase()).to.equal(rankifyInstance.address.toLowerCase());

      // Verify domain separator construction
      const domainSeparator = eth.utils.keccak256(
        eth.utils.defaultAbiCoder.encode(
          ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
          [_TYPE_HASH, _HASHED_NAME, _HASHED_VERSION, _CACHED_CHAIN_ID, _CACHED_THIS],
        ),
      );
      expect(_CACHED_DOMAIN_SEPARATOR).to.equal(domainSeparator);
    });
  });
});
