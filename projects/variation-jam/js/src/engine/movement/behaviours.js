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
 * @typedef {import("../navigation/grid-graph.js").GridGraph} GridGraph
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

  getEffective() {
    return this.effectivenessBase;
  }

  /**
   * Override in subclasses.
   *
   * @param {import("p5")} p5
   * @param {GridGraph} grid
   * @param {{[key:string]: any}} fields
   * @param {{pos:p5.Vector, vel:p5.Vector, maxSpeed:number, maxForce:number}} npcState
   * @param {p5.Vector | {x:number, y:number}} targetPos
   * @returns {p5.Vector} steering vector
   */
  computeSteer(p5, grid, fields, npcState, targetPos) {
    return p5.createVector(0, 0);
  }
}

export class IdleMovementBehaviour extends MovementBehaviour {
  constructor(effectivenessBase = 1.0) {
    super(effectivenessBase);
    this.type = "idle";
  }

  /**
   * Idle: no steering, just let the agent drift/stop.
   *
   * @param {import("p5")} p5
   * @param {GridGraph} grid
   * @param {{[key:string]: any}} fields
   * @param {{
   *   pos: p5.Vector,
   *   vel: p5.Vector,
   *   maxSpeed: number,
   *   maxForce: number
   * }} agentState
   * @param {p5.Vector | {x:number, y:number}} targetPos
   * @returns {p5.Vector}
   */
  computeSteer(p5, grid, fields, agentState, targetPos) {
    // Could also gradually brake here if you want:
    // const brake = agentState.vel.copy().mult(-0.2);
    // return brake;
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

  computeSteer(p5, grid, fields, npcState, targetPos) {
    return computeMovementSteer(
      p5,
      "pursue",
      this.getEffective(),
      grid,
      fields?.pathFromPlayer ?? fields?.evadeFromPlayer,
      npcState,
      targetPos
    );
  }
}

/**
 * Movement behaviour that tries to maximize distance to target
 * using the distance field (evade / flee) while also avoiding being cornered/sticking to canvas bounds.
 */
// ---------------------------------------------------------------------------
// EvadeMovementBehaviour (Euclidean + corner-as-player penalty)
// ---------------------------------------------------------------------------

export class EvadeMovementBehaviour extends MovementBehaviour {
  /**
   * @param {number} [effectivenessBase=1.0]
   */
  constructor(effectivenessBase = 1.0) {
    super(effectivenessBase);
    this.type = "evade";
  }

  /**
   * Evade by maximizing distance from the *nearest* threat, where threats are:
   *  - the real player (via Euclidean distance field)
   *  - the four corners of the play area (treated as if a player was there)
   *
   * For each candidate node (current + neighbors), we compute:
   *   dPlayer  = distanceField.getDistance(node)
   *   dCorner  = min distance to any canvas corner
   *   effectiveDist = min(dPlayer, cornerFactor * dCorner)
   *
   * and pick the node with the largest effectiveDist.
   *
   * If no appropriate distance field is provided, falls back to local
   * flee + border avoidance.
   *
   * @param {import("p5")} p5
   * @param {import("../navigation/grid-graph.js").GridGraph} grid
   * @param {{[key:string]: any}} fields
   * @param {{
   *   pos: p5.Vector,
   *   vel: p5.Vector,
   *   maxSpeed: number,
   *   maxForce: number
   * }} agentState
   * @param {p5.Vector | {x:number, y:number}} targetPos  // player position
   * @returns {p5.Vector}
   */
  computeSteer(p5, grid, fields, agentState, targetPos) {
    const { pos, vel, maxSpeed, maxForce } = agentState;

    // Prefer Euclidean-type field for evasion
    const distanceField =
      fields?.evadeFromPlayer || fields?.pathFromPlayer || null;

    if (!grid || !distanceField) {
      // No usable field → fallback to simple flee+border
      return this._computeLocalFlee(p5, agentState, targetPos);
    }

    // --- 1) Find current node ------------------------------------------------
    const { gx, gy, valid } = grid.worldToGrid(pos);
    if (!valid) {
      return this._computeLocalFlee(p5, agentState, targetPos);
    }

    const currentNode = grid.getNode(gx, gy);
    if (!currentNode) {
      return this._computeLocalFlee(p5, agentState, targetPos);
    }

    const candidates = [currentNode, ...grid.getNeighbors(currentNode)];
    if (!candidates.length) {
      return this._computeLocalFlee(p5, agentState, targetPos);
    }

    // --- 2) Threat model: player + four corners -----------------------------
    const cornerFactor = 1.0; // 1.0 = corners as dangerous as the player
    const width = p5.width;
    const height = p5.height;

    let bestNode = currentNode;
    let bestScore = -Infinity;

    for (const node of candidates) {
      if (node.walkable === false) continue;

      // Distance from player (via Euclidean field)
      const dPlayer = distanceField.getDistance(node);
      if (!Number.isFinite(dPlayer)) continue;

      // Node center in world space
      const { gx: ngx, gy: ngy } = node.data;
      const center = grid.gridToWorldCenter(ngx, ngy);
      const cx = center.x;
      const cy = center.y;

      // Distance to each corner
      const dTL = Math.hypot(cx - 0, cy - 0);
      const dTR = Math.hypot(cx - width, cy - 0);
      const dBL = Math.hypot(cx - 0, cy - height);
      const dBR = Math.hypot(cx - width, cy - height);
      const dCornerClosest = Math.min(dTL, dTR, dBL, dBR);

      // Effective distance to nearest threat:
      // (player OR closest corner, scaled)
      const effectiveDist = Math.min(dPlayer, cornerFactor * dCornerClosest);

      // We want to maximize effectiveDist
      if (effectiveDist > bestScore + 1e-6) {
        bestScore = effectiveDist;
        bestNode = node;
      } else if (
        Math.abs(effectiveDist - bestScore) <= 1e-6 &&
        Math.random() < 0.2
      ) {
        // small random tiebreak to avoid deterministic sticking
        bestScore = effectiveDist;
        bestNode = node;
      }
    }

    // --- 3) Steer towards the best node's center ----------------------------
    const { gx: bgx, gy: bgy } = bestNode.data;
    const bestCenter = grid.gridToWorldCenter(bgx, bgy);
    const target = p5.createVector(bestCenter.x, bestCenter.y);

    const steer = computeSteer(p5, pos, vel, target, maxSpeed, maxForce);
    if (steer.mag() > maxForce) {
      steer.setMag(maxForce);
    }

    steer.mult(this.getEffective());
    return steer;
  }

