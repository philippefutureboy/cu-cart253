/**
 * Run a drawing callback as if the sketch were in the requested p5 “space”
 * (coordinate system), regardless of the current renderer.
 *
 * - If current renderer already matches `mode`, it just calls the callback.
 * - If current renderer is WEBGL and `mode === 'P2D'`, it switches to an
 *   orthographic projection and moves the origin to the top-left.
 * - If current renderer is 2D (P2D) and `mode === 'WEBGL'`, it recenters the
 *   origin to the canvas center to mimic WEBGL's screen-space coords.
 *
 * Limitations:
 * - In 2D (P2D) you still can’t draw true 3D; this only adjusts origin/projection.
 * - This does not change rect/ellipse modes; set those inside your callback if needed.
 * - Active shaders/blend modes remain in effect; call `p5.resetShader()` in your callback
 *   if you need default pipeline.
 *
 * This code and the conceptualisation was authored by ChatGPT-5 (OpenAI), and then integrated
 * by Philippe Hebert.
 *
 * @param {p5} p5                The p5 instance.
 * @param {'P2D'|'WEBGL'} mode   Desired coordinate space for the callback.
 * @param {(p5: p5, ...args:any[]) => any} drawCallback  Your drawing code.
 * @param {...any} args          Extra args forwarded to `drawCallback`.
 * @returns {any}                Whatever `drawCallback` returns.
 */
export default function withP5Space(p5, mode, drawCallback, ...args) {
  const ctx = p5.drawingContext;
  const isWebGL =
    ctx instanceof WebGLRenderingContext ||
    ctx instanceof WebGL2RenderingContext;

  if (mode !== "P2D" && mode !== "WEBGL") {
    throw new Error(
      `withP5Space: invalid mode "${mode}". Use "P2D" or "WEBGL".`,
    );
  }

  const modeMatches =
    (isWebGL && mode === "WEBGL") || (!isWebGL && mode === "P2D");
  if (modeMatches) {
    return drawCallback(p5, ...args);
  }

  let result;
  if (isWebGL && mode === "P2D") {
    // WEBGL → emulate P2D: orthographic, top-left origin
    p5.push();
    p5.ortho(); // pixel-aligned projection
    p5.translate(-p5.width / 2, -p5.height / 2, 0); // top-left origin
    result = drawCallback(p5, ...args);
    p5.pop();
    return result;
  }

  // P2D → emulate WEBGL: center origin (no 3D, just screen-space mimicry)
  p5.push();
  p5.translate(p5.width / 2, p5.height / 2); // center origin like WEBGL
  result = drawCallback(p5, ...args);
  p5.pop();
  return result;
}
