import { RankifyDiamondInstance, RankToken } from '../../types';
import { BigNumber, BigNumberish, ethers, Wallet } from 'ethers';
import { IRankifyInstance } from '../../types/src/facets/RankifyInstanceMainFacet';
import {
  mockVotes,
  mockProposals,
  MockVotes,
  ProposalSubmission,
  RInstanceSettings,
  EnvSetupResult,
  AdrSetupResult,
  SignerIdentity,
} from '../utils';
import { assert } from 'console';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import cryptoJs from "crypto-js";
import aes from "crypto-js/aes";

export enum GameState {
  Created,
  RegistrationOpened,
  PartyFilled,
  Started,
  NextMove,
  LastMove,
  Overtime,
  Ended,
}

export class InstanceBase {
  env: EnvSetupResult;
  adr: AdrSetupResult;
  rankifyInstance: RankifyDiamondInstance;
  ongoingVotes: MockVotes = [];
  ongoingProposals: ProposalSubmission[] = [];
  hre: HardhatRuntimeEnvironment;
  private gameStates: Map<number, GameState> = new Map();
  private proposalShuffling: Map<number, number[]> = new Map(); // gameId -> shuffled indices
  rankToken: RankToken;
  constructor(
    env: EnvSetupResult,
    adr: AdrSetupResult,
    rankifyInstance: RankifyDiamondInstance,
    rankToken: RankToken,
    hre: HardhatRuntimeEnvironment,
  ) {
    this.env = env;
    this.adr = adr;
    this.rankifyInstance = rankifyInstance;
    this.hre = hre;
    this.rankToken = rankToken;
  }

  increaseTime = async (time: number) => {
    await this.hre.network.provider.send('evm_increaseTime', [time]);
    await this.hre.network.provider.send('evm_mine');
  };

  createGame = async (signer: SignerIdentity, gameMaster: string, gameRank: BigNumberish, openNow?: boolean) => {
    await this.env.rankifyToken
      .connect(signer.wallet)
      .approve(this.rankifyInstance.address, ethers.constants.MaxUint256)
      .then(r => r.wait(1));
    const params: IRankifyInstance.NewGameParamsInputStruct = {
      gameMaster: gameMaster,
      gameRank: gameRank,
      maxPlayerCnt: RInstanceSettings.RInstance_MAX_PLAYERS + 1,
      minPlayerCnt: RInstanceSettings.RInstance_MIN_PLAYERS,
      timePerTurn: RInstanceSettings.RInstance_TIME_PER_TURN,
      timeToJoin: RInstanceSettings.RInstance_TIME_TO_JOIN,
      nTurns: RInstanceSettings.RInstance_MAX_TURNS,
      voteCredits: RInstanceSettings.RInstance_VOTE_CREDITS,
      minGameTime: RInstanceSettings.RInstance_MIN_GAME_TIME,
    };
    await this.rankifyInstance
      .connect(signer.wallet)
      .createGame(params)
      .then(r => r.wait(1));
    const gameId = await this.rankifyInstance.getContractState().then(state => state.numGames);
    if (openNow)
      await this.rankifyInstance
        .connect(signer.wallet)
        .openRegistration(gameId)
        .then(r => r.wait(1));
    this.updateGameState(gameId, GameState.Created);
    return gameId;
  };
  runToTheEnd = async (
    gameId: BigNumberish,
    gameMaster: SignerIdentity,
    players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
    distribution?: 'ftw' | 'semiUniform' | 'equal',
  ) => {
    let isLastTurn = await this.rankifyInstance.isLastTurn(gameId);
    await this.runToLastTurn(gameId, gameMaster, players, distribution ?? 'equal');
    if (isLastTurn) {
      await this.hre.ethers.provider.send('evm_increaseTime', [RInstanceSettings.RInstance_MIN_GAME_TIME + 1]);
      await this.hre.network.provider.send('evm_mine');
    }
    let isGameOver = await this.rankifyInstance.isGameOver(gameId);
    while (!isGameOver) {
      await this.makeTurn(gameId, distribution ?? 'ftw');
      isGameOver = await this.rankifyInstance.isGameOver(gameId);
    }

    this.updateGameState(gameId, GameState.Ended);
  };
  runToLastTurn = async (
    gameId: BigNumberish,
    gameMaster: SignerIdentity,
    players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
    distribution?: 'ftw' | 'semiUniform' | 'equal',
  ): Promise<void> => {
    while (!(await this.rankifyInstance.isLastTurn(gameId))) {
      await this.makeTurn(gameId, distribution ?? 'equal');
    }
    this.updateGameState(gameId, GameState.LastMove);
  };

