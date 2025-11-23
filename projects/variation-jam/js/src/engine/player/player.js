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
   * @param {number} opts.x          - Initial x position
   * @param {number} opts.y          - Initial y position
   * @param {KeyboardInput} opts.keyboard
   * @param {MouseInput} [opts.mouse]  // kept for future flexibility, not used by keyboard controller
   * @param {number} [opts.radius=20]
   * @param {number} [opts.maxSpeed=3.0]
   * @param {number} [opts.maxForce=0.3]
   * @param {string} [opts.colorKey="player"] - theme.colors[colorKey] used in draw
   * @param {import("./player/controller/interfaces.js").IPlayerController} [opts.controller]
   *        Optional: custom controller; defaults to PlayerKeyboardController if not provided.
   */
  constructor(
    p5,
    {
      x,
      y,
      keyboard,
      mouse,
      radius = 20,
      maxSpeed = 3.0,
      maxForce = 0.3,
      colorKey = "player",
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

    // Visual settings
    this.radius = radius;
    this.colorKey = colorKey;
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
  }

  get x() {
    return this.agent.pos.x;
  }

  get y() {
    return this.agent.pos.y;
  }

  draw(p5) {
    p5.push();
    {
      p5.noStroke();

      const fallbackColor = 255;
      const colorMap = theme.colors || {};
      const fillColor = colorMap[this.colorKey] ?? fallbackColor;

      p5.fill(fillColor);
      p5.circle(this.x, this.y, this.radius * 2);
    }
    p5.pop();
  }
}
