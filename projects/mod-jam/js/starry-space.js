/**
 * A starry space demo.
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

// === CONFIG ======================================================================================

const TILE_W = window.innerWidth;
const TILE_H = window.innerHeight;
const GRID_SIZE = 10;
const CENTER_TILE = 5;
const MOVE_SPEED = 0.01; // player/world units per frame
const NOISE_SEED = 1234567; // one global seed so tiles stitch seamlessly

// CONFIG: WORLD DIMENSIONS
const WORLD_W = GRID_SIZE * TILE_W;
const WORLD_H = GRID_SIZE * TILE_H;

// CONFIG: GRID OF TILES
let grid = []; // 2D array of { tx, ty, box: Box, background: p5.Graphics }

// === CLASSES =====================================================================================

/**
 * CoordinatesBox class
 *
 * The CoordinatesBox class is a simple rectangle with min/max x and y coordinates,
 * defining a bounded region in the "world" of the 2D game.
 *
 * I had to create that box so that I could map the box to the canvas; essentially
 * this is an "in-world" coordinate system, separate from the canvas pixels.
 */
class CoordinatesBox {
  constructor({ xMin, xMax, yMin, yMax }) {
    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;
  }
  get width() {
    return this.xMax - this.xMin;
  }
  get height() {
    return this.yMax - this.yMin;
  }
  get center() {
    return [(this.xMin + this.xMax) / 2, (this.yMin + this.yMax) / 2];
  }

  /**
   * Offsets and scales the CoordinatesBox to be centered around the given
   * (cx, cy) point, with, width `w` and height `h`.
   * The point of this method is to handle expansion of the viewport
   * centered around its center.
   * @param {number} cx New center-x of the box
   * @param {number} cy New center-y of the box
   * @param {number} w New width of the box
   * @param {number} h New height of the box
   */
  setFromCenterAndSize(cx, cy, w, h) {
    this.xMin = cx - w / 2;
    this.xMax = cx + w / 2;
    this.yMin = cy - h / 2;
    this.yMax = cy + h / 2;
  }

  /**
   * Constrains the Box to the width/height provided.
   * The point of this method is to constrain the Box to the World min/max coordinates.
   * @param {*} w
   * @param {*} h
   */
  clampTo(w, h) {
    this.xMin = constrain(this.xMin, 0, w - this.width);
    this.xMax = this.xMin + this.width;
    this.yMin = constrain(this.yMin, 0, h - this.height);
    this.yMax = this.yMin + this.height;
  }
}

let viewport = new CoordinatesBox({
  xMin: CENTER_TILE * TILE_W,
  xMax: (CENTER_TILE + 1) * TILE_W,
  yMin: CENTER_TILE * TILE_H,
  yMax: (CENTER_TILE + 1) * TILE_H,
});

/**
 * CoordinatesPoint class
 *
 * A coordinate (x,y) within a CoordinateBox
 * The class provides quality of life functions to position a point
 * within a bounding box (CoordinateBox).
 */
class CoordinatesPoint {
  constructor(x, y, box) {
    this.x = x;
    this.y = y;
    this.boundingBox = box; // used only for percent helpers
  }
  get xRel() {
    return this.x - this.boundingBox.xMin;
  }
  get yRel() {
    return this.y - this.boundingBox.yMin;
  }
  get xPercent() {
    return this.xRel / this.boundingBox.width;
  }
  get yPercent() {
    return this.yRel / this.boundingBox.height;
  }

  // for debug
  toObject() {
    return {
      x: this.x,
      y: this.y,
      xRel: this.xRel,
      yRel: this.yRel,
      xPercent: this.xPercent,
      yPercent: this.yPercent,
    };
  }
}

let player = new CoordinatesPoint(
  (viewport.xMin + viewport.xMax) / 2,
  (viewport.yMin + viewport.yMax) / 2,
  viewport
);

// === P5.js RUNTIME ===============================================================================

function setup() {
  createCanvas(TILE_W, TILE_H);
  pixelDensity(1);
  noSmooth();
  imageMode(CORNER);

  // Build grid
  for (let i = 0; i < GRID_SIZE; i++) {
    const row = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      row.push({
        tx: j,
        ty: i,
        box: new CoordinatesBox({
          xMin: j * TILE_W,
          xMax: (j + 1) * TILE_W,
          yMin: i * TILE_H,
          yMax: (i + 1) * TILE_H,
        }),
        background: renderSky(j, i),
      });
    }
    grid.push(row);
  }
}

