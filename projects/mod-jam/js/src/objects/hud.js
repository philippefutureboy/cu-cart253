import GLOBALS from "../globals.js";

export default class Hud {
  draw(p5, SIM) {
    if (GLOBALS.DEBUG_MODE === 2) {
      p5.push();
      p5.fill(255);
      p5.noStroke();
      p5.textSize(12);
      const mode = SIM.DEBUG_MODE ? "DEBUG" : "NORMAL";
      const paused = SIM.paused ? "PAUSED" : SIM.runContinuous ? "RUN" : "STEP";
      const t = SIM.time.toFixed(3);
      const dt = (SIM.DEBUG_MODE ? SIM.SIM_DT : GLOBALS.FIXED_DT).toFixed(5);
      p5.text(
        `${mode} | ${paused} | frame=${SIM.frame} t=${t}s | dt=${dt}s`,
        10,
        p5.height - 12
      );
      p5.pop();
    }
  }
}
