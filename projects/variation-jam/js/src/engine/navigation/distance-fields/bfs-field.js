import { ILazyDistanceField } from "./interfaces.js";

/**
 * BFS-based distance field.
 * Produces integer "steps" of shortest-path distance from anchorPos.
 *
 * Use case: PursueMovementBehaviour.
 */
export class GridGraphBFSField extends ILazyDistanceField {
  /**
   * @param {import('../grid-graph.js').GridGraph} grid
   */
  constructor(grid) {
    super();
    this.grid = grid;
    this.distances = new Map();
    this.anchorPos = null;

    this._dirty = false; // true when lazyCompute has been called but not computed
    this._computed = false;
  }

  clear() {
    this.distances.clear();
    this._dirty = false;
    this._computed = false;
    this.anchorPos = null;
  }

  /**
   * Standard compute: BFS waves from anchorPos through the grid.
   * @param {{x:number,y:number}} anchorPos
   */
  compute(anchorPos) {
    if (!anchorPos) return;

    this.distances.clear();
    this._dirty = false;
    this._computed = true;

    // Find closest grid node
    const startNode = this.grid.findClosestNode(anchorPos);
    if (!startNode) return;

    const queue = [startNode];
    this.distances.set(startNode.id, 0);

    while (queue.length) {
      const node = queue.shift();
      const d = this.distances.get(node.id);

      const neighbors = this.grid.getNeighbors(node);
      for (const nbr of neighbors) {
        if (!this.distances.has(nbr.id)) {
          this.distances.set(nbr.id, d + 1);
          queue.push(nbr);
        }
      }
    }
  }

  /**
   * Lazy: store anchorPos only.
   * @param {{x:number,y:number}} anchorPos
   */
  lazyCompute(anchorPos) {
    this.anchorPos = anchorPos;
    this._dirty = true;
  }

  /**
   * Internal: run compute if lazyCompute was called.
   */
  _ensure() {
    if (this._dirty) {
      this.compute(this.anchorPos);
      this._dirty = false;
      this._computed = true;
    }
  }

  /**
   * Get BFS distance.
   * @param {import('../grid-graph.js').GridNode} node
   */
  getDistance(node) {
    this._ensure();
    return this.distances.get(node.id) ?? Infinity;
  }
}
