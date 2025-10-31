/**
 * src/utils/coordinates.js
 *
 * A set of helper classes that can be used to represent a position/bounding rectangle in x,y space.
 * Used by the StarrySky (src/environments/starry-sky.js), and by the flies (to determine if should
 * be drawn or not).
 */

/**
 * CoordinatesBox class
 *
 * The CoordinatesBox class is a simple rectangle with min/max x and y coordinates,
 * defining a bounded region in the "world" of the 2D game.
 *
 * I had to create that box so that I could map the box to the canvas; essentially
 * this is an "in-world" coordinate system, separate from the canvas pixels.
 */
export class CoordinatesBox {
  constructor({ xMin, xMax, yMin, yMax }) {
    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;
  }
  get width() {
    return this.xMax - this.xMin;
  }
  get height() {
    return this.yMax - this.yMin;
  }
  get center() {
    return [(this.xMin + this.xMax) / 2, (this.yMin + this.yMax) / 2];
  }

  /**
   * Checks if another box overlaps with this one
   * Useful for checks whether or not an object should be rendered.
   *
   * @param {CoordinatesBox} other
   * @param {number} other.xMin
   * @param {number} other.xMax
   * @param {number} other.yMin
   * @param {number} other.yMax
   * @returns
   */
  overlaps(other) {
    const xInView =
      (this.xMin <= other.xMin && other.xMin <= this.xMax) ||
      (this.xMin <= other.xMax && other.xMax <= this.xMax);
    const yInView =
      (this.yMin <= other.yMin && other.yMin <= this.yMax) ||
      (this.yMin <= other.yMax && other.yMax <= this.yMax);
    return xInView && yInView;
  }

  /**
   * Offsets and scales the CoordinatesBox to be centered around the given
   * (cx, cy) point, with, width `w` and height `h`.
   * The point of this method is to handle expansion of the viewport
   * centered around its center.
   * @param {number} cx New center-x of the box
   * @param {number} cy New center-y of the box
   * @param {number} w New width of the box
   * @param {number} h New height of the box
   */
  setFromCenterAndSize(cx, cy, w, h) {
    this.xMin = cx - w / 2;
    this.xMax = cx + w / 2;
    this.yMin = cy - h / 2;
    this.yMax = cy + h / 2;
  }

  /**
   * Constrains the Box to the width/height provided.
   * The point of this method is to constrain the Box to the World min/max coordinates.
   * @param {*} w
   * @param {*} h
   */
  clampTo(p5, w, h) {
    this.xMin = p5.constrain(this.xMin, 0, w - this.width);
    this.xMax = this.xMin + this.width;
    this.yMin = p5.constrain(this.yMin, 0, h - this.height);
    this.yMax = this.yMin + this.height;
  }

  toObject() {
    return {
      xMin: this.xMin,
      xMax: this.xMax,
      yMin: this.yMin,
      yMax: this.yMax,
      width: this.width,
      height: this.height,
      center: this.center,
    };
  }
}

/**
 * CoordinatesPoint class
 *
 * A coordinate (x,y) within a CoordinateBox
 * The class provides quality of life functions to position a point
 * within a bounding box (CoordinateBox).
 */
export class CoordinatesPoint {
  constructor(x, y, box) {
    this.x = x;
    this.y = y;
    this.boundingBox = box; // used only for percent helpers
  }
  get xRel() {
    return this.x - this.boundingBox.xMin;
  }
  get yRel() {
    return this.y - this.boundingBox.yMin;
  }
  get xPercent() {
    return this.xRel / this.boundingBox.width;
  }
  get yPercent() {
    return this.yRel / this.boundingBox.height;
  }

  // for debug
  toObject() {
    return {
      x: this.x,
      y: this.y,
      xRel: this.xRel,
      yRel: this.yRel,
      xPercent: this.xPercent,
      yPercent: this.yPercent,
    };
  }
}
