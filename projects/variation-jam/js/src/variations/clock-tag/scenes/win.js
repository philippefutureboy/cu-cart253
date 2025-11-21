import { BaseScene, SceneRequest } from "../../../p5/scene.js";
import FontBook from "../../../utils/fonts.js";
import * as theme from "../../../theme.js";

export default class WinScene extends BaseScene {
  static key = "clock-tag-game.win";
  static label = "Clock Tag Game: Win Scene";

  constructor({ duration = 2 } = {}) {
    super();
    this.font = null;
    this.tauntSoundBite = null;
    this.tauntSoundPlayed = false;
    this.sceneDuration = duration;
    this._setupped = false;
  }

  /**
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
   * @param {import('p5')} p5
   */
  draw(p5) {
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
        p5.textSize(theme.typo["mayas-script"].h1.size);
        p5.textFont(this.font);
      } else {
        p5.textSize(theme.typo["default"].h1.size);
      }
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.fill(theme.colors.textDefault);
      p5.text("PFF TOO EASY.", p5.width / 2, p5.height / 2);
    }
    p5.pop();

    if (secondsLeft <= 0) {
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
