import { IP5Lifecycle } from "./interfaces.js";

/**
 * A simple message to pass from a Scene to a SceneManager
 * telling it we are requesting to preload a scene / switch to another scene.
 *
 * SceneManager interprets returns from P5 lifecycle methods; if a SceneRequest
 * is returned from any lifecycle method, it executes the requested Scene effect
 * (preload / switch).
 */
export class SceneRequest {
  /**
   * @param {string} scene
   * @param {'preload'|'switch'} type
   */
  constructor(scene, type = "switch") {
    this.scene = scene;
    this.type = type;
  }
}

/**
 * Abstract base class for Scenes
 *
 * Extends the IP5Lifecycle while enforcing static (class) attributes at runtime.
 * Also implements the Singleton pattern.
 * Updates the return type of the lifecycle method to support returning either nothing
 * or a SceneRequest.
 */
export class BaseScene extends IP5Lifecycle {
  constructor() {
    // dynamic type check
    if (!new.target.hasOwnProperty("key") || !new.target.key) {
      throw new Error(
        `Scene class '${
          new.target.constructor.key
        }' should have a non-empty static 'key' property`
      );
    }
    if (!new.target.hasOwnProperty("label") || !new.target.label) {
      throw new Error(
        `Scene class '${
          new.target.constructor.label
        }' should have a non-empty static 'label' property`
      );
    }
    if (!new.target.hasOwnProperty("instance")) {
      throw new Error(
        `Scene class '${new.target.constructor.key}' static 'instance' property`
      );
    }

    // singleton pattern
    if (new.target.instance) {
      return new.target.instance;
    } else {
      super();
      new.target.instance = this;
      this.key = this.constructor.key; // convenience alias
      this.label = this.constructor.label; // convenience alias
    }
  }

  static getInstance() {
    return this.instance ?? new this.constructor();
  }

  /**
   * @template {BaseScene} Scene
   * @param {import('p5')} p5
   * @param {Scene} prevScene
   */
  onEnter(p5, prevScene) {
    throw new TypeError("Abstract method 'onEnter' must be implemented");
  }

  /**
   * @template {BaseScene} Scene
   * @param {import('p5')} p5
   * @param {Scene} nextScene
   */
  onExit(p5, nextScene) {
    throw new TypeError("Abstract method 'onExit' must be implemented");
  }

  // P5 LIFECYCLE METHODS ==========================================================================

  /**
   *
   * @param {import('p5')} p5
   * @returns {SceneRequest|Array<SceneRequest>|void}
   */
  setup(p5) {
    throw new TypeError("Abstract method 'setup' must be implemented");
  }

