/**
 * src/engine/navigation/graph.js
 *
 * A simple Graph & Node datastructure, using the adjacency map implementation.
 *
 * @attribution GenAI usage: 75%. I know how to hand-roll a Graph, but
 * why re-invent the wheel? Since I'm not packaging using vite/rollup & npm,
 * I figured, let's have AI implement this standard class.
 *
 */
export class Node {
  /**
   * Node class.
   * Requires a string id
   * @param {string} id
   * @param {any} data
   */
  constructor(id, data = {}) {
    if (!id || typeof id !== "string") {
      throw new Error("Node requires a non-empty string 'id' property");
    }
    this.id = id;
    this.data = data; // optional payload
  }
}

export class Graph {
  constructor() {
    /** @type {Map<Node.id, Node>} */
    this.nodesMap = new Map();
    /** @type {Map<Node.id, Set<Node.id>>} */
    this.adj = new Map();
  }

  addNode(node) {
    if (!(node instanceof Node)) {
      throw new Error("addNode expects an instance of Node");
    }

    const id = node.id;

    if (this.nodesMap.has(id)) {
      throw new Error(`Node with id '${id}' already exists`);
    }

    this.nodesMap.set(id, node);
    this.adj.set(id, new Set());
  }

  addEdge(a, b) {
    const u = a instanceof Node ? a.id : a;
    const v = b instanceof Node ? b.id : b;

    if (u === v) {
      throw new Error("Simple graph: no self-loops allowed");
    }

    if (!this.nodesMap.has(u)) {
      throw new Error(`Node '${u}' does not exist in graph`);
    }
    if (!this.nodesMap.has(v)) {
      throw new Error(`Node '${v}' does not exist in graph`);
    }

    // Undirected, no duplicates
    this.adj.get(u).add(v);
    this.adj.get(v).add(u);
  }

  removeEdge(a, b) {
    const u = a instanceof Node ? a.id : a;
    const v = b instanceof Node ? b.id : b;

    if (this.adj.has(u)) this.adj.get(u).delete(v);
    if (this.adj.has(v)) this.adj.get(v).delete(u);
  }

  removeNode(node) {
    const id = node instanceof Node ? node.id : node;

    if (!this.nodesMap.has(id)) return;

    // Remove incident edges
    for (const nbr of this.adj.get(id)) {
      this.adj.get(nbr).delete(id);
    }

    this.adj.delete(id);
    this.nodesMap.delete(id);
  }

  hasNode(node) {
    const id = node instanceof Node ? node.id : node;
    return this.nodesMap.has(id);
  }

  hasEdge(a, b) {
    const u = a instanceof Node ? a.id : a;
    const v = b instanceof Node ? b.id : b;
    return this.adj.has(u) && this.adj.get(u).has(v);
  }

  neighbors(node) {
    const id = node instanceof Node ? node.id : node;
    if (!this.adj.has(id)) return [];
    return Array.from(this.adj.get(id)).map((nbrId) =>
      this.nodesMap.get(nbrId)
    );
  }

  nodes() {
    return Array.from(this.nodesMap.values());
  }

  edges() {
    const result = [];
    for (const [u, nbrs] of this.adj.entries()) {
      for (const v of nbrs) {
        if (String(u) < String(v)) {
          result.push([this.nodesMap.get(u), this.nodesMap.get(v)]);
        }
      }
    }
    return result;
  }
}
