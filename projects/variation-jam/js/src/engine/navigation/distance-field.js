/**
 * src/engine/navigation/distance-field.js
 *
 * Algorithms to compute the distance to a target position
 * at every node of a GridGraph.
 * Standard Breadth-First-Search algorithm, could be found on Wikipedia.
 *
 * This can then be used by NPCs to make decisions about
 * where to head to reach a target (e.g. player).
 *
 * @attribution GenAI usage: 100%.
 *              Full conversation available at src/engine/ATTRIBUTION/ChatGPT-engine-discussion.html
 *
 */
import { GridGraph } from "./grid-graph.js";

export class GridGraphDistanceField {
  /**
   * @param {GridGraph} grid
   */
  constructor(grid) {
    this.grid = grid;
    /** @type {Map<string, number>} */
    this.distances = new Map();
    this.hasValidField = false;
  }

  /**
   * Compute BFS distance from position (world coords)
   * over walkable nodes and using grid.getNeighbors.
   * @param {{x:number, y:number}} pos
   */
  compute(pos) {
    const { gx, gy, valid } = this.grid.worldToGrid(pos);
    if (!valid) {
      this.hasValidField = false;
      return;
    }

    const startNode = this.grid.getNode(gx, gy);
    if (!startNode || !startNode.walkable) {
      this.hasValidField = false;
      return;
    }

    // Initialize distances
    this.distances.clear();
    for (const node of this.grid.graph.nodes()) {
      this.distances.set(node.id, Infinity);
    }

    const startId = startNode.id;
    this.distances.set(startId, 0);

    const queue = [startNode];

    while (queue.length > 0) {
      const current = queue.shift();
      const curD = this.distances.get(current.id);

      const neighbors = this.grid.getNeighbors(current);
      for (const nbr of neighbors) {
        const old = this.distances.get(nbr.id);
        if (old > curD + 1) {
          this.distances.set(nbr.id, curD + 1);
          queue.push(nbr);
        }
      }
    }

    this.hasValidField = true;
  }

  /**
   * Get distance at grid coordinates.
   * Returns Infinity if unknown/unreachable.
   * @param {number} gx
   * @param {number} gy
   * @returns {number}
   */
  getDistance(gx, gy) {
    const node = this.grid.getNode(gx, gy);
    if (!node) return Infinity;
    const d = this.distances.get(node.id);
    return d === undefined ? Infinity : d;
  }
}
