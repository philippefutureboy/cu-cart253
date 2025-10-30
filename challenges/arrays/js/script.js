/**
 * Boingo // Arrays Challenge
 * Authors:
 *   - Philippe Hebert
 *   - Ash Oest O'Leary
 *   - Ima Williams
 *   - Pippin Barr
 * 
 * A ball that bounces around on the canvas
 */

"use strict";

let ball1 = undefined; // Will create it with createBall()

/**
 * Create the canvas and the ball
 */
function setup() {
  // Create the canvas
  createCanvas(400, 400);
  // Create the ball
  ball1 = createBall();
}

/**
 * Creates a random ball
 */
function createBall() {
  // Create a ball object with appropriate properties
  const newBall = {
    // Position and dimensions
    x: 200,
    y: 200,
    size: 20,
    // Colour
    fill: "#000000",
    // Movement
    velocity: {
      x: random(-5, 5),
      y: random(-5, 5)
    }
  };
  return newBall;
}

/**
 * Moves and draws the ball
 */
function draw() {
  background("#87ceeb");
  
  moveBall();
  bounceBall();
  drawBall();
}

/**
 * Moves the ball according to its velocity
 */
function moveBall() {
  ball1.x += ball1.velocity.x;
  ball1.y += ball1.velocity.y;
}

/**
 * Bounces the ball off the walls
 */
function bounceBall() {
  // Check if the ball has reached the left or right
  const bounceX = (ball1.x > width || ball1.x < 0);
  // Check if the ball has reached the top or bottom
  const bounceY = (ball1.y > height || ball1.y < 0);
  
  // Handle bouncing horizontally
  if (bounceX) {
    ball1.velocity.x *= -1;
  }
  // Handle bouncing vertically
  if (bounceY) {
    ball1.velocity.y *= -1;
  }
}

/**
 * Draw the ball on the canvas
 */
function drawBall() {
  push();
  noStroke();
  fill(ball1.fill);
  ellipse(ball1.x, ball1.y, ball1.size);
  pop();
}
