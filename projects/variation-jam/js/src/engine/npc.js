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
  IdleMovementBehaviour,
} from "./movement/behaviours.js";
import * as theme from "../theme.js";

/**
 * @typedef {Object} NPCDistanceFields
 * @property {import("./navigation/distance-fields/interfaces.js").IDistanceField|import("./navigation/distance-fields/interfaces.js").ILazyDistanceField} [pathFromPlayer]
 * @property {import("./navigation/distance-fields/interfaces.js").IDistanceField|import("./navigation/distance-fields/interfaces.js").ILazyDistanceField} [evadeFromPlayer]
 */

/**
 * @typedef {Object} NPCUpdateContext
 * The context passed to the NPC's update(p5, context) method.
 * Includes the grid, distance fields, and player's MovementAgent to be able to make
 * informed decisions with the assigned MovementBehaviour (pursue, evade, patrol, etc.)
 *
 * @property {import("./navigation/grid-graph.js").GridGraph} grid
 * @property {NPCDistanceFields} fields
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
   * @param {string} [opts.fillColorKey="npc"] Fill color for the npc. defaults to "npc"
   * @param {"pursuer"|"evader"|"idle"} [opts.mode="pursuer"]
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
      fillColorKey = "npc",
      strokeColorKey = null,
      mode = "pursuer",
      effectivenessPursue = 1.0,
      effectivenessEvade = 0.8,
    } = {}
  ) {
    console.log("effectivenessPursue", effectivenessPursue);
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
      idle: new IdleMovementBehaviour(),
    };

    /** @type {"pursuer"|"evader"|"idle"} */
    this.mode = mode;
    // When a modifier is applied via applyModifier, the number of frames before restoring
    // state is stored here.
    /** @type {number|null} */
    this._modifierFramesLeft = null;
    // An object storing the modified properties to reapply them once the modifier is cleared.
    /** @type {Object|null} */
    this._unmodifier = null;
    /** @type {{mode: "pursuer"|"evader"|"idle", at: number}|null} */
    this.modeTransition = null;

    this.fillColorKey = fillColorKey;
    this.strokeColorKey = strokeColorKey;

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
   * Sets the NPC mode and update current behaviour, with an optional delay.
   *
   * @param {"pursuer"|"evader"} mode Mode to switch to
   * @param {number} delayMs Delay, in ms, before applying the mode.
   */
  setMode(mode, delayMs) {
    // Same mode, nothing to do.
    if (this.mode === mode) return;
    // Do not override if there's already a transition in progress.
    if (delayMs !== undefined) {
      // Move to evader automatically without delay so that the
      // NPC doesn't stay in place near the player when it should
      // start evading
      if (mode === "evader") {
        this.mode = mode;
      }
      // Move to idle if the mode requested is pursuer
      // to give the player a chance to escape.
      else {
        this.mode = "idle";
      }
      this._applyModeBehaviour();
      this.modeTransition = this.modeTransition ?? {
        mode,
        at: delayMs + performance.now(),
      };
    }
    // No delay provided, we set the mode promptly.
    else {
      this.mode = mode;
      this._applyModeBehaviour();
    }
  }

  /**
   * Internal helper to bind the MovementBehaviour based on current mode.
   */
  _applyModeBehaviour() {
    if (this.mode === "idle") {
      this.agent.reset();
    }
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
   * Applies a modifier to the NPC.
   * Modifies the properties of the NPC for {frameCount} frames.
   * Allows to introduce variation in behaviours for a duration.
   *
   * @param {{ maxSpeed: number, maxForce: number, strokeColorKey: string, effectivenessBase: number }} modifier
   * @param {number} frameCount Number of frames to apply the modifier for.
   * @param {boolean} force Whether or not to force the replacement of an existing modifier
   * @returns Returns whether or not the modifier has been applied.
   */
  applyModifier(modifier, frameCount = 60, force = false) {
    if (!force && this._modifierFramesLeft !== null) {
      return false;
    }
    this.clearModifier();
    this._modifierFramesLeft = frameCount;
    this._unmodifier = {
      strokeColorKey: this.strokeColorKey,
      fillColorKey: this.fillColorKey,
      maxSpeed: this.agent.maxSpeed,
      maxForce: this.agent.maxForce,
      effectivenessBase: this.agent.movementBehaviour.effectivenessBase,
    };
    this.strokeColorKey = modifier.strokeColorKey ?? this.strokeColorKey;
    this.fillColorKey = modifier.fillColorKey ?? this.fillColorKey;
    this.agent.maxSpeed = modifier.maxSpeed ?? this.agent.maxSpeed;
    this.agent.maxForce = modifier.maxForce ?? this.agent.maxForce;
    this.agent.movementBehaviour.effectivenessBase =
      modifier.effectivenessBase ??
      this.agent.movementBehaviour.effectivenessBase;
    return true;
  }

  clearModifier() {
    if (this._unmodifier) {
      this.strokeColorKey = this._unmodifier.strokeColorKey;
      this.fillColorKey = this._unmodifier.fillColorKey;
      this.agent.maxSpeed = this._unmodifier.maxSpeed;
      this.agent.maxForce = this._unmodifier.maxForce;
      this.agent.movementBehaviour.effectivenessBase =
        this._unmodifier.effectivenessBase;
      this._unmodifier = null;
      this._modifierFramesLeft = null;
    }
  }

  /**
   * Update NPC movement.
   *
   * @param {import("p5")} p5
   * @param {NPCUpdateContext} context
   */
  update(p5, context) {
    // Check if there's a modifier to clear
    if (this._modifierFramesLeft <= 0) {
      this.clearModifier();
    }
    // Check if there's a modifier active, if so, remove a frame from framesLeft.
    else if (this._modifierFramesLeft !== null) {
      this._modifierFramesLeft -= 1;
    }
    const { grid, fields, playerAgent } = context;

    // For pursue/evade behaviours, "fields" contains the pre-lazily-computed
    // distance fields (pathFromPlayer, evadeFromPlayer, etc.).
    // We pass a targetPos mainly for fallback logic; using playerAgent's
    // position is the natural default.
    const targetPos = playerAgent ? playerAgent.pos : this.agent.pos;

    this.agent.update(p5, grid, fields, targetPos);

    // Check if a mode transition is due for being applied.
    // If so apply and delete the transition
    if (
      this.modeTransition !== null &&
      this.modeTransition.at <= performance.now()
    ) {
      this.mode = this.modeTransition.mode;
      this.modeTransition = null;
      this._applyModeBehaviour();
    }
  }

  /**
   * Draw the NPC. Uses theme.colors.pursuer / theme.colors.evader by default.
   *
   * @param {import('p5')} p5
   */
  draw(p5) {
    p5.push();
    {
      p5.noStroke();

      const colorMap = theme.colors || {};

      const fallbackStrokeColor = 0;
      // use the transition color if available to give user feedback
      let strokeColorKey = this.strokeColorKey;
      if (!strokeColorKey) {
        strokeColorKey =
          this.mode === "idle" ? this.modeTransition?.mode : this.mode;
      }
      const strokeColor = colorMap[strokeColorKey] ?? fallbackStrokeColor;

      const fallbackFillColor = 255;
      const fillColorKey = this.fillColorKey;
      const fillColor = colorMap[fillColorKey] ?? fallbackFillColor;

      p5.strokeWeight(4);
      p5.stroke(strokeColor);
      p5.fill(fillColor);
      p5.circle(this.x, this.y, this.radius * 2);
    }
    p5.pop();
  }
}
