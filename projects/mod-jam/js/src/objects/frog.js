import GLOBALS from "../globals.js";
import { PhysicsObjectModel } from "../physics/models.js";
import { PhysicsObjectView } from "../physics/views.js";
import {
  rot2,
  omegaCrossR,
  clearForces,
  clearTorque,
  addForce,
  integrateSemiImplicit,
  integrateAngularSemiImplicit,
  applyEdgeSpring,
} from "../physics/functions.js";
import { vectorArc } from "../utils/drawing.js";

// === PARAMETERS ==================================================================================

// Frog params (Phase 2 & 3)
const FROG_MASS = 4.0;
const FROG_RADIUS = 24; // approximate disk radius for inertia
// Anchor in frog local coords (mouth offset from Center Of Mass (COM))
const MOUTH_OFFSET_LOCAL = { x: +20, y: 0 }; // pixels in frog's body frame

// Tongue params (Phase 4)
const N_NODES = 10; // number of tongue nodes (0..N-1)
const TONGUE_LENGTH = 200; // total visual length (pixels)
const SEG_REST = TONGUE_LENGTH / (N_NODES - 1); // spacing between nodes

// Tongue physics (Phase 5) ------------------------------------------------
const SEG_MASS = 0.05; // mass of internal nodes
const TIP_MASS = 0.6; // heavier tip gives nice “whip” feel
const EDGE_K = 300; // was 600
const EDGE_C = 2 * Math.sqrt(EDGE_K * SEG_MASS); // ~critical damping (per-edge)
const GRAVITY_Y = 0.0; // keep 0 for now

// === BODY ========================================================================================

/**
 * FrogBodyModel
 *
 * Model modelizing the Frog body's physics.
 * Initially implemented by me, iterated upon by ChatGPT 5.0 Thinking.
 */
class FrogBodyModel extends PhysicsObjectModel {
  constructor({ x, y, angle = 0 }) {
    super({ id: "frog.body", x, y, angle, mass: FROG_MASS });
    this.radius = FROG_RADIUS;
    // Approximate moment of inertia for a solid disk: I ≈ 1/2 m r^2
    this.inertia = 0.5 * this.mass * Math.pow(this.radius, 2);
    // Optional torque accumulator for future phases
    this.torque = 0;
  }
}

/**
 * FrogBodyView
 *
 * View for the FrogBodyModel. Manages how the frog is rendered on screen.
 *
 * Entirely implemented by me.
 */
class FrogBodyView extends PhysicsObjectView {
  /**
   * @param {import('p5')} p5
   * @param {FrogBodyModel} model The frog body PhysicsObjectModel
   * @param {boolean} dead Whether or not the frog is dead
   */
  draw(p5, model, dead) {
    const { x, y, angle } = model;
    p5.push();
    p5.translate(x, y);
    p5.rotate(angle);
    if (GLOBALS.DEBUG_MODE === 2) this._drawDebug(p5, model);
    else this._drawAsset(p5, model, dead);
    p5.translate(-x, -y);
    p5.pop();
  }

  _drawDebug(p5, model) {
    // body
    p5.fill("#0f0");
    p5.stroke(0);
    p5.ellipse(0, 0, 2 * model.radius, 2 * model.radius);
    // heading line
    p5.stroke(0);
    p5.line(0, 0, model.radius, 0);

    this._drawDebugInfo(p5, 30, 0, model);
  }

  /**
   *
   * @param {import('p5')} p5
   * @param {FrogBodyModel} model The frog body PhysicsObjectModel
   * @param {boolean} dead Whether or not the frog is dead
   */
  _drawAsset(p5, model, dead) {
    // legs
    // left hind leg
    this._drawFrogFrontLeg(p5, true);
    // right hind leg
    this._drawFrogFrontLeg(p5, false);
    // left hind leg
    this._drawFrogHindLeg(p5, true);
    // right hind leg
    this._drawFrogHindLeg(p5, false);

    // head
    this._drawFrogHead(p5, model, dead);
    // body
    this._drawFrogBody(p5);

    if (GLOBALS.DEBUG_MODE === 1) {
      p5.push();
      {
        p5.fill("#f00");
        p5.stroke(0);
        p5.circle(0, 0, 4, 4);
      }
      p5.pop();
    }
  }

