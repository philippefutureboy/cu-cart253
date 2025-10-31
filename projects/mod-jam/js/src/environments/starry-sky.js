/**
 * Starry sky
 *
 * Does two things:
 *
 * 1 - Renders tiles of stars, where each tile position (tx, ty) is deterministic
 *     (random seed is fixed for each tile position)
 * 2 - Allows expansion of the viewport to zoom out and make the player feel the
 *     vast emptiness of space.
 *
 * Starry sky (deterministic random stars) was implemented by ChatGPT.
 *
 * Zoom out feature was implemented by me, and took me quite a while.
 * I played around a lot with how to scale out, using a scale variable, but ultimately
 * after a few hours of debugging, I figured out it would be more effective to just
 * calculate the scale based on the viewport size (duh lol).
 *
 */

import { CoordinatesBox, CoordinatesPoint } from "../utils/coordinates.js";

// === CONFIG ======================================================================================
const NOISE_SEED = 1234567; // one global seed so tiles stitch seamlessly

// === MAIN CLASSES ================================================================================

export class StarrySkyTile extends CoordinatesBox {
  constructor({ tx, ty, xMin, xMax, yMin, yMax } = {}) {
    super({ xMin, xMax, yMin, yMax });
    this.tx = tx;
    this.ty = ty;
    this.background = null;
  }

  /**
   *
   * @param {import('p5')} p5
   */
  setup(p5) {
    this.background = renderSky(p5, this.tx, this.ty, this.width, this.height);
  }
}

class StarrySky {
  /**
   *
   * @param {object} opts
   * @param {number} opts.width
   * @param {number} opts.height
   * @param {[number, number]} opts.gridSize
   */
  constructor({ width = null, height = null, gridSize = [9, 9] } = {}) {
    // Argument guards
    if (
      !Number.isInteger(width) ||
      width <= 0 ||
      !Number.isInteger(width) ||
      width <= 0
    ) {
      throw new TypeError(
        "Both opts.width and opts.height should be positive natural numbers"
      );
    }
    if (
      !Array.isArray(gridSize) ||
      gridSize.length !== 2 ||
      gridSize.some((v) => v < 1 || Math.floor(v) !== v)
    ) {
      throw new TypeError(
        "opts.gridSize should be a [number, number] where both numbers are integers >= 1"
      );
    }

    // Setting state
    this.TILE_W = width;
    this.TILE_H = height;
    this.GRID_SIZE = gridSize;
    this.CENTER_TILE = gridSize.map((v) => Math.floor(v / 2));
    this.WORLD_W = this.GRID_SIZE[0] * this.TILE_W; // max width of all tiles
    this.WORLD_H = this.GRID_SIZE[1] * this.TILE_H; // max height of all tiles
    /** @type {Array<Array<StarrySkyTile>>} */
    this.grid = []; // 2D array of { tx, ty, box: Box, background: p5.Graphics }
    this.viewport = new CoordinatesBox({
      xMin: this.CENTER_TILE[0] * this.TILE_W,
      xMax: (this.CENTER_TILE[0] + 1) * this.TILE_W,
      yMin: this.CENTER_TILE[1] * this.TILE_H,
      yMax: (this.CENTER_TILE[1] + 1) * this.TILE_H,
    });
  }

  // === P5.js RUNTIME BINDINGS ====================================================================

  /**
   * Setup function to be called as part of p5.setup
   * Renders the sky ahead of time and saves the buffers on the object
   * @param {import('p5')} p5
   */
  setup(p5) {
    // Build grid
    for (let i = 0; i < this.GRID_SIZE[1]; i++) {
      const row = [];
      for (let j = 0; j < this.GRID_SIZE[0]; j++) {
        const tile = new StarrySkyTile({
          tx: j,
          ty: i,
          xMin: j * this.TILE_W,
          xMax: (j + 1) * this.TILE_W,
          yMin: i * this.TILE_H,
          yMax: (i + 1) * this.TILE_H,
        });
        tile.setup(p5);
        row.push(tile);
      }
      this.grid.push(row);
    }
  }

