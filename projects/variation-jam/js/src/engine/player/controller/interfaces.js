/**
 * src/engine/player/controller/interfaces.js
 *
 * Base class / Interface for the Player*Controller classes.
 * Player*Controller classes process user-input and convert them into
 * PlayerIntent dataclass instances to pass to a Player*MovementBehaviour class.
 *
 * @see ../intent.js
 *
 * @attribution GenAI usage: 100%.
 *              Full conversation available at src/engine/ATTRIBUTION/ChatGPT-engine-discussion.html
 */
import { PlayerIntent } from "../intent.js";

/**
 * IPlayerController
 *
 * Interface/base class for all player controllers.
 * Concrete controllers must implement:
 *  - update(p5)
 *  - getIntent(): PlayerIntent
 */
export class IPlayerController {
  constructor() {
    if (new.target === IPlayerController) {
      throw new Error(
        "IPlayerController is an interface/base class and cannot be instantiated directly."
      );
    }
  }

  /**
   * Update internal intent based on this controller's input source.
   * @param {import("p5")} p5
   */
  update(p5) {
    throw new Error(
      "IPlayerController.update(p5) must be implemented by subclasses."
    );
  }

  /**
   * Return the current PlayerIntent.
   * @returns {PlayerIntent}
   */
  getIntent() {
    throw new Error(
      "IPlayerController.getIntent() must be implemented by subclasses."
    );
  }
}
