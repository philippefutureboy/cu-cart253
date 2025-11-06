import GLOBALS from "../globals.js";
import { PhysicsObjectModel } from "../physics/models.js";
import { PhysicsObjectView } from "../physics/views.js";
import RopePBD from "../physics/rope-pbd.js";
import {
  rot2,
  omegaCrossR,
  clearForces,
  clearTorque,
  integrateSemiImplicit,
  integrateAngularSemiImplicit,
} from "../physics/functions.js";
import { vectorArc } from "../utils/drawing.js";

// === PARAMETERS ==================================================================================

// Frog params (Phase 2 & 3)
const FROG_MASS = 4.0;
const FROG_RADIUS = 24; // approximate disk radius for inertia
// Anchor in frog local coords (mouth offset from Center Of Mass (COM))
const MOUTH_OFFSET_LOCAL = { x: 0, y: -40 }; // pixels in frog's body frame

// PBD rope defaults
const ROPE_OPTS = {
  // Dense rope
  numPoints: 60,
  restSegLen: 2,

  iterations: 8,
  substeps: 2,

  // Rope “material”
  stretchStiffness: 0.9,
  bendStiffness: 0.25,

  // Deep space with a bit of damping
  gravity: { x: 0, y: 0 },
  airDrag: 0.1,

  // Length driver
  maxScale: 3.2,
  extendSpeed: 0.14,
  retractSpeed: 0.035,
  epsilonScale: 0.02,
  minShootScale: 0.2,

  // Alignment motor
  alignK: 0.3,
  alignFade: 0.86,
  alignWhileSpinningFactor: 0.5,

  // Angular coupling
  spinAdvection: 1.0,
  spinImpulseGain: 0.05,
  spinFalloff: 0.6,
  spinVelClamp: 0.25,

  // Anti-overspin
  omegaMaxFactor: 1.2,
  angularFriction: 0.18,

  // Stretch soft cap
  maxExtraStretchPerBone: 5,

  // Mouth mass & optional anchor
  mouthMass: 8.0,
  useAnchor: false,
  mouthAnchor: { x: 0, y: 0 },
  mouthAnchorK: 0.25,
  mouthAnchorC: 0.65,
};

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
 * FrogTongueView
 *
 * View for the tongue (RopePBD instance).
 * Manages how the tongue is rendered on screen.
 *
 * Initial structure by me; implementation by ChatGPT 5.0 Thinking.
 */
class FrogTongueView {
  /**
   * @param {import('p5')} p5
   * @param {RopePBD} rope
   */
  draw(p5, rope) {
    // segments
    p5.push();
    {
      p5.noFill();
      for (let i = 0; i < rope.numPoints - 1; i++) {
        const a = rope.x[i],
          b = rope.x[i + 1];
        const t = i / (rope.numPoints - 1);
        // const hue = p5.lerp(350, 5, t);
        p5.stroke("red");
        p5.strokeWeight(3);
        p5.line(a.x, a.y, b.x, b.y);
      }
    }
    p5.pop();

    // tip
    const tip = rope.x[rope.tipIndex];
    p5.push();
    {
      p5.noStroke();
      p5.fill("red");
      p5.circle(tip.x, tip.y, 10);
    }
    p5.pop();

    // mouth spinner dot
    const m = rope.x[0];
    const r = 10;
    const theta = rope._theta % (2 * Math.PI);
    p5.push();
    {
      p5.translate(m.x, m.y);
      p5.fill(40, 20, 90);
      p5.circle(Math.cos(theta) * r, Math.sin(theta) * r, 3);
    }
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

    this.rope = new RopePBD(ROPE_OPTS);
    this.rope.initializeAt(this.mouthWorld);

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
    // Rope uses verlet; no velocities to scale directly — damping already applied visually.
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
    this.tongue.draw(p5, model.rope);
  }
}

class Frog {
  constructor(x, y, angle = 0) {
    this.model = new FrogModel(x, y, angle);
    this.view = new FrogView();
    this._spaceLatch = false; // edge-detect space press
  }

  /**
   * Updates the Frog physics based on input and steps the rope with Simulation dt.
   * Rope Simulation stepping implemented using ChatGPT 5.0 Thinking.
   *
   * @param {import('p5')} p5
   * @param {number} dt Delta (time) since last update call
   */
  update(p5, dt) {
    const { body, mouthWorld, mouthVel, rope, dead } = this.model;

    // Only process inputs if the frog is not dead
    if (!dead) {
      if (GLOBALS.INPUTS.up) body.fy -= 150;
      if (GLOBALS.INPUTS.down) body.fy += 150;
      if (GLOBALS.INPUTS.left) body.fx -= 150;
      if (GLOBALS.INPUTS.right) body.fx += 150;
      if (GLOBALS.INPUTS.z) body.torque -= 500;
      if (GLOBALS.INPUTS.x) body.torque += 500;

      // Space: Launch → Space: Retract (edge detected)
      const spaceDown = !!GLOBALS.INPUTS.space;
      if (spaceDown && !this._spaceLatch) {
        if (!rope.shooting && !rope.retracting) {
          rope.unpinTip();
          rope.setLaunchFromAngle(body.a);
          rope.launch();
        } else if (rope.shooting) {
          rope.startRetract();
        }
      }
      this._spaceLatch = spaceDown;
    }

    // linear & angular integration
    integrateSemiImplicit(body, dt);
    integrateAngularSemiImplicit(body, dt);
    clearForces(body);
    clearTorque(body);

    // Mouth kinematics (pose + velocity)
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

    // Make rope mouth anchor follow world anchor when collapsed
    rope.setMouthAnchor({ x: mouthWorld.x, y: mouthWorld.y });
    // If we *just* launched, capture angle (already done above)
    // Step rope with dt and current mouth angular velocity
    rope.step(dt, mouthWorld, { xv: mouthVel.x, yv: mouthVel.y }, body.av);
  }

  /**
   * Called by the main loop to perform tongue tip ↔ fly hit tests and manage stickiness.
   * @param {Fly} fly
   * @param {number} catchRadius
   */
  handleFlyCollision(fly, catchRadius = 12) {
    const rope = this.model.rope;
    // Only sticky while expanding or retracting
    if (!(rope.shooting || rope.retracting)) return;

    const tip = rope.tip();
    const dx = tip.x - fly.model.x;
    const dy = tip.y - fly.model.y;
    if (
      !fly.sticky &&
      dx * dx + dy * dy <= (catchRadius + 4) * (catchRadius + 4)
    ) {
      // attach
      fly.sticky = true;
      rope.attachTip();
      rope.startRetract(); // stop expansion and pull back
      fly.setStickyPosition(tip);
    } else if (fly.sticky) {
      // keep fly on tip while retracting
      fly.setStickyPosition(tip);
      // release when rope collapses
      if (rope.isIdle()) {
        fly.releaseSticky();
        rope.detachTip();
      }
    }
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
