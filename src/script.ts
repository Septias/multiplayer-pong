import {
  MessageType,
  PaddleMoveMessage,
  game_over,
  sendGossip,
  set_ready,
} from "./backend";

// Canvas Related
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d")!;

let referee = "";
let opponent = "";

let paddleIndex = 0;

let width = 500;
let height = 700;

// Paddle
let paddleHeight = 10;
let paddleWidth = 50;
let paddleDiff = 25;
let paddleX = [225, 225];
let trajectoryX = [0, 0];
let playerMoved = false;

// Ball
let ballX = 250;
let ballY = 350;
let ballRadius = 5;
let ballDirection = 1;

// Speed
let speedY = 2;
let speedX = 0;

// Score for Both Players
let score = [0, 0];
let exit = false;

// Create Canvas Element
function createCanvas() {
  canvas.id = "canvas";
  canvas.width = width;
  canvas.height = height;
  document.body.appendChild(canvas);
}

// Wait for Opponents
function renderIntro() {
  // Canvas Background
  context.fillStyle = "black";
  context.fillRect(0, 0, width, height);

  // Intro Text
  context.fillStyle = "white";
  context.font = "32px Courier New";
  context.fillText("Waiting for opponent...", 20, canvas.height / 2 - 30);
}

// Render Everything on Canvas
function renderCanvas() {
  // Canvas Background
  context.fillStyle = "black";
  context.fillRect(0, 0, width, height);

  // Paddle Color
  context.fillStyle = "white";

  // Bottom Paddle
  context.fillRect(paddleX[0], height - 20, paddleWidth, paddleHeight);

  // Top Paddle
  context.fillRect(paddleX[1], 10, paddleWidth, paddleHeight);

  // Dashed Center Line
  context.beginPath();
  context.setLineDash([4]);
  context.moveTo(0, 350);
  context.lineTo(500, 350);
  context.strokeStyle = "grey";
  context.stroke();

  // Ball
  context.beginPath();
  context.arc(ballX, ballY, ballRadius, 2 * Math.PI, 0);
  context.fillStyle = "white";
  context.fill();

  // Score
  context.font = "32px Courier New";
  context.fillText(score[0].toString(), 20, canvas.height / 2 + 50);
  context.fillText(score[1].toString(), 20, canvas.height / 2 - 30);
}

// Reset Ball to Center
function ballReset() {
  ballX = width / 2;
  ballY = height / 2;
  sendGossip({ type: MessageType.BallMove, ballX, ballY, score });
}

// Adjust Ball Movement
function ballMove() {
  // Vertical Speed
  ballY += speedY * ballDirection;
  // Horizontal Speed
  if (playerMoved) {
    ballX += speedX;
  }

  sendGossip({ type: MessageType.BallMove, ballX, ballY, score });
}

// Determine What Ball Bounces Off, Score Points, Reset Ball
function ballBoundaries() {
  // Bounce off Left Wall
  if (ballX < 0 && speedX < 0) {
    speedX = -speedX;
  }
  // Bounce off Right Wall
  if (ballX > width && speedX > 0) {
    speedX = -speedX;
  }
  // Bounce off player paddle (bottom)
  if (ballY > height - paddleDiff) {
    if (ballX >= paddleX[0] && ballX <= paddleX[0] + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 1;
        // Max Speed
        if (speedY > 4) {
          speedY = 4;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[0] = ballX - (paddleX[0] + paddleDiff);
      speedX = trajectoryX[0] * 0.2;
    } else {
      // Reset Ball, add to Computer Score
      ballReset();
      score[1]++;
    }
  }
  // Bounce off computer paddle (top)
  if (ballY < paddleDiff) {
    if (ballX >= paddleX[1] && ballX <= paddleX[1] + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 1;
        // Max Speed
        if (speedY > 4) {
          speedY = 4;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[1] = ballX - (paddleX[1] + paddleDiff);
      speedX = trajectoryX[1] * 0.2;
    } else {
      ballReset();
      score[0]++;
    }
  }
  if (score[0] >= 5 || score[1] >= 5) {
    game_over(
      score[0] > score[1] ? referee : opponent,
      score[0] < score[1] ? referee : opponent
    );
  }
}
var req: number;
// Called Every Frame
function animate() {
  if (referee == window.webxdc.selfAddr) {
    ballMove();
    ballBoundaries();
  }
  renderCanvas();
  if (!exit) {
    req = requestAnimationFrame(animate);
  }
}

// Load Game, Reset Everything
function loadGame() {
  createCanvas();
  renderIntro();
}

function listener(e: any) {
  playerMoved = true;
  paddleX[paddleIndex] = e.offsetX;
  if (paddleX[paddleIndex] < 0) {
    paddleX[paddleIndex] = 0;
  }
  if (paddleX[paddleIndex] > width - paddleWidth) {
    paddleX[paddleIndex] = width - paddleWidth;
  }
  sendGossip({
    type: MessageType.PaddleMove,
    xPosition: paddleX[paddleIndex],
    player: paddleIndex,
  });
  // Hide Cursor
  canvas.style.cursor = "none";
}
function startGame() {
  exit = false;
  if (referee == window.webxdc.selfAddr) {
    paddleIndex = 0;
  } else if (opponent == window.webxdc.selfAddr) {
    paddleIndex = 1;
  }
  requestAnimationFrame(animate);
  if (referee == window.webxdc.selfAddr || opponent == window.webxdc.selfAddr) {
    canvas.addEventListener("mousemove", listener);
  }
}

// On Load
loadGame();

export function doStartGame(refereeId: string, opponentId: string) {
  console.log(`referee: ${refereeId} \n player: ${opponentId}`);
  referee = refereeId;
  opponent = opponentId;
  startGame();
}

export function doPaddleMove({ xPosition, player }: PaddleMoveMessage) {
  paddleX[player] = xPosition;
}

export function doBallMove(ballData: any): void {
  ({ ballX, ballY, score } = ballData);
}

export function doEndGame() {
  exit = true;
  cancelAnimationFrame(req);
  requestAnimationFrame(renderIntro);

  referee = "";
  opponent = "";
  paddleIndex = 0;
  paddleX = [225, 225];
  ballX = 250;
  ballY = 350;
  ballRadius = 5;
  ballDirection = 1;

  speedY = 2;
  speedX = 0;
  score = [0, 0];
  console.log("ending game", req);

  canvas.removeEventListener("mousemove", listener);
  renderIntro();
  set_ready();
}
