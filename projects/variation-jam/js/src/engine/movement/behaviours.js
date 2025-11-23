/**
 * src/engine/movement/behaviours.js
 *
 * Movement behaviour strategies:
 * Strategy design pattern that receive a GridGraph, GridGraphDistanceField
 * and compute the steer force to pass back to the agent.
 *
 * @attribution GenAI usage: 100%.
 *              Full conversation available at src/engine/ATTRIBUTION/ChatGPT-engine-discussion.html
 */

import { computeSteer } from "./steering.js";
import { PlayerIntent } from "../player/intent.js";

/**
 * @typedef {import("../player/controller/interfaces.js").IPlayerController} IPlayerController
 */

/**
 * Base class for movement behaviours.
 * Exposes an "effectiveness" parameter in [0, 1] which is mapped
 * internally to [0.5, 1] so that even 0 isn't totally braindead.
 */
export class MovementBehaviour {
  /**
   * @param {number} effectivenessBase in [0,1]
   */
  constructor(effectivenessBase = 1.0) {
    this.effectivenessBase = clamp01(effectivenessBase);
  }

  /**
   * Map user-facing [0,1] -> internal [0.5,1].
   * 0   -> 0.5  (quite noisy / imperfect)
   * 0.1 -> 0.55 (close to the "old 0.5")
   * 1   -> 1.0  (fully sharp)
   */
  getEffective() {
    return 0.5 + 0.5 * this.effectivenessBase;
  }

  /**
   * Override in subclasses.
   *
   * @param {import("p5")} p5
   * @param {GridGraph} grid
   * @param {GridGraphDistanceField} distanceField
   * @param {{pos:p5.Vector, vel:p5.Vector, maxSpeed:number, maxForce:number}} npcState
   * @param {p5.Vector | {x:number, y:number}} targetPos
   * @returns {p5.Vector} steering vector
   */
  computeSteer(p5, grid, distanceField, npcState, targetPos) {
    return p5.createVector(0, 0);
  }
}

/**
 * Movement behaviour that tries to minimize distance to target
 * using the distance field (pursue / chase).
 */
export class PursueMovementBehaviour extends MovementBehaviour {
  constructor(effectivenessBase = 1.0) {
    super(effectivenessBase);
    this.type = "pursue";
  }

  computeSteer(p5, grid, distanceField, npcState, targetPos) {
    return computeMovementSteer(
      p5,
      "pursue",
      this.getEffective(),
      grid,
      distanceField,
      npcState,
      targetPos
    );
  }
}

/**
 * Movement behaviour that tries to maximize distance to target
 * using the distance field (evade / flee).
 */
export class EvadeMovementBehaviour extends MovementBehaviour {
  constructor(effectivenessBase = 1.0) {
    super(effectivenessBase);
    this.type = "evade";
  }

  computeSteer(p5, grid, distanceField, npcState, targetPos) {
    return computeMovementSteer(
      p5,
      "evade",
      this.getEffective(),
      grid,
      distanceField,
      npcState,
      targetPos
    );
  }
}

/**
 * Movement behaviour driven by an IPlayerController.
 * Uses player intent (moveX, moveY, sprint, dash) to generate steering
 * for a MovementAgent.
 */
export class PlayerMovementBehaviour extends MovementBehaviour {
  /**
   * @param {IPlayerController} controller
   * @param {number} [effectivenessBase=1.0]
   *   Base effectiveness in [0, 1]. MovementBehaviour#getEffective()
   *   can remap this to [0.5, 1] or similar as you defined.
   */
  constructor(controller, effectivenessBase = 1.0) {
    super(effectivenessBase);
    this.controller = controller;
    this.type = "player-controlled";
  }

