const GLOBALS = {};

// === DEBUG MODE GLOBALS ==========================================================================

/**
 * GLOBALS.DEBUG_MODE
 *
 * Values:
 *  - 0 = debug off
 *  - 1 = show debug HUD
 *  - 2 = move into physics simulation debug mode
 *
 * Uses the hostname to determine whether to automatically move into debug mode or not
 */
GLOBALS.DEBUG_MODE = ["localhost", "127.0.0.1"].includes(
  window.location.hostname
)
  ? 1
  : 0;

/**
 * GLOBALS.DEBUG_COUNTER_LINES_INDEX
 *
 * Index for looping through the Counter instance's Easter egg lines.
 */
GLOBALS.DEBUG_COUNTER_LINES_INDEX = 0;

// === PHYSICS SIM GLOBALS =========================================================================

/**
 * GLOBALS.FRAME_RATE
 *
 * The frameRate we expect the p5 engine to run at.
 */
GLOBALS.FRAME_RATE = 60;

/**
 * GLOBALS.FIXED_DT
 *
 * Deterministic mapping of in-physics-simulation seconds per frame, for debug purpose
 */
GLOBALS.FIXED_DT = 1 / GLOBALS.FRAME_RATE;

/**
 * GLOBALS.AUDIT_DAMPERS
 *
 * Flag for printing debug statements to the console for the Frog tongue object physics simulation.
 * If true, prints auditing prints for the spring damper forces.
 */
GLOBALS.AUDIT_DAMPERS = false;

/**
 * GLOBALS.MAX_SUBSTEPS
 *
 * If the frameRate drops significantly, the deterministic simulation slows down
 * such that on every frame, at most n FIXED_DT cycles are applied in simulation.
 * Example, if a full second passes between two p5 frames, this will cap the simulation
 * at GLOBALS.MAX_SUBSTEPS * GLOBALS.FIXED_DT = 2/60th of a second in simulation.
 *
 * This is to avoid the simulation spiraling out of control if the time between inputs
 * is delayed due to loss in performance.
 *
 * This was baked in the solution from ChatGPT. It's not something I would have considered in the
 * first place because I don't expect massive frame drops, but since it came with the Simulation
 * class, I'm like, why naht?
 */
GLOBALS.MAX_SUBSTEPS = 2;

// === STATE GLOBALS ===============================================================================

/**
 * GLOBALS.SCENE
 *
 * Values:
 *  - "title": Title screen
 *  - "main": Main game loop
 *  - "game-over": Game over screen
 *  - "game-win": Game win screen (if we ever get one)
 */
GLOBALS.SCENE = "title";

/**
 * GLOBALS.GAME_OVER_AT
 *
 * Epoch timestamp of when the game was marked as over.
 * Defaults to null
 *
 * @type {number|null}
 */
GLOBALS.GAME_OVER_AT = null;

/**
 * GLOBALS.GAME_DURATION
 *
 * Duration of a game; sets how much oxygen time is left in the
 * tank (in seconds)
 */
GLOBALS.GAME_DURATION = 3 * 60;

GLOBALS.COUNTER_EASTER_EGG_LINES = [
  ["A space fly", { pitch: 0.9, rate: 0.9, volume: 1.0 }],
  ["Did you see that?!", { pitch: 1.1, rate: 1.0, volume: 1.0 }],
  ["Another fly bites the dust!", { pitch: 0.9, rate: 1.0, volume: 1.0 }],
  ["Are, I, Pee that fly.", { pitch: 0.9, rate: 1.0, volume: 1.0 }],
  ["That's not gonna fly.", { pitch: 0.9, rate: 1.1, volume: 1.0 }],
  ["Ground Control to Major Tom!", { pitch: 1.4, rate: 0.8, volume: 1.0 }],
];

/**
 * GLOBALS.FLY_MEDIAN_COUNT_PER_SKY_TILE
 *
 * Median number of flies per StarrySky.grid tile.
 */
GLOBALS.FLY_MEDIAN_COUNT_PER_SKY_TILE = 1;

/**
 * GLOBALS.FLY_MAX_DEV_COUNT_PER_SKY_TILE
 *
 * Max deviation from median for number of flies per StarrySky.grid tile.
 */
GLOBALS.FLY_MAX_DEV_COUNT_PER_SKY_TILE = 1;

// === CONTROLS GLOBALS ============================================================================

/**
 * GLOBALS.INPUT
 *
 * Global store for the input states captured from keyPressed/keyReleased and mouseClicked.
 */
GLOBALS.INPUTS = {
  up: false,
  down: false,
  left: false,
  right: false,
  z: false,
  x: false,
  space: false,
  clickAt: null,
};

export default GLOBALS;