  _drawFrogHead(p5, model, dead) {
    const { av } = model;
    let eyesDirection;
    if (between(av, -0.5, 0.5)) eyesDirection = 0;
    if (between(av, -2, -0.5)) eyesDirection = -1;
    if (between(av, -4, -2)) eyesDirection = -2;
    if (av < -4) eyesDirection = -2;
    if (between(av, 0.5, 2)) eyesDirection = 1;
    if (between(av, 2, 4)) eyesDirection = 2;
    if (av > 2) eyesDirection = 3;

    // frog helmet lens
    p5.push();
    {
      p5.fill(p5.color(255, 255, 255, 40));
      p5.ellipse(0, -25, 50, 50);
    }
    p5.pop();

    // frog head
    p5.push();
    {
      if (!dead) {
        p5.fill("#0f0");
      } else {
        p5.fill("#72ede7");
      }
      p5.ellipse(0, -20, 40, 40);
    }
    p5.pop();

    // left eye
    p5.push();
    {
      p5.fill("#fff");
      p5.ellipse(-12, -33, 10, 10);

      if (!dead) {
        p5.fill("black");
        p5.ellipse(-12 + eyesDirection, -35, 3, 3);
      } else {
        p5.stroke("red");
        p5.strokeWeight(2);
        p5.line(-14, -35, -10, -31);
        p5.line(-10, -35, -14, -31);
      }
    }
    p5.pop();

    // right eye
    p5.push();
    {
      p5.fill("#fff");
      p5.ellipse(12, -33, 10, 10);
      if (!dead) {
        p5.fill("black");
        p5.ellipse(12 + eyesDirection, -35, 3, 3);
      } else {
        p5.stroke("red");
        p5.strokeWeight(2);
        p5.line(14, -35, 10, -31);
        p5.line(10, -35, 14, -31);
      }
    }
    p5.pop();

    // helmet glass top contour
    p5.push();
    {
      p5.stroke("white");
      p5.noFill();
      p5.arc(0, -33, 44, 35, p5.PI, 2 * p5.PI);
      p5.ellipse(0, -25, 50, 50);
    }
    p5.pop();

    // helmet occlusion
    p5.push();
    {
      p5.fill("#F5F7FB");
      p5.beginShape();
      vectorArc(p5, 0, -33, 45, 35, 0, p5.PI);
      p5.stroke("white");
      vectorArc(p5, 0, -25, 50, 50, p5.PI + p5.PI / 8, -p5.PI / 8);
      p5.endShape(p5.CLOSE);
    }
    p5.pop();

    // helmet glass bottom contour
    p5.push();
    {
      p5.stroke("black");
      p5.noFill();
      p5.arc(0, -33, 44, 35, 0, p5.PI);
    }
    p5.pop();
  }

  _drawFrogBody(p5) {
    p5.push();
    {
      p5.fill("#F5F7FB");
      p5.stroke("black");
      p5.beginShape();
      vectorArc(p5, 0, 20, 52, 85, -p5.PI / 4 + 0.12, (10 / 8) * p5.PI - 0.12);
      vectorArc(
        p5,
        0,
        -23.5,
        50,
        50,
        p5.PI + p5.PI / 8 - 0.95,
        -p5.PI / 8 + 0.95
      );
      p5.endShape(p5.CLOSE);
    }
    p5.pop();
  }

