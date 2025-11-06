/**
 * Simple text-display with controls cues for player to know controls
 */
export default class ControlsHud {
  /**
   * Setup function to be called during the setup phase.
   * Currently a no-op. Kept to keep a standard API for drawable objects.
   *
   * @param {import('p5')} p5
   */
  setup(p5) {
    // NO-OP
  }

  /**
   * Draw function
   *
   * @param {import('p5')} p5
   */
  draw(p5) {
    p5.push();
    {
      p5.fill(255);
      p5.noStroke();
      p5.textSize(16);
      p5.textAlign(p5.CENTER, p5.TOP);
      p5.text(
        "(space) to launch/retract tongue     (← , ↑ , ↓ , →) to move the frog     (z , x) to add angular velocity",
        p5.width / 2,
        p5.height - 18
      );
    }
    p5.pop();
  }
}
