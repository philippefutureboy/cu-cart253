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
let opacity = 255;

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
  opacity = 255;
  opacity = Math.round(255 * (mouseX / 600));
  drawForest();
  drawSky();
  drawRoad();
}

/**
 * Function to draw road in the lower half of the canvas
 */
function drawSky() {
  push();
  fill(color(118, 180, 219, opacity));
  noStroke();
  beginShape();
  // vertex declarations in counter-clockwise order
  // to start from the 0,0 towards n,n
  vertex(0, 0);
  vertex(0, 140);
  vertex(230, 360);
  vertex(300, 360);
  vertex(330, 310);
  vertex(450, 280);
  vertex(500, 200);
  vertex(600, 180);
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
  fill(color(87, 105, 73, opacity));
  noStroke();
  rect(0, 0, 600, 800);
  pop();
}

/**
 * Function to draw road in the lower half of the canvas
 */
function drawRoad() {
  drawAsphalt();
  drawRoadLine();
}

function drawAsphalt() {
  push();
  fill(color(129, 148, 145, opacity));
  noStroke();
  beginShape();
  // vertex declarations in counter-clockwise order
  // to start from the 0,0 towards n,n
  vertex(0, 800);
  vertex(0, 660);
  vertex(210, 430);
  vertex(280, 430);
  vertex(600, 800);

  // vertex(600, 0);
  endShape(CLOSE);
  pop();
}

function drawRoadLine() {
  push();
  stroke(color(236, 190, 105, opacity));
  strokeWeight(9);
  strokeCap(SQUARE);
  line(242, 432, 210, 800);
  line(257, 432, 265, 800);
  pop();
}