function draw() {
  update();
  background("#1a113c");

  // Map current viewport -> canvas
  const s = Math.min(width / viewport.width, height / viewport.height);
  push();
  {
    scale(s);
    translate(-viewport.xMin, -viewport.yMin);

    // Draw visible tiles only
    const { xi0, yi0, xi1, yi1 } = visibleTileRange(viewport);
    for (let i = yi0; i <= yi1; i++) {
      for (let j = xi0; j <= xi1; j++) {
        const tile = grid[i][j];
        image(tile.background, tile.box.xMin, tile.box.yMin);
      }
    }

    // Player
    push();
    {
      fill("#0f0");
      stroke("black");
      circle(player.x, player.y, 50);
    }
    pop();
  }
  pop();
}

function update() {
  if (keyIsDown(UP_ARROW)) player.y -= TILE_H * MOVE_SPEED;
  if (keyIsDown(DOWN_ARROW)) player.y += TILE_H * MOVE_SPEED;
  if (keyIsDown(LEFT_ARROW)) player.x -= TILE_W * MOVE_SPEED;
  if (keyIsDown(RIGHT_ARROW)) player.x += TILE_W * MOVE_SPEED;

  // Expand viewport (zoom out) when player nears borders
  if (
    player.xPercent < 0.05 ||
    player.xPercent > 0.95 ||
    player.yPercent < 0.05 ||
    player.yPercent > 0.95
  ) {
    expandViewport();
  }
}

// === VIEWPORT HELPERS ============================================================================

// Expands the viewport symmetrically on both side whenever the
// player object nears the side of the canvas.
// Expands both in x and y by the same relative percentage.
function expandViewport() {
  // how much to expand this frame (symmetric growth)
  const growW = MOVE_SPEED * TILE_W * 2;
  const growH = MOVE_SPEED * TILE_H * 2;

  const newW = Math.min(viewport.width + growW, WORLD_W);
  const newH = Math.min(viewport.height + growH, WORLD_H);

  const [cx, cy] = viewport.center;
  viewport.setFromCenterAndSize(cx, cy, newW, newH);
  viewport.clampTo(WORLD_W, WORLD_H);
}

// Compute the index range of tiles intersecting the viewport
// Uses the known tile size (TILE_W, TILE_H) to calculate what's the min and max
// tiles that are expected to be rendered within the viewport
function visibleTileRange(vp) {
  const xi0 = Math.max(0, Math.floor(vp.xMin / TILE_W));
  const yi0 = Math.max(0, Math.floor(vp.yMin / TILE_H));
  const xi1 = Math.min(GRID_SIZE - 1, Math.floor((vp.xMax - 1) / TILE_W));
  const yi1 = Math.min(GRID_SIZE - 1, Math.floor((vp.yMax - 1) / TILE_H));
  return { xi0, yi0, xi1, yi1 };
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
 * @param {number} tx Tile x index
 * @param {number} ty Tile y index
 * @param {boolean} debug
 * @returns
 */
function renderSky(tx, ty, debug = false) {
  const pg = createGraphics(TILE_W, TILE_H, P2D);
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
      pg.textSize(TILE_W / 4);
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
    generateStars(pg, tx, ty);
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
 * @param {number} tx
 * @param {number} ty
 */
function generateStars(pg, tx, ty) {
  pg.push();
  {
    pg.colorMode(pg.HSB, 360, 100, 100, 100);
    pg.noStroke();

    pg.noiseSeed(NOISE_SEED);
    pg.noiseDetail(5, 0.2);

    pg.background("#1a113c");
    pg.translate(TILE_W / 2, TILE_H / 2);

    // Per-tile deterministic RNG (don’t reseed noise!)
    const rng = mulberry32(hash32(tx, ty, 0xc0ffee));

    const starCount = 2 * Math.round(Math.sqrt(TILE_W * TILE_H));
    for (let k = 0; k < starCount; k++) {
      const x = rngRange(rng, -TILE_W / 2, TILE_W / 2);
      const y = rngRange(rng, -TILE_H / 2, TILE_H / 2);

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
