/**
 * Store
 *
 * A static, singleton key–value store for sharing state between p5.js scenes and canvases.
 *
 * ## Design
 * - Implemented as a static class with private storage (`#stores`).
 * - Each canvas (or logical grouping) can have its own store, identified by an `id` string.
 * - A default namespace `"default"` is used if no `id` is provided.
 * - Methods are static, so you call `Store.get(...)`, `Store.set(...)`, etc. directly without instantiation.
 * - All methods accept a single options object for clarity and defaults.
 *
 * ## Typical Use Cases
 * - Persisting data across scene transitions (`score`, `player position`, etc.).
 * - Sharing state between multiple scenes in the same canvas.
 * - Passing state between multiple canvases (`id = "game1"`, `"game2"`, etc.).
 * - Keeping lightweight, non-reactive state without introducing Redux/Zustand.
 *
 * ## Examples
 * ```js
 * import Store from "src/lib/p5/store";
 *
 * // Default namespace
 * Store.set({ key: "score", value: 10 });
 * const score = Store.get({ key: "score" }); // 10
 *
 * // Namespaced by canvas id
 * Store.patch({ id: "game1", obj: { hp: 100, level: 2 } });
 * Store.update({ id: "game1", key: "score", fn: (s = 0) => s + 1 });
 *
 * // Remove/clear/destroy
 * Store.delete({ id: "game1", key: "level" });
 * Store.clear({ id: "game1" });   // clears keys but keeps namespace
 * Store.destroy({ id: "game1" }); // removes the namespace entirely
 * ```
 *
 * ## Notes
 * - This store is **not reactive**: React components will not automatically re-render
 *   when values change. It’s designed for p5 draw loops and transient scene state.
 * - If you need reactivity in React UI, wrap this in a reactive store (Zustand, Redux, etc.)
 *   and synchronize as needed.
 * - State lives for the lifetime of the process. Call `Store.destroy({ id })` on `<P5.Canvas>` unmount
 *   if you want to free memory.
 */
export class Store {
  static #stores = new Map();

  /** @private Ensure a store exists for a given canvas id */
  static #ensure(id = "default") {
    if (!this.#stores.has(id)) this.#stores.set(id, new Map());
    return this.#stores.get(id);
  }

  /**
   * Get a value.
   * @param {{ id?: string, key: string }} opts
   * @returns {any}
   *
   * @example
   * Store.get({ key: "score" })                 // uses default id
   * Store.get({ id: "game1", key: "score" })    // namespaced
   */
  static get({ id = "default", key }) {
    return this.#ensure(id).get(key);
  }

  /**
   * Set a value (pass `undefined` to delete the key).
   * @param {{ id?: string, key: string, value: any }} opts
   *
   * @example
   * Store.set({ key: "score", value: 10 })
   * Store.set({ id: "game1", key: "score", value: 42 })
   * Store.set({ key: "temp", value: undefined }) // deletes "temp"
   */
  static set({ id = "default", key, value }) {
    const s = this.#ensure(id);
    if (value === undefined) s.delete(key);
    else s.set(key, value);
  }

  /**
   * Patch multiple keys at once.
   * Keys with `undefined` values are deleted.
   * @param {{ id?: string, obj: Record<string, any> }} opts
   *
   * @example
   * Store.patch({ obj: { hp: 100, level: 2 } })
   * Store.patch({ id: "game1", obj: { temp: undefined } }) // deletes "temp"
   */
  static patch({ id = "default", obj }) {
    const s = this.#ensure(id);
    for (const [k, v] of Object.entries(obj || {})) {
      if (v === undefined) s.delete(k);
      else s.set(k, v);
    }
  }

  /**
   * Remove a single key.
   * @param {{ id?: string, key: string }} opts
   *
   * @example
   * Store.delete({ key: "level" })
   * Store.delete({ id: "game1", key: "level" })
   */
  static delete({ id = "default", key }) {
    this.#ensure(id).delete(key);
  }

  /**
   * Clear all keys from a namespace, but keep the namespace.
   * @param {{ id?: string }} opts
   *
   * @example
   * Store.clear({})                // clears default
   * Store.clear({ id: "game1" })   // clears game1
   */
  static clear({ id = "default" } = {}) {
    this.#ensure(id).clear();
  }

  /**
   * Destroy the namespace entirely (removes the Map).
   * @param {{ id?: string }} opts
   *
   * @example
   * Store.destroy({})                // destroys default
   * Store.destroy({ id: "game1" })   // destroys game1
   */
  static destroy({ id = "default" } = {}) {
    this.#stores.delete(id);
  }

  /**
   * Functional update helper: next = fn(current).
   * @param {{ id?: string, key: string, fn: (current:any)=>any }} opts
   *
   * @example
   * Store.update({ key: "score", fn: (s = 0) => s + 1 })
   * Store.update({ id: "game1", key: "hp", fn: (hp = 100) => hp - 10 })
   */
  static update({ id = "default", key, fn }) {
    const cur = this.get({ id, key });
    this.set({ id, key, value: fn(cur) });
  }
}
