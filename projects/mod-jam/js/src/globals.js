const GLOBALS = {};

// CONSTANTS
GLOBALS.FRAME_RATE = 60;
GLOBALS.FIXED_DT = 1 / GLOBALS.FRAME_RATE; // seconds per physics step (deterministic)
GLOBALS.MAX_SUBSTEPS = 2; // cap to avoid spiral-of-death on slow frames

// VARIABLES
GLOBALS.DEBUG_MODE = 2;
GLOBALS.AUDIT_DAMPERS = true;

export default GLOBALS;
