/**
 * src/engine/player/intent.js
 *
 * PlayerIntent
 *
 * Represents the abstract intent of the player, independent of input device.
 * Controllers update this; movement behaviours consume it.
 *
 * @attribution GenAI usage: 100%.
 *              Full conversation available at src/engine/ATTRIBUTION/ChatGPT-engine-discussion.html
 */
export class PlayerIntent {
  /**
   * @param {Object} [opts]
   * @param {number} [opts.moveX=0]   - Horizontal intent in [-1, 1]
   * @param {number} [opts.moveY=0]   - Vertical intent in [-1, 1]
   * @param {boolean} [opts.sprint=false]
   * @param {boolean} [opts.dash=false]
   */
  constructor({ moveX = 0, moveY = 0, sprint = false, dash = false } = {}) {
    /** @type {number} */
    this.moveX = moveX;
    /** @type {number} */
    this.moveY = moveY;
    /** @type {boolean} */
    this.sprint = sprint;
    /** @type {boolean} */
    this.dash = dash;
  }

  /**
   * Reset to neutral intent (no movement, no sprint/dash).
   */
  reset() {
    this.moveX = 0;
    this.moveY = 0;
    this.sprint = false;
    this.dash = false;
  }

  /**
   * Create a deep copy of this intent.
   * @returns {PlayerIntent}
   */
  clone() {
    return new PlayerIntent({
      moveX: this.moveX,
      moveY: this.moveY,
      sprint: this.sprint,
      dash: this.dash,
    });
  }

  /**
   * Optionally expose a plain object view (if ever needed).
   * @returns {{moveX:number, moveY:number, sprint:boolean, dash:boolean}}
   */
  toObject() {
    return {
      moveX: this.moveX,
      moveY: this.moveY,
      sprint: this.sprint,
      dash: this.dash,
    };
  }
}
