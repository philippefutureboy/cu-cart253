import GLOBALS from "../globals.js";
import Tracer from "../utils/tracer.js";

export default class Hud {
  constructor() {
    this.frameRateTracer = new Tracer("frameRate", {
      maxFrames: 180,
      strategy: "ring",
      enabled: true,
    });
  }

  draw(p5, SIM) {
    this.frameRateTracer.capture(
      p5.frameCount,
      { frameRate: p5.frameRate() },
      { merge: true }
    );
    // GLOBALS.DEBUG_MODE in (1, 2): Debug mode is ON
    if (GLOBALS.DEBUG_MODE !== 0) {
      this._maybeDrawCrosshair(p5);
      this._drawGlobalDebugHud(p5);
    }
    // GLOBALS.DEBUG_MODE = 2: Physics simulation debug mode
    if (GLOBALS.DEBUG_MODE === 2) {
      this._drawSimDebugHud(p5, SIM);
    }
  }

  /**
   * Draws a crosshair at the position where the user last clicked at.
   *
   * Why did I implement this?
   *   I implemented this so that I could more easily measure where
   *   to put the ellipses, rect, vertex, and other shapes while developing.
   *
   * @param {import('p5')} p5
   */
  _maybeDrawCrosshair(p5) {
    const { clickAt } = GLOBALS.INPUTS;
    if (clickAt !== null) {
      p5.push();
      p5.stroke("blue");
      p5.strokeWeight(1);
      p5.line(clickAt[0], 0, clickAt[0], p5.height);
      p5.line(0, clickAt[1], p5.width, clickAt[1]);
      p5.pop();
    }
  }

  /**
   * Draws a hud with debug information in the upper left corner.
   *
   * Why did I implement this?
   *   I implemented this so that I can have confirmation of user input and also see useful info
   *   about the p5 state.
   *
   * @param {import('p5')} p5
   */
  _drawGlobalDebugHud(p5) {
    const { up, down, left, right, space, clickAt } = GLOBALS.INPUTS;
    // Getting avg frameRate in last second to have an idea of the performance
    const frameRates = this.frameRateTracer.buffer.slice(
      -1 - GLOBALS.FRAME_RATE,
      -1
    );
    const avgFrameRateLastSec =
      frameRates.reduce((acc, trace) => acc + trace.frameRate, 0) /
      frameRates.length;

    // draw info
    let lines = [
      "Stats:",
      `  debugMode: ${GLOBALS.DEBUG_MODE}`,
      `  frameRate: ${p5.round(avgFrameRateLastSec, 1)}`,
      `  frameCount: ${p5.frameCount}`,
      `  time: ${Math.floor(p5.millis() / 1000)} s`,
      `  size: (${p5.width}, ${p5.height})`,
      "",
      "Inputs:",
      `  up: ${up}`,
      `  down: ${down}`,
      `  left: ${left}`,
      `  right: ${right}`,
      `  space: ${space}`,
      `  mouse: (${Math.floor(p5.mouseX)}, ${Math.floor(p5.mouseY)})`,
      clickAt !== null
        ? `  click: (${Math.floor(clickAt[0])}, ${Math.floor(clickAt[1])})`
        : "  click:",
    ];
    p5.push();
    p5.fill("white");
    p5.textSize(11);
    p5.textAlign(p5.LEFT, p5.TOP);
    for (let [i, line] of lines.entries()) {
      p5.text(line, 5, 5 + i * 14);
    }
    p5.pop();

    // draw cursor position next to it
    const onCanvas =
      p5.mouseX >= 0 &&
      p5.mouseX <= p5.width &&
      p5.mouseY >= 0 &&
      p5.mouseY <= p5.height;

    if (onCanvas) {
      p5.push();
      p5.fill("white");
      p5.textSize(11);
      p5.textAlign(p5.LEFT, p5.BOTTOM);
      p5.text(
        ` (${Math.floor(p5.mouseX)}, ${Math.floor(p5.mouseY)})`,
        p5.mouseX,
        p5.mouseY
      );
      p5.pop();
    }
  }

  /**
   * Draws a debug HUD for the SIM
   *
   * Implemented by ChatGPT as part of the request for a debuggable/steppable physical simulation.
   *
   * @param {import('p5')} p5
   */
  _drawSimDebugHud(p5, SIM) {
    p5.push();
    p5.fill(255);
    p5.noStroke();
    p5.textSize(11);
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
