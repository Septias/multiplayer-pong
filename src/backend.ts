import { doBallMove, doPaddleMove, doStartGame, doEndGame } from "./script";

export enum MessageType {
  Ready,
  StartGame,
  PaddleMove,
  BallMove,
  GameOver,
}

// Player is ready
interface ReadyMessage {
  type: MessageType.Ready;
  player: string;
}

function isReadyMessage(msg: any): msg is ReadyMessage {
  return msg.type === MessageType.Ready;
}

interface startGameMessage {
  type: MessageType.StartGame;
  refereeId: string;
  opponent: string;
}

function isStartGameMessage(msg: any): msg is startGameMessage {
  return msg.type === MessageType.StartGame;
}

// Paddle moves
export interface PaddleMoveMessage {
  type: MessageType.PaddleMove;
  xPosition: number;
  player: number;
}

function isPaddleMoveMessage(msg: any): msg is PaddleMoveMessage {
  return msg.type === MessageType.PaddleMove;
}

// Ball moves
interface BallMoveMessage {
  type: MessageType.BallMove;
  ballX: number;
  ballY: number;
  score: number[];
}

function isBallMoveMessage(msg: any): msg is BallMoveMessage {
  return msg.type === MessageType.BallMove;
}

// Game Over
interface GameOverMessage {
  type: MessageType.GameOver;
  winner: string;
}

function isGameOverMessage(msg: any): msg is GameOverMessage {
  return msg.type === MessageType.GameOver;
}

type messages =
  | ReadyMessage
  | BallMoveMessage
  | PaddleMoveMessage
  | startGameMessage
  | GameOverMessage;

let players: string[] = [];
let referee: string = window.webxdc.selfAddr;

window.webxdc.setEphemeralUpdateListener(function (update: messages) {
  if (isReadyMessage(update)) {
    players.push(update.player);
    console.log("Player ready", players);

    if (referee == window.webxdc.selfAddr && players.length >= 2) {
      let opponents = players.splice(0, 2);
      sendGossip({
        type: MessageType.StartGame,
        refereeId: opponents[0],
        opponent: opponents[1],
      });
      referee = opponents[0];
      doStartGame(opponents[0], opponents[1]);
    }
  } else if (isStartGameMessage(update)) {
    console.log("Game starting");
    referee = update.refereeId;
    doStartGame(update.refereeId, update.opponent);
  } else if (isPaddleMoveMessage(update)) {
    referee = "";
    doPaddleMove(update);
  } else if (isBallMoveMessage(update)) {
    referee = "";
    doBallMove(update);
  } else if (isGameOverMessage(update)) {
    referee = "";
    console.log("Game Over");
    doEndGame();
  } else {
    console.log("Unknown message", update);
  }
});

// let timeout = false;
export function sendGossip(message: messages) {
  /* if (timeout) {
    return;
  }
  timeout = true;
  setTimeout(() => {
    timeout = false;
  }, 5); */
  window.webxdc.sendEphemeralUpdate(message);
}

export function set_ready() {
  players.push(window.webxdc.selfAddr);
  sendGossip({ type: MessageType.Ready, player: window.webxdc.selfAddr });
}

export function game_over(winner: string, loser: string) {
  let info = `${winner} won against ${loser}`;
  window.webxdc.sendUpdate({ info, payload: null }, info);
  sendGossip({ type: MessageType.GameOver, winner });
  doEndGame();

  if (players.length >= 2) {
    let opponents = players.splice(0, 2);
    console.log("Refree started new game between", opponents);
    sendGossip({
      type: MessageType.StartGame,
      refereeId: opponents[0],
      opponent: opponents[1],
    });
    doStartGame(opponents[0], opponents[1]);
  } else {
    console.log("Waiting for players");
  }
}
