import {
  AdrSetupResult,
  RInstance_MAX_PLAYERS,
  RInstance_MIN_PLAYERS,
  EnvSetupResult,
  MockVotes,
  ProposalSubmission,
  setupTest,
  SignerIdentity,
  RInstance_MAX_TURNS,
  signJoiningGame,
} from './utils';
import { RInstanceSettings, mineBlocks, mockProposals, mockVotes, getPlayers } from './utils';
import { expect } from 'chai';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import { Rankify, RankifyDiamondInstance, RankToken } from '../types/';
import { LibCoinVending } from '../types/src/facets/RankifyInstanceRequirementsFacet';
import { IRankifyInstance } from '../types/src/facets/RankifyInstanceMainFacet';
import { deployments, ethers, getNamedAccounts } from 'hardhat';
const path = require('path');
import { BigNumber, BigNumberish } from 'ethers';
import { assert } from 'console';
import { solidityKeccak256 } from 'ethers/lib/utils';
import addDistribution from '../scripts/playbooks/addDistribution';
import hre from 'hardhat';
import { network } from 'hardhat';
const scriptName = path.basename(__filename);

import { getCodeIdFromArtifact } from '../scripts/getCodeId';
import { MAODistribution } from '../types/src/distributions/MAODistribution';
import { generateDistributorData } from '../scripts/libraries/generateDistributorData';
let votes: MockVotes;
let proposalsStruct: ProposalSubmission[];
let adr: AdrSetupResult;
let votersAddresses: string[];
let env: EnvSetupResult;
let rankifyInstance: RankifyDiamondInstance;
let rankToken: RankToken;

const createGame = async (
  gameContract: RankifyDiamondInstance,
  signer: SignerIdentity,
  gameMaster: string,
  gameRank: BigNumberish,
  openNow?: boolean,
) => {
  await env.rankifyToken.connect(signer.wallet).approve(gameContract.address, ethers.constants.MaxUint256);
  const params: IRankifyInstance.NewGameParamsInputStruct = {
    gameMaster: gameMaster,
    gameRank: gameRank,
    maxPlayerCnt: RInstance_MAX_PLAYERS,
    minPlayerCnt: RInstance_MIN_PLAYERS,
    timePerTurn: RInstanceSettings.RInstance_TIME_PER_TURN,
    timeToJoin: RInstanceSettings.RInstance_TIME_TO_JOIN,
    nTurns: RInstance_MAX_TURNS,
    voteCredits: RInstanceSettings.RInstance_VOTE_CREDITS,
    minGameTime: RInstanceSettings.RInstance_MIN_GAME_TIME,
  };
  await gameContract.connect(signer.wallet).createGame(params);
  const gameId = await gameContract.getContractState().then(state => state.numGames);
  if (openNow) await gameContract.connect(signer.wallet).openRegistration(gameId);
  return gameId;
};
const runToTheEnd = async (
  gameId: BigNumberish,
  gameContract: RankifyDiamondInstance,
  gameMaster: SignerIdentity,
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
  distribution?: 'ftw' | 'semiUniform' | 'equal',
) => {
  let isGameOver = await rankifyInstance.isGameOver(gameId);
  let isLastTurn = await rankifyInstance.isLastTurn(gameId);
  while (!isGameOver) {
    isLastTurn = await rankifyInstance.isLastTurn(gameId);
    const turn = await rankifyInstance.getTurn(gameId).then(r => r.toNumber());
    if (turn !== 1) {
      votes = await mockValidVotes(players, gameContract, gameId, gameMaster, true, distribution ?? 'ftw');
    }

    const proposals = await mockValidProposals(players, gameContract, gameMaster, gameId, true);
    if (isLastTurn) await time.increase(RInstanceSettings.RInstance_MIN_GAME_TIME + 1);
    await gameContract.connect(gameMaster.wallet).endTurn(
      gameId,
      turn == 1 ? [] : votes?.map(vote => vote.vote),
      proposals.map(prop => (turn < RInstance_MAX_TURNS ? prop.proposal : '')),
      proposals.map((p, i) => i),
    );
    isGameOver = await rankifyInstance.isGameOver(gameId);
  }
};
const runToLastTurn = async (
  gameId: BigNumberish,
  gameContract: RankifyDiamondInstance,
  gameMaster: SignerIdentity,
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
  distribution?: 'ftw' | 'semiUniform' | 'equal',
): Promise<void> => {
  const initialTurn = await rankifyInstance.getTurn(gameId);
  for (let turn = initialTurn.toNumber(); turn < RInstanceSettings.RInstance_MAX_TURNS; turn++) {
    if (turn !== 1) {
      votes = await mockValidVotes(players, gameContract, gameId, gameMaster, true, distribution ?? 'ftw');
    }

    const proposals = await mockValidProposals(players, gameContract, gameMaster, gameId, true);
    await gameContract.connect(gameMaster.wallet).endTurn(
      gameId,
      turn == 1 ? [] : votes?.map(vote => vote.vote),
      proposals.map(prop => prop.proposal),
      proposals.map((prop, idx) => idx),
    );
  }
  const isLastTurn = await gameContract.isLastTurn(gameId);
  assert(isLastTurn, 'should be last turn');
};

