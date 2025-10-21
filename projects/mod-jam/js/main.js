import GLOBALS from "./src/globals.js";
import Simulation from "./src/physics/simulation.js";
import Frog from "./src/objects/frog.js";
import Hud from "./src/objects/hud.js";
// import Tracer from "./src/utils/tracer.js";

const SIM = new Simulation();
const HUD = new Hud();
let frog;

/**
 * @param {import('p5')} p5
 */
function setup(p5) {
  p5.createCanvas(800, 600);
  frog = new Frog(400, 300, 0);
  window.frog = frog;

  // Give the frog a small initial spin to visualize mouth velocity
  frog.model.body.av = 0.8; // rad/s
}

/**
 * Fixed-step loop:
 *  - Convert frame time (deltaTime) to seconds.
 *  - Step the simulation in FIXED_DT chunks (deterministic).
 *  - Cap number of substeps to keep frame time bounded on slow frames.
 *  - Draw exactly once per frame to avoid “ghosting/artifacts”.
 *
 * @param {import('p5')} p5
 */
function draw(p5) {
  p5.background(10);
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

  frog.draw(p5);
  HUD.draw(p5, SIM);
}

function keyPressed(p5) {
  if (GLOBALS.DEBUG_MODE === 2 && p5.key === "2") {
    SIM.toggle();
  }
  if (GLOBALS.DEBUG_MODE === 2 && p5.key === "3") {
    SIM.step();
  }
}

new window.p5((p5) => {
  p5.setup = () => setup(p5);
  p5.draw = () => draw(p5);
  p5.keyPressed = () => keyPressed(p5);
});
