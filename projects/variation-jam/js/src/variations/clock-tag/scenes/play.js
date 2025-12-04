import { BaseScene, SceneRequest } from "../../../p5/scene.js";
import Clock from "../components/clock.js";
import FontBook from "../../../utils/fonts.js";
import SoundBook from "../../../utils/sounds.js";
import * as theme from "../../../theme.js";

export default class PlayScene extends BaseScene {
  static key = "clock-tag-game.play";
  static label = "Clock Tag Game: Play Scene";

  constructor({ duration = 15 } = {}) {
    super();
    this.state = null;
    this.clock = null;
    this.startAt = null;
    this.font = null;
    this.elevatorMusic = null;
    this.elevatorMusicPlayed = false;
    this.sceneDuration = duration ?? 15;
    this._setupped = false;
  }

  /**
   * @param {import('p5')} p5
   */
  setup(p5) {
    if (this._setupped) {
      return;
    }
    // Load elevator music ahead of render
    SoundBook.load(
      p5,
      "elevator-music",
      "assets/sounds/Elevator Music - So Chill Youtube-55TD9gnMt3Y.mp3"
    ).then((soundFile) => {
      this.elevatorMusic = soundFile;
    });

    // Get font
    FontBook.getPromise("mayas-script").then((font) => {
      this.font = font;
      this.clock.font = font;
    });

    this.clock = new Clock({
      cx: p5.width / 2,
      cy: p5.height / 2,
      handColors: {
        seconds: theme.colors.tag,
      },
    });
    this.clock.setup(p5);
    this.clock.start();
    this.startAt = this.clock.timestamp;
    this.state = "playing";

    this._setupped = true;
  }

  /**
   * @param {import('p5')} p5
   */
  draw(p5) {
    if (
      !SoundBook.isSentinel(this.elevatorMusic) &&
      this.elevatorMusic !== null
    ) {
      if (!this.elevatorMusicPlayed) {
        this.elevatorMusicPlayed = true;
        this.elevatorMusic.play();
      }
    }

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
      p5.fill(
        secondsLeft > 10 ? theme.colors.textDefault : theme.colors.textBad
      );
      p5.textAlign(p5.CENTER, p5.BOTTOM);
      p5.text(secondsLeft, p5.width / 2, p5.height - 80);
    }
    p5.pop();
    this.clock.draw(p5);

    if (this.state === "win") {
      this.elevatorMusic.stop();
      return new SceneRequest("clock-tag-game.win", "switch");
    } else if (this.state === "lose") {
      this.elevatorMusic.stop();
      return new SceneRequest("clock-tag-game.lose", "switch");
    } else if (this.state === "playing") {
      if (new Date() - this.startAt >= this.sceneDuration * 1000) {
        this.state = "lose";
      } else if (this.clock.handsOverlap("hours", "seconds")) {
        this.clock.update(p5, {
          handColors: {
            hours: this.clock.handColors.seconds,
            seconds: this.clock.handColors.hours,
          },
        });
        this.state = "win";
      } else if (this.clock.handsOverlap("minutes", "seconds")) {
        this.clock.update(p5, {
          handColors: {
            minutes: this.clock.handColors.seconds,
            seconds: this.clock.handColors.minutes,
          },
        });
        this.state = "win";
      } else {
        this.clock.update(p5);
      }
    }
  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyPressed(p5, event) {
    if (event.key === "Backspace") {
      event.stopPropagation();
      this.elevatorMusic.stop();
      return new SceneRequest("menu");
    }
  }
}
