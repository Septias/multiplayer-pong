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
  queue: string[];
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
let opponent: string = "";

let realtime = window.webxdc.joinRealtimeChannel();
let timout: number; // used to timeout if referee leaves (edge case)
let playing = false;

let enc = new TextEncoder();
let dec = new TextDecoder();

players.push(window.webxdc.selfAddr);
sendGossip({ type: MessageType.Ready, player: window.webxdc.selfAddr });

let interval = setInterval(() => {
  sendGossip({ type: MessageType.Ready, player: window.webxdc.selfAddr });
}, 500);

function maybe_start_game() {
  if (referee == window.webxdc.selfAddr && players.length >= 2 && !playing) {
    let opponents = players.splice(0, 2);
    sendGossip({
      type: MessageType.StartGame,
      refereeId: opponents[0],
      opponent: opponents[1],
      queue: players,
    });
    referee = opponents[0];
    playing = true;
    doStartGame(opponents[0], opponents[1]);
  }
}

realtime.setListener((enc_msg: Uint8Array) => {
  let update = JSON.parse(dec.decode(enc_msg));
  clearInterval(interval);

  if (isReadyMessage(update)) {
    // stop interval
    if (players.find((p) => p === update.player)) {
      return;
    }
    console.log("Player added", update.player);
    players.push(update.player);
    maybe_start_game();
  } else if (isStartGameMessage(update)) {
    playing = true;
    console.log("Game starting");
    referee = update.refereeId;
    opponent = update.opponent;
    players = update.queue;
    doStartGame(update.refereeId, update.opponent);
  } else if (isPaddleMoveMessage(update)) {
    doPaddleMove(update);
  } else if (isBallMoveMessage(update)) {
    // ball moves are supposed to be spammed by the referee
    if (window.webxdc.selfAddr === opponent) {
      console.log("opponent");

      clearTimeout(timout);
      timout = setTimeout(() => {
        console.log("game timeout");
        referee = window.webxdc.selfAddr;
        doEndGame();
        maybe_start_game();
      }, 500);
    }
    referee = "";
    doBallMove(update);
  } else if (isGameOverMessage(update)) {
    console.log("Game Over");
    doEndGame();
  } else {
    console.log("Unknown message", update);
  }
});

export function sendGossip(message: messages) {
  realtime.send(enc.encode(JSON.stringify(message)));
}

export function set_ready() {
  players.push(window.webxdc.selfAddr);
  sendGossip({ type: MessageType.Ready, player: window.webxdc.selfAddr });
}

export function game_over(winner: string, loser: string) {
  let info = `${winner} won against ${loser}`;
  window.webxdc.sendUpdate({ info, payload: null }, info);
  doEndGame();
  sendGossip({ type: MessageType.GameOver, winner });
  if (players.length >= 2) {
    let opponents = players.splice(0, 2);
    console.log("Refree started new game between", opponents);
    sendGossip({
      type: MessageType.StartGame,
      refereeId: opponents[0],
      opponent: opponents[1],
      queue: players,
    });
    doStartGame(opponents[0], opponents[1]);
  } else {
    playing = false;
    console.log("Waiting for players");
  }
}