  async endTurn(gameId: BigNumberish): Promise<void> {
    console.log('\nEnding turn for game:', gameId.toString());
    const turn = await this.rankifyInstance.getTurn(gameId);
    const turnNumber = turn.toNumber();
    const isLastTurn = await this.rankifyInstance.isLastTurn(gameId);
    const playersLength = await this.rankifyInstance.getPlayers(gameId).then(players => players.length);

    console.log('Turn number:', turnNumber);
    console.log('Is last turn:', isLastTurn);
    console.log('Number of players:', playersLength);

    // Get previous turn's shuffling
    const previousShuffling =
      this.proposalShuffling.get(Number(gameId)) || Array.from({ length: playersLength }, (_, i) => i);
    console.log('Previous shuffling:', previousShuffling);

    // Create new shuffling
    const newShuffling = Array.from({ length: playersLength }, (_, i) => i);
    for (let i = newShuffling.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newShuffling[i], newShuffling[j]] = [newShuffling[j], newShuffling[i]];
    }
    console.log('New shuffling:', newShuffling);

    // Process proposals and votes
    const proposals = this.ongoingProposals.map(p => p.proposal);
    console.log('Original proposals:', proposals);
    const shuffledProposals = newShuffling.map(i => proposals[i]);
    console.log('Shuffled proposals:', shuffledProposals);

    // Map votes
    const votes = turnNumber === 1 ? [] : this.ongoingVotes?.map(vote => vote.vote);
    console.log('Original votes:', votes);

    const mappedVotes =
      turnNumber === 1
        ? []
        : votes.map((vote, index) => {
          assert(vote.length === playersLength, 'Vote length must match players length');
          const mappedVote = new Array(playersLength).fill(0);
          previousShuffling.forEach((newIndex, oldIndex) => {
            mappedVote[newIndex] = this.ongoingVotes[index].shuffled ? vote[newIndex] : vote[oldIndex];
          });
          return mappedVote;
        });

    console.log('Mapped votes:', mappedVotes);
 
    // Store new shuffling
    if (!isLastTurn) {
      this.proposalShuffling.set(Number(gameId), newShuffling);
      console.log('Stored new shuffling for next turn');
    } else {
      await this.hre.network.provider.send('evm_increaseTime', [RInstanceSettings.RInstance_MIN_GAME_TIME + 1]);
      await this.hre.network.provider.send('evm_mine');
    }