  _drawFrogFrontLeg(p5, flip) {
    const xflip = (x) => (flip ? -1 * x : 1 * x);
    const aflip = (a) => (flip ? -a : a);

    p5.push();
    {
      p5.stroke("black");
      p5.angleMode(p5.DEGREE);

      p5.push();
      {
        p5.fill("#a5a7aB");
        p5.stroke("black");
        p5.translate(xflip(53), -6);
        p5.rotate(aflip(137));
        p5.ellipse(xflip(0), 0, 22, 8);
        p5.strokeWeight(0.1);
        p5.triangle(xflip(8), 0, xflip(13), 0, xflip(17), -10);
        p5.circle(xflip(16), -10, 4.5);
        // ------- p5.triangle(xflip(15), 0, xflip(20), 0, xflip(24), -10);
        p5.triangle(xflip(9), 2, xflip(9), -2, xflip(23), -3);
        p5.circle(xflip(23), -3, 4.5);
        p5.triangle(xflip(9), 0, xflip(5), 3, xflip(25), 7);
        p5.circle(xflip(22), 6, 4.5);
      }
      p5.pop();

      // front foot
      p5.push();
      {
        p5.fill("#D5D7DB");
        p5.translate(xflip(32), -4);
        p5.rotate(aflip(9.8));
        p5.ellipse(xflip(0), 0, 38, 9);
      }
      p5.pop();
    }
    p5.pop();
  }

  _drawFrogHindLeg(p5, flip) {
    const xflip = (x) => (flip ? -1 * x : 1 * x);
    const aflip = (a) => (flip ? -a : a);

    p5.push();
    {
      p5.stroke("black");
      p5.angleMode(p5.DEGREE);

      // hind foot
      p5.push();
      {
        p5.fill("#a5a7aB");
        p5.stroke("black");
        p5.translate(xflip(45), 38);
        p5.rotate(aflip(137.4));
        p5.ellipse(xflip(0), 0, 34, 10);
        p5.strokeWeight(0.1);
        p5.triangle(xflip(15), 0, xflip(20), 0, xflip(24), -10);
        p5.circle(xflip(23), -10, 4.5);
        p5.triangle(xflip(16), 2, xflip(16), -2, xflip(30), -3);
        p5.circle(xflip(29), -3, 4.5);
        p5.triangle(xflip(16), 0, xflip(12), 3, xflip(32), 7);
        p5.circle(xflip(29), 6, 4.5);
      }
      p5.pop();

      // hind lower leg
      p5.push();
      {
        p5.fill("#D5D7DB");
        p5.translate(xflip(39), 36);
        p5.rotate(aflip(149.4));
        p5.ellipse(xflip(0), 0, 34, 10);
      }
      p5.pop();

      // hind upper leg
      p5.push();
      {
        p5.fill("#F5F7FB");
        p5.translate(xflip(28), 38);
        p5.rotate(aflip(149.9));
        p5.ellipse(xflip(0), 0, 50, 15);
      }
      p5.pop();
    }
    p5.pop();
  }
}

// === TONGUE ======================================================================================

/**
 * FrogTongueModel
 *
 * Model modelizing the Frog tongue.
 *
 * - Holds an array of PhysicsObjectModel nodes.
 * - For Phase 4 (no physics), we’ll simply *set* node positions each frame
 *   to lie on a straight ray from the mouth along the frog heading.
 * - Node 0 is considered the anchor (mass 0).
 *
 * Implementation by ChatGPT 5.0 Thinking.
 *
 * Why is the anchor node set to mass 0?
 * ChatGPT answers:
 *
 * > Setting the anchor node (node 0) to mass = 0 makes it a kinematic point, not affected by
 * > simulation forces. In practice:
 * >
 * >  * **It’s pinned to the frog’s mouth:** The tongue’s first node must exactly follow the frog’s
 * >    mouth each frame — position and velocity are directly copied from the frog. Giving it
 * >    mass = 0 prevents the physics solver from trying to move it due to springs, gravity, or inertia.
 * >
 * >  * **It acts as a fixed boundary condition:** Springs can apply tension to it, but it won’t
 * >    accelerate or drift. This creates the correct physical constraint: the tongue can swing
 * >    and stretch, but the attachment point stays at the mouth.
 * >
 * >  * **Simplifies the solver:** You don’t have to compute reaction forces on that node, nor
 * >    integrate it — you just overwrite its state after stepping the rest of the rope.
 * >
 * > If we later want bidirectional coupling (where the tongue pulls on the frog, as in Phase 6),
 * > we’ll still treat the anchor as kinematic but read the net spring force on it to apply an equal
 * > and opposite reaction to the frog’s body.
 */
