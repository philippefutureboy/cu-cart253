import { BaseScene, SceneRequest } from "../../../p5/scene.js";
import FontBook from "../../../utils/fonts.js";
import SoundBook from "../../../utils/sounds.js";
import * as theme from "../../../theme.js";

/**
 * ZombieTag.WinScene
 *
 * Displays win screen for {duration} seconds
 * Transitions to menu afterwards.
 *
 */
export default class WinScene extends BaseScene {
  static key = "zombie-tag-game.win";
  static label = "Zombie Tag Game: Win Scene";

  /**
   * @param {Object} opts
   * @param {number} opts.duration How long this scenes stays up
   */
  constructor({ duration = 4 } = {}) {
    super();
    this.font = null;
    this.sceneDuration = duration;
    this.soundEffect = null;
    this.soundEffectPlayed = false;
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

    // Load font
    FontBook.getPromise("mayas-script").then((font) => {
      this.font = font;
    });

    // Load sound
    SoundBook.load(
      p5,
      "quest-complete",
      "assets/sounds/Skyrim quest complete sound Youtube-hPYEsBwHPlM.mp3"
    ).then((soundFile) => {
      this.soundEffect = soundFile;
    });
    this._setupped = true;
  }

  /**
   * Draws a win response.
   * Plays yaaay sound effect.
   * Requests transition to menu scene once duration has elapsed.
   *
   * @param {import('p5')} p5
   */
  draw(p5) {
    // Play yaaay sound effect
    if (!SoundBook.isSentinel(this.soundEffect) && this.soundEffect !== null) {
      if (!this.soundEffectPlayed) {
        this.soundEffectPlayed = true;
        this.soundEffect.play();
      }
    }
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

    p5.background("#000");
    p5.push();
    {
      if (!FontBook.isSentinel(this.font) && this.font !== null) {
        p5.textFont(this.font);
      }
      p5.textSize(typo.h1.size);
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.fill("#ff0");
      p5.text("YOU SURVIVED!", p5.width / 2, p5.height / 2);
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
