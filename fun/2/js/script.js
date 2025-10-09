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
};

function setup() {
  createCanvas(800, 800);
  frameRate(FRAME_RATE);
}

function draw() {
  // move once per half second
  if (Math.floor(frameCount % MOVE_RATE) === 0 && user.moves.length !== 0) {
    switch (user.moves.at(0)) {
      case "down":
        user.gy = constrain(user.gy + 1, 0, gridSize[1]);
        break;
      case "up":
        user.gy = constrain(user.gy - 1, 0, gridSize[1]);
        break;
      case "left":
        user.gx = constrain(user.gx - 1, 0, gridSize[0]);
        break;
      case "right":
        user.gx = constrain(user.gx + 1, 0, gridSize[0]);
        break;
      default:
        break;
    }
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
  if (key === "ArrowDown") {
    user.moves.unshift("down");
  } else if (key === "ArrowUp") {
    user.moves.unshift("up");
  } else if (key === "ArrowLeft") {
    user.moves.unshift("left");
  } else if (key === "ArrowRight") {
    user.moves.unshift("right");
  }
}

function keyReleased() {
  user.moves.pop();
}
