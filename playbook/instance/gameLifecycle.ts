import { DAODistributor, RankifyDiamondInstance, RankToken } from '../../types';
import { task } from 'hardhat/config';
import inquirer from 'inquirer';
import { InstanceBase, GameState } from './InstanceBase';
import { setupPlaybook } from '../utils';
import { SignerIdentity } from '../utils';

type GameAction = 'openRegistration' | 'fillParty' | 'startGame' | 'nextMove' | 'lastMove' | 'overtime' | 'endGame';

const actionStateMap: Record<GameAction, GameState> = {
  openRegistration: GameState.Created,
  fillParty: GameState.RegistrationOpened,
  startGame: GameState.PartyFilled,
  nextMove: GameState.NextMove,
  lastMove: GameState.LastMove,
  overtime: GameState.Overtime,
  endGame: GameState.Ended,
};

async function getAvailableActions(gameState: GameState): Promise<string[]> {
  const allActions = ['openRegistration', 'fillParty', 'startGame', 'nextMove', 'lastMove', 'overtime', 'endGame'];

  const stateToIndex: Record<GameState, number> = {
    [GameState.Created]: 0,
    [GameState.RegistrationOpened]: 1,
    [GameState.PartyFilled]: 2,
    [GameState.Started]: 3,
    [GameState.NextMove]: 3, // Same as Started
    [GameState.LastMove]: 5,
    [GameState.Overtime]: 6,
    [GameState.Ended]: 7,
  };

  const index = stateToIndex[gameState];
  return index === undefined ? ['back to game selection'] : allActions.slice(index);
}

async function executeActionWithIntermediateSteps(
  instanceBase: InstanceBase,
  gameId: number,
  targetAction: string,
  currentState: GameState,
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
) {
  // Execute single action and wait for state update
  async function executeAndWaitForState(action: GameAction) {
    console.log(`Executing step: ${action}`);
    await executeSingleAction(instanceBase, gameId, action, players);
    // Wait for state update and verify
    const newState = await instanceBase.getGameState(gameId);
    console.log(`State updated to: ${GameState[newState]}`);
  }

  // If the target action is the same as current state's action, just execute it
  if (actionStateMap[targetAction as GameAction] === currentState) {
    await executeAndWaitForState(targetAction as GameAction);
    return;
  }

  // For progression, execute only if state matches expectations
  switch (currentState) {
    case GameState.Created:
      await executeAndWaitForState('openRegistration');
      await executeActionWithIntermediateSteps(
        instanceBase,
        gameId,
        targetAction,
        await instanceBase.getGameState(gameId),
        players,
      );
      break;
    case GameState.RegistrationOpened:
      await executeAndWaitForState('fillParty');
      await executeActionWithIntermediateSteps(
        instanceBase,
        gameId,
        targetAction,
        await instanceBase.getGameState(gameId),
        players,
      );
      break;
    case GameState.PartyFilled:
      await executeAndWaitForState('startGame');
      await executeActionWithIntermediateSteps(
        instanceBase,
        gameId,
        targetAction,
        await instanceBase.getGameState(gameId),
        players,
      );
      break;
    case GameState.Started:
      if (targetAction === 'nextMove') {
        await executeAndWaitForState('nextMove');
        break;
      }
    // eslint-disable-next-line no-fallthrough
    case GameState.NextMove:
    case GameState.LastMove:
      if (targetAction === 'lastMove') {
        await executeAndWaitForState('lastMove');
        break;
      }
    // eslint-disable-next-line no-fallthrough
    case GameState.Overtime:
      await executeAndWaitForState('endGame');
      break;
    case GameState.Ended:
      break;
  }
}

