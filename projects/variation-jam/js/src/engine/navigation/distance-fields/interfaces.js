/**
 * @interface IDistanceField
 *
 * Concrete fields must implement:
 *   - compute(anchorPos)
 *   - getDistance(node)
 *   - clear()
 *
 * "Distance" is intentionally abstract: it may represent
 * BFS cost, Euclidean distance, safety value, etc.
 */
export class IDistanceField {
  /**
   * @param {{x:number,y:number}} anchorPos
   */
  compute(anchorPos) {
    throw new Error("IDistanceField.compute must be implemented");
  }

  /**
   * @param {import('../grid-graph.js').GridNode} node
   * @returns {number}
   */
  getDistance(node) {
    throw new Error("IDistanceField.getDistance must be implemented");
  }

  clear() {
    throw new Error("IDistanceField.clear must be implemented");
  }
}

/**
 * @interface ILazyDistanceField
 * Extends IDistanceField with lazy evaluation.
 */
export class ILazyDistanceField extends IDistanceField {
  /**
   * Store anchorPos but do not compute immediately.
   * @param {{x:number,y:number}} anchorPos
   */
  lazyCompute(anchorPos) {
    throw new Error("ILazyDistanceField.lazyCompute must be implemented");
  }

  /**
   * Force compute if we haven't yet, or if lazyCompute was called.
   * Called automatically inside getDistance().
   */
  _ensure() {
    throw new Error("ILazyDistanceField._ensure must be implemented");
  }
}
