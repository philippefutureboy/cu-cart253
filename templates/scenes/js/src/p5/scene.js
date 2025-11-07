import IP5Lifecycle from "./lifecycle.js";

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

export class BaseScene extends IP5Lifecycle {
  /**
   * @param {string} name
   */
  constructor() {
    // dynamic type check
    if (!new.target.hasOwnProperty("name") || !new.target.name) {
      throw new Error(
        `Scene class '${
          new.target.constructor.name
        }' should have a non-empty static 'name' property`
      );
    }
    if (!new.target.hasOwnProperty("instance")) {
      throw new Error(
        `Scene class '${
          new.target.constructor.name
        }' static 'instance' property`
      );
    }

    // singleton pattern
    if (new.target.instance) {
      return new.target.instance;
    } else {
      super();
      new.target.instance = this;
      this.name = this.constructor.name; // convenience alias
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
   * @returns {SceneRequest|void}
   */
  setup(p5) {
    throw new TypeError("Abstract method 'setup' must be implemented");
  }

  /**
   *
   * @param {import('p5')} p5
   * @returns {SceneRequest|void}
   */
  draw(p5) {
    throw new TypeError("Abstract method 'draw' must be implemented");
  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   * @returns {SceneRequest|void}
   */
  keyPressed(p5, event) {
    throw new TypeError("Abstract method 'keyPressed' must be implemented");
  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   * @returns {SceneRequest|void}
   */
  keyReleased(p5, event) {
    throw new TypeError("Abstract method 'keyReleased' must be implemented");
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   * @returns {SceneRequest|void}
   */
  mouseClicked(p5, event) {
    throw new TypeError("Abstract method 'mouseClicked' must be implemented");
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   * @returns {SceneRequest|void}
   */
  mousePressed(p5, event) {
    throw new TypeError("Abstract method 'mousePressed' must be implemented");
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   * @returns {SceneRequest|void}
   */
  mouseReleased(p5, event) {
    throw new TypeError("Abstract method 'mouseReleased' must be implemented");
  }
}

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
    const name = scene.constructor.name;
    if (SceneManager.scenes.has(name)) {
      throw new Error(`SceneManager already has a scene named '${name}'`);
    }
    if (scene.constructor === BaseScene) {
      throw new Error(`Cannot register instance of abstract class BaseScene`);
    }
    SceneManager.scenes.set(name, scene);
    if (current) {
      this.setCurrentScene(name);
    }
  }

  /**
   * Removes a scene from the SceneManager
   * @param {string} name
   */
  unregisterScene(name) {
    if (SceneManager.scenes.has(name)) {
      return;
    }
  }

  /**
   * Checks for existence of a scene
   * @param {string} name
   */
  hasScene(name) {
    return SceneManager.scenes.has(name);
  }

  /**
   * Getter for a scene
   * @param {string} name
   */
  getScene(name) {
    if (!SceneManager.scenes.has(name)) {
      throw new Error(`Unknown scene '${name}'`);
    }
    return SceneManager.scenes.get(name);
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
   * Sets current scene to a scene registered under 'name'
   * @param {string} name
   */
  setCurrentScene(name) {
    if (!SceneManager.scenes.has(name)) {
      throw new Error(`Unknown scene '${name}'`);
    }
    this.current = SceneManager.scenes.get(name);
  }

  // P5 LIFECYCLE METHODS ==========================================================================

  /**
   * Delegates the execution of the lifecycle method to the current scene
   * and switches scene if the returned value is a SceneRequest instance.
   *
   * @param {string} method Lifecycle method
   * @param {import('p5')} p5
   * @param {...any} args
   */
  _lifecycle(method, p5, ...args) {
    const scene = this.getCurrentScene();
    // only run if the method exists on scene class
    if (hasInstanceMethod(scene, method)) {
      const result = scene[method](p5, ...args);
      if (result instanceof SceneRequest) {
        const request = result;
        const nextScene = this.getScene(request.scene);

        switch (request.type) {
          case "preload":
            if (hasInstanceMethod(nextScene, "setup")) nextScene.setup(p5);
            break;
          case "switch":
            if (hasInstanceMethod(scene, "onExit")) scene.onExit(p5, nextScene);
            if (hasInstanceMethod(nextScene, "onEnter"))
              nextScene.onEnter(p5, scene);
            this.setCurrentScene(request.scene);
            break;
          default:
            break;
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