async function executeSingleAction(
  instanceBase: InstanceBase,
  gameId: number,
  action: GameAction,
  players: [SignerIdentity, SignerIdentity, ...SignerIdentity[]],
) {
  switch (action) {
    case 'openRegistration':
      await instanceBase.openRegistration(gameId);
      console.log('Registration opened successfully');
      break;
    case 'fillParty':
      await instanceBase.fillParty(
        players,
        instanceBase.rankifyInstance,
        gameId,
        true,
        false,
        instanceBase.adr.gameMaster1,
      );
      console.log('Party filled successfully');
      break;
    case 'startGame':
      await instanceBase.startGame(gameId);
      console.log('Game started successfully');
      break;
    case 'nextMove':
      await instanceBase.makeTurn(gameId);
      console.log('Next move completed');
      break;
    case 'lastMove':
      await instanceBase.runTillLastTurn(gameId);
      console.log('Last move completed');
      break;
    case 'overtime':
      await instanceBase.handleOvertime(gameId);
      console.log('Overtime handled');
      break;
    case 'endGame':
      await instanceBase.endGame(gameId);
      console.log('Game ended successfully');
      break;
  }
}

async function handleGameState(instanceBase: InstanceBase, gameId: number) {
  let continueGame = true;
  const players = [
    instanceBase.adr.player1,
    instanceBase.adr.player2,
    instanceBase.adr.player3,
    instanceBase.adr.player4,
    instanceBase.adr.player5,
  ] as [SignerIdentity, SignerIdentity, ...SignerIdentity[]];

  while (continueGame) {
    const currentState = await instanceBase.getGameState(gameId);
    const availableActions = await getAvailableActions(currentState);

    const { action } = await inquirer.prompt({
      type: 'list',
      name: 'action',
      message: `Game ${gameId} (${GameState[currentState]}) - What would you like to do?`,
      choices: [...availableActions, 'back to game selection'],
    });

    if (action === 'back to game selection') {
      continueGame = false;
      continue;
    }

    try {
      await executeActionWithIntermediateSteps(instanceBase, gameId, action, currentState, players);
      if (action === 'endGame') {
        continueGame = false;
      }
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
    }
  }
}

task('gameLifecycle', 'Interactive guide through the game lifecycle').setAction(async (_, hre) => {
  const setupEnv = await setupPlaybook(hre);
  hre.tracer.enabled = true;
  const { ethers } = hre;
  // Initial setup
  const DAODistributor = await hre.deployments.get('DAODistributor');
  const distributorContract = new hre.ethers.Contract(
    DAODistributor.address,
    DAODistributor.abi,
    hre.ethers.provider,
  ) as DAODistributor;

  const numInstances = await distributorContract.numInstances();
  if (numInstances.gt(0)) {
    console.log('Distributor already has instances, skipping distribution creation');
  } else {
    const distribution = await hre.run('addDistribution');
    console.log('Distribution added, Distributors Id:', distribution.distributorsId);
  }

  const subject = await hre.run('createSubject');
  console.log('Subject created with instances:', subject.instances);

  const instanceBase = new InstanceBase(
    setupEnv.env,
    setupEnv.adr,
    (await ethers.getContractAt(
      'RankifyDiamondInstance',
      subject.instancesParsed.ACIDInstance,
    )) as RankifyDiamondInstance,
    (await ethers.getContractAt('RankToken', subject.instancesParsed.rankToken)) as RankToken,
    hre,
  );

  let exitProgram = false;
  while (!exitProgram) {
    const { action } = await inquirer.prompt({
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: ['Create new game', 'Select existing game', 'Exit'],
    });

    switch (action) {
      case 'Create new game': {
        const gameId = await instanceBase.createGame(
          instanceBase.adr.gameCreator1,
          instanceBase.adr.gameMaster1.wallet.address,
          1,
          false,
        );
        console.log('Game created with ID:', gameId);
        const { manage } = await inquirer.prompt({
          type: 'confirm',
          name: 'manage',
          message: 'Would you like to manage this game now?',
        });
        if (manage) {
          await handleGameState(instanceBase, Number(gameId));
        }
        break;
      }
      case 'Select existing game': {
        const games = await instanceBase.getActiveGames();
        if (games.length === 0) {
          console.log('No active games found');
          continue;
        }
        const { gameId } = await inquirer.prompt({
          type: 'list',
          name: 'gameId',
          message: 'Select a game to manage:',
          choices: games.map(id => ({
            name: `Game ${id}`,
            value: id,
          })),
        });
        await handleGameState(instanceBase, gameId);
        break;
      }
      case 'Exit':
        exitProgram = true;
        break;
    }
  }
});
