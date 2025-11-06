/**
 * DigitalClockCountdown
 *
 * A digital clock wired to go down one second at a time,
 * and optionally calls an updateCallback for additional effects.
 *
 * Decided to replace the HungerBar with this instead because I kept
 * wondering "What kills you in space?" and the same answer kept popping up:
 * asphyxiation.
 * I felt like that would be more appropriate than "dying of hunger", when
 * you are literally eating fly after fly as the core loop.
 * This feels more definitive, more accurate to the theme, and creates a sense
 * of inevitability and finality to it; no matter how many flies you eat,
 * you will die in this cold outer space.
 */
export default class DigitalClockCountdown {
  constructor({
    label,
    seconds,
    x,
    y,
    h,
    color,
    maxSteps = 2,
    updateCallback = () => null,
  } = {}) {
    // draw props
    this.x = x;
    this.y = y;
    this.h = h;
    this.label = label;
    this.color = color ?? "#ff0000";
    this.font = null;

    // actions on update
    this.updateCallback = updateCallback ?? (() => null);

    // countdown props
    this.startSeconds = seconds; // how many seconds we start with
    this.leftSeconds = seconds; // how many seconds are left
    this.lastUpdate = null; // stores the last timestamp (seconds since epoch) when the update method was called
    this.maxSteps = maxSteps ?? 2; // max number of seconds to deduct per update call
  }

  start() {
    this.lastUpdate = Math.floor(Date.now() / 1000);
  }

  clear() {
    this.leftSeconds = this.startSeconds;
    this.lastUpdate = null;
  }

  stop() {
    this.lastUpdate = null;
  }

  update() {
    if (this.lastUpdate !== null) {
      // calc how much time elapsed since lastUpdate; cap to maxSteps
      // thus, deltaS = [0, maxSteps]
      const timestampS = Math.floor(Date.now() / 1000);
      let deltaS = Math.min(timestampS - this.lastUpdate, this.maxSteps);
      // only update every second
      if (deltaS !== 0) {
        this.leftSeconds = Math.max(this.leftSeconds - deltaS, 0);
        this.lastUpdate = timestampS;
        if (this.updateCallback) {
          this.updateCallback(this.leftSeconds);
        }
      }
    }
  }

  setup(p5) {
    // Using mono to be able to compute the length of the clock ahead of time.
    // Monospaced = each character has the same width, thus I can do
    // string.length * size of one character = width of counter
    this.font = p5.loadFont("assets/fonts/Digital-7/digital-7-mono.ttf");
    this.charWidth = (this.h - 2) / 2; // approx
  }

  draw(p5) {
    const hms = secondsToHMS(this.leftSeconds);
    p5.push();
    p5.fill("white");
    p5.textAlign(p5.CENTER, p5.CENTER);
    // x + (hms.length * this.charWidth / 2): Center the label horizontally about the clock
    p5.text(this.label, this.x + (hms.length * this.charWidth) / 2, this.y);
    p5.pop();

    p5.push();
    p5.fill(this.color);
    p5.textFont(this.font);
    p5.textSize(this.h);
    p5.text(hms, this.x, this.y + 26);
    p5.pop();
  }
}

function secondsToHMS(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // Add leading zeros if needed
  return [hrs, mins, secs].map((v) => String(v).padStart(2, "0")).join(":");
}
