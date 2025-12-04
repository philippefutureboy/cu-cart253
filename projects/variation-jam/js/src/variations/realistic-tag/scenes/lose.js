import { BaseScene, SceneRequest } from "../../../p5/scene.js";
import FontBook from "../../../utils/fonts.js";
import * as theme from "../../../theme.js";

/**
 * RealisticTag.LoseScene
 *
 * Displays lose screen for {duration} seconds
 * Transitions to menu afterwards.
 *
 */
export default class LoseScene extends BaseScene {
  static key = "realistic-tag-game.lose";
  static label = "Realistic Tag Game: Lose Scene";

  /**
   * @param {Object} opts
   * @param {number} opts.duration How long this scenes stays up
   */
  constructor({ duration = 5 } = {}) {
    super();
    this.font = null;
    this.sceneDuration = duration;
    this._setupped = false;
  }

  /**
   * Load assets
   *
   * @param {import('p5')} p5
   */
  setup(p5) {
    if (this._setupped) {
      return;
    }

    FontBook.getPromise("mayas-script").then((font) => {
      this.font = font;
    });
    this._setupped = true;
  }

  /**
   * Draws the rule text.
   * Requests transition to play scene once duration has been elapsed.
   *
   * @param {import('p5')} p5
   */
  draw(p5) {
    let typo = null;
    // get the appropriate typo styling based on loaded font
    if (!FontBook.isSentinel(this.font) && this.font !== null) {
      typo = theme.typo["mayas-script"];
    } else {
      typo = theme.typo["default"];
    }

    // initialize scene timeout
    this.startAt = this.startAt ?? new Date();
    // calculate how much time is left
    const secondsElapsed = Math.floor((new Date() - this.startAt) / 1000);
    const sceneDuration = this.sceneDuration;
    const secondsLeft = Math.max(sceneDuration - secondsElapsed, 0);

    p5.background(theme.colors.background);
    p5.push();
    {
      if (!FontBook.isSentinel(this.font) && this.font !== null) {
        p5.textFont(this.font);
      }
      p5.textSize(typo.h1.size);
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.fill(theme.colors.textDefault);
      p5.text("DAMN, YOUR FRIEND IS FAST!", p5.width / 2, p5.height / 2);
    }
    p5.pop();

    if (secondsLeft === 0) {
      return new SceneRequest("menu");
    }
  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyPressed(p5, event) {
    if (event.key === "Backspace") {
      event.stopPropagation();
      return new SceneRequest("menu");
    }
  }
}
