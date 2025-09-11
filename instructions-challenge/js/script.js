/**
 * Instruction Challenge
 * Authors:
 *  - Emile Bedard
 *  - Joyce Lam
 *  - Philippe Hebert
 *
 * TODO: DESCRIPTION
 */

"use strict";

let img; // variable to store the image
let opacity = 50;

// preload was written using ChatGPT 5 because we do not know the API by heart
function preload() {
  // Load the image before setup() runs
  img = loadImage("assets/images/inspo_image.jpg");
}

function setup() {
  createCanvas(600, 800);
}

function draw() {
  background(0);
  // Draw the image at position (0,0) with resizing 600,800 to match canvas
  image(img, 0, 0, 600, 800);
  drawForest();
  drawSky();
  drawRoad();
}

/**
 * Function to draw road in the lower half of the canvas
 */
function drawSky() {
  push();
  fill(color(118, 180, 219, 255));
  noStroke();
  beginShape();
  // vertex declarations in counter-clockwise order
  // to start from the 0,0 towards n,n
  vertex(0, 0);
  vertex(0, 140);
  vertex(230, 360);
  vertex(300, 360);
  vertex(600, 0);

  // vertex(600, 0);
  endShape(CLOSE);
  // rect(0, 0, 600, 430);
  pop();
}

/**
 * Function to draw the forest
 */
function drawForest() {
  push();
  fill(color(87, 105, 73, 255));
  noStroke();
  rect(0, 0, 600, 800);
  pop();
}

/**
 * Function to draw road in the lower half of the canvas
 */
function drawRoad() {
  push();
  fill(color(129, 148, 145, opacity));
  noStroke();
  rect(0, 430, 600, 400);
  pop();
}