const endTurn = async (gameId: BigNumberish, gameContract: RankifyDiamondInstance) => {
  return gameContract.connect(adr.gameMaster1.wallet).endTurn(
    gameId,
    votes.map(vote => vote.vote),
    proposalsStruct.map(prop => prop.proposal),
    proposalsStruct.map((prop, idx) => idx),
  );
};

const runToOvertime = async (
  gameId: BigNumberish,
  gameContract: RankifyDiamondInstance,
  gameMaster: SignerIdentity,
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
) => {
  await runToLastTurn(gameId, gameContract, gameMaster, players, 'equal');

  await mockValidVotes(players, gameContract, gameId, gameMaster, true, 'equal');
  const proposals = await mockValidProposals(players, gameContract, gameMaster, gameId, true);
  const turn = await gameContract.getTurn(gameId);
  await gameContract.connect(gameMaster.wallet).endTurn(
    gameId,
    votes.map(vote => vote.vote),
    proposals.map(prop => prop.proposal),
    proposals.map((prop, idx) => idx),
  );
};

const mockValidVotes = async (
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
  gameContract: RankifyDiamondInstance,
  gameId: BigNumberish,
  gameMaster: SignerIdentity,
  submitNow?: boolean,
  distribution?: 'ftw' | 'semiUniform' | 'equal',
) => {
  const turn = await gameContract.getTurn(gameId);
  votes = await mockVotes({
    gameId: gameId,
    turn: turn,
    verifierAddress: gameContract.address,
    players: players,
    gm: gameMaster,
    distribution: distribution ?? 'semiUniform',
  });
  if (submitNow) {
    votersAddresses = players.map(player => player.wallet.address);
    for (let i = 0; i < players.length; i++) {
      await rankifyInstance
        .connect(gameMaster.wallet)
        .submitVote(gameId, votes[i].voteHidden, players[i].wallet.address);
    }
  }
  return votes;
};

const startGame = async (gameId: BigNumberish) => {
  const currentT = await time.latest();
  await time.setNextBlockTimestamp(currentT + Number(RInstanceSettings.RInstance_TIME_TO_JOIN) + 1);
  await mineBlocks(RInstanceSettings.RInstance_TIME_TO_JOIN + 1);
  await rankifyInstance.connect(adr.gameMaster1.wallet).startGame(gameId);
};

const mockValidProposals = async (
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
  gameContract: RankifyDiamondInstance,
  gameMaster: SignerIdentity,
  gameId: BigNumberish,
  submitNow?: boolean,
) => {
  const turn = await gameContract.getTurn(gameId);

  proposalsStruct = await mockProposals({
    players: players,
    gameId: gameId,
    turn: turn,
    verifierAddress: gameContract.address,
    gm: gameMaster,
  });
  if (submitNow) {
    for (let i = 0; i < players.length; i++) {
      await gameContract.connect(gameMaster.wallet).submitProposal(proposalsStruct[i].params);
    }
  }
  return proposalsStruct;
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
      gameContract.address,
      players[i].wallet.address,
      gameId,
      gameMaster,
    );
    await gameContract
      .connect(players[i].wallet)
      .joinGame(gameId, signature, hiddenSalt, { value: ethers.utils.parseEther('0.4') });
  }
  if (shiftTime) {
    const currentT = await time.latest();
    await time.setNextBlockTimestamp(currentT + Number(RInstanceSettings.RInstance_TIME_TO_JOIN) + 1);
    await mineBlocks(1);
  }
  if (startGame && gameMaster) {
    await rankifyInstance.connect(gameMaster.wallet).startGame(gameId);
  }
};

