import { SceneManager } from "./scene.js";

export default class P5Runtime extends SceneManager {
  constructor({
    frameRate = 60,
    width = window.innerWidth,
    height = window.innerHeight,
  } = {}) {
    super();
    this._frameRate = frameRate ?? 60;
    this._initial_width = width ?? window.innerWidth;
    this._initial_height = height ?? window.innerHeight;
  }

  /**
   *
   * @param {import('p5')} p5
   */
  setup(p5) {
    p5.createCanvas(this._initial_width, this._initial_height);
    p5.frameRate(this._frameRate);
    super.setup(p5);
  }
}
