"use strict";

// --- DEBUG VARIABLES -----------------------------------------------------------------------------
var DEBUG_MODE = 2;

// =============================== CONSTANTS ====================================
const FIXED_DT = 1 / 60; // seconds per physics step (deterministic)
const MAX_SUBSTEPS = 2; // cap to avoid spiral-of-death on slow frames

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
    // (We’ll add inertia/torque usage in Phase 3+)
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

// =============================== FROG MODEL ==================================
// Keep ALL frog state in the model (controller stays thin)
class FrogModel {
  constructor(x, y, angle = 0) {
    this.body = new FrogBodyModel({ x, y, angle });
    // Mouth world position lives in the model (updated in later phases)
    this.mouthWorld = {
      x: x + MOUTH_OFFSET_LOCAL.x,
      y: y + MOUTH_OFFSET_LOCAL.y,
    };
  }
}

// =============================== CONTROLLER ==================================

class Frog {
  constructor(x, y, angle = 0) {
    this.model = new FrogModel(x, y, angle);
    this.view = new FrogBodyView();
  }

  // Phase 2: deterministic step — keep this lean for now.
  update(dt) {
    const m = this.model.body;

    // 1) Clear forces each step
    clearForces(m);

    // 2) (Optional) apply a tiny constant force to test the loop stability
    addForce(m, 5, 0);

    // 3) Integrate linear motion (angular comes later)
    integrateSemiImplicit(m, dt);

    // 4) Keep mouthWorld in sync position-wise (no rotation yet; Phase 3)
    this.model.mouthWorld.x = m.x + MOUTH_OFFSET_LOCAL.x;
    this.model.mouthWorld.y = m.y + MOUTH_OFFSET_LOCAL.y;
  }

  draw() {
    this.view.draw(this.model.body);

    // debug: draw mouth anchor
    if (DEBUG_MODE === 2) {
      push();
      stroke("#ff0");
      fill("#ff0");
      circle(this.model.mouthWorld.x, this.model.mouthWorld.y, 6);
      pop();
    }
  }
}

// =========================== PHYSICS HELPERS (Phase 2) =======================

/**
 * Clear accumulated force on an object before computing the next step.
 */
function clearForces(o) {
  o.fx = 0;
  o.fy = 0;
}

/**
 * Add a force to an object (will be applied in the next integration).
 */
function addForce(o, fx, fy) {
  o.fx += fx;
  o.fy += fy;
}

/**
 * Semi-implicit Euler (a.k.a. symplectic Euler) for linear motion:
 *   v_{t+dt} = v_t + a * dt
 *   x_{t+dt} = x_t + v_{t+dt} * dt
 * More stable for stiff systems than explicit Euler.
 */
function integrateSemiImplicit(o, dt) {
  if (o.invMass === 0) return; // kinematic object
  const ax = o.fx * o.invMass; // F = ma; a = F/m; a = F * (1/m)
  const ay = o.fy * o.invMass; // F = ma; a = F/m; a = F * (1/m)
  o.xv += ax * dt; // velocity = acceleration * time
  o.yv += ay * dt; // velocity = acceleration * time
  o.x += o.xv * dt; // distance = velocity * time
  o.y += o.yv * dt; // distance = velocity * time
}

// ================================ P5 RUNTIME =================================

let frog;

function setup() {
  createCanvas(800, 600);
  frog = new Frog(400, 300, 0);
}

/**
 * Fixed-step loop:
 *  - Convert frame time (deltaTime) to seconds.
 *  - Step the simulation in FIXED_DT chunks (deterministic).
 *  - Cap number of substeps to keep frame time bounded on slow frames.
 *  - Draw exactly once per frame to avoid “ghosting/artifacts”.
 */
function draw() {
  background(10);

  let dtLeft = Math.min(0.1, deltaTime / 1000); // clamp giant frame hitches
  let steps = 0;
  while (dtLeft > 1e-6 && steps < MAX_SUBSTEPS) {
    const dt = Math.min(FIXED_DT, dtLeft);
    frog.update(dt);
    dtLeft -= dt;
    steps++;
  }

  frog.draw();
}