describe(scriptName, () => {
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
  beforeEach(async () => {
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
        metadata: ethers.utils.hexlify(ethers.utils.toUtf8Bytes('metadata')),
        rankTokenURI: 'https://example.com/rank',
        principalCost: RInstanceSettings.PRINCIPAL_COST,
        principalTimeConstant: RInstanceSettings.PRINCIPAL_TIME_CONSTANT,
      },
    };
    const data = generateDistributorData(distributorArguments);
    const maoCode = await hre.ethers.provider.getCode(env.maoDistribution.address);
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

    await env.rankifyToken
      .connect(adr.gameCreator1.wallet)
      .approve(rankifyInstance.address, ethers.constants.MaxUint256);
    await env.rankifyToken
      .connect(adr.gameCreator2.wallet)
      .approve(rankifyInstance.address, ethers.constants.MaxUint256);
    await env.rankifyToken
      .connect(adr.gameCreator3.wallet)
      .approve(rankifyInstance.address, ethers.constants.MaxUint256);
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
    expect(await rankifyInstance.owner()).to.be.equal(ethers.constants.AddressZero);
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
    await env.rankifyToken
      .connect(adr.gameCreator1.wallet)
      .approve(rankifyInstance.address, ethers.constants.MaxUint256);
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
    const s1 = await signJoiningGame(rankifyInstance.address, adr.gameCreator1.wallet.address, 1, adr.gameMaster1);
    await expect(
      rankifyInstance.connect(adr.gameCreator1.wallet).joinGame(1, s1.signature, s1.hiddenSalt),
    ).to.be.revertedWith('game not found');
    proposalsStruct = await mockProposals({
      players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
      gameId: 1,
      turn: 1,
      verifierAddress: rankifyInstance.address,
      gm: adr.gameMaster1,
    });
    await expect(
      rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(proposalsStruct[0].params),
    ).to.be.revertedWith('game not found');
    votersAddresses = getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS).map(player => player.wallet.address);
    votes = await mockVotes({
      gameId: 1,
      turn: 1,
      verifierAddress: rankifyInstance.address,
      players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
      gm: adr.gameMaster1,
      distribution: 'semiUniform',
    });
    await expect(
      rankifyInstance.connect(adr.gameMaster1.wallet).submitVote(1, votes[0].voteHidden, adr.player1.wallet.address),
    ).to.be.revertedWith('game not found');
    await expect(rankifyInstance.connect(adr.gameMaster1.wallet).openRegistration(1)).to.be.revertedWith(
      'game not found',
    );

    let s2 = await signJoiningGame(rankifyInstance.address, adr.gameMaster1.wallet.address, 1, adr.gameMaster1);

    await expect(
      rankifyInstance.connect(adr.gameMaster1.wallet).joinGame(0, s2.signature, s2.hiddenSalt),
    ).to.be.revertedWith('game not found');
    await expect(rankifyInstance.connect(adr.gameMaster1.wallet).startGame(0)).to.be.revertedWith('game not found');
    const proposals = await mockProposals({
      players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
      gameId: 1,
      turn: 1,
      verifierAddress: rankifyInstance.address,
      gm: adr.gameMaster1,
    });
    await expect(
      rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
        1,
        votes.map(vote => vote.vote),
        proposals.map(prop => prop.proposal),
        proposalsStruct.map((p, idx) => idx),
      ),
    ).to.be.revertedWith('game not found');
    await expect(
      rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(proposalsStruct[0].params),
    ).to.be.revertedWith('game not found');
  });
  describe('When a game of first rank was created', () => {
    let initialCreatorBalance: BigNumber;
    let initialBeneficiaryBalance: BigNumber;
    let initialTotalSupply: BigNumber;
    let gamePrice: BigNumber;

    beforeEach(async () => {
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
      await createGame(rankifyInstance, adr.gameCreator1, adr.gameMaster1.wallet.address, 1);
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
      expect(state.minGameTime).to.be.equal(RInstanceSettings.RInstance_MIN_GAME_TIME);
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
      await env.rankifyToken.connect(adr.player1.wallet).approve(rankifyInstance.address, ethers.constants.MaxUint256);
      const gameId = await rankifyInstance.getContractState().then(s => s.numGames);
      const s1 = await signJoiningGame(rankifyInstance.address, adr.player1.wallet.address, 1, adr.gameMaster1);
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
        await rankifyInstance.connect(adr.gameCreator1.wallet).openRegistration(1);
      });

      it('Mutating join requirements is no longer possible', async () => {
        await expect(
          rankifyInstance.connect(adr.gameCreator1.wallet).setJoinRequirements(1, requirement),
        ).to.be.revertedWith('Cannot do when registration is open');
      });
      it.only('Qualified players can join', async () => {
        const s1 = await signJoiningGame(rankifyInstance.address, adr.player1.wallet.address, 1, adr.gameMaster1);
        await expect(rankifyInstance.connect(adr.player1.wallet).joinGame(1, s1.signature, s1.hiddenSalt)).to.be.emit(
          rankifyInstance,
          'PlayerJoined',
        );
      });
      it('Game cannot be started until join block time has passed unless game is full', async () => {
        const s1 = await signJoiningGame(rankifyInstance.address, adr.player1.wallet.address, 1, adr.gameMaster1);
        await rankifyInstance.connect(adr.player1.wallet).joinGame(1, s1.signature, s1.hiddenSalt);
        await expect(rankifyInstance.connect(adr.player1.wallet).startGame(1)).to.be.revertedWith(
          'startGame->Not enough players',
        );
        const s2 = await signJoiningGame(rankifyInstance.address, adr.player2.wallet.address, 1, adr.gameMaster1);
        await rankifyInstance.connect(adr.player2.wallet).joinGame(1, s2.signature, s2.hiddenSalt);
        const s3 = await signJoiningGame(rankifyInstance.address, adr.player3.wallet.address, 1, adr.gameMaster1);
        await rankifyInstance.connect(adr.player3.wallet).joinGame(1, s3.signature, s3.hiddenSalt);
        const s4 = await signJoiningGame(rankifyInstance.address, adr.player4.wallet.address, 1, adr.gameMaster1);
        await rankifyInstance.connect(adr.player4.wallet).joinGame(1, s4.signature, s4.hiddenSalt);
        const s5 = await signJoiningGame(rankifyInstance.address, adr.player5.wallet.address, 1, adr.gameMaster1);
        await rankifyInstance.connect(adr.player5.wallet).joinGame(1, s5.signature, s5.hiddenSalt);
        const s6 = await signJoiningGame(rankifyInstance.address, adr.player6.wallet.address, 1, adr.gameMaster1);
        await rankifyInstance.connect(adr.player6.wallet).joinGame(1, s6.signature, s6.hiddenSalt);
        await expect(rankifyInstance.connect(adr.player1.wallet).startGame(1)).to.be.emit(
          rankifyInstance,
          'GameStarted',
        );
      });
      it('No more than max players can join', async () => {
        for (let i = 1; i < RInstanceSettings.RInstance_MAX_PLAYERS + 1; i++) {
          let name = `player${i}` as any as keyof AdrSetupResult;
          const s1 = await signJoiningGame(rankifyInstance.address, adr[`${name}`].wallet.address, 1, adr.gameMaster1);
          await rankifyInstance.connect(adr[`${name}`].wallet).joinGame(1, s1.signature, s1.hiddenSalt);
        }
        await env.rankifyToken
          .connect(adr.maliciousActor1.wallet)
          .approve(rankifyInstance.address, ethers.constants.MaxUint256);
        const s1 = await signJoiningGame(
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
        await expect(
          rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal({
            gameId: 1,
            proposer: adr.player1.wallet.address,
            commitmentHash: solidityKeccak256(['string'], ['mockString']),
            encryptedProposal: '',
          }),
        ).to.be.revertedWith('Game has not yet started');
        proposalsStruct = await mockProposals({
          players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
          gameId: 1,
          turn: 1,
          verifierAddress: rankifyInstance.address,
          gm: adr.gameMaster1,
        });
        votes = await mockVotes({
          gameId: 1,
          turn: 1,
          verifierAddress: rankifyInstance.address,
          players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
          gm: adr.gameMaster1,
          distribution: 'semiUniform',
        });
        votersAddresses = getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS).map(player => player.wallet.address);
        await expect(
          rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
            1,
            votes.map(vote => vote.vote),
            proposalsStruct.map(p => p.proposal),
            proposalsStruct.map((p, index) => index),
          ),
        ).to.be.revertedWith('Game has not yet started');
        await expect(
          rankifyInstance
            .connect(adr.gameMaster1.wallet)
            .submitVote(1, votes[0].voteHidden, adr.player1.wallet.address),
        ).to.be.revertedWith('Game has not yet started');
        await expect(rankifyInstance.connect(adr.gameCreator1.wallet).openRegistration(1)).to.be.revertedWith(
          'Cannot do when registration is open',
        );
        await expect(
          rankifyInstance.connect(adr.gameCreator1.wallet).setJoinRequirements(1, requirement),
        ).to.be.revertedWith('Cannot do when registration is open');

        await expect(
          rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
            1,
            votes.map(vote => vote.vote),
            proposalsStruct.map(p => p.proposal),
            proposalsStruct.map((p, index) => index),
          ),
        ).to.be.revertedWith('Game has not yet started');
      });
      it('Cannot be started if not enough players', async () => {
        await mineBlocks(RInstanceSettings.RInstance_TIME_TO_JOIN + 1);
        await expect(rankifyInstance.connect(adr.gameMaster1.wallet).startGame(1)).to.be.revertedWith(
          'startGame->Not enough players',
        );
      });
      describe('When there is minimal number and below maximum players in game', () => {
        beforeEach(async () => {
          await fillParty(
            getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
            rankifyInstance,
            1,
            false,
            adr.gameMaster1,
          );
        });
        it('Can start game after joining period is over', async () => {
          await expect(rankifyInstance.connect(adr.gameMaster1.wallet).startGame(1)).to.be.revertedWith(
            'startGame->Not enough players',
          );
          const currentT = await time.latest();
          await time.setNextBlockTimestamp(currentT + Number(RInstanceSettings.RInstance_TIME_TO_JOIN) + 1);
          await mineBlocks(1);
          await expect(rankifyInstance.connect(adr.gameMaster1.wallet).startGame(1)).to.be.emit(
            rankifyInstance,
            'GameStarted',
          );
        });
        it('Game methods beside start are inactive', async () => {
          //TODO: add more methods here
          proposalsStruct = await mockProposals({
            players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
            gameId: 1,
            turn: 1,
            verifierAddress: rankifyInstance.address,
            gm: adr.gameMaster1,
          });
          await expect(
            rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(proposalsStruct[0].params),
          ).to.be.revertedWith('Game has not yet started');
          votes = await mockVotes({
            gameId: 1,
            turn: 1,
            verifierAddress: rankifyInstance.address,
            players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
            gm: adr.gameMaster1,
            distribution: 'semiUniform',
          });
          votersAddresses = getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS).map(
            player => player.wallet.address,
          );

          await expect(
            rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
              1,
              votes.map(vote => vote.vote),
              proposalsStruct.map(p => p.proposal),
              proposalsStruct.map((p, idx) => idx),
            ),
          ).to.be.revertedWith('Game has not yet started');
          await expect(
            rankifyInstance
              .connect(adr.gameMaster1.wallet)
              .submitVote(1, votes[0].voteHidden, adr.player1.wallet.address),
          ).to.be.revertedWith('Game has not yet started');
        });
        describe('When game has started', () => {
          beforeEach(async () => {
            await startGame(1);
          });
          it('Can finish turn early if previous turn participant did not made a move', async () => {
            proposalsStruct = await mockValidProposals(
              getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
              rankifyInstance,
              adr.gameMaster1,
              1,
              false,
            );
            for (let i = 0; i < proposalsStruct.length; i++) {
              const { params } = proposalsStruct[i];
              if (i !== 0) {
                await rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(params);
              }
            }

            await time.increase(Number(RInstanceSettings.RInstance_TIME_PER_TURN) + 1);
            votes = [];
            await endTurn(1, rankifyInstance);
            proposalsStruct = await mockValidProposals(
              getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
              rankifyInstance,
              adr.gameMaster1,
              1,
              false,
            );
            for (let i = 0; i < proposalsStruct.length; i++) {
              const { params } = proposalsStruct[i];
              if (i !== 0) {
                await rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(params);
              }
            }
            votes = await mockValidVotes(
              getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
              rankifyInstance,
              1,
              adr.gameMaster1,
              false,
            );
            const players = getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS);
            for (let i = 0; i < votes.length; i++) {
              if (i !== 0) {
                await rankifyInstance
                  .connect(adr.gameMaster1.wallet)
                  .submitVote(1, votes[i].voteHidden, players[i].wallet.address);
              }
            }

            await time.increase(Number(RInstanceSettings.RInstance_TIME_PER_TURN) + 1);
            await expect(endTurn(1, rankifyInstance)).to.emit(rankifyInstance, 'TurnEnded');
            await mockValidVotes(
              getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
              rankifyInstance,
              1,
              adr.gameMaster1,
              true,
            );
            expect(await rankifyInstance.isActive(1, proposalsStruct[0].params.proposer)).to.be.false;
            proposalsStruct = await mockValidProposals(players, rankifyInstance, adr.gameMaster1, 1, false);
            for (let i = 0; i < proposalsStruct.length; i++) {
              if (i !== 1) {
                await rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(proposalsStruct[i].params);
              }
            }
            expect(await rankifyInstance.isActive(1, proposalsStruct[0].params.proposer)).to.be.true;
            await expect(endTurn(1, rankifyInstance)).to.be.revertedWith('nextTurn->CanEndEarly');
          });
          it('First turn has started', async () => {
            expect(await rankifyInstance.connect(adr.player1.wallet).getTurn(1)).to.be.equal(1);
          });
          it('Cannot end game before minimum game time', async () => {
            const players = getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS);
            await runToLastTurn(1, rankifyInstance, adr.gameMaster1, players);
            await mockValidVotes(players, rankifyInstance, 1, adr.gameMaster1, true, 'ftw');
            await mockValidProposals(players, rankifyInstance, adr.gameMaster1, 1, true);
            await expect(endTurn(1, rankifyInstance)).to.be.revertedWith(
              'Game duration less than minimum required time',
            );
            await time.increase(RInstanceSettings.RInstance_MIN_GAME_TIME - 100);
            await expect(endTurn(1, rankifyInstance)).to.be.revertedWith(
              'Game duration less than minimum required time',
            );
            await time.increase(101);
            await expect(endTurn(1, rankifyInstance)).to.not.be.reverted;
          });
          it('Accepts only proposals and no votes', async () => {
            const proposals = await mockProposals({
              players: getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
              gameId: 1,
              turn: 1,
              verifierAddress: rankifyInstance.address,
              gm: adr.gameMaster1,
            });
            await expect(
              rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(proposals[0].params),
            ).to.be.emit(rankifyInstance, 'ProposalSubmitted');
            votes = await mockVotes({
              gameId: 1,
              turn: 1,
              verifierAddress: rankifyInstance.address,
              players: getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
              gm: adr.gameMaster1,
              distribution: 'semiUniform',
            });
            votersAddresses = getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS).map(
              player => player.wallet.address,
            );

            await expect(
              rankifyInstance.connect(adr.gameMaster1.wallet).submitVote(1, votes[0].voteHidden, votersAddresses[0]),
            ).to.be.revertedWith('No proposals exist at turn 1: cannot vote');
          });
          it('Processes only proposals only from game master', async () => {
            await expect(
              rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(proposalsStruct[0].params),
            ).to.emit(rankifyInstance, 'ProposalSubmitted');
            await expect(
              rankifyInstance.connect(adr.maliciousActor1.wallet).submitProposal(proposalsStruct[0].params),
            ).to.be.revertedWith('Only game master');
          });
          it('Can end turn if timeout reached with zero scores', async () => {
            await mineBlocks(RInstanceSettings.RInstance_TIME_PER_TURN + 1);
            await expect(rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(1, [], [], []))
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
              proposalsStruct = await mockValidProposals(
                getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
                rankifyInstance,
                adr.gameMaster1,
                1,
                true,
              );
            });
            it('Can end turn', async () => {
              await expect(
                rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
                  1,
                  [],
                  proposalsStruct.map(p => p.proposal),
                  proposalsStruct.map((p, idx) => idx),
                ),
              ).to.be.emit(rankifyInstance, 'TurnEnded');
            });
            describe('When turn is over and there is one proposal missing', async () => {
              beforeEach(async () => {
                await rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
                  1,
                  [],
                  proposalsStruct.map(p => p.proposal).slice(0, -1),
                  proposalsStruct.map((p, idx) => idx),
                );
              });
              it('Can end next turn ', async () => {
                // ToDo: add "with correct scores" to the end of the test
                const players = getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS);
                await mockValidVotes(players, rankifyInstance, 1, adr.gameMaster1, true, 'ftw');
                await mockValidProposals(players, rankifyInstance, adr.gameMaster1, 1, true);
                await expect(
                  rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
                    1,
                    votes.map(vote => vote.vote),
                    proposalsStruct.map(p => p.proposal),
                    proposalsStruct.map((p, idx) => (idx === players.length - 1 ? players.length : idx)),
                  ),
                ).to.be.emit(rankifyInstance, 'TurnEnded');
              });
            });
            describe('When first turn was made', () => {
              beforeEach(async () => {
                await rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
                  1,
                  [],
                  proposalsStruct.map(p => p.proposal),
                  proposalsStruct.map((p, idx) => idx),
                );
              });
              it('throws if player votes twice', async () => {
                await mockValidVotes(
                  getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
                  rankifyInstance,
                  1,
                  adr.gameMaster1,
                  true,
                );
                await mockValidProposals(
                  getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
                  rankifyInstance,
                  adr.gameMaster1,
                  1,
                  true,
                );
                await expect(
                  rankifyInstance
                    .connect(adr.gameMaster1.wallet)
                    .submitVote(1, votes[0].voteHidden, adr.player1.wallet.address),
                ).to.be.revertedWith('Already voted');
              });
              it('shows no players made a turn', async () => {
                expect(await rankifyInstance.getPlayersMoved(1)).to.deep.equal([
                  getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS).map(() => false),
                  ethers.BigNumber.from('0'),
                ]);
              });
              it('shows no players made a turn even after player send proposal', async () => {
                const proposals = await mockValidProposals(
                  getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
                  rankifyInstance,
                  adr.gameMaster1,
                  1,
                  false,
                );
                await rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(proposals[0].params);
                await rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(proposals[1].params),
                  expect(await rankifyInstance.getPlayersMoved(1)).to.deep.equal([
                    getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS).map(() => false),
                    ethers.BigNumber.from('0'),
                  ]);
              });
              describe('When all players voted', () => {
                beforeEach(async () => {
                  votes = await mockValidVotes(
                    getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS),
                    rankifyInstance,
                    1,
                    adr.gameMaster1,
                    true,
                  );
                  votersAddresses = getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS).map(
                    player => player.wallet.address,
                  );
                });
                it('cannot end turn because players still have time to propose', async () => {
                  await expect(
                    rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
                      1,
                      votes.map(vote => vote.vote),
                      proposalsStruct.map(p => p.proposal),
                      proposalsStruct.map((p, idx) => idx),
                    ),
                  ).to.be.revertedWith('nextTurn->CanEndEarly');
                });
                it('Can end turn if timeout reached', async () => {
                  const currentT = await time.latest();
                  await time.setNextBlockTimestamp(currentT + Number(RInstanceSettings.RInstance_TIME_PER_TURN) + 1);
                  expect(await rankifyInstance.getTurn(1)).to.be.equal(2);
                  const players = getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS);
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
                  await expect(
                    rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
                      1,
                      votes.map(vote => vote.vote),
                      [],
                      votersAddresses.map((p, idx) => idx),
                    ),
                  )
                    .to.be.emit(rankifyInstance, 'TurnEnded')
                    .withArgs(
                      1,
                      2,
                      getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS).map(identity => identity.wallet.address),
                      expectedScores,
                      [],
                      [],
                      [],
                    );
                });
                it('Returns correct scores in getScores if votes are shuffled', async () => {
                  const currentT = await time.latest();
                  await time.setNextBlockTimestamp(currentT + Number(RInstanceSettings.RInstance_TIME_PER_TURN) + 1);
                  expect(await rankifyInstance.getTurn(1)).to.be.equal(2);
                  const players = getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS);
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
                  await rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(1, votesShuffled, [], proposerIndex);
                  const scores = await rankifyInstance.getScores(1).then(v => v[1].map(i => i.toNumber()));
                  expect(expectedScores).to.be.eql(scores);
                });
                it('Emits correct ProposalScore event values', async () => {
                  const currentT = await time.latest();
                  await time.setNextBlockTimestamp(currentT + Number(RInstanceSettings.RInstance_TIME_PER_TURN) + 1);
                  expect(await rankifyInstance.getTurn(1)).to.be.equal(2);
                  const players = getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS);
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
                  await expect(
                    rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
                      1,
                      votes.map(vote => vote.vote),
                      [],
                      votersAddresses.map((p, idx) => idx),
                    ),
                  )
                    .to.emit(rankifyInstance, 'ProposalScore')
                    .withArgs('1', '2', proposalsStruct[0].proposal, proposalsStruct[0].proposal, expectedScores[0]);
                });
              });
            });
          });
        });
        describe('When another game  of first rank is created', () => {
          beforeEach(async () => {
            await createGame(rankifyInstance, adr.gameCreator1, adr.gameMaster2.wallet.address, 1, true);
          });
          it('Reverts if players from another game tries to join', async () => {
            const s1 = await signJoiningGame(rankifyInstance.address, adr.player1.wallet.address, 2, adr.gameMaster1);
            await expect(
              rankifyInstance.connect(adr.player1.wallet).joinGame(2, s1.signature, s1.hiddenSalt),
            ).to.be.revertedWith('addPlayer->Player in game');
          });
        });
      });
      describe('When there is not enough players and join time is out', () => {
        beforeEach(async () => {
          await fillParty(getPlayers(adr, RInstance_MIN_PLAYERS - 1), rankifyInstance, 1, true, adr.gameMaster1);
        });
        it('It throws on game start', async () => {
          await expect(rankifyInstance.connect(adr.gameCreator1.wallet).startGame(1)).to.be.revertedWith(
            'startGame->Not enough players',
          );
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
      it('Next turn without winner brings Game is in overtime conditions', async () => {
        let isGameOver = await rankifyInstance.isGameOver(1);
        expect(isGameOver).to.be.false;
        await mockValidProposals(
          getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
          rankifyInstance,
          adr.gameMaster1,
          1,
          true,
        );
        await mockValidVotes(
          getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
          rankifyInstance,
          1,
          adr.gameMaster1,
          true,
          'equal',
        );
        await endTurn(1, rankifyInstance);

        expect(await rankifyInstance.isOvertime(1)).to.be.true;
      });
      describe('when is overtime', () => {
        beforeEach(async () => {
          await mockValidVotes(
            getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
            rankifyInstance,
            1,
            adr.gameMaster1,
            true,
            'equal',
          );
          await mockValidProposals(
            getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
            rankifyInstance,
            adr.gameMaster1,
            1,
            true,
          );
          await endTurn(1, rankifyInstance);
        });
        it('emits game Over when submitted votes result unique leaders', async () => {
          await mockValidVotes(
            getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
            rankifyInstance,
            1,
            adr.gameMaster1,
            true,
            'ftw',
          );
          const proposals = await mockValidProposals(
            getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
            rankifyInstance,
            adr.gameMaster1,
            1,
            true,
          );
          await time.increase(Number(RInstanceSettings.RInstance_MIN_GAME_TIME) + 1);
          expect(
            await rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
              1,
              votes.map(vote => vote.vote),
              proposals.map(p => p.proposal),
              proposalsStruct.map((p, idx) => idx),
            ),
          ).to.emit(rankifyInstance, 'GameOver');
        });
        it("Keeps game in overtime when submitted votes don't result unique leaders", async () => {
          await mockValidVotes(
            getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
            rankifyInstance,
            1,
            adr.gameMaster1,
            true,
            'equal',
          );
          const proposals = await mockValidProposals(
            getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
            rankifyInstance,
            adr.gameMaster1,
            1,
            true,
          );
          expect(await rankifyInstance.connect(adr.gameMaster1.wallet).isOvertime(1)).to.be.true;
          expect(await rankifyInstance.connect(adr.gameMaster1.wallet).isGameOver(1)).to.be.false;
        });
      });

      describe('When game is over', () => {
        beforeEach(async () => {
          await runToTheEnd(
            1,
            rankifyInstance,
            adr.gameMaster1,
            getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
          );
        });
        it('Throws on attempt to make another turn', async () => {
          const currentTurn = await rankifyInstance.getTurn(1);
          votes = await mockVotes({
            gameId: 1,
            turn: currentTurn,
            verifierAddress: rankifyInstance.address,
            players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
            gm: adr.gameMaster1,
            distribution: 'ftw',
          });
          proposalsStruct = await mockProposals({
            players: getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS),
            gameId: 1,
            turn: currentTurn,
            verifierAddress: rankifyInstance.address,
            gm: adr.gameMaster1,
          });

          for (let i = 0; i < RInstanceSettings.RInstance_MAX_PLAYERS; i++) {
            await expect(
              rankifyInstance.connect(adr.gameMaster1.wallet).submitProposal(proposalsStruct[i].params),
            ).to.be.revertedWith('Game over');

            await expect(
              rankifyInstance
                .connect(adr.gameMaster1.wallet)
                .submitVote(
                  1,
                  votes[i].voteHidden,
                  getPlayers(adr, RInstanceSettings.RInstance_MAX_PLAYERS)[i].wallet.address,
                ),
            ).to.be.revertedWith('Game over');
          }
          await expect(
            rankifyInstance.connect(adr.gameMaster1.wallet).endTurn(
              1,
              votes.map(vote => vote.vote),
              [],
              [],
            ),
          ).to.be.revertedWith('Game over');
        });
        it('Gave rewards to winner', async () => {
          expect(await rankToken.balanceOf(adr.player2.wallet.address, 1)).to.be.equal(0);
          expect(await rankToken.balanceOf(adr.player2.wallet.address, 2)).to.be.equal(0);
          expect(await rankToken.balanceOf(adr.player1.wallet.address, 2)).to.be.equal(1);
          expect(await rankToken.balanceOf(adr.player3.wallet.address, 1)).to.be.equal(0);
          expect(await rankToken.balanceOf(adr.player3.wallet.address, 2)).to.be.equal(0);
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
            const s1 = await signJoiningGame(rankifyInstance.address, adr.player1.wallet.address, 2, adr.gameMaster1);
            const s2 = await signJoiningGame(rankifyInstance.address, adr.player2.wallet.address, 2, adr.gameMaster1);
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
        console.warn('opened');
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
        await rankifyInstance.connect(adr.gameCreator1.wallet).createGame(params);
        const state = await rankifyInstance.getContractState();
        await rankifyInstance.connect(adr.gameCreator1.wallet).openRegistration(state.numGames);
        const s1 = await signJoiningGame(
          rankifyInstance.address,
          adr.player1.wallet.address,
          state.numGames,
          adr.gameMaster1,
        );
        await rankifyInstance.connect(adr.player1.wallet).joinGame(state.numGames, s1.signature, s1.hiddenSalt);
        const currentT = await time.latest();
        await time.setNextBlockTimestamp(currentT + Number(RInstanceSettings.RInstance_TIME_TO_JOIN) + 1);

        await rankToken.connect(adr.player2.wallet).setApprovalForAll(rankifyInstance.address, true);

        const s2 = await signJoiningGame(
          rankifyInstance.address,
          adr.player2.wallet.address,
          state.numGames,
          adr.gameMaster1,
        );
        await expect(
          rankifyInstance.connect(adr.player2.wallet).joinGame(state.numGames, s2.signature, s2.hiddenSalt),
        ).to.be.revertedWithCustomError(rankToken, 'insufficient');
      });
    });
  });
  describe('When there was multiple first rank games played so higher rank game can be filled', () => {
    beforeEach(async () => {
      for (let numGames = 0; numGames < RInstanceSettings.RInstance_MAX_PLAYERS; numGames++) {
        const gameId = await createGame(rankifyInstance, adr.gameCreator1, adr.gameMaster1.wallet.address, 1, true);
        await fillParty(
          getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS, numGames),
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
          getPlayers(adr, RInstanceSettings.RInstance_MIN_PLAYERS, numGames),
        );
      }
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
        await createGame(rankifyInstance, adr.player1, adr.gameMaster1.wallet.address, 2, true);
      });
      it('Can be joined only by bearers of rank token', async () => {
        const lastCreatedGameId = await rankifyInstance.getContractState().then(r => r.numGames);
        await rankToken.connect(adr.player2.wallet).setApprovalForAll(rankifyInstance.address, true);
        const s2 = await signJoiningGame(
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
          rankifyInstance.address,
          adr.player1.wallet.address,
          lastCreatedGameId,
          adr.gameMaster1,
        );
        const s2 = await signJoiningGame(
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
        const balancesBeforeJoined: BigNumber[] = [];
        beforeEach(async () => {
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

    await env.rankifyToken
      .connect(adr.gameCreator1.wallet)
      .approve(rankifyInstance.address, ethers.constants.MaxUint256);
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

    await env.rankifyToken
      .connect(adr.gameCreator1.wallet)
      .approve(rankifyInstance.address, ethers.constants.MaxUint256);
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
      minGameTime: 3600,
      timePerTurn: RInstanceSettings.RInstance_TIME_PER_TURN,
      timeToJoin: RInstanceSettings.RInstance_TIME_TO_JOIN,
    };

    await env.rankifyToken
      .connect(adr.gameCreator1.wallet)
      .approve(rankifyInstance.address, ethers.constants.MaxUint256);
    await expect(rankifyInstance.connect(adr.gameCreator1.wallet).createGame(params)).to.be.revertedWithCustomError(
      rankifyInstance,
      'invalidTurnCount',
    );
  });
});