  /**
   *
   * @param {import('p5')} p5
   * @returns {SceneRequest|Array<SceneRequest>|void}
   */
  draw(p5) {
    throw new TypeError("Abstract method 'draw' must be implemented");
  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   * @returns {SceneRequest|Array<SceneRequest>|void}
   */
  keyPressed(p5, event) {
    throw new TypeError("Abstract method 'keyPressed' must be implemented");
  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   * @returns {SceneRequest|Array<SceneRequest>|void}
   */
  keyReleased(p5, event) {
    throw new TypeError("Abstract method 'keyReleased' must be implemented");
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   * @returns {SceneRequest|Array<SceneRequest>|void}
   */
  mouseClicked(p5, event) {
    throw new TypeError("Abstract method 'mouseClicked' must be implemented");
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   * @returns {SceneRequest|Array<SceneRequest>|void}
   */
  mousePressed(p5, event) {
    throw new TypeError("Abstract method 'mousePressed' must be implemented");
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   * @returns {SceneRequest|Array<SceneRequest>|void}
   */
  mouseReleased(p5, event) {
    throw new TypeError("Abstract method 'mouseReleased' must be implemented");
  }
}

/**
 * SceneManager
 *
 * An engine that manages scenes & scene transitions.
 * To use it, create a SceneManager instance (singleton),
 * then register scenes using the registerScene method.
 *
 * It can technically be used directly as a p5 sketch, but does not create a canvas
 * in the setup method. For that, see P5Runtime, a convenience class that
 * creates the canvas with a set size & frame rate.
 *
 * @see ./runtime.js:P5Runtime
 */
export class SceneManager extends IP5Lifecycle {
  /**
   * @template {BaseScene} Scene
   * @type {Map<string, Scene>}
   */
  static scenes = new Map();
  static instance = null;

  static getInstance() {
    return SceneManager.instance ?? new SceneManager();
  }

  constructor() {
    if (SceneManager.instance) {
      return SceneManager.instance;
    }
    super();
    this.current = null;
    SceneManager.instance = this;
  }

  // SCENE REGISTRY ================================================================================

  /**
   * Adds a scene to the SceneManager
   * @template {BaseScene} Scene
   * @param {Scene} scene
   */
  registerScene(scene, { current = false } = {}) {
    const key = scene.constructor.key;
    if (SceneManager.scenes.has(key)) {
      throw new Error(`SceneManager already has a scene keyed '${key}'`);
    }
    if (scene.constructor === BaseScene) {
      throw new Error(`Cannot register instance of abstract class BaseScene`);
    }
    SceneManager.scenes.set(key, scene);
    if (current) {
      this.setCurrentScene(key);
    }
  }

  /**
   * Removes a scene from the SceneManager
   * @param {string} key
   */
  unregisterScene(key) {
    if (SceneManager.scenes.has(key)) {
      return;
    }
  }

  /**
   * Checks for existence of a scene
   * @param {string} key
   */
  hasScene(key) {
    return SceneManager.scenes.has(key);
  }

  /**
   * Getter for a scene
   * @param {string} key
   */
  getScene(key) {
    if (!SceneManager.scenes.has(key)) {
      throw new Error(`Unknown scene '${key}'`);
    }
    return SceneManager.scenes.get(key);
  }

  /**
   * Getter for current scene
   * @template {BaseScene} Scene
   * @returns {Scene|null} Current scene if set, else null
   */
  getCurrentScene() {
    return this.current;
  }

  /**
   * Sets current scene to a scene registered under 'key'
   * @param {string} key
   */
  setCurrentScene(key) {
    if (!SceneManager.scenes.has(key)) {
      throw new Error(`Unknown scene '${key}'`);
    }
    this.current = SceneManager.scenes.get(key);
  }

  // P5 LIFECYCLE METHODS ==========================================================================

  /**
   * Delegates the execution of the lifecycle method to the current scene
   * and switches scene if the returned value is a SceneRequest instance.
   * Supports receiving multiple SceneRequest to be able to preload multiple scenes in parallel.
   *
   * @param {string} method Lifecycle method
   * @param {import('p5')} p5
   * @param {...any} args
   */
  _lifecycle(method, p5, ...args) {
    const scene = this.getCurrentScene();
    // only run if the method exists on scene class
    if (hasInstanceMethod(scene, method)) {
      let result = scene[method](p5, ...args);
      if (result instanceof SceneRequest) {
        result = [result];
      }

      if (
        Array.isArray(result) &&
        result.every((e) => e instanceof SceneRequest)
      ) {
        for (const request of result) {
          const requestedScene = this.getScene(request.scene);
          console.log(request);

          switch (request.type) {
            case "preload":
              if (hasInstanceMethod(requestedScene, "setup"))
                requestedScene.setup(p5);
              break;
            case "switch":
              if (hasInstanceMethod(requestedScene, "setup"))
                requestedScene.setup(p5);
              if (hasInstanceMethod(scene, "onExit"))
                scene.onExit(p5, requestedScene);
              if (hasInstanceMethod(requestedScene, "onEnter"))
                requestedScene.onEnter(p5, scene);
              this.setCurrentScene(request.scene);
              break;
            default:
              break;
          }
        }
      }
    }
  }

  /**
   * @param {import('p5')} p5
   */
  setup(p5) {
    this._lifecycle("setup", p5);
  }

  /**
   *
   * @param {import('p5')} p5
   */
  draw(p5) {
    this._lifecycle("draw", p5);
  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyPressed(p5, event) {
    this._lifecycle("keyPressed", p5, event);
  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyReleased(p5, event) {
    this._lifecycle("keyReleased", p5, event);
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mouseClicked(p5, event) {
    this._lifecycle("mouseClicked", p5, event);
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mousePressed(p5, event) {
    this._lifecycle("mousePressed", p5, event);
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mouseReleased(p5, event) {
    this._lifecycle("mouseReleased", p5, event);
  }
}

/**
 * hasInstanceMethod
 * Checks if the object's class has an implementation of the method named {method}.
 *
 * @param {any} obj
 * @param {string} method
 */
function hasInstanceMethod(obj, method) {
  return (
    Object.getPrototypeOf(obj).hasOwnProperty(method) &&
    typeof obj[method] === "function"
  );
}
