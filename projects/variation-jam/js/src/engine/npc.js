/**
 * src/engine/npc.js
 *
 * A higher-level construct that combines all of the pieces of
 * the engine to render, compute behaviour, and update position of a non-playable object.
 *
 * @attribution GenAI usage: 100%.
 *              Full conversation available at src/engine/ATTRIBUTION/ChatGPT-engine-discussion.html
 */

import { MovementAgent } from "./movement/agent.js";
import {
  PursueMovementBehaviour,
  EvadeMovementBehaviour,
} from "./movement/behaviours.js";
import * as theme from "../theme.js";

/**
 * @typedef {Object} NPCUpdateContext
 * The context passed to the NPC's update(p5, context) method.
 * Includes the grid, distanceField, and player's MovementAgent to be able to make
 * informed decisions with the assigned MovementBehaviour (pursue, evade, patrol, etc.)
 *
 * @property {import("./navigation/grid-graph.js").GridGraph} grid
 * @property {import("./navigation/distance-field.js").GridGraphDistanceField} distanceField
 * @property {import("./movement/agent.js").MovementAgent} [playerAgent]
 *   Optional; if provided, NPC can use it as a target reference.
 */

/**
 * NPC
 *
 * Engine-level NPC that:
 *  - wraps a MovementAgent (physics / movement)
 *  - owns a set of MovementBehaviours (pursue / evade by default)
 *  - can switch between behaviours via mode ("pursuer" | "evader" | custom keys)
 *  - exposes update(p5, context) and draw(p5)
 */
export default class NPC {
  /**
   * @param {import("p5")} p5
   * @param {Object} opts
   * @param {number} opts.x          - Initial x
   * @param {number} opts.y          - Initial y
   * @param {number} [opts.radius=20]
   * @param {number} [opts.maxSpeed=2.5]
   * @param {number} [opts.maxForce=0.25]
   * @param {"pursuer"|"evader"} [opts.mode="pursuer"]
   * @param {string} [opts.colorKeyPursuer="pursuer"]
   * @param {string} [opts.colorKeyEvader="evader"]
   * @param {number} [opts.effectivenessPursue=1.0]
   * @param {number} [opts.effectivenessEvade=0.8]
   */
  constructor(
    p5,
    {
      x,
      y,
      radius = 20,
      maxSpeed = 2.5,
      maxForce = 0.25,
      mode = "pursuer",
      colorKeyPursuer = "pursuer",
      colorKeyEvader = "evader",
      effectivenessPursue = 1.0,
      effectivenessEvade = 0.8,
    } = {}
  ) {
    /** @type {MovementAgent} */
    this.agent = new MovementAgent(p5, x, y, {
      radius,
      maxSpeed,
      maxForce,
      debugTag: `npc-${mode}`,
    });

    // Default behaviours: pursue / evade using distance fields
    this.behaviours = {
      pursuer: new PursueMovementBehaviour(effectivenessPursue),
      evader: new EvadeMovementBehaviour(effectivenessEvade),
    };

    /** @type {"pursuer"|"evader"} */
    this.mode = mode;

    this.colorKeyPursuer = colorKeyPursuer;
    this.colorKeyEvader = colorKeyEvader;

    // Set initial behaviour
    this._applyModeBehaviour();
  }

  /**
   * Current x position of the NPC (for view code that expects x/y).
   */
  get x() {
    return this.agent.pos.x;
  }

  /**
   * Current y position of the NPC.
   */
  get y() {
    return this.agent.pos.y;
  }

  /**
   * Radius used for drawing / collision.
   */
  get radius() {
    return this.agent.radius ?? 20;
  }

  /**
   * Change NPC mode and update current behaviour.
   *
   * @param {"pursuer"|"evader"} mode
   */
  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this._applyModeBehaviour();
  }

  /**
   * Internal helper to bind the MovementBehaviour based on current mode.
   */
  _applyModeBehaviour() {
    const behaviour = this.behaviours[this.mode] ?? null;
    this.agent.setMovementBehaviour(behaviour);
  }

  /**
   * Allows adding or overriding behaviours by key.
   *
   * @param {string} key
   * @param {import("./movement/behaviours.js").MovementBehaviour} behaviour
   */
  setBehaviour(key, behaviour) {
    this.behaviours[key] = behaviour;
    // Optional: if the current mode matches, re-apply
    if (key === this.mode) {
      this.agent.setMovementBehaviour(behaviour);
    }
  }

  /**
   * Update NPC movement.
   *
   * @param {import("p5")} p5
   * @param {NPCUpdateContext} context
   */
  update(p5, context) {
    const { grid, distanceField, playerAgent } = context;

    // For pursue/evade behaviours, the distance field is already computed
    // from the relevant target (e.g., from player). We pass a targetPos mainly
    // for fallback logic; using playerAgent's position is the natural default.
    const targetPos = playerAgent ? playerAgent.pos : this.agent.pos;

    this.agent.update(p5, grid, distanceField, targetPos);
  }

  /**
   * Draw the NPC. Uses theme.colors.pursuer / theme.colors.evader by default.
   *
   * @param {import("p5")} p5
   */
  draw(p5) {
    p5.push();
    {
      p5.noStroke();

      const colorMap = theme.colors || {};
      const fallbackColor = 200;
      let colorKey =
        this.mode === "pursuer" ? this.colorKeyPursuer : this.colorKeyEvader;
      const fillColor = colorMap[colorKey] ?? fallbackColor;

      p5.fill(fillColor);
      p5.circle(this.x, this.y, this.radius * 2);
    }
    p5.pop();
  }
}
