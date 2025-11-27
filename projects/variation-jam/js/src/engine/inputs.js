/**
 * src/engine/inputs.js
 *
 * Decoupling facades for processing user inputs (keyboard, mouse).
 * p5.js provides a pretty thin wrapper around the native
 * browser event-handling model, which plays not always conveniently
 * with the draw loop.
 *
 * I figured it would be more intuitive to record the inputs into
 * objects that provide easy-to-query access methods that can be
 * used in a more iterative OOP paradigm (vs an event-driven paradigm).
 *
 * Given I already built a scene-management system that exposes
 * event handling methods on the scenes, I figured I could hook the input
 * event handling methods into these, and then query the state of the
 * input instance in the draw method.
 *
 * @attribution GenAI usage: 0%; Implementation is 100% done manually.
 */
import {
  IP5KeyboardEventHandler,
  IP5MouseEventHandler,
} from "../p5/interfaces.js";

export class KeyboardInput extends IP5KeyboardEventHandler {
  constructor() {
    super();
    this.keys = new Map();
    this.events = [];
  }

  /**
   * Returns the latest keyboard event matching type & key (both optional)
   * @param {{type: string|undefined, key: string|undefined}} query
   * @returns {{frame: number, ts: Date, type: string, key: string, event: MouseEvent}} event
   */
  pop({ type, key } = {}) {
    if (type === undefined && key === undefined) {
      return this.events.pop();
    }
    for (let i = this.events.length - 1; i >= 0; i--) {
      const event = this.events[i];
      const queryType = type ?? event.type;
      const queryKey = key ?? event.key;
      if (queryType === event.type && queryKey === event.key) {
        this.events = this.events.toSpliced(i, 1);
        return click;
      }
    }
  }

  /**
   * Returns whether or not `key` is currently pressed on keyboard
   * @param {string} key
   * @returns {boolean}
   */
  isDown(key) {
    return this.keys.has(key) && this.keys.get(key) === true;
  }

  /**
   * Sets `event.key` as down, records the press event.
   *
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyPressed(p5, event) {
    this.keys.set(event.key, true);

    this.events.push({
      frame: p5.frameCount,
      ts: new Date(),
      type: "pressed",
      key: event.key,
      pressed: true,
      event,
    });
  }

  /**
   * Sets `event.key` as up, records the release event.
   *
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyReleased(p5, event) {
    this.keys.set(event.key, false);

    this.events.push({
      frame: p5.frameCount,
      ts: new Date(),
      type: "released",
      key: event.key,
      pressed: true,
      event,
    });
  }
}

export class MouseInput extends IP5MouseEventHandler {
  constructor() {
    super();
    this.buttons = new Map();
    this.events = [];
    this.p5 = null;
  }

  /**
   * Saves p5 to offer mouseX, mouseY outside of draw context
   *
   * @param {import('p5')} p5
   */
  setup(p5) {
    this.p5 = p5;
  }

  /**
   * @returns Returns the x position of the mouse
   */
  get mouseX() {
    return this.p5.mouseX;
  }

  /**
   * @returns Returns the y position of the mouse
   */
  get mouseY() {
    return this.p5.mouseY;
  }

  /**
   * Returns whether or not `button` is currently pressed on mouse
   *
   * @param {string} button
   * @returns {boolean}
   */
  isDown(button) {
    if (button === undefined) {
      return this.buttons.values().some((v) => v);
    }
    return this.buttons.has(button) && this.buttons.get(button) === true;
  }

  /**
   * Returns the latest mouse event matching type & button (both optional)
   *
   * @param {{type: string|undefined, button: string|undefined}} query
   * @returns {{frame: number, ts: Date, type: string, button: string, x: number, y: number, event: MouseEvent}} event
   */
  pop({ type, button } = {}) {
    if (type === undefined && button === undefined) {
      return this.events.pop();
    }
    for (let i = this.events.length - 1; i >= 0; i--) {
      const event = this.events[i];
      const queryType = type ?? event.type;
      const queryButton = button ?? event.button;
      if (queryType === event.type && queryButton === event.button) {
        this.events = this.events.toSpliced(i, 1);
        return click;
      }
    }
  }

  /**
   * Records a click event
   *
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mouseClicked(p5, event) {
    const data = {
      frame: p5.frameCount,
      ts: new Date(),
      type: "click",
      button: event.button,
      x: this.mouseX,
      y: this.mouseY,
      event,
    };
    this.events.push(data);
  }

  /**
   * Records a mousePressed event
   * Sets the `event.button` as down
   *
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mousePressed(p5, event) {
    this.buttons.set(event.button, true);
    const data = {
      frame: p5.frameCount,
      ts: new Date(),
      type: "press",
      button: event.button,
      x: this.mouseX,
      y: this.mouseY,
      event,
    };
    this.events.push(data);
  }

  /**
   * Records a mouseReleased event
   * Sets the `event.button` as up
   *
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mouseReleased(p5, event) {
    this.buttons.set(event.button, false);
    const data = {
      frame: p5.frameCount,
      ts: new Date(),
      type: "release",
      button: event.button,
      x: this.mouseX,
      y: this.mouseY,
      event,
    };
    this.events.push(data);
  }
}
