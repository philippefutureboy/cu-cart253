/**
 * Data Challenge
 * 
 * Authors:
 * - Philippe Hebert
 * - Emile Bedard
 * - Joyce Lam 
 * 
 * The data challenge submission - work with structured data.
 */

"use strict";

let carData = undefined;
let dinosaurData = undefined;
let langData = undefined;
let lang = "fr";

// Starts with the instruction
let carName = "Click to generate a car name.";

/**
 * Load the car and dinosaur data
 */
function preload() {
    carData = loadJSON("assets/data/cars.json")
    dinosaurData = loadJSON("assets/data/dinosaurs.json")
}

/**
 * Create the canvas
*/
function setup() {
    createCanvas(600, 400);
    console.log("carData", carData)
    console.log("dinosaurData", dinosaurData)
}

/**
 * Display the current main text (either instructions or a car)
*/
function draw() {
    background(0);

    push();
    fill("pink");
    textAlign(CENTER, CENTER);
    textSize(32);
    text(carName, width / 2, height / 2);
    pop();
}

/**
 * Generate a new car name
 */
function mousePressed() {
    const car = round(random(0, carData.cars.length - 1));
    const dino = round(random(0, dinosaurData.dinosaurs.length - 1));

    carName = carData.cars[car] + " " + dinosaurData.dinosaurs[dino];
}