import GLOBALS from "./src/globals.js";
import Simulation from "./src/physics/simulation.js";
import NASASpeechSynthesizer from "./src/utils/speech-synthesizer.js";
import Counter from "./src/ui/counter.js";
import DigitalClockCountdown from "./src/ui/digital-clock-countdown.js";
import Frog from "./src/objects/frog.js";
import Hud from "./src/ui/hud.js";
import StarrySky from "./src/environments/starry-sky.js";
import TitleScreenOverlay from "./src/ui/title-screen.js";
// import Tracer from "./src/utils/tracer.js";

// === MODULE GLOBALS ==============================================================================
// Globals which don't need to be referenced elsewhere, and whose inclusion here increases
// readbility anyways.

// --- Simulation
const SIM = new Simulation();

// --- UI
const TITLE_SCREEN = new TitleScreenOverlay();
const HUD = new Hud();
/** @type {DigitalClock} */
let digitalClock;
/** @type {NASASpeechSynthesizer} */
let speechSynthesizer;
/** @type {Counter} */
let flyCounter;
let hasFly = false;

// --- Environments
/** @type {StarrySky} */
let starrySky;

// --- Game Objects
/** @type {Frog} */
let frog;

// === P5.js RUNTIME ===============================================================================
/**
 * P5 setup phase handler
 *
 * Setups all of the important objects ahead of the first draw cycle.
 *
 * Implementation by me.
 *
 * @param {import('p5')} p5
 */
function setup(p5) {
  p5.createCanvas(window.innerWidth, window.innerHeight);
  p5.pixelDensity(1);
  p5.noSmooth();

  // TITLE SCREEN
  TITLE_SCREEN.setup(p5);

  // ENVIRONMENTS
  starrySky = new StarrySky({ width: p5.width, height: p5.height });
  starrySky.setup(p5);

  // OBJECTS
  // We center the frog in the viewport (camera) of the
  // starry sky
  const [vcx, vcy] = starrySky.getViewportCenter();
  frog = new Frog(
    vcx + 200, // offset to right of title logo
    vcy - 25, // offset to center with title logo
    0
  );

  // HUD
  speechSynthesizer = new NASASpeechSynthesizer();
  digitalClock = new DigitalClockCountdown({
    x: p5.width - 150,
    y: 16,
    h: 24,
    label: "OXYGEN",
    seconds: GLOBALS.GAME_DURATION,
    updateCallback: (secondsLeft) => {
      if (secondsLeft <= 10 && secondsLeft % 2 === 0 && secondsLeft !== 0) {
        speechSynthesizer.speak("LOW OXYGEN!", {
          pitch: 0.8,
          rate: 0.8,
          volume: 1.0,
        });
      } else if (secondsLeft === 0) {
        return speechSynthesizer.speak("OXYGEN DEPLETED.", {
          pitch: 0.8,
          rate: 0.7,
          volume: 1.0,
        });
      }
      return null;
    },
  });
  digitalClock.setup(p5);
  flyCounter = new Counter({
    x: window.innerWidth - 30,
    y: 16,
    text: "FLIES",
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
 * P5 draw phase handler
 *
 * Defers a call to update game state, then renders the various objects based on the value of
 * GLOBALS.SCENE.
 *
 * Implemented by me.
 *
 * @param {import('p5')} p5
 */
function draw(p5) {
  // UPDATE PHASE
  updateGameState(p5);

  // DRAW PHASE
  switch (GLOBALS.SCENE) {
    case "title": {
      if (!TITLE_SCREEN.ready) break;
      p5.push();
      {
        // apply viewbox scaling
        p5.scale(starrySky.getScaleFactor(p5));
        p5.translate(...starrySky.getTranslationOffset(p5));

        starrySky.draw(p5);
        frog.draw(p5);
      }
      p5.pop();
      TITLE_SCREEN.draw(p5);
      HUD.draw(p5, SIM);
      break;
    }
    case "main": {
      p5.push();
      {
        // apply viewbox scaling
        p5.scale(starrySky.getScaleFactor(p5));
        p5.translate(...starrySky.getTranslationOffset(p5));

        starrySky.draw(p5);
        frog.draw(p5);
      }
      p5.pop();

      flyCounter.draw(p5);
      digitalClock.draw(p5);
      HUD.draw(p5, SIM);
      break;
    }
    default: {
      HUD.draw(p5, SIM);
      break;
    }
  }
}

/**
 *
 * Game state update handler: Do I need to say more?
 *
 * The simulation update part is implemented by ChatGPT 5.0 Thinking.
 *
 * @param {*} p5
 */
function updateGameState(p5) {
  if (GLOBALS.SCENE === "title" && GLOBALS.INPUTS.space) {
    GLOBALS.SCENE = "main";
    digitalClock.start();
  }

  /**
   * This if-else is 100% implemented by ChatGPT 5.0 Thinking.
   *
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
      frog.update(p5, SIM.SIM_DT);
      SIM.frame += 1;
      SIM.time += SIM.SIM_DT;
    }
  } else {
    // ---------- Normal mode: deterministic fixed-step using deltaTime ----------
    let dtLeft = Math.min(0.1, p5.deltaTime / 1000);
    let steps = 0;
    while (dtLeft > 1e-6 && steps < GLOBALS.MAX_SUBSTEPS) {
      const dt = Math.min(GLOBALS.FIXED_DT, dtLeft);
      frog.update(p5, dt);
      dtLeft -= dt;
      steps++;
      SIM.frame += 1;
      SIM.time += dt;
    }
  }

  if (GLOBALS.SCENE === "main") {
    digitalClock.update();
    starrySky.update(p5, frog.model.body);
    if (digitalClock.leftSeconds === 0) {
      digitalClock.stop();
      GLOBALS.SCENE === "game-over";
    }
    if (hasFly) {
      flyCounter.increment();
      hasFly = false;
    }
  }
}

/**
 * p5.keyPressed handler
 *
 * Captures user input (arrows, space), as well as debug commands (numbered keys).
 *
 * Implemented by me.
 *
 * @param {import('p5')} p5
 */
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
    case "z":
    case "Z": {
      GLOBALS.INPUTS.z = true;
      break;
    }
    case "x":
    case "X": {
      GLOBALS.INPUTS.x = true;
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
        SIM.DEBUG_MODE = !SIM.DEBUG_MODE;
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

/**
 * p5.keyReleased handler
 *
 * Releases the user inputs (updates to false in GLOBALS.INPUTS)
 *
 * Implemented by me.
 *
 * @param {import('p5')} p5
 */
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
    case "z":
    case "Z": {
      GLOBALS.INPUTS.z = false;
      break;
    }
    case "x":
    case "X": {
      GLOBALS.INPUTS.x = false;
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

/**
 * p5.mouseClicked handler
 *
 * Captures clicks done on canvas; clicks outside of canvas clear state.
 * Clicks are used primarily for debug purpose.
 *
 * Implemented by me.
 *
 * @param {import('p5')} p5
 */
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

/**
 * P5 runtime declaration
 *
 * Being in instance mode, that means that p5 must be passed down everywhere (the p5 functions are not
 * exposed on the globalThis by default).
 */
new window.p5((p5) => {
  p5.setup = () => setup(p5);
  p5.draw = () => draw(p5);
  p5.keyPressed = () => keyPressed(p5);
  p5.keyReleased = () => keyReleased(p5);
  p5.mouseClicked = (event) => mouseClicked(p5, event);
});