class FrogTongueModel {
  constructor() {
    this.nodes = [];
    this.initialized = false; // we’ll lay out once from the mouth on first update
    for (let i = 0; i < N_NODES; i++) {
      const isAnchor = i === 0;
      const isTip = i === N_NODES - 1;
      const mass = isAnchor ? 0 : isTip ? TIP_MASS : SEG_MASS;
      this.nodes.push(
        new PhysicsObjectModel({ id: `tongue.nodes.${i}`, mass, x: 0, y: 0 })
      );
    }
  }

  /**
   * Calls scaleVelocities on each of the nodes of the tongue
   *
   * @param {number} factor Scaling factor, expected (not enforced) to be [0, Infinity]
   * @param {boolean} scaleLinearV Whether or not to scale this.xv, this.yv. Defaults to true.
   * @param {boolean} scaleAngularV Whether or not to scale this.av. Defaults to true.
   *
   * @see PhysicsObjectModel.scaleVelocities
   */
  scaleVelocities(factor, scaleLinearV = true, scaleAngularV = true) {
    for (const node of this.nodes) {
      node.scaleVelocities(factor, scaleLinearV, scaleAngularV);
    }
  }
}

/**
 * FrogTongueView
 *
 * View for the FrogTongueModel. Manages how the tongue is rendered on screen.
 *
 * Initial structure by me; implementation by ChatGPT 5.0 Thinking.
 * Documentation by me.
 */
class FrogTongueView {
  /**
   * @param {import('p5')} p5
   * @param {FrogTongueModel} model
   */
  draw(p5, model) {
    const nodes = model.nodes;

    // draw segments
    p5.push();
    p5.stroke("#f44");
    p5.strokeWeight(3);
    p5.noFill();
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i],
        b = nodes[i + 1];
      p5.line(a.x, a.y, b.x, b.y);
    }
    p5.pop();

    // tip as a small red rectangle
    const tip = nodes[nodes.length - 1];
    p5.push();
    p5.rectMode(p5.CENTER);
    p5.noStroke();
    p5.fill("#f44");
    p5.rect(tip.x, tip.y, 8, 6, 1);
    p5.pop();
  }
}

// === FROG ========================================================================================

/**
 * FrogModel
 *
 * Centralized model holding the submodels for body, mouth, tongue.
 *
 * Initially implemented by me, iterated upon by ChatGPT 5.0 Thinking.
 */
class FrogModel {
  constructor(x, y, angle = 0) {
    this.body = new FrogBodyModel({ x, y, angle });
    // Mouth world position lives in the model (updated in later phases)
    this.mouthWorld = {
      x: x + MOUTH_OFFSET_LOCAL.x,
      y: y + MOUTH_OFFSET_LOCAL.y,
    };
    this.mouthVel = { x: 0, y: 0 }; // will be computed from COM vel + ω×r
    this.tongue = new FrogTongueModel();
    this.dead = false;
  }

  /**
   * Calls scaleVelocities on children models
   *
   * @param {number} factor Scaling factor, expected (not enforced) to be [0, Infinity]
   * @param {boolean} scaleLinearV Whether or not to scale this.xv, this.yv. Defaults to true.
   * @param {boolean} scaleAngularV Whether or not to scale this.av. Defaults to true.
   *
   * @see PhysicsObjectModel.scaleVelocities
   */
  scaleVelocities(factor, scaleLinearV = true, scaleAngularV = true) {
    this.body.scaleVelocities(factor, scaleLinearV, scaleAngularV);
    this.tongue.scaleVelocities(factor, scaleLinearV, scaleAngularV);
  }
}