  /**
   * Updates the StarrySky to keep the player within viewport
   *
   * @param {import('p5')} p5
   * @param {PhysicsObjectModel} player The player PhysicsObjectModel
   */
  update(p5, player) {
    // Expand viewport (zoom out) when player nears borders

    const playerPos = new CoordinatesPoint(player.x, player.y, this.viewport);
    if (
      playerPos.xPercent < 0.05 ||
      playerPos.xPercent > 0.95 ||
      playerPos.yPercent < 0.05 ||
      playerPos.yPercent > 0.95
    ) {
      this._expandViewport(p5, player);
    }
  }

  /**
   *
   * @param {import('p5')} p5
   */
  draw(p5) {
    p5.background("#1a113c");
    p5.push();
    {
      p5.imageMode(p5.CORNER);
      // Draw visible tiles only
      const { xi0, yi0, xi1, yi1 } = this._visibleTileRange();
      // console.log({ xi0, yi0, xi1, yi1 });
      for (let i = yi0; i <= yi1; i++) {
        for (let j = xi0; j <= xi1; j++) {
          const tile = this.grid[i][j];
          p5.image(tile.background, tile.xMin, tile.yMin);
        }
      }
    }
    p5.pop();
  }

  // === P5.js RUNTIME HELPERS =====================================================================

  /**
   * Returns the scale factor to be used in the main draw function to scale
   *
   * @param {import('p5')} p5
   * @returns {float} The factor at which p5 should scale (zoom out) the rendered content.
   *                  Range [0,1].
   */
  getScaleFactor(p5) {
    return Math.min(
      p5.width / this.viewport.width,
      p5.height / this.viewport.height
    );
  }

  /**
   * Returns the translation offset to be used in the main draw function
   *
   * @param {import('p5')} p5
   * @returns {[number, number]} The x and y translation offsets, as a tuple
   */
  getTranslationOffset(p5) {
    return [-this.viewport.xMin, -this.viewport.yMin];
  }

  getViewportCenter(p5) {
    return this.viewport.center;
  }

  /**
   *
   * @yields {StarrySkyTile} One of the tiles in this.grid
   */
  *iterateTiles() {
    for (let i = 0; i < this.grid.length; i++) {
      for (let j = 0; j < this.grid[i].length; j++) {
        yield this.grid[i][j];
      }
    }
  }

  // === VIEWPORT HELPERS ==========================================================================

  /**
   * Expands the viewport symmetrically on both side whenever the
   * player object nears the side of the canvas.
   * Expands both in x and y by the same relative percentage.
   *
   * @param {PhysicsObjectModel} playerModel
   */
  _expandViewport(p5, playerModel) {
    // how much to expand this frame (symmetric growth)
    const maxVel = Math.max(Math.abs(playerModel.xv), Math.abs(playerModel.yv));
    const growW = maxVel * 2;
    const growH = maxVel * 2;

    const newW = Math.min(this.viewport.width + growW, this.WORLD_W);
    const newH = Math.min(this.viewport.height + growH, this.WORLD_H);

    const [cx, cy] = this.viewport.center;
    // console.log("_expandViewport", {
    //   playerModel,
    //   viewport: this.viewport.toObject(),
    //   calcs: {
    //     cx,
    //     cy,
    //     growW,
    //     growH,
    //     newW,
    //     newH,
    //   },
    // });

    this.viewport.setFromCenterAndSize(cx, cy, newW, newH);
    this.viewport.clampTo(p5, this.WORLD_W, this.WORLD_H);
  }

  /**
   * Computes the index range of tiles intersecting the viewport
   * Uses the known tile size (TILE_W, TILE_H) to calculate what's the min and max
   * tiles that are expected to be rendered within the viewport.
   *
   * @returns {object} An object delimiting the range of tiles (xi0-xi1, yi0-yi1) of tiles visible
   *                   within viewport
   */
  _visibleTileRange() {
    const xi0 = Math.max(0, Math.floor(this.viewport.xMin / this.TILE_W));
    const yi0 = Math.max(0, Math.floor(this.viewport.yMin / this.TILE_H));
    const xi1 = Math.min(
      this.GRID_SIZE[1] - 1,
      Math.floor((this.viewport.xMax - 1) / this.TILE_W)
    );
    const yi1 = Math.min(
      this.GRID_SIZE[0] - 1,
      Math.floor((this.viewport.yMax - 1) / this.TILE_H)
    );
    return { xi0, yi0, xi1, yi1 };
  }
}

