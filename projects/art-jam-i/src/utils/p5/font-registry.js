import P5 from "p5";
import P5ResourceRegistry from "./resource-registry";
export { KeyError, RendererNotFoundError } from "./resource-registry";

export default class P5FontRegistry extends P5ResourceRegistry {
  static instance;

  constructor() {
    // Singleton pattern, so we have one shared global font registry
    if (P5FontRegistry.instance) {
      return P5FontRegistry.instance;
    }
    super();
    P5FontRegistry.instance = this;
  }

  /**
   * Loads a font file at path {path} to the given P5 renderer and saves it
   * in the registry.
   *
   * @param {P5} p5
   * @param {string} name
   * @param {string} path
   */
  async load(p5, name, path) {
    if (!this.has(p5, name, path)) {
      const font = await p5.loadFont(path); // type: p5.Font
      this.set(p5, name, font);
    }
  }

  /**
   * Getter for a (p5, key) composite key
   *
   * @param {P5} p5
   * @param {string} key
   *
   * @throws {RendererNotFoundError} If p5._renderer is not registered
   * @throws {KeyError} If key is not found within specific p5._renderer submap
   *
   * @returns {P5.Font} The requested font
   */
  get(p5, key) {
    return super.get(p5, key);
  }

  /**
   * Setter for a (p5, key) composite key + value
   *
   * @param {P5} p5
   * @param {string} name
   * @param {P5.Font} value
   * @param {Object<string, any>} options
   */
  set(p5, name, value, { aliases = [] } = {}) {
    if (!this._registry.has(p5._renderer)) {
      this._registry.set(p5._renderer, new Map());
    }
    const rendererRegistry = this._registry.get(p5._renderer);
    for (const key of [name, ...aliases]) {
      rendererRegistry.set(key, value);
    }
  }
}
