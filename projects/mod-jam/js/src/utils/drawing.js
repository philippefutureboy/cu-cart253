/**
 * src/utils/drawing.js
 *
 * A set of convenience utilities (functions, classes) used to ease
 * drawing more complex assets.
 *
 */

export class ConvenientImage {
  /**
   * ConvenientImage
   *
   * A simple wrapper around p5.image that auto calculates the (width, height)
   * of the image based off its aspectRatio and optional dimension constraints.
   * Also includes convenience setup, draw methods.
   *
   * Implemented so that I don't have to manually calculate aspectRatio and embed it as a constant
   * in the code. A bit more elegant that way.
   *
   * @param {(string|number)} id unique identifier to identify the instance in logs
   * @param {string} uri uri to the asset
   * @param {object} opts options dictionary, optional
   * @param {(string|null)} opts.x optional default x position; defaults to null
   * @param {(string|null)} opts.y optional default y position; defaults to null
   * @param {(string|null)} opts.maxWidth optional maximum width constraint for the image; defaults to null
   * @param {(string|null)} opts.maxHeight optional maximum height constraint for the image; defaults to null
   * @param {(string)} opts.imageMode optional imageMode; defaults to 'CORNER'
   */
  constructor(
    id,
    uri,
    {
      x = null,
      y = null,
      imageMode = "CORNER",
      maxWidth = null,
      maxHeight = null,
    } = {}
  ) {
    // private
    this._uri = uri;
    this._img = null;
    this._loaded = false;
    this._maxWidth = maxWidth;
    this._maxHeight = maxHeight;
    this._aspectRatio = NaN;
    this._imageMode = imageMode ?? "CORNER";
    this._dimCache = {};
    // public
    this.id = id;
    this.x = x ?? null;
    this.y = y ?? null;
  }

  get loaded() {
    return this._loaded;
  }

  get aspectRatio() {
    return this._aspectRatio;
  }

  /**
   * width
   *
   * Dynamic getter that calculates the width of the image based off the aspecRatio
   * of the loaded p5.Image and the constraints (maxWidth, maxHeight) provided to the constructor.
   */
  get width() {
    if (!this._dimCache[this._maxWidth]?.[this._maxHeight]) {
      this._calcDimensions();
    }
    return this._dimCache[this._maxWidth][this._maxHeight].width;
  }

  /**
   * height
   *
   * Dynamic getter that calculates the height of the image based off the aspecRatio
   * of the loaded p5.Image and the constraints (maxWidth, maxHeight) provided to the constructor.
   */
  get height() {
    if (!this._dimCache[this._maxWidth]?.[this._maxHeight]) {
      this._calcDimensions();
    }
    return this._dimCache[this._maxWidth][this._maxHeight].height;
  }

  /**
   * _calcDimensions
   *
   * Calculates the width and height of the image to display, based off the aspecRatio
   * of the loaded p5.Image and the constraints (maxWidth, maxHeight) provided to the constructor.
   * Saves the result to a cache to make the future lookup of width/height efficient.
   *
   * Would use a tuple(width, height) as cache key, but tuples don't exist in JS, so
   * instead we use a nested dict. A stringification of the tuple could work as well.
   */
  _calcDimensions() {
    let width, height;
    // if only constrained on the width, take maxWidth, and calc height
    if (this._maxWidth && !this._maxHeight) {
      width = this._maxWidth;
      height = Math.round(this._maxWidth / this._aspectRatio);
    }
    // if only constrained on the height, take maxHeight, and calc width
    else if (!this._maxWidth && this._maxHeight) {
      width = Math.round(this._aspectRatio * this._maxHeigh);
      height = this._maxHeight;
    }
    // if constrained on both width and height, take whichever max allows
    // the other dim to be calculated from the aspectRatio and still adhere to its constraint
    else if (this._maxWidth && this._maxHeight) {
      if (this._maxWidth / this._aspectRatio > this._maxHeight) {
        width = Math.round(this._aspectRatio * this._maxHeigh);
        height = this._maxHeight;
      } else {
        width = this._maxWidth;
        height = Math.round(this._maxWidth / this._aspectRatio);
      }
    }
    // No constrains, take the original image dimensions
    else {
      width = this._img.width;
      height = this._img.height;
    }

    // console.log(this.id, {
    //   img: this._img,
    //   aspectRatio: this.aspectRatio,
    //   maxWidth: this._maxWidth,
    //   maxHeight: this._maxHeight,
    //   width,
    //   height,
    // });

    // now save the results in cache
    if (this._dimCache[this._maxWidth] === undefined) {
      this._dimCache[this._maxWidth] = {};
    }
    this._dimCache[this._maxWidth][this._maxHeight] = { width, height };
    // console.log(this.id, this.height);
  }

