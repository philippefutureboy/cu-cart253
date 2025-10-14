"use strict";

const WIDTH = 400;
const HEIGHT = 400;
const FRAME_RATE = 60;
const DEFAULT_MOVE_RATE = 20;
const MOVE_SPEED = 20;

let play = false;

let food = {
  size: 16,
  x: WIDTH / 2,
  y: align(HEIGHT / 8, MOVE_SPEED),
};

const snake = {
  x: [WIDTH / 2, WIDTH / 2],
  y: [HEIGHT / 2, HEIGHT / 2 + MOVE_SPEED],
  positions: new Set([
    `${WIDTH / 2},${HEIGHT / 2}`,
    `${WIDTH / 2},${HEIGHT / 2 + MOVE_SPEED}`,
  ]),
  size: MOVE_SPEED,
  length: 2,
  moveRate: DEFAULT_MOVE_RATE,
  lastDirection: "up",
  requestedDirections: [],

  addKeyPress(direction) {
    this.requestedDirections.push(direction);
  },

  head() {
    return [this.x[0], this.y[0]];
  },

  move(arrowKeysDown, { width, height }) {
    const requestedDirection = this.requestedDirections.at(-1);
    // register that this is the direction we want to go in
    // if the user requests the direction where the "neck" of the snake
    // is (previous head), ignore that request
    const direction =
      requestedDirection === invertDirection(this.lastDirection)
        ? null
        : requestedDirection;

    // clear the requestedDirections if not currently pressed
    this.requestedDirections = this.requestedDirections.filter(
      (direction) => arrowKeysDown[direction]
    );

    let headX, headY, tailX, tailY;
    switch (direction ?? this.lastDirection) {
      case "down":
        headX = this.x[0];
        headY = this.y[0] + MOVE_SPEED;
        this.lastDirection = "down";
        break;
      case "up":
        headX = this.x[0];
        headY = this.y[0] - MOVE_SPEED;
        this.lastDirection = "up";
        break;
      case "left":
        headX = this.x[0] - MOVE_SPEED;
        headY = this.y[0];
        this.lastDirection = "left";
        break;
      case "right":
        headX = this.x[0] + MOVE_SPEED;
        headY = this.y[0];
        this.lastDirection = "right";
        break;
      default:
        break;
    }

    headX = loopAround(headX, 0, width);
    headY = loopAround(headY, 0, height);

    // add the new head
    this.x.unshift(headX);
    this.y.unshift(headY);

    // remove the tail to avoid lengthening on each move
    if (this.length < this.x.length) {
      tailX = this.x.pop();
      tailY = this.y.pop();
    }
    this.positions.delete(`${tailX},${tailY}`);
  },
};

function setup() {
  createCanvas(WIDTH, HEIGHT);
  frameRate(FRAME_RATE);
}

function draw() {
  background(0);
  // push();
  // noStroke();
  // fill(0);
  // rectMode(CORNER);
  // rect(
  //   0 + snake.size / 2,
  //   0 + snake.size / 2,
  //   width - snake.size,
  //   height - snake.size
  // );
  // pop();

  if (!play) {
    return;
  }

  // move once per half second
  if (Math.floor(frameCount % snake.moveRate) === 0) {
    snake.move(
      {
        down: keyIsDown(DOWN_ARROW),
        up: keyIsDown(UP_ARROW),
        left: keyIsDown(LEFT_ARROW),
        right: keyIsDown(RIGHT_ARROW),
      },
      { width, height }
    );
    // if the head is already in the occupied positions, we game over
    if (snake.positions.has(`${snake.head()}`)) {
      throw Error();
      // else we add the head to the set of occupied positions
    } else {
      snake.positions.add(`${snake.head()}`);
    }
  }

  if (snake.x[0])
    if (food.x === snake.x[0] && food.y === snake.y[0]) {
      snake.length += 1;
      snake.moveRate = Math.max(
        DEFAULT_MOVE_RATE - 2 * Math.floor(snake.length / 4),
        5
      );
      do {
        food.x = align(random(snake.size, width - snake.size), snake.size);
        food.y = align(random(snake.size, height - snake.size), snake.size);
      } while (snake.positions.has(`${food.x},${food.y}`));
    }

  rectMode(CENTER);

  push();
  fill("yellow");
  ellipse(food.x, food.y, food.size, food.size);
  pop();

  push();
  noStroke();
  fill("red");
  for (let i = 0; i < snake.length; i++) {
    rect(snake.x[i], snake.y[i], snake.size - 2, snake.size - 2, 2);
  }
  pop();
}

function keyPressed() {
  if (key.startsWith("Arrow")) {
    const direction = key.substring(5).toLowerCase();
    snake.addKeyPress(direction);
  } else if (key === " ") {
    play = !play;
  }
}

function align(value, increment) {
  const deltaFromIncrement = value % increment;
  if (deltaFromIncrement >= 0.5 * increment) {
    return value - (value % increment) + increment;
  }
  return value - (value % increment);
}

function invertDirection(direction) {
  switch (direction) {
    case "up":
      return "down";
    case "down":
      return "up";
    case "left":
      return "right";
    case "right":
      return "left";
    default:
      throw new Error(`Invalid value: ${direction}`);
  }
}

function loopAround(value, min, max) {
  if (value < min) {
    return max;
  }
  if (value > max) {
    return min;
  }

  return value;
}
