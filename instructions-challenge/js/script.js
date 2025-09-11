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
  drawRoad();
  // fill(color(118, 180, 219, 50));
}

/**
 * Function to draw road in the lower half of the canvas
 */
function drawRoad() {
  push();
  fill(color(129, 148, 145, 50));
  noStroke();
  rect(0, 430, 600, 400);
  pop();
}