/**
 * FrogView
 *
 * Centralized view for the Frog. Manages how the frog is rendered on screen.
 *
 * Implemented by me.
 */
class FrogView {
  constructor() {
    this.body = new FrogBodyView();
    this.tongue = new FrogTongueView();
  }

  /**
   * @param {import('p5')} p5
   * @param {FrogTongueModel} model
   */
  draw(p5, model) {
    this.body.draw(p5, model.body, model.dead);
    this.tongue.draw(p5, model.tongue);
  }
}

class Frog {
  constructor(x, y, angle = 0) {
    this.model = new FrogModel(x, y, angle);
    this.view = new FrogView();
  }

  /**
   * Updates the Frog physics based on input
   *
   * @param {import('p5')} p5
   * @param {number} dt Delta (time) since last update call
   */
  update(p5, dt) {
    const { body, mouthWorld, mouthVel, tongue, dead } = this.model;

    // Only process inputs if the frog is not dead
    if (!dead) {
      if (GLOBALS.INPUTS.up) body.fy -= 150;
      if (GLOBALS.INPUTS.down) body.fy += 150;
      if (GLOBALS.INPUTS.left) body.fx -= 150;
      if (GLOBALS.INPUTS.right) body.fx += 150;
      if (GLOBALS.INPUTS.z) body.torque -= 500;
      if (GLOBALS.INPUTS.x) body.torque += 500;
    }

    // --- Linear integration (semi-implicit Euler)
    // (No forces yet, but the helpers and pattern are ready for later phases)
    integrateSemiImplicit(body, dt);

    // --- Angular integration (semi-implicit Euler)
    integrateAngularSemiImplicit(body, dt);

    clearForces(body);
    clearTorque(body);

    // --- Phase 3: Mouth kinematics (pose + velocity) -------------------------
    // r_anchor = R(θ) * MOUTH_OFFSET_LOCAL
    // r_anchor: rotated vector MOUTH_OFFSET_LOCAL at angle θ
    const r_anchor = rot2(body.a, MOUTH_OFFSET_LOCAL);

    // World position of mouth: X_anchor = X_com + r_anchor
    mouthWorld.x = body.x + r_anchor.x;
    mouthWorld.y = body.y + r_anchor.y;

    // Velocity at a point on a rigid body: v = V_com + ω × r
    const v_rot = omegaCrossR(body.av, r_anchor);
    mouthVel.x = body.xv + v_rot.x;
    mouthVel.y = body.yv + v_rot.y;

    // --- Phase 5: Physical rope (edge springs + axial damping) -------------------
    const heading = { x: Math.cos(body.a), y: Math.sin(body.a) };
    stepTongue(tongue, mouthWorld, mouthVel, heading, dt);
  }

  /**
   * Scales the movement of the frog using `factor`.
   * Facade that calls model.scaleVelocities
   * Used when game moves to game-over state to slow down the movements and give a "slow motion" feel.
   *
   * @param {number} factor Scaling factor, expected (not enforced) to be [0, Infinity]
   */
  scaleMovement(factor) {
    this.model.scaleVelocities(factor, true, true);
  }

  /**
   * @param {import('p5')} p5
   */
  draw(p5) {
    this.view.draw(p5, this.model);

    // debug: draw mouth anchor
    if (GLOBALS.DEBUG_MODE === 2) {
      p5.push();
      p5.stroke("#ff0");
      p5.fill("#ff0");
      p5.circle(this.model.mouthWorld.x, this.model.mouthWorld.y, 6);

      const s = 20; // scale by a factor of s for visibility

      p5.stroke("#ff0");
      p5.line(
        this.model.mouthWorld.x,
        this.model.mouthWorld.y,
        this.model.mouthWorld.x +
          (this.model.mouthVel.x * (1 / GLOBALS.FIXED_DT)) / s,
        this.model.mouthWorld.y +
          (this.model.mouthVel.y * (1 / GLOBALS.FIXED_DT)) / s
      );
      p5.pop();
    }
  }
}

