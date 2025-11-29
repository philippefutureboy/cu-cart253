import { IP5Drawable } from "../p5/interfaces.js";

/**
 * Simple button.
 * Alignment is applied to the button's RECTANGLE relative to (x, y).
 * Text is centered inside the button.
 */
export class Button extends IP5Drawable {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {number|[number, number, number, number]} cornerRounding
   * @param {"left"|"center"|"right"} horizontalAlign
   * @param {"top"|"middle"|"bottom"} verticalAlign
   * @param {string|import('p5').Color} bgColor
   * @param {string|import('p5').Color} textColor
   * @param {number} textSize
   * @param {string|import('p5').Font} textFont
   * @param {number} strokeWeight
   * @param {string|import('p5').Color} strokeColor
   * @param {string} [label=""] Text displayed on the button (optional, last param)
   */
  constructor({
    x,
    y,
    width,
    height,
    cornerRounding,
    horizontalAlign,
    verticalAlign,
    bgColor,
    hoverBgColor,
    textColor,
    textSize,
    textFont,
    strokeWeight,
    strokeColor,
    label = "",
  } = {}) {
    super();

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.cornerRounding = cornerRounding ?? 4;

    this.horizontalAlign = horizontalAlign ?? "left";
    this.verticalAlign = verticalAlign ?? "top";

    this.bgColor = bgColor ?? "#ddd";
    this.hoverBgColor = hoverBgColor ?? "#aaa";
    this.textColor = textColor ?? "#444";
    this.textSize = textSize ?? 16;
    this.textFont = textFont ?? "sans-serif";

    this.strokeWeight = strokeWeight ?? 0;
    this.strokeColor = strokeColor ?? "#444";

    this.label = label;

    this.hovered = false;
  }

  /**
   * No-op, but kept for interface completeness.
   * @param {import('p5')} _p5
   */
  setup(_p5) {
    // Nothing needed here for now.
  }

  /**
   * Draws the button.
   * @param {import('p5')} p5
   */
  draw(p5) {
    const { left, top } = this._getTopLeft();
    const centerX = left + this.width / 2;
    const centerY = top + this.height / 2;

    // Rectangle
    p5.push();
    {
      p5.rectMode(p5.CORNER);
      if (this.strokeWeight > 0) {
        p5.stroke(this.strokeColor);
        p5.strokeWeight(this.strokeWeight);
      } else {
        p5.noStroke();
      }

      p5.fill(this.hovered ? this.hoverBgColor : this.bgColor);
      const cornerArgs = Array.isArray(this.cornerRounding)
        ? this.cornerRounding
        : [this.cornerRounding];
      p5.rect(left, top, this.width, this.height, ...cornerArgs);
    }
    p5.pop();

    // Text
    if (this.label && this.label.length > 0) {
      p5.push();
      {
        p5.noStroke();
        p5.fill(this.textColor);
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.textSize(this.textSize);
        p5.textFont(this.textFont);
        p5.text(this.label, centerX, centerY - 8);
      }
      p5.pop();
    }
  }

  /**
   * Returns true if the given mouse position is inside the button.
   *
   * @param {number} mouseX
   * @param {number} mouseY
   * @returns {boolean}
   */
  isHovered(mouseX, mouseY) {
    const { left, top } = this._getTopLeft();
    const right = left + this.width;
    const bottom = top + this.height;

    const inside =
      mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom;

    this.hovered = inside;
    return inside;
  }

  /**
   * Returns true if the given MouseEvent represents a left-click
   * within the bounds of the button.
   *
   * @param {MouseEvent} event
   * @returns {boolean}
   */
  isClicked(event) {
    // Only consider left button (0)
    if (event.button !== 0) return false;

    // offsetX/Y are coordinates relative to the event target (the canvas)
    const mouseX = event.x;
    const mouseY = event.y;

    return this.isHovered(mouseX, mouseY);
  }

  /**
   * Computes the top-left corner of the button given its alignment.
   * @private
   * @returns {{ left: number, top: number }}
   */
  _getTopLeft() {
    let left;
    let top;

    // Horizontal
    switch (this.horizontalAlign) {
      case "center":
        left = this.x - this.width / 2;
        break;
      case "right":
        left = this.x - this.width;
        break;
      case "left":
      default:
        left = this.x;
        break;
    }

    // Vertical
    switch (this.verticalAlign) {
      case "middle":
        top = this.y - this.height / 2;
        break;
      case "bottom":
        top = this.y - this.height;
        break;
      case "top":
      default:
        top = this.y;
        break;
    }

    return { left, top };
  }
}
