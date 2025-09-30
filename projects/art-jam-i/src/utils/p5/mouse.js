/**
 * @typedef {import('p5')} P5
 */

let mouseHasBeenDetected = false;

/**
 * Returns whether or not the mouse has been detected on the page
 * @param {P5} p5
 * @returns {boolean}
 */
export function hasMouseBeenDetected(p5) {
  // FIXME: This may need to be scene-scoped
  // FIXME: This may only work for P2D mode
  if (!mouseHasBeenDetected) {
    // p5 seems to leave the mouseX and mouseY at 0,0 if the window is not focused
    mouseHasBeenDetected = p5.mouseX !== 0 || p5.mouseY !== 0;
  }
  return mouseHasBeenDetected;
}

/**
 * Returns whether or not the mouse is within the bounds of the canvas
 * @param {P5} p5
 * @returns {boolean}
 */
export function isMouseInBounds(p5) {
  // FIXME: This may only work for P2D mode
  return (
    p5.mouseX >= 0 &&
    p5.mouseX <= p5.width &&
    p5.mouseY >= 0 &&
    p5.mouseY <= p5.height
  );
}
