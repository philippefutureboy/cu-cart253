import GLOBALS from "./src/globals.js";
import Simulation from "./src/physics/simulation.js";
import NASASpeechSynthesizer from "./src/utils/speech-synthesizer.js";
import Counter from "./src/ui/counter.js";
import HungerBar from "./src/ui/hunger-bar.js";
import Frog from "./src/objects/frog.js";
import Hud from "./src/ui/hud.js";
import TitleScreenOverlay from "./src/ui/title-screen.js";
// import Tracer from "./src/utils/tracer.js";

// Simulation
const SIM = new Simulation();

// UI
const TITLE_SCREEN = new TitleScreenOverlay();
const HUD = new Hud();
/** @type {HungerBar} */
let hungerBar;
/** @type {NASASpeechSynthesizer} */
let speechSynthesizer;
/** @type {Counter} */
let flyCounter;
let hasFly = false;

// Game objects
/** @type {Frog} */
let frog;

/**
 * @param {import('p5')} p5
 */
function setup(p5) {
  p5.createCanvas(window.innerWidth, window.innerHeight);

  TITLE_SCREEN.setup(p5);
  frog = new Frog(window.innerWidth / 2 + 200, window.innerHeight / 2 - 25, 0);
  hungerBar = new HungerBar({
    x: p5.width - 150,
    y: 16,
    w: 100,
    h: 12,
    text: "Energy",
  });
  speechSynthesizer = new NASASpeechSynthesizer();
  flyCounter = new Counter({
    x: window.innerWidth - 30,
    y: 16,
    text: "Flies",
    what: ["fly", "flies"],
    synthesizer: speechSynthesizer,
    easterEggLines: [...GLOBALS.COUNTER_EASTER_EGG_LINES],
  });

  // Initial check if I hard-coded the DEBUG_MODE to physics simulation debug mode
  // Moves the SIM into debug mode as well.
  if (GLOBALS.DEBUG_MODE === 2) {
    SIM.DEBUG_MODE = true;
    SIM.pause();
  }

  // Give the frog a small initial spin to visualize mouth velocity
  frog.model.body.av = 0.8; // rad/s
}

/**
 * @param {import('p5')} p5
 */
function draw(p5) {
  // UPDATE PHASE
  updateGameState(p5);

  // DRAW PHASE
  p5.background(10);
  switch (GLOBALS.SCENE) {
    case "title": {
      if (!TITLE_SCREEN.ready) break;
      frog.draw(p5);
      TITLE_SCREEN.draw(p5);
      HUD.draw(p5, SIM);
      break;
    }
    case "main": {
      flyCounter.draw(p5);
      hungerBar.draw(p5);
      frog.draw(p5);
      HUD.draw(p5, SIM);
      break;
    }
    default: {
      HUD.draw(p5, SIM);
      break;
    }
  }
}

function updateGameState(p5) {
  if (GLOBALS.SCENE === "title" && GLOBALS.INPUTS.space) {
    GLOBALS.SCENE = "main";
  }

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
    while (dtLeft > 1e-6 && steps < GLOBALS.MAX_SUBSTEPS) {
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
    hungerBar.update(p5, 10);
    hasFly = false;
  } else {
    hungerBar.update(p5, 0);
  }
}

function keyPressed(p5) {
  switch (p5.key) {
    // Register arrow presses
    case "ArrowUp":
    case "ArrowDown":
    case "ArrowLeft":
    case "ArrowRight": {
      const direction = p5.key.substring(5).toLowerCase();
      GLOBALS.INPUTS[direction] = true;
      break;
    }

    // Register spacebar press
    case " ":
      GLOBALS.INPUTS.space = true;
      break;

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
      if (GLOBALS.DEBUG_MODE === 2) {
        SIM.DEBUG_MODE = !!SIM.DEBUG_MODE;
        SIM.toggle();
      }
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

function keyReleased(p5) {
  switch (p5.key) {
    // Register arrow presses
    case "ArrowUp":
    case "ArrowDown":
    case "ArrowLeft":
    case "ArrowRight": {
      const direction = p5.key.substring(5).toLowerCase();
      GLOBALS.INPUTS[direction] = false;
      break;
    }

    // Register spacebar press
    case " ":
      GLOBALS.INPUTS.space = false;
      break;
    default:
      break;
  }
}

function mouseClicked(p5, event) {
  const onCanvas =
    p5.mouseX >= 0 &&
    p5.mouseX <= p5.width &&
    p5.mouseY >= 0 &&
    p5.mouseY <= p5.height;
  // left click
  if (event.button === 0) {
    if (onCanvas) GLOBALS.INPUTS.clickAt = [p5.mouseX, p5.mouseY];
    else GLOBALS.INPUTS.clickAt = null;
  }
}

new window.p5((p5) => {
  p5.setup = () => setup(p5);
  p5.draw = () => draw(p5);
  p5.keyPressed = () => keyPressed(p5);
  p5.keyReleased = () => keyReleased(p5);
  p5.mouseClicked = (event) => mouseClicked(p5, event);
});
