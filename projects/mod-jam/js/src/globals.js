const GLOBALS = {};

// CONSTANTS
GLOBALS.FRAME_RATE = 60;
GLOBALS.FIXED_DT = 1 / GLOBALS.FRAME_RATE; // seconds per physics step (deterministic)
GLOBALS.MAX_SUBSTEPS = 2; // cap to avoid spiral-of-death on slow frames

GLOBALS.COUNTER_EASTER_EGG_LINES = [
  ["A space fly", { pitch: 0.9, rate: 0.9, volume: 1.0 }],
  ["Did you see that?!", { pitch: 1.1, rate: 1.0, volume: 1.0 }],
  ["Another fly bites the dust!", { pitch: 0.9, rate: 1.0, volume: 1.0 }],
  ["Are, I, Pee that fly.", { pitch: 0.9, rate: 1.0, volume: 1.0 }],
  ["That's not gonna fly.", { pitch: 0.9, rate: 1.1, volume: 1.0 }],
  ["Ground Control to Major Tom!", { pitch: 1.4, rate: 0.8, volume: 1.0 }],
];

// VARIABLES
GLOBALS.DEBUG_MODE = 2;
GLOBALS.DEBUG_COUNTER_LINES_INDEX = 0;
GLOBALS.AUDIT_DAMPERS = true;
GLOBALS.INPUTS = {
  up: false,
  down: false,
  left: false,
  right: false,
  space: false,
  clickAt: null,
};

export default GLOBALS;
