import GLOBALS from "./src/globals.js";
import Simulation from "./src/physics/simulation.js";
import NASASpeechSynthesizer from "./src/utils/speech-synthesizer.js";
import Counter from "./src/ui/counter.js";
import Frog from "./src/objects/frog.js";
import Hud from "./src/objects/hud.js";
// import Tracer from "./src/utils/tracer.js";

const SIM = new Simulation();
const HUD = new Hud();
/** @type {Frog} */
let frog;
/** @type {Counter} */
let flyCounter;
let hasFly = false;
/** @type {NASASpeechSynthesizer} */
let speechSynthesizer;

/**
 * @param {import('p5')} p5
 */
function setup(p5) {
  p5.createCanvas(window.innerWidth, window.innerHeight);
  frog = new Frog(window.innerWidth / 2, window.innerHeight / 2, 0);
  speechSynthesizer = new NASASpeechSynthesizer();
  flyCounter = new Counter({
    x: window.innerWidth - 30,
    y: 16,
    text: "Flies",
    what: ["fly", "flies"],
    synthesizer: speechSynthesizer,
    easterEggLines: [...GLOBALS.COUNTER_EASTER_EGG_LINES],
  });

  // Give the frog a small initial spin to visualize mouth velocity
  frog.model.body.av = 0.8; // rad/s
}

/**
 * @param {import('p5')} p5
 */
function draw(p5) {
  p5.background(10);

  /**
   * Fixed-step loop:
   *  - Convert frame time (deltaTime) to seconds.
   *  - Step the simulation in FIXED_DT chunks (deterministic).
   *  - Cap number of substeps to keep frame time bounded on slow frames.
   *  - Draw exactly once per frame to avoid “ghosting/artifacts”.
   */
  if (SIM.DEBUG_MODE) {
    // ---------- Debug stepping: ignore deltaTime ----------
    let steps = 0;
    if (!SIM.paused && SIM.runContinuous) {
      steps = 1; // exactly one physics step per draw()
    } else if (SIM.stepQueued > 0) {
      steps = 1; // consume exactly one queued step this frame
      SIM.stepQueued -= 1;
    } else {
      steps = 0; // paused and no step requested
    }

    for (let i = 0; i < steps; i++) {
      frog.update(SIM.SIM_DT);
      SIM.frame += 1;
      SIM.time += SIM.SIM_DT;
    }
  } else {
    // ---------- Normal mode: deterministic fixed-step using deltaTime ----------
    let dtLeft = Math.min(0.1, p5.deltaTime / 1000);
    let steps = 0;
    while (dtLeft > 1e-6 && steps < MAX_SUBSTEPS) {
      const dt = Math.min(GLOBALS.FIXED_DT, dtLeft);
      frog.update(dt);
      dtLeft -= dt;
      steps++;
      SIM.frame += 1;
      SIM.time += dt;
    }
  }

  if (hasFly) {
    flyCounter.increment();
    hasFly = false;
  }

  frog.draw(p5);
  flyCounter.draw(p5);
  HUD.draw(p5, SIM);
}

function keyPressed(p5) {
  if (GLOBALS.DEBUG_MODE === 2 && p5.key === "2") {
    SIM.toggle();
  }
  if (GLOBALS.DEBUG_MODE === 2 && p5.key === "3") {
    SIM.step();
  }
  switch (p5.key) {
    // DEBUG_MODE toggler
    // * 0 = debug off
    // * 1 = show debug HUD
    // * 2 = move into physics simulation debug mode
    case "1":
      GLOBALS.DEBUG_MODE = (GLOBALS.DEBUG_MODE + 1) % 3;
      // Unpause the physics simulation if we move back to DEBUG_MODE = 0
      if (GLOBALS.DEBUG_MODE === 0) SIM.run();
      break;

    // Simulation pause toggler; only works in DEBUG_MODE = 2
    case "2":
      if (GLOBALS.DEBUG_MODE === 2) SIM.toggle();
      break;

    // Simulation frame-by-frame stepper; only works in DEBUG_MODE = 2
    case "3":
      if (GLOBALS.DEBUG_MODE === 2) SIM.step();
      break;

    // Fly Counter increment; only works if DEBUG_MODE is enabled
    case "9":
      if (GLOBALS.DEBUG_MODE !== 0) hasFly = true;
      break;

    // Fly Counter: Speak an Easter egg line; only works if DEBUG_MODE is enabled
    case "0": {
      if (GLOBALS.DEBUG_MODE === 0) break;

      let idx = GLOBALS.DEBUG_COUNTER_LINES_INDEX;
      speechSynthesizer.speak(...GLOBALS.COUNTER_EASTER_EGG_LINES[idx]);
      GLOBALS.DEBUG_COUNTER_LINES_INDEX =
        (GLOBALS.DEBUG_COUNTER_LINES_INDEX + 1) %
        GLOBALS.COUNTER_EASTER_EGG_LINES.length;
      break;
    }
    default:
      break;
  }
}

new window.p5((p5) => {
  p5.setup = () => setup(p5);
  p5.draw = () => draw(p5);
  p5.keyPressed = () => keyPressed(p5);
});