// === SKY RENDER HELPERS ==========================================================================

/**
 * Renders a sky patch (tile).
 *
 * If debug = true, renders literal tiles (rect with border), with the tx, ty
 * value textually displayed. Was incredibly useful to fix the viewport zoom-out,
 * because without it I couldn't quite understand how the viewport was panning/zooming,
 * which made the debugging process difficult.
 * Once I had the debug view, I was able to swiftly determine the behaviour and fix it.
 *
 * If debug = false, renders the stars by calling generateStars
 *
 * @param {import('p5')} p5
 * @param {number} tx Tile x index
 * @param {number} ty Tile y index
 * @param {number} twidth Tile width
 * @param {number} theight Tile height
 * @param {boolean} debug
 * @returns
 */
function renderSky(p5, tx, ty, twidth, theight, debug = false) {
  const pg = p5.createGraphics(twidth, theight, p5.P2D);
  pg.pixelDensity(1);
  pg.noSmooth();

  if (debug) {
    pg.push();
    {
      pg.strokeWeight(2);
      pg.stroke("red");
      pg.noFill();
      pg.rect(1, 1, pg.width - 2, pg.height - 2);
      pg.fill("black");
      pg.textAlign(pg.CENTER, pg.CENTER);
      pg.textSize(twidth / 4);
      pg.text(`(${tx}, ${ty})`, pg.width / 2, pg.height / 2);
    }
    pg.pop();
    return pg;
  }

  pg.push();
  {
    // Solid opaque background prevents seams between tiles; a little ChatGPT trick because
    // I had a grid showing up between the tiles, and when I asked it, it provided this as the
    // simplest fix.
    pg.background("#1a113c");
    generateStars(pg, tx, ty, twidth, theight);
  }
  pg.pop();
  return pg;
}

/**
 * Generates stars on the provided p5.Graphics object
 *
 * Implemented by ChatGPT Thinking 5.0. Documented and adapted by me.
 *
 * @param {import('p5').Graphics} pg
 * @param {number} tx Tile x index
 * @param {number} ty Tile y index
 * @param {number} twidth Tile width
 * @param {number} theight Tile height
 */
function generateStars(pg, tx, ty, twidth, theight) {
  pg.push();
  {
    pg.colorMode(pg.HSB, 360, 100, 100, 100);
    pg.noStroke();

    pg.noiseSeed(NOISE_SEED);
    pg.noiseDetail(5, 0.2);

    pg.background("#1a113c");
    pg.translate(twidth / 2, theight / 2);

    // Per-tile deterministic RNG (don’t reseed noise!)
    const rng = mulberry32(hash32(tx, ty, 0xc0ffee));

    const starCount = 2 * Math.round(Math.sqrt(twidth * theight));
    for (let k = 0; k < starCount; k++) {
      const x = rngRange(rng, -twidth / 2, twidth / 2);
      const y = rngRange(rng, -theight / 2, theight / 2);

      if (rng() < 0.01) pg.fill(0, 0, 100, 100); // rare bright star
      else pg.fill(0, 0, 100, rngRange(rng, 10, 50));

      pg.circle(x, y, rngRange(rng, 1, 3));
    }
  }
  pg.pop();
}

// ---- Deterministic RNG helpers ----
// Everything below, implemented by ChatGPT Thinking 5.0:

// hash two ints (+namespace) -> uint32
function hash32(a, b, ns = 0) {
  let h = 2166136261 >>> 0;
  h ^= (a | 0) + 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h ^= (b | 0) + 0x85ebca6b;
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= ns | 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  return (h ^ (h >>> 16)) >>> 0;
}

// Mulberry32 PRNG
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Map rng() to [min, max)
function rngRange(rng, min, max) {
  return min + rng() * (max - min);
}

export default StarrySky;
