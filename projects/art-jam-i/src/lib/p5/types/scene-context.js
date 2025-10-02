// src/lib/p5/types.js
/**
 * @typedef {import('p5')} P5
 */

/**
 * Public runtime API handed to scene methods.
 * Prototype methods are bound in the constructor for safe destructuring.
 */
export class SceneContext {
  /**
   * @param {Object} args
   * @param {string} args.id
   * @param {(sceneName:string)=>Promise<void>} args.preload
   * @param {(sceneName:string)=>Promise<void>} args.setScene
   * @param {(ev:string, fn:(p5:P5, evt:any)=>any, opts?:{id?:string}) => () => void} args.addEventListener
   * @param {(ev:string, fn:(p5:P5, evt:any)=>any, opts?:{id?:string}) => () => void} args.addEventListenerScoped
   * @param {(ev:string, id:string) => void} args.removeEventListener
   */
  constructor({
    id,
    preload,
    setScene,
    addEventListener,
    addEventListenerScoped,
    removeEventListener,
  }) {
    /** @private */ this._id = id;
    /** @private */ this._preloadImpl = preload;
    /** @private */ this._setSceneImpl = setScene;
    /** @private */ this._addImpl = addEventListener;
    /** @private */ this._addScopedImpl = addEventListenerScoped;
    /** @private */ this._removeImpl = removeEventListener;

    // Bind prototype methods so destructuring remains safe
    this.preload = this.preload.bind(this);
    this.setScene = this.setScene.bind(this);
    this.addEventListener = this.addEventListener.bind(this);
    this.addEventListenerScoped = this.addEventListenerScoped.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
    this.id = this.id.bind(this);
  }

  /** @returns {string} */
  id() {
    return this._id;
  }

  /**
   * Eagerly preload a scene's assets by name.
   * @param {string} sceneName
   * @returns {Promise<void>}
   */
  preload(sceneName) {
    return this._preloadImpl(sceneName);
  }

  /**
   * Transition to another scene by name.
   * @param {string} sceneName
   * @returns {Promise<void>}
   */
  setScene(sceneName) {
    return this._setSceneImpl(sceneName);
  }

  /**
   * Add a p5 event listener. Returns an unsubscribe function.
   * @param {string} eventName
   * @param {(p5:P5, evt:any)=>any} handler
   * @param {{id?:string}} [opts]
   * @returns {() => void}
   */
  addEventListener(eventName, handler, opts) {
    return this._addImpl(eventName, handler, opts);
  }

  /**
   * Add a p5 event listener bound to the **current scene** (auto-removed on scene switch).
   * @param {string} eventName
   * @param {(p5:P5, evt:any)=>any} handler
   * @param {{id?:string}} [opts]
   * @returns {() => void}
   */
  addEventListenerScoped(eventName, handler, opts) {
    return this._addScopedImpl(eventName, handler, opts);
  }

  /**
   * Remove a previously added listener by its id (only needed if you used an explicit id).
   * @param {string} eventName
   * @param {string} id
   * @returns {void}
   */
  removeEventListener(eventName, id) {
    this._removeImpl(eventName, id);
  }
}
