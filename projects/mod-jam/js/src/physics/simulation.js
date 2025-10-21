export default class Simulation {
  constructor() {
    // former globals
    this.DEBUG_MODE = true; // when true, ignore deltaTime; run by frame count
    this.SIM_HZ = 60; // fixed "displayed framerate" for debug stepping
    this.SIM_DT = 1 / this.SIM_HZ; // debug dt per physics step

    this.paused = true; // paused flag (was simPaused)
    this.runContinuous = false; // do exactly 1 physics step per draw() (was simRunContinuous)
    this.stepQueued = 0; // queued single steps (was simStepQueued)
    this.frame = 0; // physics steps performed (was simFrame)
    this.time = 0; // simulation time in seconds (was simTime)
  }

  // --- controls (formerly on window.*) ---
  pause() {
    this.paused = true;
    this.runContinuous = false;
  }

  run() {
    this.paused = false;
    this.runContinuous = true;
  }

  toggle() {
    if (this.paused) this.run();
    else this.pause();
  }

  step(n = 1) {
    this.paused = true;
    this.runContinuous = false;
    this.stepQueued += Math.max(1, n | 0);
  }

  setHz(hz) {
    this.SIM_HZ = Math.max(1, hz | 0);
    this.SIM_DT = 1 / this.SIM_HZ;
    console.log(`[sim] debug Hz=${this.SIM_HZ}, dt=${this.SIM_DT.toFixed(5)}s`);
  }

  status() {
    return {
      SIM_DEBUG_MODE: this.DEBUG_MODE,
      SIM_HZ: this.SIM_HZ,
      SIM_DT: this.SIM_DT,
      simPaused: this.paused,
      simRunContinuous: this.runContinuous,
      simStepQueued: this.stepQueued,
      simFrame: this.frame,
      simTime_s: this.time,
    };
  }

  // (optional) helpers you might call from your engine loop:
  // mark one physics step as completed
  onPhysicsStepDone() {
    this.frame += 1;
    this.time = this.frame * this.SIM_DT;
  }
  // consume one queued step (returns true if one was consumed)
  takeQueuedStep() {
    if (this.stepQueued > 0) {
      this.stepQueued -= 1;
      return true;
    }
    return false;
  }
}
