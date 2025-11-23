/**
 * src/engine/movement/agent.js
 *
 * MovementAgent implementation.
 *
 * Provides movement/kinematic logic to and in-game object.
 * Doesn't compute the direction; only applies the result of
 * the MovementBehaviour strategy.
 *
 * MovementBehaviour classes implement the Strategy OOP design pattern,
 * and are interchangeable. This allows the MovementAgent to change behaviour
 * on the fly, when setMovementBehaviour is called.
 *
 * @attribution GenAI usage: 100%.
 *              Full conversation available at src/engine/ATTRIBUTION/ChatGPT-engine-discussion.html
 */

/**
 * @typedef {import("p5")} p5
 * @typedef {import("./behaviours.js").MovementBehaviour} MovementBehaviour
 */

/**
 * @typedef {Object} MovementAgentOptions
 * @property {number} [radius=8]
 *   Logical radius of the agent (useful for collisions / view layer).
 * @property {number} [maxSpeed=2.0]
 *   Maximum linear speed.
 * @property {number} [maxForce=0.2]
 *   Maximum steering force (acceleration magnitude).
 * @property {MovementBehaviour|null} [movementBehaviour=null]
 *   Initial movement behaviour strategy.
 * @property {string} [debugTag]
 *   Optional identifier for debugging / logging.
 */

/**
 * MovementAgent is a pure movement/kinematics container.
 *
 * It owns:
 *  - position, velocity, acceleration
 *  - maxSpeed, maxForce
 *  - an optional MovementBehaviour strategy
 *
 * It does NOT:
 *  - decide *what* to target (that's provided as targetPos)
 *  - handle rendering (view layer responsibility)
 *  - handle collisions (world / collision system responsibility)
 */
export class MovementAgent {
  /**
   * @param {p5} p5         - p5 instance (for vector creation).
   * @param {number} x      - Initial x position in world space.
   * @param {number} y      - Initial y position in world space.
   * @param {MovementAgentOptions} [options={}]
   */
  constructor(p5, x, y, options = {}) {
    /** @type {p5.Vector} */
    this.pos = p5.createVector(x, y);
    /** @type {p5.Vector} */
    this.vel = p5.createVector(0, 0);
    /** @type {p5.Vector} */
    this.acc = p5.createVector(0, 0);

    /** @type {number} */
    this.radius = options.radius ?? 8;
    /** @type {number} */
    this.maxSpeed = options.maxSpeed ?? 2.0;
    /** @type {number} */
    this.maxForce = options.maxForce ?? 0.2;

    /** @type {MovementBehaviour|null} */
    this.movementBehaviour = options.movementBehaviour ?? null;

    /** @type {string|undefined} */
    this.debugTag = options.debugTag;
  }

  /**
   * Attach or replace the current movement behaviour.
   *
   * @param {MovementBehaviour|null} behaviour
   */
  setMovementBehaviour(behaviour) {
    this.movementBehaviour = behaviour ?? null;
  }

  /**
   * Lightweight snapshot of state for behaviours.
   * Keeps behaviours pure-ish and decoupled from the full agent instance.
   *
   * @returns {{
   *   pos: p5.Vector,
   *   vel: p5.Vector,
   *   maxSpeed: number,
   *   maxForce: number
   * }}
   */
  getStateSnapshot() {
    return {
      pos: this.pos.copy(),
      vel: this.vel.copy(),
      maxSpeed: this.maxSpeed,
      maxForce: this.maxForce,
    };
  }

  /**
   * Apply a steering acceleration to this agent.
   * This just accumulates into `acc` for the current frame.
   *
   * @param {p5.Vector} force
   */
  applyForce(force) {
    if (!force || typeof force.x !== "number" || typeof force.y !== "number") {
      return;
    }
    this.acc.add(force);
  }

  /**
   * High-level update step:
   *  1. Ask current movementBehaviour (if any) for a steering vector.
   *  2. Apply that steering.
   *  3. Integrate physics (acc -> vel -> pos).
   *
   * NOTE:
   *  - grid and distanceField are treated as read-only from the agent's POV.
   *  - targetPos is a generic movement target (player, waypoint, threat, etc.).
   *
   * @param {p5} p5
   * @param {GridGraph} grid
   * @param {GridGraphDistanceField} distanceField
   * @param {p5.Vector | {x:number, y:number}} targetPos
   */
  update(p5, grid, distanceField, targetPos) {
    // 1) Steering from behaviour (if any)
    if (this.movementBehaviour && targetPos != null) {
      const steer = this.movementBehaviour.computeSteer(
        p5,
        grid,
        distanceField,
        this.getStateSnapshot(),
        targetPos
      );

      if (steer) {
        this.applyForce(steer);
      }
    }

    // 2) Integrate physics
    this.vel.add(this.acc);

    // Respect maxSpeed
    const speed = this.vel.mag();
    if (speed > this.maxSpeed) {
      this.vel.setMag(this.maxSpeed);
    }

    this.pos.add(this.vel);

    // Reset acceleration for next frame
    this.acc.set(0, 0);
  }
}