    console.log('\nSubmitting turn end transaction...');
    console.log('Previous shuffling:', previousShuffling);
    const tx = await this.rankifyInstance
      .connect(this.adr.gameMaster1.wallet)
      .endTurn(gameId, mappedVotes, shuffledProposals, previousShuffling)
      .then(tx => tx.wait(1));
    // const receipt = await tx.wait();
    const scores = await this.rankifyInstance.getScores(gameId);
    console.log('Turn ended successfully');
    // console.log((receipt.logs[0] as any)?.args);
    console.log('Scores:', scores);
  }

  runToOvertime = async (
    gameId: BigNumberish,
    gameMaster: SignerIdentity,
    players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
  ) => {
    await this.runToLastTurn(gameId, gameMaster, players, 'equal');
    await this.makeTurn(gameId, 'equal');
    this.updateGameState(gameId, GameState.Overtime);
  };

  mockValidVotes = async (
    players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
    gameContract: RankifyDiamondInstance,
    gameId: BigNumberish,
    gameMaster: SignerIdentity,
    submitNow?: boolean,
    distribution?: 'ftw' | 'semiUniform' | 'equal',
  ) => {
    const turn = await gameContract.getTurn(gameId);
    this.ongoingVotes = await mockVotes({
      gameId: gameId,
      turn: turn,
      verifierAddress: gameContract.address,
      players: players,
      gm: gameMaster,
      distribution: distribution ?? 'semiUniform',
    });
    if (submitNow) {
      const gameMasterPK = process.env.GM_KEY || '';
      for (let i = 0; i < players.length; i++) {
        const playerVotedEvents = await gameContract.queryFilter(
          gameContract.filters.VoteSubmitted(gameId, turn, players[i].wallet.address),
        );
        if (playerVotedEvents.length === 0) {
          await gameContract
            .connect(gameMaster.wallet)
            .submitVote(gameId, this.ongoingVotes[i].voteHidden, players[i].wallet.address);
        } else {
          console.log('Player ', players[i].wallet.address, ' already voted! Replacing mock with real one');
          this.ongoingVotes[i].voteHidden = playerVotedEvents[0].args.votesHidden;
          try {
            const decryptedVote = JSON.parse(aes.decrypt(playerVotedEvents[0].args.votesHidden, gameMasterPK).toString(cryptoJs.enc.Utf8));
            console.log('Decrypted vote:', decryptedVote);
            this.ongoingVotes[i].vote = decryptedVote.map((v: string) => Number(v));
            this.ongoingVotes[i].shuffled = true;
            console.log('Decrypted and reshuffled vote:', this.ongoingVotes[i].vote);
          } catch (e) {
            console.error('Failed to decrypt vote');
          }
        }
      }
    }
    return this.ongoingVotes;
  };

  startGame = async (gameId: BigNumberish) => {
    const currentT = await this.hre.ethers.provider.getBlock('latest').then(b => b.timestamp);
    await this.hre.network.provider.send('evm_setNextBlockTimestamp', [
      currentT + Number(RInstanceSettings.RInstance_TIME_TO_JOIN) + 1,
    ]);
    await this.hre.network.provider.send('evm_mine');
    const started = await this.rankifyInstance.getTurn(gameId);
    if (started.toNumber() !== 0) {
      console.error('Game already started');
    } else {
      await this.rankifyInstance
        .connect(this.adr.gameMaster1.wallet)
        .startGame(gameId)
        .then(r => r.wait(1));
    }
    this.updateGameState(gameId, GameState.Started);
  };

  mockValidProposals = async (
    players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
    gameContract: RankifyDiamondInstance,
    gameMaster: SignerIdentity,
    gameId: BigNumberish,
    submitNow?: boolean,
  ) => {
    const turn = await gameContract.getTurn(gameId);
    const gameMasterPK = process.env.GM_KEY || '';

    this.ongoingProposals = await mockProposals({
      players: players,
      gameId: gameId,
      turn: turn,
      verifierAddress: gameContract.address,
      gmPK: gameMasterPK,
    });

    if (submitNow) {
      for (let i = 0; i < players.length; i++) {
        const playerProposedEvents = await gameContract.queryFilter(
          gameContract.filters.ProposalSubmitted(gameId, turn, this.ongoingProposals[i].params.proposer),
        );
        if (playerProposedEvents.length == 0) {
          await gameContract.connect(gameMaster.wallet).submitProposal(this.ongoingProposals[i].params);
        } else {
          console.log('Player ', players[i].wallet.address, ' already proposed! Replacing mock with real one');
          this.ongoingProposals[i].params.encryptedProposal = playerProposedEvents[0].args.proposalEncryptedByGM
          this.ongoingProposals[i].params.commitmentHash = playerProposedEvents[0].args.commitmentHash
          try {
            this.ongoingProposals[i].proposal = aes.decrypt(playerProposedEvents[0].args.proposalEncryptedByGM, gameMasterPK).toString(cryptoJs.enc.Utf8);
            console.log('Proposal decrypted: ' + this.ongoingProposals[i].proposal);
          } catch (e) {
            console.log('Failed to decrypt proposal. Probably not encrypted', e);
          }
        }
      }
    }

    return this.ongoingProposals;
  };



  fillParty = async (
    players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
    gameContract: RankifyDiamondInstance,
    gameId: BigNumberish,
    shiftTime: boolean,
    startGame?: boolean,
    gameMaster?: SignerIdentity,
  ) => {
    const promises = [];
    for (let i = 0; i < players.length; i++) {
      const playerInGame = await this.rankifyInstance.getPlayersGame(players[i].wallet.address);
      if (playerInGame.toNumber() !== 0) {
        if (playerInGame.toNumber() !== Number(gameId)) {
          console.error('Player already in another game');
          throw new Error('Player already in another game');
        }
      } else {
        if (!this.rankToken.address) throw new Error('Rank token undefined or unemployed');
        (await this.rankToken.connect(players[i].wallet).setApprovalForAll(this.rankifyInstance.address, true)).wait(1);

        promises.push(await gameContract.connect(players[i].wallet).joinGame(gameId));
      }
      await Promise.all(promises.map(p => p.wait(1)));
      if (shiftTime) {
        const currentT = await this.hre.ethers.provider.getBlock('latest').then(b => b.timestamp);
        await this.hre.network.provider.send('evm_setNextBlockTimestamp', [
          currentT + Number(RInstanceSettings.RInstance_TIME_TO_JOIN) + 1,
        ]);
        await this.hre.network.provider.send('evm_mine');
      }
      if (startGame && gameMaster) {
        (await this.rankifyInstance.connect(gameMaster.wallet).startGame(gameId)).wait(1);
      }
    }
    this.updateGameState(gameId, GameState.PartyFilled);
  };

  async getActiveGames(): Promise<number[]> {
    const state = await this.rankifyInstance.getContractState();
    const totalGames = state.numGames.toNumber();
    const activeGames: number[] = [];

    for (let i = 1; i <= totalGames; i++) {
      const isOver = await this.rankifyInstance.isGameOver(i);
      if (!isOver) {
        activeGames.push(i);
      }
    }

    return activeGames;
  }

  async makeTurn(gameId: BigNumberish, distribution: 'ftw' | 'semiUniform' | 'equal' = 'ftw'): Promise<void> {
    const gameEnded = await this.rankifyInstance.isGameOver(gameId);
    if (!gameEnded) {
      console.log('\nMaking move for game:', gameId.toString());
      const turn = await this.rankifyInstance.getTurn(gameId);
      console.log('Current turn:', turn.toString());

      const players = [this.adr.player1, this.adr.player2, this.adr.player3, this.adr.player4, this.adr.player5] as [
        SignerIdentity,
        SignerIdentity,
        ...SignerIdentity[],
      ];

      // Submit votes if not first turn
      if (turn.toNumber() !== 1) {
        console.log('Submitting votes for turn:', turn.toString());
        this.ongoingVotes = await this.mockValidVotes(
          players,
          this.rankifyInstance,
          gameId,
          this.adr.gameMaster1,
          true,
          distribution,
        );
        console.log('Votes submitted:', this.ongoingVotes.length);
      }

      // Submit proposals
      console.log('Submitting proposals...');
      this.ongoingProposals = await this.mockValidProposals(
        players,
        this.rankifyInstance,
        this.adr.gameMaster1,
        gameId,
        true,
      );
      console.log('Proposals submitted:', this.ongoingProposals.length);

      await this.endTurn(gameId);

      const isLastTurn = await this.rankifyInstance.isLastTurn(gameId);
      const isOvertime = await this.rankifyInstance.isOvertime(gameId);
      const isGameOver = await this.rankifyInstance.isGameOver(gameId);
      if (isOvertime) {
        this.updateGameState(gameId, GameState.Overtime);
      } else if (isLastTurn) {
        this.updateGameState(gameId, GameState.LastMove);
      } else if (isGameOver) {
        this.updateGameState(gameId, GameState.Ended);
      } else {
        this.updateGameState(gameId, GameState.NextMove);
      }
    }
  }

  async handleOvertime(gameId: number): Promise<void> {
    const players = [this.adr.player1, this.adr.player2, this.adr.player3] as [
      SignerIdentity,
      SignerIdentity,
      ...SignerIdentity[],
    ];
    await this.runToOvertime(gameId, this.adr.gameMaster1, players);
    this.updateGameState(gameId, GameState.Overtime);
  }

  async endGame(gameId: number): Promise<void> {
    const gameEnded = await this.rankifyInstance.isGameOver(gameId);
    if (!gameEnded) {
      const players = [this.adr.player1, this.adr.player2, this.adr.player3] as [
        SignerIdentity,
        SignerIdentity,
        ...SignerIdentity[],
      ];
      console.log('Running to the end for game:', gameId.toString());
      await this.runToTheEnd(gameId, this.adr.gameMaster1, players, 'equal');
      console.log('Game ended');
      const GameOverF = this.rankifyInstance.filters.GameOver(gameId);
      console.log('Getting game over event for game:', gameId.toString());
      const evts = await this.rankifyInstance.queryFilter(GameOverF);
      const playerAddresses = evts[0].args.players;
      const playerScores = evts[0].args.scores;
      console.log('Game over event args:', evts[0].args);
      console.log(
        'Scores:',
        playerAddresses.map((addr, i) => ({
          address: addr,
          score: playerScores[i].toString(),
        })),
      );

      // Find winner by highest score
      const winnerIndex = playerScores.reduce((maxIndex, score, i) => {
        return BigNumber.from(score).gt(BigNumber.from(playerScores[maxIndex])) ? i : maxIndex;
      }, 0);
      const winner = playerAddresses[winnerIndex];

      const gameRank = await this.rankifyInstance.getGameRank(gameId);
      const rewardBalance = await this.rankToken.balanceOf(winner, gameRank.add(1));
      console.log(`Game ${gameId} ended. Winner ${winner} received ${rewardBalance.toString()} rank tokens.`);
    }
    this.updateGameState(gameId, GameState.Ended);
  }

  async getGameState(gameId: BigNumberish): Promise<GameState> {
    return this.gameStates.get(Number(gameId)) || GameState.Created;
  }

  private updateGameState(gameId: BigNumberish, state: GameState): void {
    this.gameStates.set(Number(gameId), state);
  }

  async openRegistration(gameId: BigNumberish): Promise<void> {
    const registrationOpened = await this.rankifyInstance.isRegistrationOpen(gameId);
    if (!registrationOpened) {
      await this.rankifyInstance
        .connect(this.adr.gameCreator1.wallet)
        .openRegistration(gameId)
        .then(r => r.wait(1));
    }
    this.updateGameState(gameId, GameState.RegistrationOpened);
  }

  async runTillLastTurn(gameId: number): Promise<void> {
    const isLastTurn = await this.rankifyInstance.isLastTurn(gameId);
    if (!isLastTurn) {
      await this.runToLastTurn(
        gameId,
        this.adr.gameMaster1,
        [this.adr.player1, this.adr.player2, this.adr.player3],
        'equal',
      );
    }
  }
}