  /**
   * Compute steering from player intent.
   *
   * @param {import("p5")} p5
   * @param {GridGraph} grid
   * @param {GridGraphDistanceField} distanceField
   * @param {{
   *   pos: p5.Vector,
   *   vel: p5.Vector,
   *   maxSpeed: number,
   *   maxForce: number
   * }} agentState
   * @param {p5.Vector | {x:number, y:number}} targetPos
   *   For player, this is not currently used (intent drives movement instead),
   *   but we keep it in the signature for compatibility.
   * @returns {p5.Vector} steering vector
   */
  computeSteer(p5, grid, distanceField, agentState, targetPos) {
    const { pos, vel, maxSpeed, maxForce } = agentState;

    /** @type {PlayerIntent} */
    const intent =
      this.controller && typeof this.controller.getIntent === "function"
        ? this.controller.getIntent()
        : new PlayerIntent();

    const moveX = intent.moveX;
    const moveY = intent.moveY;
    const sprint = intent.sprint;
    // const dash  = intent.dash; // reserved for future dash logic

    // --- Case 1: no movement input → brake / idle ---------------------------------
    if (Math.abs(moveX) < 1e-3 && Math.abs(moveY) < 1e-3) {
      // If we still have velocity, gently brake by steering against it
      if (vel.mag() > 1e-3) {
        const brakeTarget = p5.createVector(pos.x - vel.x, pos.y - vel.y);

        const brakeSteer = computeSteer(
          p5,
          pos,
          vel,
          brakeTarget,
          maxSpeed,
          maxForce * 0.5 // braking is usually softer
        );

        brakeSteer.mult(this.getEffective());
        return brakeSteer;
      }

      // No velocity and no input → no steering
      return p5.createVector(0, 0);
    }

    // --- Case 2: movement input → steer toward direction --------------------------
    let dir = p5.createVector(moveX, moveY);
    if (dir.mag() > 1e-3) {
      dir.normalize();
    }

    // We pick a target point some distance ahead in the direction of intent.
    // This reuses the same computeSteer logic as pursue behaviours.
    const MOVE_DISTANCE = 50;
    const target = p5.createVector(
      pos.x + dir.x * MOVE_DISTANCE,
      pos.y + dir.y * MOVE_DISTANCE
    );

    // Sprint: modify effective maxSpeed (leave agent's base maxSpeed intact)
    const speedFactor = sprint ? 1.5 : 1.0;
    const effMaxSpeed = maxSpeed * speedFactor;
    const effMaxForce = maxForce; // could be adjusted during sprint if desired

    const steer = computeSteer(p5, pos, vel, target, effMaxSpeed, effMaxForce);

    // Blend using the behaviour's effectiveness [0.5,1] (or however getEffective() is defined)
    steer.mult(this.getEffective());
    return steer;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers (module-private)
// ---------------------------------------------------------------------------

/**
 * Shared core for pursue/evade behaviours using a distance field.
 *
 * @param {import("p5")} p5
 * @param {"pursue"|"evade"} mode
 * @param {number} eff internal effectiveness in [0.5, 1]
 * @param {GridGraph} grid
 * @param {GridGraphDistanceField} distanceField
 * @param {{pos:p5.Vector, vel:p5.Vector, maxSpeed:number, maxForce:number}} npcState
 * @param {p5.Vector | {x:number, y:number}} targetPos
 * @returns {p5.Vector}
 */
function computeMovementSteer(
  p5,
  mode,
  eff,
  grid,
  distanceField,
  npcState,
  targetPos
) {
  const pos = npcState.pos;
  const vel = npcState.vel;
  const maxSpeed = npcState.maxSpeed;
  const maxForce = npcState.maxForce;

  const { gx, gy, valid } = grid.worldToGrid(pos);

  // If we don't have a valid distance field or node, fall back
  if (
    !valid ||
    !distanceField.hasValidField ||
    !Number.isFinite(distanceField.getDistance(gx, gy))
  ) {
    return fallbackMovementSteer(
      p5,
      mode,
      eff,
      pos,
      vel,
      targetPos,
      maxSpeed,
      maxForce
    );
  }

  let bestGx = gx;
  let bestGy = gy;
  let bestD = distanceField.getDistance(gx, gy);

  const neighbors = grid.getNeighbors(gx, gy);

  // Decision-level noise: sometimes choose a suboptimal neighbor
  // eff in [0.5,1] → at 0.5, 50% "mistake" chance; at 1, 0%.
  const makeMistake = p5.random() > eff;

  if (makeMistake && neighbors.length > 0) {
    const rand = neighbors[Math.floor(p5.random(neighbors.length))];
    bestGx = rand.gx;
    bestGy = rand.gy;
  } else {
    for (const n of neighbors) {
      const d = distanceField.getDistance(n.gx, n.gy);
      if (!Number.isFinite(d)) continue;

      if (mode === "pursue") {
        if (d < bestD) {
          bestD = d;
          bestGx = n.gx;
          bestGy = n.gy;
        }
      } else {
        // evade: maximize distance
        if (d > bestD) {
          bestD = d;
          bestGx = n.gx;
          bestGy = n.gy;
        }
      }
    }
  }

  // Smart target = center of best cell
  const center = grid.gridToWorldCenter(bestGx, bestGy);
  const smartTarget = p5.createVector(center.x, center.y);
  const smartSteer = computeSteer(
    p5,
    pos,
    vel,
    smartTarget,
    maxSpeed,
    maxForce
  );

  // Execution-level noise: small random steering component
  const randomTarget = randomPointAround(p5, pos, 50);
  const randomSteer = computeSteer(
    p5,
    pos,
    vel,
    randomTarget,
    maxSpeed,
    maxForce
  );

  // Blend random vs smart by effectiveness
  // eff in [0.5,1]: biases strongly toward smart direction.
  const blended = lerpVector(p5, randomSteer, smartSteer, eff);
  return blended;
}

/**
 * Fallback steering when the distance field is not usable:
 * - pursue: straight seek to target
 * - evade: straight flee from target
 */
function fallbackMovementSteer(
  p5,
  mode,
  eff,
  pos,
  vel,
  targetPos,
  maxSpeed,
  maxForce
) {
  const targetVec = targetPos.copy
    ? targetPos.copy()
    : p5.createVector(targetPos.x, targetPos.y);

  if (mode === "pursue") {
    const steer = computeSteer(p5, pos, vel, targetVec, maxSpeed, maxForce);
    steer.mult(eff);
    return steer;
  }

  // Evade: steer away from target
  const awayDir = p5.createVector(pos.x - targetVec.x, pos.y - targetVec.y);
  if (awayDir.mag() === 0) {
    // random direction if exactly overlapping
    const rand = randomPointAround(p5, pos, 50);
    awayDir.set(rand.x - pos.x, rand.y - pos.y);
  }

  const evadeTarget = p5.createVector(pos.x + awayDir.x, pos.y + awayDir.y);

  const steer = computeSteer(p5, pos, vel, evadeTarget, maxSpeed, maxForce);
  steer.mult(eff);
  return steer;
}

// ---------------------------------------------------------------------------
// Small vector/maths helpers
// ---------------------------------------------------------------------------

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

/**
 * Create a random point around `center` at roughly given radius.
 * @param {import("p5")} p5
 * @param {p5.Vector} center
 * @param {number} radius
 * @returns {p5.Vector}
 */
function randomPointAround(p5, center, radius) {
  const angle = p5.random(0, p5.TWO_PI);
  const r = radius * 0.5 + p5.random(radius * 0.5); // slightly varied radius
  const x = center.x + r * Math.cos(angle);
  const y = center.y + r * Math.sin(angle);
  return p5.createVector(x, y);
}

/**
 * Linear interpolation between two vectors.
 * @param {import("p5")} p5
 * @param {p5.Vector} a
 * @param {p5.Vector} b
 * @param {number} t
 * @returns {p5.Vector}
 */
function lerpVector(p5, a, b, t) {
  const x = p5.lerp(a.x, b.x, t);
  const y = p5.lerp(a.y, b.y, t);
  return p5.createVector(x, y);
}
