import { BaseSceneManager } from "./scene.js";

/**
 * P5Runtime
 *
 * A convenience class that extends BaseSceneManager
 * to create the canvas and set the frame rate at setup time.
 */
export default class P5Runtime extends BaseSceneManager {
  constructor({
    frameRate = 60,
    width = window.innerWidth,
    height = window.innerHeight,
    setup = undefined,
  } = {}) {
    super();
    this._frameRate = frameRate ?? 60;
    this._initial_width = width ?? window.innerWidth;
    this._initial_height = height ?? window.innerHeight;
    this._setup = typeof setup === "function" ? setup : () => {};
  }

  /**
   *
   * @param {import('p5')} p5
   */
  setup(p5) {
    p5.createCanvas(this._initial_width, this._initial_height);
    p5.frameRate(this._frameRate);
    this._setup(p5);
    super.setup(p5);
  }
}
