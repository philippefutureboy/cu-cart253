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
}
