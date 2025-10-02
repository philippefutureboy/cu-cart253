import P5 from "p5";

/**
 * KeyError class mimicking Python's KeyError
 *
 * Attribution: Implemented by ChatGPT-5 (OpenAI).
 * Full conversation available at ./ATTRIBUTION/chatgpt-log-renderer-error-2025-09-28.html
 */
export class KeyError extends Error {
  /**
   * @param {string} message
   * @param {object} [extra]
   */
  constructor(message, extra) {
    super(message);
    this.name = this.constructor.name;
    if (extra) Object.assign(this, extra);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Utility to extract a friendly identity for a p5 renderer.
 *
 * Attribution: Implemented by ChatGPT-5 (OpenAI).
 * Full conversation available at ./ATTRIBUTION/chatgpt-log-renderer-error-2025-09-28.html
 * @param {P5NS.Renderer2D|P5NS.RendererGL|null|undefined} renderer
 */
function describeRenderer(renderer) {
  const canvas = renderer?.elt; // HTMLCanvasElement
  const id = canvas?.id || null;
  const size = canvas ? `${canvas.width}x${canvas.height}` : null;

  const ctx = /** @type {any} */ (renderer?.drawingContext);
  let mode = "unknown";
  if (
    typeof WebGL2RenderingContext !== "undefined" &&
    ctx instanceof WebGL2RenderingContext
  ) {
    mode = "WEBGL2";
  } else if (
    typeof WebGLRenderingContext !== "undefined" &&
    ctx instanceof WebGLRenderingContext
  ) {
    mode = "WEBGL";
  } else if (
    typeof CanvasRenderingContext2D !== "undefined" &&
    ctx instanceof CanvasRenderingContext2D
  ) {
    mode = "2D";
  }

  const ctor = renderer?.constructor?.name || null;

  const summaryParts = [
    mode,
    id ? `#${id}` : null,
    size,
    ctor ? `(${ctor})` : null,
  ].filter(Boolean);

  return {
    id,
    mode,
    size,
    ctor,
    canvas,
    context: ctx || null,
    summary: summaryParts.join(" "),
  };
}

/**
 * Typed KeyError for P5.Renderer2D|P5.RendererGL.
 *
 * Adds information for easier debugging if the error is raised.
 *
 * Attribution: Implemented by ChatGPT-5 (OpenAI).
 * Full conversation available at ./ATTRIBUTION/chatgpt-log-renderer-error-2025-09-28.html
 */
export class RendererNotFoundError extends KeyError {
  /**
   * @param {P5.Renderer2D|P5.RendererGL} renderer
   * @param {string} [hint] Optional extra info for the message
   */
  constructor(renderer, hint) {
    const info = describeRenderer(renderer);
    const base = `Renderer not found`;
    const message = info.summary ? `${base}: ${info.summary}` : base;
    super(hint ? `${message} — ${hint}` : message, {
      renderer,
      rendererInfo: info,
    });
  }
}

/**
 * A per p5 renderer registry.
 *
 * Can be subclassed for specific types of resources.
 */
export default class P5ResourceRegistry {
  constructor() {
    /**
     * WeakMap<
     *  p5.Renderer2D | p5.RendererGL,
     *  Map<string, T>
     * >
     * Using a WeakMap so that if a p5 renderer is to be garbage collected, the key is removed
     * from the WeakMap as well so we have clear errors thrown when a resource should not be
     * available anymore.
     */
    this._registry = new WeakMap();
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
   * @returns {any} The requested resource
   */
  get(p5, key) {
    if (!this._registry.has(p5._renderer)) {
      throw new RendererNotFoundError(p5._renderer);
    }
    const rendererRegistry = this._registry.get(p5._renderer);
    if (!rendererRegistry.has(key)) {
      throw new KeyError(`${describeRenderer(p5._renderer)}/${key}`);
    }
    return rendererRegistry.get(key);
  }

  /**
   * Collection check for a (p5, key) composite key
   *
   * @param {P5} p5
   * @param {string} key
   *
   * @returns {boolean} Whether or not the key exists
   */
  has(p5, key) {
    const rendererRegistry = this._registry.get(p5._renderer);
    if (!rendererRegistry) {
      return false;
    }
    return rendererRegistry.has(key);
  }

  /**
   * Setter for a (p5, key) composite key + value
   *
   * @param {P5} p5
   * @param {string} name
   * @param {any} value
   * @param {Object<string, any>} options
   *
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
