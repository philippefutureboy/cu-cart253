import { ILazyDistanceField } from "./interfaces.js";

/**
 * Euclidean distance field.
 * Assigns each grid node the geometric distance to anchorPos.
 *
 * Use case: EvadeMovementBehaviour.
 */
export class GridGraphEuclideanField extends ILazyDistanceField {
  /**
   * @param {import('../grid-graph.js').GridGraph} grid
   */
  constructor(grid) {
    super();
    this.grid = grid;
    this.distances = new Map();
    this.anchorPos = null;

    this._dirty = false;
    this._computed = false;
  }

  clear() {
    this.distances.clear();
    this._dirty = false;
    this._computed = false;
    this.anchorPos = null;
  }

  /**
   * Compute Euclidean distance for each node.
   * @param {{x:number,y:number}} anchorPos
   */
  compute(anchorPos) {
    if (!anchorPos) return;

    this.distances.clear();
    this._dirty = false;
    this._computed = true;

    const nodes = this.grid.nodes();
    const cs = this.grid.cellSize;

    for (const node of nodes) {
      const { gx, gy } = node.data;
      const cx = gx * cs + cs / 2;
      const cy = gy * cs + cs / 2;

      const dx = anchorPos.x - cx;
      const dy = anchorPos.y - cy;

      this.distances.set(node.id, Math.sqrt(dx * dx + dy * dy));
    }
  }

  lazyCompute(anchorPos) {
    this.anchorPos = anchorPos;
    this._dirty = true;
  }

  _ensure() {
    if (this._dirty) {
      this.compute(this.anchorPos);
      this._dirty = false;
      this._computed = true;
    }
  }

  getDistance(node) {
    this._ensure();
    return this.distances.get(node.id) ?? Infinity;
  }
}
