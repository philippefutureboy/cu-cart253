import { BaseScene, SceneRequest } from "./p5/scene.js";
import { CoordinatesBox } from "./utils/coordinates.js";
import { throttle } from "./utils/functions.js";
import FontBook from "./utils/fonts.js";

/**
 * MenuScene
 *
 * Displays the menu on screen, including title & variation games.
 * Given a game Mapping<string, string>, displays the name of the games
 * on screen & supports game selection using keyboard (arrows + enter) and mouse (pointer + click).
 * Returns a ScreenRequest from the draw method if one of the games is selected,
 * which is then handled by the SceneManager to transition to the selected game.
 *
 * Originally, I made the style of the menu very reminescent of old-school gaming (think like Pippin's PONGS)
 * with a pixeled font, white on purple background.
 * But given the theme of the games, "tag", I thought it would be more on theme to use a font that
 * brings mischievousness, fun, and play to the table.
 * I thought of the Impossible Quiz, and decided to find a font that was similar to the impossible
 * quiz.
 * Following the same aesthetic, I switched the background back to white-ish, and used very basic
 * colors.
 */
export default class MenuScene extends BaseScene {
  static key = "menu";
  static label = "Menu";
  static instance = null;

  /**
   *
   * @param {Object<string, string>} games A dictionary <scene.key, scene.label>
   */
  constructor(games = {}) {
    super();
    this.font = null;
    /** @type {Array<{key:string, label:string, bbox: CoordinatesBox|null}>} */
    this.items = Object.entries(games).map(([key, label]) => ({
      key,
      label,
      bbox: null,
    }));
    this._setupped = false;
    this._cursorIndex = 0;
    this._cursorIndexChangedAt = null;
    this._keyMove = throttle(this._keyMove.bind(this), 200, false, true);
  }

  /**
   * @param {import('p5')} p5
   */
  setup(p5) {
    if (this._setupped) {
      return;
    }
    // Load the font Maya's Script
    const fontPromise = FontBook.getPromise("mayas-script");

    // Once the font is loaded, compute the bounding boxes for each of the menu items
    // to be able to track hovers and clicks.
    fontPromise.then((font) =>
      this._computeGameSelectionBBoxes(p5, font, undefined)
    );
    fontPromise.catch((err) =>
      this._computeGameSelectionBBoxes(p5, undefined, err)
    );
    this._setupped = true;
  }

  /**
   * Computes the bounding boxes for each of the menu items
   * to be able to track hovers and clicks.
   *
   * @param {import('p5')} p5
   * @param {import('p5').Font|undefined} font
   * @param {Error|undefined} err
   */
  _computeGameSelectionBBoxes(p5, font, err) {
    p5.push();
    {
      const topY = 200;
      const topX = 16;
      const textSize = 32;
      const lineHeight = 42;

      // only set to custom font if the font successfully loaded
      if (font !== undefined) p5.textFont(font);

      p5.textAlign(p5.LEFT, p5.TOP);
      p5.textSize(textSize);
      p5.noStroke();
      p5.fill("white");

      for (let i = 0; i < this.items.length; i += 1) {
        const label = `${i + 1}    ${this.items[i].label}`;
        const textX = topX;
        const textY = topY + i * lineHeight;
        const textWidth = p5.textWidth(label);

        // Check if the mouse is hovering on current text
        // If so, automatically update this.cursorIndex to i
        const textBBox = new CoordinatesBox({
          xMin: textX,
          yMin: textY,
          xMax: textX + textWidth,
          yMax: textY + textSize,
        });
        this.items[i].bbox = textBBox;
      }
    }
    p5.pop();
  }

