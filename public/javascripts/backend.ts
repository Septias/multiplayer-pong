import { doBallMove, paddleMove, doStartGame } from "./script";

let readyPlayerCount = 0;
let playing = false;

export enum MessageType {
  Ready,
  StartGame,
  PaddleMove,
  BallMove,
  Disconnect,
}

// Player is ready
interface ReadyMessage {
  type: MessageType.Ready;
}

function isReadyMessage(msg: any): msg is ReadyMessage {
  return msg.type === MessageType.Ready;
}

interface startGameMessage {
  type: MessageType.StartGame;
  refereeId: string;
}

function isStartGameMessage(msg: any): msg is startGameMessage {
  return msg.type === MessageType.StartGame;
}

// Paddle moves
interface PaddleMoveMessage {
  type: MessageType.PaddleMove;
  xPosition: number;
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

// Disconnect
interface DisconnectMessage {
  type: MessageType.Disconnect;
}

function isDisconnectMessage(msg: any): msg is DisconnectMessage {
  return msg.type === MessageType.Disconnect;
}

type messages =
  | ReadyMessage
  | BallMoveMessage
  | PaddleMoveMessage
  | startGameMessage;

window.webxdc.setEphemeralUpdateListener(function (update: messages) {
  if (isReadyMessage(update)) {
    console.log("Player ready");
    readyPlayerCount++;

    if (readyPlayerCount % 2 === 0) {
      sendGossip({
        type: MessageType.StartGame,
        refereeId: window.webxdc.selfAddr,
      });
      doStartGame(window.webxdc.selfAddr);
    }
  } else if (isStartGameMessage(update)) {
    console.log("Game starting");
    doStartGame(update.refereeId);
  } else if (isPaddleMoveMessage(update)) {
    console.log("Paddle moving");
    paddleMove(update);
  } else if (isBallMoveMessage(update)) {
    console.log("Ball moving");
    doBallMove(update);
  } else if (isDisconnectMessage(update)) {
    console.log("Player disconnected");
    playing = false;
  }
});

export function sendGossip(message: messages) {
  window.webxdc.sendEphemeralUpdate(message);
}