  /**
   * Fallback: purely local flee + border avoidance (previous working version).
   *
   * @param {import("p5")} p5
   * @param {{
   *   pos: p5.Vector,
   *   vel: p5.Vector,
   *   maxSpeed: number,
   *   maxForce: number
   * }} agentState
   * @param {p5.Vector | {x:number, y:number}} targetPos
   * @returns {p5.Vector}
   */
  _computeLocalFlee(p5, agentState, targetPos) {
    const { pos, vel, maxSpeed, maxForce } = agentState;

    if (!targetPos) {
      return p5.createVector(0, 0);
    }

    // 1) Flee vector
    const flee = p5.createVector(pos.x - targetPos.x, pos.y - targetPos.y);
    if (flee.magSq() < 1e-6) {
      flee.set(p5.random(-1, 1), p5.random(-1, 1));
    }
    flee.normalize();

    // 2) Border avoidance
    const margin = 50;
    const borderForce = p5.createVector(0, 0);

    if (pos.x < margin) {
      borderForce.x += (margin - pos.x) / margin;
    }
    if (pos.x > p5.width - margin) {
      borderForce.x -= (pos.x - (p5.width - margin)) / margin;
    }
    if (pos.y < margin) {
      borderForce.y += (margin - pos.y) / margin;
    }
    if (pos.y > p5.height - margin) {
      borderForce.y -= (pos.y - (p5.height - margin)) / margin;
    }

    if (borderForce.magSq() > 1e-6) {
      borderForce.normalize();
    }

    const fleeWeight = 1.0;
    const borderWeight = 0.7;

    const moveDir = p5.createVector(0, 0);
    moveDir.add(flee.copy().mult(fleeWeight));
    moveDir.add(borderForce.copy().mult(borderWeight));

    if (moveDir.magSq() < 1e-6) {
      moveDir.set(flee);
    }
    moveDir.normalize();

    const desiredVel = moveDir.copy().mult(maxSpeed);
    const steer = desiredVel.sub(vel);

    if (steer.mag() > maxForce) {
      steer.setMag(maxForce);
    }

    steer.mult(this.getEffective());
    return steer;
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
   * @param {{[key:string]: any}} fields
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
  computeSteer(p5, grid, fields, agentState, targetPos) {
    const { pos, vel, maxSpeed, maxForce } = agentState;

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
    const speedFactor = sprint ? 1.1 : 1.0;
    const effMaxSpeed = maxSpeed * speedFactor;
    const effMaxForce = maxForce; // could be adjusted during sprint if desired

    const steer = computeSteer(p5, pos, vel, target, effMaxSpeed, effMaxForce);
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
  const t = eff; // at 0.5, 50/50; at 1.0, fully smart
  return lerpVector(p5, randomSteer, smartSteer, t);
}

/**
 * Fallback for when distance field is invalid or node is not on grid.
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
  if (!targetPos) {
    return p5.createVector(0, 0);
  }

  const targetVec = p5.createVector(targetPos.x, targetPos.y);
  let steer = computeSteer(p5, pos, vel, targetVec, maxSpeed, maxForce);

  if (mode === "evade") {
    steer.mult(-1);
  }

  steer.mult(eff);
  return steer;
}

/**
 * Clamp value v into [min, max].
 */
function clamp(v, min, max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

/**
 * Clamp value into [0,1].
 */
function clamp01(x) {
  return clamp(x, 0, 1);
}

/**
 * Random point around a center within a given radius.
 * @param {import("p5")} p5
 * @param {p5.Vector} center
 * @param {number} radius
 * @returns {p5.Vector}
 */
function randomPointAround(p5, center, radius) {
  const angle = p5.random() * Math.PI * 2;
  const r = p5.random() * radius;
  const x = center.x + Math.cos(angle) * r;
  const y = center.y + Math.sin(angle) * r;
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