/**
 * stepTongue
 *
 * Function that updates the tongue segment physics properties.
 *
 * Phase 5 step (stable):
 *  - Ensure anchor node 0 is pinned to mouth *before* force evaluation
 *  - One-time straight layout on first run
 *  - Clear forces
 *  - Gravity (optional) + light isotropic drag
 *  - Edge springs/damping
 *  - Integrate free nodes
 *  - Re-pin anchor to kill any numerical creep
 *
 * Implemented 100% by ChatGPT 5.0 Thinking.
 */
function stepTongue(tongueModel, mouthWorld, mouthVel, frogHeading, dt) {
  const nodes = tongueModel.nodes;

  // ALWAYS pin anchor first — this prevents huge fake stretch when frog moves.
  nodes[0].x = mouthWorld.x;
  nodes[0].y = mouthWorld.y;
  nodes[0].xv = mouthVel.x;
  nodes[0].yv = mouthVel.y;

  // One-time straight layout from the *current* anchor
  if (!tongueModel.initialized) {
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].x = mouthWorld.x + frogHeading.x * (i * SEG_REST);
      nodes[i].y = mouthWorld.y + frogHeading.y * (i * SEG_REST);
      nodes[i].xv = mouthVel.x;
      nodes[i].yv = mouthVel.y;
    }
    tongueModel.initialized = true;
  }

  // Clear forces on all nodes (including the anchor so reaction is fresh if you read it later)
  for (let i = 0; i < nodes.length; i++) clearForces(nodes[i]);

  // Mild world drag (helps kill transverse jitter). Tune or set to 0.
  const DRAG = 0.5; // N·s/m-ish in our pixel units; small but helpful
  for (let i = 1; i < nodes.length; i++) {
    // Optional gravity
    if (GRAVITY_Y !== 0) addForce(nodes[i], 0, nodes[i].mass * GRAVITY_Y);
    // Isotropic linear drag
    addForce(nodes[i], -DRAG * nodes[i].xv, -DRAG * nodes[i].yv);
  }

  // --- Audit init (one per substep) ---
  const audit = {
    springPower: 0,
    damperPower: 0,
    maxAbsSv: 0,
    maxAbsElong: 0,
    edges: 0,
  };

  // Edge springs + axial damping
  for (let i = 0; i < nodes.length - 1; i++) {
    applyEdgeSpring(nodes[i], nodes[i + 1], SEG_REST, EDGE_K, EDGE_C, audit);
  }

  if (GLOBALS.AUDIT_DAMPERS) {
    // Damper must never add net energy: damperPower <= 0
    // Spring power can be ±. Large positive spring power with large elongation
    // is expected when you "pull"; the key is damperPower must stay ≤ 0.
    console.log(
      `[audit frame=${typeof simFrame !== "undefined" ? simFrame : "?"}] ` +
        `P_spring=${audit.springPower.toFixed(3)} ` +
        `P_damper=${audit.damperPower.toFixed(3)} (<=0 ok) ` +
        `|s|max=${audit.maxAbsSv.toFixed(3)} ` +
        `|elong|max=${audit.maxAbsElong.toFixed(3)} edges=${audit.edges}`
    );
  }

  // Integrate free nodes
  for (let i = 1; i < nodes.length; i++) {
    integrateSemiImplicit(nodes[i], dt);
  }

  // Re-pin anchor after integration to remove any numerical drift
  nodes[0].x = mouthWorld.x;
  nodes[0].y = mouthWorld.y;
  nodes[0].xv = mouthVel.x;
  nodes[0].yv = mouthVel.y;
}

// --- HELPER FUNCTIONS ----------------------------------------------------------------------------

/**
 * between
 *
 * Checks whether value is between min and max. Syntactic sugar of sorts for improved readability.
 * Implemented by me.
 */
function between(value, min, max) {
  return value >= min && value <= max;
}

export default Frog;
