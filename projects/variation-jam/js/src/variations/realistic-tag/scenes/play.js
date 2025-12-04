import { BaseScene, SceneRequest } from "../../../p5/scene.js";
import { MouseInput } from "../../../engine/inputs.js";
import { Button } from "../../../components/button.js";
import FontBook from "../../../utils/fonts.js";
import * as theme from "../../../theme.js";

/**
 * RealisticTag.PlayScene
 *
 * Prompts the user to get up and tag someone else,
 * then to come back and click the win button.
 *
 * Transitions to RealisticTag.WinScene/LoseScene/BailedOutScene.
 */
export default class PlayScene extends BaseScene {
  static key = "realistic-tag-game.play";
  static label = "Realistic Tag Game: Play Scene";

  constructor() {
    super();
    this.font = null;
    this._setupped = false;

    this.inputs = null;
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
   * Prepare state & handlers
   *
   * @param {import('p5')} p5
   */
  onEnter(p5) {
    this.inputs = {
      mouse: new MouseInput(),
    };
    this.inputs.mouse.setup(p5);
    this.buttons = null;
  }

  /**
   * Unset state
   *
   * @param {import('p5')} p5
   */
  onExit(p5) {
    this.inputs = null;
    this.buttons = null;
  }

  /**
   * Draws the rule text & buttons to exit the game.
   * Transitions to one of three scenes - Lose, Win, Disappointed
   *
   * @param {import('p5')} p5
   */
  draw(p5) {
    if (this.buttons) {
      this.buttons.win.isHovered(p5.mouseX, p5.mouseY);
      this.buttons.lose.isHovered(p5.mouseX, p5.mouseY);
      this.buttons.bailedOut.isHovered(p5.mouseX, p5.mouseY);

      if (this.inputs.mouse.events.length) {
        const event = this.inputs.mouse.pop({ type: "click" });
        if (event && this.buttons.win.isClicked(event)) {
          return new SceneRequest("realistic-tag-game.win");
        } else if (event && this.buttons.lose.isClicked(event)) {
          return new SceneRequest("realistic-tag-game.lose");
        } else if (event && this.buttons.bailedOut.isClicked(event)) {
          return new SceneRequest("realistic-tag-game.bailed-out");
        }
      }
    }

    let typo = null;
    // get the appropriate typo styling based on loaded font
    if (!FontBook.isSentinel(this.font) && this.font !== null) {
      typo = theme.typo["mayas-script"];
    } else {
      typo = theme.typo["default"];
    }

    p5.background(theme.colors.background);

    // Draw rule text
    p5.push();
    {
      if (!FontBook.isSentinel(this.font) && this.font !== null) {
        p5.textSize(typo.h1.size);
        p5.textFont(this.font);
      } else {
        p5.textSize(typo.h1.size);
      }
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.fill(theme.colors.textDefault);
      p5.text(
        "IRL    !",
        p5.width / 2,
        p5.height / 2.5 - typo.h1.lineHeight / 2
      );
      p5.fill(theme.colors.pursuer);
      p5.text(
        "TAG",
        p5.width / 2 + 24,
        p5.height / 2.5 - typo.h1.lineHeight / 2
      );
      p5.fill(theme.colors.textDefault);
      p5.text(
        "GET UP AND GO    SOMEONE!",
        p5.width / 2,
        p5.height / 2.5 + typo.h1.lineHeight / 2
      );
      p5.fill(theme.colors.pursuer);
      p5.text(
        "TAG",
        p5.width / 2 + 88,
        p5.height / 2.5 + typo.h1.lineHeight / 2
      );
      p5.textSize(typo.h1Subtitle.size);
      p5.fill(theme.colors.textDefault);
      p5.text(
        "come back after and click a button below:",
        p5.width / 2,
        p5.height / 2.5 + typo.h1.lineHeight * 1.5
      );
    }
    p5.pop();

    // Draw the buttons
    const marginX = 24;
    const width = p5.width / 3 - 2 * marginX;
    if (!this.buttons) {
      this.buttons = {
        win: new Button({
          x: marginX,
          y: 520,
          width: width,
          height: 80,
          cornerRounding: 24,
          label: "I DID IT!",
          bgColor: theme.colors.background,
          hoverBgColor: "#ddf",
          strokeWeight: 5,
          strokeColor: theme.colors.textDefault,
          textColor: theme.colors.textDefault,
          textSize: typo.h1.size - 16,
          textFont: this.font,
        }),
        lose: new Button({
          x: marginX + width + 2 * marginX,
          y: 520,
          width: width,
          height: 80,
          cornerRounding: 24,
          label: "Im still it.",
          bgColor: theme.colors.background,
          hoverBgColor: "#ddf",
          strokeWeight: 5,
          strokeColor: theme.colors.textDefault,
          textColor: theme.colors.textDefault,
          textSize: typo.h1.size - 16,
          textFont: this.font,
        }),
        bailedOut: new Button({
          x: marginX + 2 * (width + 2 * marginX),
          y: 520,
          width: width,
          height: 80,
          cornerRounding: 24,
          label: "Whatever",
          bgColor: theme.colors.background,
          hoverBgColor: "#ddf",
          strokeWeight: 5,
          strokeColor: theme.colors.textDefault,
          textColor: theme.colors.textDefault,
          textSize: typo.h1.size - 16,
          textFont: this.font,
        }),
      };
    }

    this.buttons.win.draw(p5);
    this.buttons.lose.draw(p5);
    this.buttons.bailedOut.draw(p5);
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mouseClicked(p5, event) {
    if (this.inputs?.mouse) {
      this.inputs.mouse.mouseClicked(p5, event);
    }
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mousePressed(p5, event) {
    if (this.inputs?.mouse) {
      this.inputs.mouse.mousePressed(p5, event);
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
