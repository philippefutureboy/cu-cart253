"use strict";

const grid = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];
const FRAME_RATE = 60;
const MOVE_RATE = 30; // every half a second
const gridSize = [grid[0].length, grid.length];
const user = {
  moves: [],
  gx: 0,
  gy: 0,

  addMove(direction) {
    this.moves.push(direction);
  },

  applyMove(arrowKeysDown) {
    switch (this.moves.at(-1)) {
      case "down":
        this.gy = constrain(this.gy + 1, 0, gridSize[1]);
        break;
      case "up":
        this.gy = constrain(this.gy - 1, 0, gridSize[1]);
        break;
      case "left":
        this.gx = constrain(this.gx - 1, 0, gridSize[0]);
        break;
      case "right":
        this.gx = constrain(this.gx + 1, 0, gridSize[0]);
        break;
      default:
        break;
    }
    // clear the moves, but keep the direction if the arrow key is down
    this.moves = this.moves.filter((move) => arrowKeysDown[move]);
  },
};

function setup() {
  createCanvas(800, 800);
  frameRate(FRAME_RATE);
}

function draw() {
  // move once per half second
  if (Math.floor(frameCount % MOVE_RATE) === 0 && user.moves.length !== 0) {
    user.applyMove({
      down: keyIsDown(DOWN_ARROW),
      up: keyIsDown(UP_ARROW),
      left: keyIsDown(LEFT_ARROW),
      right: keyIsDown(RIGHT_ARROW),
    });
  }

  background("#808080");

  const dw = width / gridSize[0];
  const dh = height / gridSize[1];
  rectMode(CENTER);

  for (let i = 0; i < gridSize[0]; i += 1) {
    for (let j = 0; j < gridSize[1]; j += 1) {
      const isUserHere = user.gx == i && user.gy == j;
      stroke(isUserHere ? "#a0a0a0" : "#c0c0c0");
      fill(isUserHere ? "#a0a0a0" : "#c0c0c0");
      rect(i * dw + dw / 2, j * dh + dh / 2, dw - 4, dh - 4, 8);
      fill(isUserHere ? "#dcdcdc" : "#f0f0f0");
      rect(i * dw + dw / 2, j * dh + dh / 2, dw - 16, dh - 16, 8);
      if (user.gx == i && user.gy == j) {
        fill(0);
        ellipse(i * dw + dw / 2, j * dh + dh / 2, dw / 3, dh / 3);
      }
    }
  }
}

function keyPressed() {
  if (key.startsWith("Arrow")) {
    const direction = key.substring(5).toLowerCase();
    user.addMove(direction);
  }
}
