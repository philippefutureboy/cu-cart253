export class IP5Drawable {
  /**
   *
   * @param {import('p5')} p5
   */
  setup(p5) {
    throw new TypeError("Abstract method 'setup' must be implemented");
  }

  /**
   *
   * @param {import('p5')} p5
   */
  draw(p5) {
    throw new TypeError("Abstract method 'draw' must be implemented");
  }
}

export class IP5EventHandler {
  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyPressed(p5, event) {
    throw new TypeError("Abstract method 'keyPressed' must be implemented");
  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyReleased(p5, event) {
    throw new TypeError("Abstract method 'keyReleased' must be implemented");
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mouseClicked(p5, event) {
    throw new TypeError("Abstract method 'mouseClicked' must be implemented");
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mousePressed(p5, event) {
    throw new TypeError("Abstract method 'mousePressed' must be implemented");
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mouseReleased(p5, event) {
    throw new TypeError("Abstract method 'mouseReleased' must be implemented");
  }
}

export class IP5StatefulDrawable extends IP5Drawable {
  /**
   *
   * @param {import('p5')} p5
   * @param {any} data
   */
  update(p5, data) {
    throw new TypeError("Abstract method 'setup' must be implemented");
  }
}

/**
 * IP5Lifecycle
 *
 * An interface that exposes most of P5's lifecycle methods.
 * As an interface, all methods are abstract and unimplemented.
 * This is meant to be extended by a subclass that provides concrete implementation
 * for each method.
 */
export class IP5Lifecycle {}
// Pseudo multiple-inheritance by assigning the methods to the prototype
// of the class.
Object.assign(IP5Lifecycle.prototype, IP5Drawable, IP5EventHandler);
