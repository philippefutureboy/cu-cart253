/**
 * src/engine/player/controller/keyboard-controller.js
 *
 * Implements the PlayerKeyboardController class.
 * This class transforms player inputs via the KeyboardInput class into
 * PlayerIntent to be consumed by a Player*MovementBehaviour strategy.
 *
 * @see ../intent.js
 *
 * @attribution GenAI usage: 100%.
 *              Full conversation available at src/engine/ATTRIBUTION/ChatGPT-engine-discussion.html
 */
import { IPlayerController } from "./interfaces.js";
import { KeyboardInput } from "../../inputs.js";
import { PlayerIntent } from "../intent.js";

/**
 * PlayerKeyboardController
 *
 * Reads from KeyboardInput and produces a PlayerIntent.
 * Keyboard-only (no mouse). Controls support WASD/wasd/arrows inputs.
 */
export class PlayerKeyboardController extends IPlayerController {
  /**
   * @param {Object} deps
   * @param {KeyboardInput} deps.keyboard
   */
  constructor({ keyboard } = {}) {
    super();

    if (!keyboard) {
      throw new Error(
        "PlayerKeyboardController requires a KeyboardInput instance"
      );
    }

    /** @type {KeyboardInput} */
    this.keyboard = keyboard;

    /** @type {PlayerIntent} */
    this.intent = new PlayerIntent();
  }

  /**
   * Recompute the player's intent based on current keyboard state.
   *
   * @param {import("p5")} p5
   */
  update(p5) {
    const kb = this.keyboard;

    let moveX = 0;
    let moveY = 0;

    // Horizontal: A/Left  -> -1,  D/Right -> +1
    if (kb.isDown("a") || kb.isDown("A") || kb.isDown("ArrowLeft")) {
      moveX -= 1;
    }
    if (kb.isDown("d") || kb.isDown("D") || kb.isDown("ArrowRight")) {
      moveX += 1;
    }

    // Vertical: W/Up -> -1,  S/Down -> +1
    if (kb.isDown("w") || kb.isDown("W") || kb.isDown("ArrowUp")) {
      moveY -= 1;
    }
    if (kb.isDown("s") || kb.isDown("S") || kb.isDown("ArrowDown")) {
      moveY += 1;
    }

    // Normalize so diagonals are not faster
    const mag = Math.hypot(moveX, moveY);
    if (mag > 1e-3) {
      moveX /= mag;
      moveY /= mag;
    }

    const sprint = kb.isDown("Shift");
    const dash = false; // reserved for future

    this.intent.moveX = moveX;
    this.intent.moveY = moveY;
    this.intent.sprint = sprint;
    this.intent.dash = dash;
  }

  /**
   * Get the current PlayerIntent.
   * Returning the instance is fine as long as consumers treat it as read-only.
   * @returns {PlayerIntent}
   */
  getIntent() {
    return this.intent;
  }
}
