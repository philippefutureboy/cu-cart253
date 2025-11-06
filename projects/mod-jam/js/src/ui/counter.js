/**
 * Counter
 *
 * Counter that can integrate with a SpeechSynthesizer to produce sound whenever
 * the counter is incremented.
 * While I'm aware the requirement is to have a more "creative" counter,
 * I thought that for the design of my game, having a classical counter was more adequate for the
 * game. Adding the ability to have a voiceover (especially in an old, radio-like voice), adds
 * to the immersion into the theme of space.
 */
export default class Counter {
  /**
   * class constructor
   *
   * @param {object} opts
   * @param {string} opts.x x coordinate for drawing counter
   * @param {string} opts.y y coordinate for drawing counter
   * @param {string} opts.text The text displayed above the counter number
   * @param {[string, string]} opts.what The type of the thing we are counting.
   * Used for speech synthesis on increment. Format: [singular, plural].
   * @param {number} opts.count The default count to start at
   * @param {object} opts.synthesizer The synthesizer to use for voiceover on increment
   * @param {([string, object])[]} opts.easterEggLines Easter egg lines to replace the default
   * increment voiceover, at random intervals. Expects an Array<[string, { pitch, rate, volume }]>,
   * Where the second element of each line (options) is optional.
   */
  constructor({
    x = 0,
    y = 0,
    text = "Count",
    what = ["", ""],
    count = 0,
    synthesizer = null,
    easterEggLines = null,
  } = {}) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.count = count;
    this.what = what ?? ["", ""];
    this.synthesizer = synthesizer;
    this.easterEggLines = easterEggLines ?? [];
    this.easterEggIndex = 0;
    this.lastCountValWithEasterEgg = null; // last value of count when an easter egg line was voiced
  }

  increment() {
    this.count += 1;
    // guard synthesizer in case none provided
    if (this.synthesizer) {
      let msgConfig;

      // check if it is the time for an Easter egg voiceover line
      if (
        // we want to let the user play a bit before easter eggs kick in
        // also that prevents all easter eggs to follow one after another
        this.count - (this.lastCountValWithEasterEgg ?? 0) > 4 &&
        // we don't want to have an IndexError
        this.easterEggIndex < this.easterEggLines.length &&
        // random makes it more rewarding/less predictable
        Math.random() > 0.4
      ) {
        msgConfig = this.easterEggLines[this.easterEggIndex];
        this.easterEggIndex += 1;
        this.lastCountValWithEasterEgg = this.count;
      } else {
        // Count verbally, uttered with default config
        msgConfig = [
          `${this.count} ${this.count === 1 ? this.what[0] : this.what[1]}.`,
        ];
      }
      this.synthesizer.speak(...msgConfig);
    }
  }

  draw(p5) {
    p5.push();
    p5.fill("white");
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.text(this.text, this.x + 10, this.y);
    p5.textSize(20);
    p5.textAlign(p5.CENTER, p5.BOTTOM);
    p5.text(`${this.count}`, this.x + 10, this.y + 30);
    p5.pop();
  }
}
