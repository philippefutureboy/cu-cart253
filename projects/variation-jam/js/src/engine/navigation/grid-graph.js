import { Graph, Node } from "./graph.js";

export class GridNode extends Node {
  /**
   * @param {number} gx
   * @param {number} gy
   * @param {object} data
   */
  constructor(gx, gy, data = {}) {
    const id = `${gx},${gy}`;
    super(id, {
      ...data,
      gx,
      gy,
      // walkable defaults to true unless overridden
      walkable: data.walkable !== undefined ? !!data.walkable : true,
    });
  }

  get gx() {
    return this.data.gx;
  }

  get gy() {
    return this.data.gy;
  }

  get walkable() {
    return this.data.walkable;
  }

  set walkable(v) {
    this.data.walkable = !!v;
  }
}

export class GridGraph {
  /**
   * @param {number} worldWidth
   * @param {number} worldHeight
   * @param {number} cellSize
   * @param {"4"|"8"} neighborMode
   */
  constructor(worldWidth, worldHeight, cellSize, neighborMode = "4") {
    this.cellSize = cellSize;
    this.cols = Math.floor(worldWidth / cellSize);
    this.rows = Math.floor(worldHeight / cellSize);

    this.neighborMode = neighborMode === "8" ? "8" : "4";

    this.graph = new Graph();

    // Create GridNodes
    for (let gx = 0; gx < this.cols; gx++) {
      for (let gy = 0; gy < this.rows; gy++) {
        const node = new GridNode(gx, gy);
        this.graph.addNode(node);
      }
    }

    // Create adjacency (purely geometric, independent of walkable)
    this._buildEdges();
  }

  // --- Internal helpers -------------------------------------------------

  _idFromGrid(gx, gy) {
    return `${gx},${gy}`;
  }

  _inBounds(gx, gy) {
    return gx >= 0 && gx < this.cols && gy >= 0 && gy < this.rows;
  }

  _getNodeById(id) {
    return /** @type {GridNode|null} */ (this.graph.nodesMap.get(id) || null);
  }

  _buildEdges() {
    for (let gx = 0; gx < this.cols; gx++) {
      for (let gy = 0; gy < this.rows; gy++) {
        const id = this._idFromGrid(gx, gy);
        const node = this._getNodeById(id);
        if (!node) continue;

        // 4 directions
        const deltas4 = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ];

        if (this.neighborMode === "4") {
          for (const [dx, dy] of deltas4) {
            const nx = gx + dx;
            const ny = gy + dy;
            if (!this._inBounds(nx, ny)) continue;
            const nid = this._idFromGrid(nx, ny);
            this.graph.addEdge(node.id, nid);
          }
          continue;
        }

        // 8 directions
        const deltas8 = [...deltas4, [1, 1], [1, -1], [-1, 1], [-1, -1]];

        for (const [dx, dy] of deltas8) {
          const nx = gx + dx;
          const ny = gy + dy;
          if (!this._inBounds(nx, ny)) continue;
          const nid = this._idFromGrid(nx, ny);
          this.graph.addEdge(node.id, nid);
        }
      }
    }
  }

  // --- Public API: model / topology / coordinates ----------------------

  /**
   * World (pixel) -> grid coordinates.
   * @param {{x:number, y:number}} pos
   * @returns {{gx:number, gy:number, valid:boolean}}
   */
  worldToGrid(pos) {
    const gx = Math.floor(pos.x / this.cellSize);
    const gy = Math.floor(pos.y / this.cellSize);
    const valid = this._inBounds(gx, gy);
    return { gx, gy, valid };
  }

  /**
   * Grid -> world center position.
   * @param {number} gx
   * @param {number} gy
   * @returns {{x:number, y:number}}
   */
  gridToWorldCenter(gx, gy) {
    return {
      x: (gx + 0.5) * this.cellSize,
      y: (gy + 0.5) * this.cellSize,
    };
  }

  /**
   * Get a single GridNode by grid coordinates.
   * @param {number} gx
   * @param {number} gy
   * @returns {GridNode|null}
   */
  getNode(gx, gy) {
    if (!this._inBounds(gx, gy)) return null;
    return this._getNodeById(this._idFromGrid(gx, gy));
  }

  /**
   * Get multiple GridNodes by an array of {gx,gy}.
   * Returns only nodes that exist.
   * @param {Array<{gx:number, gy:number}>} coords
   * @returns {GridNode[]}
   */
  getManyNodes(coords) {
    const result = [];
    for (const { gx, gy } of coords) {
      const n = this.getNode(gx, gy);
      if (n) result.push(n);
    }
    return result;
  }

  /**
   * Get neighbors of a node, respecting neighborMode and walkable status,
   * and preventing diagonal corner-cutting dynamically.
   *
   * Overloads:
   *   getNeighbors(node: GridNode): GridNode[]
   *   getNeighbors(gx: number, gy: number): GridNode[]
   */
  getNeighbors(arg1, arg2) {
    let node;
    if (arg1 instanceof GridNode || arg1 instanceof Node) {
      node = arg1;
    } else {
      node = this.getNode(arg1, arg2);
    }
    if (!node) return [];

    const gx = node.gx;
    const gy = node.gy;

    const deltas4 = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    const result = [];

    // Helper to check walkable
    const safeGet = (x, y) => this.getNode(x, y);

    if (this.neighborMode === "4") {
      for (const [dx, dy] of deltas4) {
        const nx = gx + dx;
        const ny = gy + dy;
        if (!this._inBounds(nx, ny)) continue;
        const nbr = safeGet(nx, ny);
        if (nbr && nbr.walkable) result.push(nbr);
      }
      return result;
    }

    // 8-direction mode
    const deltas8 = [...deltas4, [1, 1], [1, -1], [-1, 1], [-1, -1]];

    for (const [dx, dy] of deltas8) {
      const nx = gx + dx;
      const ny = gy + dy;
      if (!this._inBounds(nx, ny)) continue;

      const nbr = safeGet(nx, ny);
      if (!nbr || !nbr.walkable) continue;

      // For diagonals, prevent corner cutting:
      if (dx !== 0 && dy !== 0) {
        const sideA = safeGet(gx + dx, gy);
        const sideB = safeGet(gx, gy + dy);
        if (!sideA || !sideB || !sideA.walkable || !sideB.walkable) {
          continue;
        }
      }

      result.push(nbr);
    }

    return result;
  }
}
