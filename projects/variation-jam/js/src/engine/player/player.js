/**
 * src/engine/player/player.js
 *
 * Player class implementation.
 * A higher-level construct that combines all of the pieces of the engine
 * to render, control, and update a player-representing object using user-input.
 *
 * @attribution GenAI usage: 100%.
 *              Full conversation available at src/engine/ATTRIBUTION/ChatGPT-engine-discussion.html
 */
import { MovementAgent } from "../movement/agent.js";
import { PlayerMovementBehaviour } from "../movement/behaviours.js";
import { PlayerKeyboardController } from "./controller/keyboard-controller.js";
import * as theme from "../../theme.js";

/**
 * Player
 *
 * Game-level object that composes:
 *  - a controller (currently PlayerKeyboardController)
 *  - a MovementAgent
 *  - a PlayerMovementBehaviour
 *  - a draw(p5) method
 */
export class Player {
  /**
   * @param {import("p5")} p5
   * @param {Object} opts
   * @param {number} opts.x Initial x position
   * @param {number} opts.y Initial y position
   * @param {string} opts.mode Tag mode.
   * @param {KeyboardInput} opts.keyboard Keyboard input.
   * @param {MouseInput} [opts.mouse] Mouse input. Unused, but available for future use.
   * @param {number} [opts.radius=20]
   * @param {number} [opts.maxSpeed=3.0]
   * @param {number} [opts.maxForce=0.3]
   * @param {string} [opts.fillColorKey="player"] Fill color for the player. defaults to "player"
   * @param {import("./player/controller/interfaces.js").IPlayerController} [opts.controller]
   *        Optional: custom controller; defaults to PlayerKeyboardController if not provided.
   */
  constructor(
    p5,
    {
      x,
      y,
      mode,
      keyboard,
      mouse,
      radius = 20,
      maxSpeed = 3.0,
      maxForce = 0.3,
      fillColorKey = "player",
      controller,
    } = {}
  ) {
    if (!keyboard && !controller) {
      throw new Error(
        "Player requires either a KeyboardInput instance or a custom controller."
      );
    }

    // Controller: either provided or created as keyboard-based
    if (controller) {
      this.controller = controller;
    } else {
      this.controller = new PlayerKeyboardController({ keyboard });
    }

    // MovementAgent: holds pos/vel/acc and runs movement behaviours
    this.agent = new MovementAgent(p5, x, y, {
      radius,
      maxSpeed,
      maxForce,
      debugTag: "player",
    });

    // Attach a PlayerMovementBehaviour that consumes controller intent
    const behaviour = new PlayerMovementBehaviour(this.controller);
    this.agent.setMovementBehaviour(behaviour);
    this.mode = mode;
    this.modeTransition = null;

    // Visual settings
    this.radius = radius;
    this.fillColorKey = fillColorKey;
  }

  /**
   * Update the player:
   *  1. Update controller (inputs → intent)
   *  2. Update movement agent (intent → steering → new pos)
   *
   * @param {import("p5")} p5
   * @param {import("./navigation/grid-graph.js").GridGraph} grid
   * @param {import("./navigation/distance-field.js").GridGraphDistanceField} distanceField
   */
  update(p5, grid, distanceField) {
    this.controller.update(p5);

    const targetPos = this.agent.pos;
    this.agent.update(p5, grid, distanceField, targetPos);

    // Check if a mode transition is due for being applied.
    // If so apply and delete the transition
    if (
      this.modeTransition !== null &&
      this.modeTransition.at > performance.now()
    ) {
      this.mode = this.modeTransition.mode;
      this.modeTransition = null;
    }
  }

  get x() {
    return this.agent.pos.x;
  }

  get y() {
    return this.agent.pos.y;
  }

  /**
   * Sets the player mode, with an optional delay.
   *
   * @param {"pursuer"|"evader"} mode Mode to switch to
   * @param {number} delayMs Delay, in ms, before applying the mode.
   */
  setMode(mode, delayMs) {
    console.log("player.setMode", {
      mode,
      delayMs,
      prevMode: this.mode,
      prevTransition: this.modeTransition,
    });
    // Same mode, nothing to do.
    if (this.mode === mode) return;
    // Do not override if there's already a transition in progress.
    if (delayMs !== undefined) {
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

  draw(p5) {
    p5.push();
    {
      const colorMap = theme.colors || {};

      const fallbackStrokeColor = 0;
      // use the transition color if available to give user feedback
      const strokeColorKey = this.modeTransition?.mode ?? this.mode;
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