  /**
   * @param {import('p5')} p5
   */
  draw(p5) {
    const font = FontBook.get("mayas-script");
    if (font === FontBook.LoadingSentinel) {
      return;
    }
    this._drawBackground(p5);
    this._drawTitle(p5);
    this._drawGameSelection(p5);
  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyPressed(p5, event) {
    // Capture Arrow key presses to move in the menu
    if (event.key.startsWith("Arrow")) {
      this._keyMove(event);
    }
    // Capture Enter key presses as confirmation of selection of a game
    else if (event.key === "Enter") {
      return new SceneRequest(this.items[this._cursorIndex].key, "switch");
    }
    event.stopPropagation();
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mouseClicked(p5, event) {
    const cursorPos = { x: p5.mouseX, y: p5.mouseY };
    for (let item of this.items) {
      const textBBox = item.bbox;
      if (textBBox !== null && textBBox.inBox(cursorPos)) {
        return new SceneRequest(item.key);
      }
    }
  }

  _drawBackground(p5) {
    p5.background("#f0f0ff");
    p5.push();
    {
      p5.noFill();
      p5.rect(0, 0, p5.width, p5.height);
    }
    p5.pop();
  }

  /**
   * @param {import('p5')} p5
   */
  _drawTitle(p5) {
    const font = FontBook.get("mayas-script");
    const title = "A GAME OF TAG";
    const textSize = 64;
    const textX = p5.width / 2;
    const textY = 48;
    const lineHeight = 80;
    const betweenLines = 16;
    p5.push();
    {
      // only set to custom font if the font successfully loaded
      if (font !== FontBook.ErrorSentinel) p5.textFont(font);

      p5.textAlign(p5.CENTER, p5.TOP);
      p5.textSize(textSize);
      p5.fill("#f00");
      p5.text(title, textX, textY);

      p5.rectMode(p5.LEFT);
      p5.noStroke();
      p5.rect(16, textY + lineHeight, p5.width - 32, 6);

      p5.fill("#00f");
      p5.textSize(40);
      p5.text(
        "SELECT YOUR VARIANT",
        p5.width / 2,
        textY + lineHeight + 6 + betweenLines
      );
    }
    p5.pop();
  }
  /**
   * Draws the labels of the games as a numbered list.
   * Supports navigation using arrow keys and mouse pointer.
   *
   * When a label is selected, it starts blinking with a brighter stroke.
   * Assumes .setup has been called prior for setup of items[i].bbox and font loading.
   *
   * @param {import('p5')} p5
   */
  _drawGameSelection(p5) {
    p5.push();
    {
      const font = FontBook.get("mayas-script");
      const textSize = 36;
      const cursorPos = { x: p5.mouseX, y: p5.mouseY };

      // only set to custom font if the font successfully loaded
      if (font !== FontBook.ErrorSentinel) p5.textFont(font);

      p5.textAlign(p5.LEFT, p5.TOP);
      p5.textSize(textSize);
      p5.noStroke();
      p5.fill("#00f");

      for (let i = 0; i < this.items.length; i += 1) {
        const item = this.items[i];

        // Check if the mouse is hovering on current text
        // If so, automatically update this.cursorIndex to i
        const textBBox = item.bbox;
        if (textBBox.inBox(cursorPos) && this._cursorIndex !== i) {
          this._cursorIndex = i;
          this._cursorIndexChangedAt = Date.now();
        }

        const label = `${i + 1}. ${item.label}`;
        const [textX, textY] = [item.bbox.xMin, item.bbox.yMin];
        // If cursor is currently on this item, add emphasis
        if (this._cursorIndex === i) {
          p5.push();
          p5.strokeWeight(0.75);
          p5.stroke("#00f");
          p5.text(label, textX, textY);
          p5.pop();
        }
        // Else just display normally
        else {
          p5.text(label, textX, textY);
        }
      }
    }
    p5.pop();
  }

  _keyMove(event) {
    switch (event.key) {
      case "ArrowUp":
        this._cursorIndex = Math.max(this._cursorIndex - 1, 0);
        this._cursorIndexChangedAt = Date.now();
        break;
      case "ArrowDown":
        this._cursorIndex = Math.min(
          this._cursorIndex + 1,
          this.items.length - 1
        );
        this._cursorIndexChangedAt = Date.now();
        break;
      case "ArrowLeft":
        // TODO if two columns
        break;
      case "ArrowRight":
        // TODO if two columns
        break;
      default:
        break;
    }
  }
}
