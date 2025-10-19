"use strict";

// --- DEBUG VARIABLES -----------------------------------------------------------------------------

var DEBUG_MODE = 2;

// =============================== CONSTANTS ====================================

// Frog params
const FROG_MASS = 4.0;
const FROG_RADIUS = 24; // approximate disk radius for inertia
// Anchor in frog local coords (mouth offset from COM)
const MOUTH_OFFSET_LOCAL = { x: +20, y: 0 }; // pixels in frog's body frame

// ============================ BASE MODEL / VIEW ===============================

class PhysicsObjectModel {
  constructor({
    x = 0,
    y = 0,
    xVelocity = 0,
    yVelocity = 0,
    angle = 0,
    angularVelocity = 0,
    mass = 0,
  } = {}) {
    this.mass = mass ?? 0;
    this.invMass = this.mass > 0 ? 1 / this.mass : 0; // kinematic if 0
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.a = angle ?? 0; // radians
    this.xv = xVelocity ?? 0;
    this.yv = yVelocity ?? 0;
    this.av = angularVelocity ?? 0;

    // force accumulator (cleared every step)
    this.fx = 0;
    this.fy = 0;
  }

  get angle() {
    return this.a;
  }
  set angle(value) {
    this.a = value;
  }
  get xVelocity() {
    return this.xv;
  }
  set xVelocity(value) {
    this.xv = value;
  }
  get yVelocity() {
    return this.yv;
  }
  set yVelocity(value) {
    this.yv = value;
  }
  get angularVelocity() {
    return this.av;
  }
  set angularVelocity(value) {
    this.av = value;
  }
}

class PhysicsObjectView {
  _drawDebugInfo(x, y, model) {
    let lines = [
      `pos: (${round(x)}, ${round(y)})`,
      `v⃗: (${round(model.xVelocity, 3)}, ${round(model.yVelocity, 3)})`,
      `Θ: ${round(model.angle, 3)}`,
      `ω: ${round(model.angularVelocity, 3)}`,
    ];
    push();
    fill("white");
    noStroke();
    textSize(10);
    textAlign(LEFT, TOP);
    const topY = y - (lines.length / 2) * 12;
    for (let [i, line] of lines.entries()) {
      text(line, x, topY + i * 12);
    }
    pop();
  }
}

// =============================== FROG BODY ===================================

class FrogBodyModel extends PhysicsObjectModel {
  constructor({ x, y, angle = 0 }) {
    super({ x, y, angle, mass: FROG_MASS });
    this.radius = FROG_RADIUS;
  }
}

class FrogBodyView extends PhysicsObjectView {
  draw(model) {
    const { x, y, angle } = model;
    push();
    translate(x, y);
    rotate(angle);
    if (DEBUG_MODE === 2) {
      // body
      fill("#0f0");
      stroke(0);
      ellipse(0, 0, 2 * model.radius, 2 * model.radius);
      // heading line
      stroke(0);
      line(0, 0, model.radius, 0);
    } else {
      // TODO: your sprite here
      fill("#0f0");
      ellipse(0, 0, 2 * model.radius, 2 * model.radius);
    }
    pop();

    if (DEBUG_MODE === 2) {
      this._drawDebugInfo(x + 30, y, model);
    }
  }
}

// =============================== CONTROLLER ==================================

class Frog {
  constructor(x, y, angle = 0) {
    this.body = {
      model: new FrogBodyModel({ x, y, angle }),
      view: new FrogBodyView(),
    };
    this.mouthWorld = {
      x: x + MOUTH_OFFSET_LOCAL.x,
      y: y + MOUTH_OFFSET_LOCAL.y,
    };
  }

  draw() {
    this.body.view.draw(this.body.model);

    if (DEBUG_MODE === 2) {
      // draw mouth anchor
      push();
      stroke("#ff0");
      fill("#ff0");
      circle(this.mouthWorld.x, this.mouthWorld.y, 6);
      pop();
    }
  }
}

// ================================ P5 RUNTIME =================================

let frog;

function setup() {
  createCanvas(800, 600);
  frog = new Frog(400, 300, 0);
}

function draw() {
  background(10);
  frog.draw();
}
