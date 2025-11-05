import GLOBALS from "../globals.js";
import { CoordinatesBox } from "../utils/coordinates.js";

export default class GameOverScreenOverlay {
  constructor() {
    this.tintTransitionDuration = 2000; // ms
    this.font = null;
    this.callback = null;
    this.calledCallback = false;
  }

  /**
   * Setup function to be called during the setup phase.
   * Loads the font that will be displayed on the Game Over screen.
   * Saves the passed callback to call it when the instance is first drawn.
   *
   * @param {import('p5')} p5
   * @param {Function} callback To support using speech synthesizer without having to pass the object
   */
  setup(p5, callback) {
    this.font = p5.loadFont("../../assets/fonts/Excluded/Excluded-z8XrX.ttf");
    this.callback = callback;
  }

  /**
   *
   * @param {import('p5')} p5
   */
  draw(p5) {
    if (this.callback !== null && !this.calledCallback) {
      this.callback();
      this.calledCallback = true;
    }
    this._drawColorFilter(p5);
    this._drawGameOverText(p5);
  }

  _drawColorFilter(p5) {
    // Originally, the idea was to have the tint increase from no-tint to 100% tint, but
    // a bug in my code (using Math.max instead of Math.min) made the.
    // The bug resulted in only the frog being visible, rather than a sepia tint, and I liked the
    // effect, so I increased the max value to 10 instead of 1.
    // Gives a bit of that "WASTED" GTA feel.
    const tintTransitionProgress = Math.min(
      (Date.now() - GLOBALS.GAME_OVER_AT) / this.tintTransitionDuration,
      5
    );

    p5.push();
    {
      // p5.filter and p5.tint were suggested by ChatGPT when asked how to have a sepia filter on the
      // whole canvas.
      p5.filter(p5.GRAY);
      p5.tint(
        255,
        p5.lerp(255, 200, tintTransitionProgress),
        p5.lerp(255, 150, tintTransitionProgress)
      ); // warm tone overlay
    }
    p5.pop();
  }

  _drawGameOverText(p5) {
    // Show GAME OVER
    let gameOverText = "GAME OVER";
    // show the characters progressively
    const gameOverTruncateLength = Math.round(
      Math.min((Date.now() - GLOBALS.GAME_OVER_AT) / 150, 9)
    );
    gameOverText = gameOverText.substring(0, gameOverTruncateLength);

    // show underscore once all the character are displayed
    const showUnderscore =
      gameOverTruncateLength === 9 &&
      // blink once per second to give the feel of a terminal
      ((Date.now() - GLOBALS.GAME_OVER_AT) / 1000) % 1 > 0.5;

    const gameOverTextHeight = p5.height / 10;

    // Draw GAME OVER_
    p5.push();
    {
      p5.textFont(this.font);
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.textSize(gameOverTextHeight);
      p5.fill("red");
      p5.stroke("black");
      p5.strokeWeight(2);
      p5.text(gameOverText, p5.width / 2, p5.height / 2);
      if (showUnderscore) {
        p5.textAlign(p5.LEFT, p5.CENTER);
        p5.text(
          "_",
          p5.width / 2 + p5.textWidth(gameOverText) / 2,
          p5.height / 2
        );
      }
    }
    p5.pop();

    // Draw cause of death text
    const gameOverFullyPrinted = gameOverTruncateLength === 9;
    const gameOverFullyPrintedAt = GLOBALS.GAME_OVER_AT + 9 * 250;
    const codAlpha = gameOverFullyPrinted
      ? // offset print after game over is shown, then gradually increase alpha over 1.5 sec
        Math.min((Date.now() - gameOverFullyPrintedAt) / 1500, 1) * 255
      : 0;
    const codAlphaMaxedAt = gameOverFullyPrintedAt + 1500;
    const codTextPosition = [
      p5.width / 2,
      p5.height / 2 + gameOverTextHeight - gameOverTextHeight / 4,
    ];
    if (codAlpha !== 0) {
      p5.push();
      {
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.textFont(this.font);
        p5.textSize(gameOverTextHeight / 4);
        p5.fill(p5.color(255, 255, 255, codAlpha));
        p5.stroke(p5.color(0, 0, 0, codAlpha));
        p5.strokeWeight(2);
        p5.text("you ran out of oxygen", ...codTextPosition);
      }
      p5.pop();
    }

    // Draw reset button, with mouse events support

    const resetAlpha =
      codAlpha !== 255
        ? 0
        : Math.min((Date.now() - codAlphaMaxedAt) / 1500, 1) * 255;
    const resetText = "Reset game";
    if (resetAlpha !== 0) {
      p5.push();
      {
        // Set styles of button text to calculate text width for button
        p5.textFont(this.font);
        p5.textSize(gameOverTextHeight / 4);
        const textWidth = p5.textWidth(resetText);

        // Create a CoordinatesBox for the button for simpler code
        const resetButtonBox = new CoordinatesBox({
          xMin: p5.width / 2 - textWidth / 2 - 16,
          xMax: p5.width / 2 + textWidth / 2 + 16,
          yMin: codTextPosition[1] + gameOverTextHeight / 2,
          yMax: codTextPosition[1] + gameOverTextHeight / 2 + 40,
        });

        // Check if mouse position is over the button
        const mouseHovering =
          between(p5.mouseX, resetButtonBox.xMin, resetButtonBox.xMax) &&
          between(p5.mouseY, resetButtonBox.yMin, resetButtonBox.yMax);

        // If button is >=50% opaque and the mouse is over it, change cursor
        // and handle click for reload
        if (resetAlpha >= 125 && mouseHovering) {
          p5.cursor(p5.HAND);
          if (p5.mouseIsPressed) {
            window.location.reload();
          }
        }
        // else reset the cursor
        else {
          p5.cursor(p5.ARROW);
        }

        // draw the button rect
        p5.fill(p5.color(100, 100, 255, resetAlpha));
        p5.stroke(p5.color(0, 0, 0, resetAlpha));
        p5.strokeWeight(1);
        p5.rectMode(p5.CENTER);
        p5.rect(
          ...resetButtonBox.center,
          resetButtonBox.width,
          resetButtonBox.height,
          4
        );

        // draw the button label
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.fill(p5.color(255, 255, 255, resetAlpha));
        p5.stroke(p5.color(0, 0, 0, resetAlpha));
        p5.strokeWeight(1);
        p5.text(resetText, ...resetButtonBox.center);
      }
      p5.pop();
    }
  }
}

// --- HELPER FUNCTIONS ----------------------------------------------------------------------------

/**
 * between
 *
 * Checks whether value is between min and max. Syntactic sugar of sorts for improved readability.
 * Implemented by me.
 */
function between(value, min, max) {
  return value >= min && value <= max;
}
