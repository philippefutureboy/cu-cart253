/* eslint-disable no-unused-vars */
/**
 * @typedef {import('p5')} P5
 * @typedef {import('./scene-context').SceneContext} SceneContext
 */

export class NotImplementedError extends TypeError {
  /**
   * @param {Function} cls
   * @param {Function} methodFn
   */
  constructor(cls, methodFn) {
    const method = (methodFn && methodFn.name) || "<anonymous>";
    super(`Abstract method ${cls.name}.${method}() is not implemented`);
  }
}

/**
 * Base class for scenes. Extend and implement lifecycle methods.
 * @abstract
 */
export class AbstractP5Scene {
  /** @type {string|null} Unique key for this scene (may be overridden by <P5.Scene name=...>) */
  static scene = null;

  /**
   * @param {P5} _p5
   * @param {SceneContext} _ctx
   */
  constructor(_p5, _ctx) {
    if (new.target === AbstractP5Scene) {
      throw new TypeError("Cannot instantiate AbstractP5Scene directly.");
    }
    const s = /** @type {*} */ (this.constructor).scene;
    if (typeof s !== "string" || !s.trim()) {
      throw new TypeError(
        `Static 'scene' must be a non-empty string on ${this.constructor.name}`,
      );
    }
  }

  /**
   * Preload heavy assets (images, fonts, shaders, etc).
   * Called when `ctx.preload(name)` is invoked or before first activate when possible.
   * @param {P5} p5
   * @param {SceneContext} ctx
   * @returns {void|Promise<void>}
   */
  preload(p5, ctx) {
    throw new NotImplementedError(this.constructor, this.preload);
  }

  /**
   * One-time setup right before the first draw of this scene.
   * @param {P5} p5
   * @param {SceneContext} ctx
   * @returns {void}
   */
  setup(p5, ctx) {
    throw new NotImplementedError(this.constructor, this.setup);
  }

  /**
   * Draw loop (called each frame).
   * @param {P5} p5
   * @param {SceneContext} ctx
   * @returns {void}
   */
  draw(p5, ctx) {
    throw new NotImplementedError(this.constructor, this.draw);
  }

  /**
   * Optional cleanup when leaving the scene (free textures, detach listeners, etc).
   * Executed asynchronously; you may await tasks if needed.
   * @param {P5} _p5
   * @param {SceneContext} _ctx
   * @returns {void|Promise<void>}
   */
  async destroy(_p5, _ctx) {
    /* optional */
  }
}