  /**
   * @param {import('p5')} p5
   * @returns {Promise<ConvenientImage>}
   */
  setup(p5) {
    // using the callback form to be able to get the img width/height
    // because otherwise the img gives a ratio of 1, which is not accurate
    // (loadImage is async)
    // returns a promise because I have an image that needs the other one
    // to have loaded to know its size and where it should be displayed.
    return new Promise((resolve, reject) => {
      try {
        p5.loadImage(this._uri, (img) => {
          this._img = img;
          this._aspectRatio = this._img.width / this._img.height;
          this._calcDimensions(); // force calc of display size
          this._loaded = true;
          resolve(this);
        });
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  }

  /**
   * @param {import('p5')} p5
   */
  draw(p5) {
    // just a guard to prevent rendering until the image is loaded
    if (this._img === null) {
      return;
    }

    if (this.x === null || this.y === null) {
      console.warn(
        `${this.constructor.name} instance (id=${this.id}) does not have an (x, y) position set`
      );
      return;
    }
    p5.push();
    p5.imageMode(p5[this._imageMode]);
    p5.image(this._img, this.x, this.y, this.width, this.height);
    p5.pop();
  }
}

/**
 * Vector-based arc, to work with complex shapes (beginShape, endShape).
 * Supports drawing points in clockwise/counter-clockwise order, to allow endShape to close
 * composite shapes made out vertices.
 *
 * Example:
 *   Drawing a crescent moon:
 *   ```
 *     push();
 *     fill("white");
 *     beginShape();
 *     stroke("black");
 *     // counter-clockwise, bottom curve
 *     vectorArc(0, 30, 60, 60, -PI / 4 + 0.12, (10 / 8) * PI - 0.12);
 *     // clockwise, top curve
 *     vectorArc(0, 1.5, 50, 50, PI + PI / 8 - 0.95, -PI / 8 + 0.95);
 *     // closes the shape
 *     endShape(CLOSE);
 *     pop();
 *   ```
 *
 * @param {number} cx x coordinate of center of arc
 * @param {number} cy y coordinate of center of arc
 * @param {number} dx x diameter of arc
 * @param {number} dy y diameter of arc
 * @param {number} a1 start angle
 * @param {number} a2 stop angle
 */
export function vectorArc(p5, cx, cy, dx, dy, a1, a2) {
  const clockwise = a1 <= a2;
  const rx = dx / 2,
    ry = dy / 2;
  for (
    let a = a1;
    clockwise ? a <= a2 : a >= a2;
    a += clockwise ? 0.01 : -0.01
  ) {
    let px = cx + p5.cos(a) * rx;
    let py = cy + p5.sin(a) * ry;
    p5.vertex(px, py);
  }
}

/** @type {WeakMap<Function, number>} */
const _blinkWeakMap = new WeakMap();

/**
 * blink
 *
 * Executes the passed function with args (p5, ...args) every n {frames}.
 * Uses a WeakMap to store last time the function was executed and calculate if should re-execute.
 * Assumes the function passed is a stable reference.
 *
 * @param {import('p5')} p5
 * @param {Function} fn Function to execute (expected to be a draw function)
 * @param {number} frames Interval at which to execute the function
 * @param {number} duration How many frames to execute the function for
 * @param  {...any} args Additional args to pass to the function
 */
export function blink(p5, fn, frames, duration, ...args) {
  // would make no sense to have duration >= frames because the whole point is to 'blink'
  if (frames <= duration) {
    throw Error(
      "frames interval should be larger than the duration of execution"
    );
  }

  if (!_blinkWeakMap.has(fn)) {
    fn(p5, ...args);
    _blinkWeakMap.set(fn, p5.frameCount);
  } else {
    const lastExecutionFrame = _blinkWeakMap.get(fn);
    // If it's been >= frames since we last launched an execution, launch an execution and
    // note that we launched the execution
    if (lastExecutionFrame + frames < p5.frameCount) {
      fn(p5, ...args);
      _blinkWeakMap.set(fn, p5.frameCount);
      return;
    }
    // If it's been < frames since we last launched an execution, we want to check if
    // we are still within the execution window; we want to execute the function for {duration}
    // frames.
    if (lastExecutionFrame + duration >= p5.frameCount) {
      fn(p5, ...args);
      return;
    }
  }
}
