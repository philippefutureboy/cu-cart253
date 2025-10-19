"use strict";

// --- DEBUG VARIABLES -----------------------------------------------------------------------------
var DEBUG_MODE = 2;

// =============================== CONSTANTS ====================================
const FIXED_DT = 1 / 60; // seconds per physics step (deterministic)
const MAX_SUBSTEPS = 2; // cap to avoid spiral-of-death on slow frames

// Frog params
const FROG_MASS = 4.0;
const FROG_RADIUS = 24; // approximate disk radius for inertia
// Anchor in frog local coords (mouth offset from Center Of Mass (COM))
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
    // Approximate moment of inertia for a solid disk: I ≈ 1/2 m r^2
    this.inertia = 0.5 * this.mass * Math.pow(this.radius, 2);
    // Optional torque accumulator for future phases
    this.torque = 0;
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
    this.mouthVel = { x: 0, y: 0 }; // will be computed from COM vel + ω×r
  }
}

// =============================== CONTROLLER ==================================

class Frog {
  constructor(x, y, angle = 0) {
    this.model = new FrogModel(x, y, angle);
    this.view = new FrogBodyView();
  }

  update(dt) {
    const b = this.model.body;
    // --- Linear integration (semi-implicit Euler)
    // (No forces yet, but the helpers and pattern are ready for later phases)
    integrateSemiImplicit(b, dt);

    // --- Angular integration (semi-implicit Euler)
    integrateAngularSemiImplicit(b, dt);

    clearForces(b);
    clearTorque(b);

    // --- Phase 3: Mouth kinematics (pose + velocity) -------------------------
    // r_anchor = R(θ) * MOUTH_OFFSET_LOCAL
    // r_anchor: rotated vector MOUTH_OFFSET_LOCAL at angle θ
    const r_anchor = rot2(b.a, MOUTH_OFFSET_LOCAL);

    // World position of mouth: X_anchor = X_com + r_anchor
    this.model.mouthWorld.x = b.x + r_anchor.x;
    this.model.mouthWorld.y = b.y + r_anchor.y;

    // Velocity at a point on a rigid body: v = V_com + ω × r
    const v_rot = omegaCrossR(b.av, r_anchor);
    this.model.mouthVel.x = b.xv + v_rot.x;
    this.model.mouthVel.y = b.yv + v_rot.y;
  }

  draw() {
    this.view.draw(this.model.body);

    // debug: draw mouth anchor
    if (DEBUG_MODE === 2) {
      push();
      stroke("#ff0");
      fill("#ff0");
      circle(this.model.mouthWorld.x, this.model.mouthWorld.y, 6);

      const s = 20; // scale by a factor of s for visibility

      stroke("#ff0");
      line(
        this.model.mouthWorld.x,
        this.model.mouthWorld.y,
        this.model.mouthWorld.x + (this.model.mouthVel.x * (1 / FIXED_DT)) / s,
        this.model.mouthWorld.y + (this.model.mouthVel.y * (1 / FIXED_DT)) / s
      );
      pop();
    }
  }
}

// ============================ SMALL VEC HELPERS ===============================

// rot2(theta, v)
// Rotates a 2D vector `v = {x, y}` by an angle `theta` (in radians) using the standard
// 2×2 rotation matrix:
//     [ cosθ  -sinθ ] [x]
//     [ sinθ   cosθ ] [y]
// Returns the rotated vector { x', y' } in world coordinates.
function rot2(theta, v) {
  const c = Math.cos(theta),
    s = Math.sin(theta);
  return { x: c * v.x - s * v.y, y: s * v.x + c * v.y };
}

// 2D "ω × r" helper: scalar ω with vector r = (x, y) → (-ω y, ω x)
function omegaCrossR(omega, r) {
  return { x: -omega * r.y, y: omega * r.x };
}

// =========================== PHYSICS HELPERS =======================

/**
 * Clear accumulated force on an object.
 */
function clearForces(o) {
  o.fx = 0;
  o.fy = 0;
}

/**
 * Clear accumulated rotational force (torque) on an object.
 */
function clearTorque(o) {
  o.torque = 0;
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

function integrateAngularSemiImplicit(o, dt) {
  const angAcc = o.inertia > 0 ? o.torque / o.inertia : 0; // ω <- ω + (τ/I) dt ; θ <- θ + ω dt
  o.av += angAcc * dt; // ω = α * s  // angularVelocity = angularAcceleration * dt
  o.a += o.av * dt; // θ = θ + angularAcceleration * dt
}

// ================================ P5 RUNTIME =================================

let frog;

function setup() {
  createCanvas(800, 600);
  frog = new Frog(400, 300, 0);

  // Give the frog a small initial spin to visualize mouth velocity
  frog.model.body.av = 0.8; // rad/s
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
