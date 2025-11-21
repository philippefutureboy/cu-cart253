import { IP5StatefulDrawable } from "../../../p5/interfaces.js";
import FontBook from "../../../utils/fonts.js";
import * as theme from "../../../theme.js";

/**
 * A simple traditional clock with three hands - hours, minutes, seconds
 * Uses js' Date to extract hours/minutes/seconds angle.
 * Has a handsOverlap() method to check if two hands overlap; used for game win condition.
 */
export default class Clock extends IP5StatefulDrawable {
  constructor({
    cx = 300,
    cy = 300,
    width = 300,
    height = 300,
    handColors = {},
    font = null,
  } = {}) {
    super();
    this.x = cx;
    this.y = cy;
    this.width = width ?? 300;
    this.height = height ?? 300;
    this.running = false;
    this.timestamp = null;
    this.handColors = {
      hours: handColors.hours ?? "#000",
      minutes: handColors.minutes ?? "#000",
      seconds: handColors.seconds ?? "#000",
    };
    this.font = font ?? null;
  }

  /**
   * Calculates the angle of a clock hand based on the current this.timestamp value.
   *
   * @param {string} hand Which hand (hours, minutes, seconds) to calc the angle for
   * @param {string} angleMode Which angle mode. Defaults to DEGREES.
   * @returns
   */
  getHandAngle(hand, angleMode = "DEGREES") {
    let fullAngle;
    switch (angleMode) {
      case "DEGREES":
        fullAngle = 360;
        break;
      case "RADIANS":
        fullAngle = 2 * Math.PI;
        break;
      default:
        throw new Error(`Invalid value for angleMode: ${angleMode}`);
    }

    const now = this.timestamp;
    switch (hand) {
      case "hours":
        const hours = now.getHours() % 12;
        return (
          ((hours + now.getMinutes() / 60 + now.getSeconds() / 3600) / 12) *
            fullAngle -
          90
        );
      case "minutes":
        return (
          ((now.getMinutes() + now.getSeconds() / 60) / 60) * fullAngle - 90
        );
      case "seconds":
        return (now.getSeconds() / 60) * fullAngle - 90;
      default:
        throw new Error(`Invalid value for hand: ${hand}`);
    }
  }

  /**
   * Checks if two clock hands overlap within `epsilon` degrees
   *
   * This method is mainly useful so that the game can check for the
   * win condition - which is that the seconds hand overlaps with another hand,
   * thus tagging it.
   *
   * Initially I didn't support an epsilon, but I realized that the seconds
   * hand moves 6 degrees per second, so I added the epsilon; otherwise it would
   * just move past the other hand because it wouldn't be exactly equal in angle.
   *
   * @param {*} hand1 First hand to check (one of hours, minutes, seconds)
   * @param {*} hand2 Second hand to check (one of hours, minutes, seconds)
   * @param {*} epsilon Precision in degrees
   * @returns {boolean} Whether or not the two hands angles overlap within `epsilon` degrees
   */
  handsOverlap(hand1, hand2, epsilon = 3) {
    let handAngle1 = this.getHandAngle(hand1, "DEGREES");
    let handAngle2 = this.getHandAngle(hand2, "DEGREES");

    // Normalize to [0, 360)
    handAngle1 = ((handAngle1 % 360) + 360) % 360;
    handAngle2 = ((handAngle2 % 360) + 360) % 360;

    // Smallest angular difference
    let diff = Math.abs(handAngle1 - handAngle2);
    if (diff > 180) diff = 360 - diff;
    // console.log(hand1, hand2, handAngle1, handAngle2, diff, epsilon);

    return diff <= epsilon;
  }

  setup(p5) {
    this.timestamp = new Date();
  }

  /**
   * Starts the clock (clock updates when update() is called)
   */
  start() {
    this.running = true;
  }

  /**
   * Stops the clock (clock stops updating when update() is called)
   */
  stop() {
    this.running = false;
  }

  /**
   * Update the clock time, and if passed, updates the fill of the hands.
   * p5 is passed to match the API of IP5StatefulDrawable interface
   * @param {import('p5')} p5
   * @param {Object} opts
   * @param {import('p5').Font|FontBook.ErrorSentinel|FontBook.LoadingSentinel|null} opts.font
   * @param {{ ?hours: string, ?minutes: string, ?seconds: string }} opts.handColors Fill colors of the hands
   */
  update(p5, { font, handColors = {} } = {}) {
    if (this.running) {
      this.timestamp = new Date();
    }
    if (font) {
      console.log(font);
      this.font = font;
    }
    this.handColors = {
      hours: handColors?.hours ?? this.handColors.hours,
      minutes: handColors?.minutes ?? this.handColors.minutes,
      seconds: handColors?.seconds ?? this.handColors.seconds,
    };
  }

  draw(p5) {
    // Draw the clock frame (circle)
    p5.push();
    {
      p5.strokeWeight(12);
      p5.stroke("#000");
      p5.fill("#fff");
      p5.ellipse(this.x, this.y, this.width, this.height);
    }
    p5.pop();

    // Draw the numbers
    // Doing [0, 12), and adding 1, that way I can do
    // `hour % 12 / 12` to get the % of 2π that the hour represents.
    for (let i = 0; i < 12; i += 1) {
      p5.push();
      {
        p5.translate(this.x, this.y);
        if (!(FontBook.isSentinel(this.font) && this.font === null)) {
          p5.textSize(40); // not using theme because this is specifically relative to clock size
          p5.textFont(this.font);
        } else {
          p5.textSize(24); // not using theme because this is specifically relative to clock size
        }
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.fill(theme.colors.textDefault);

        // iterating 1..12
        const hour = i + 1;
        // `hour % 12 / 12` = 1/12, 2/12, ... 0/12
        // `- 90` because angle starts at [1, 0], so we want to start at [0, 1]
        const angle = ((hour % 12) / 12) * 360 - 90;
        p5.text(
          `${hour}`,
          (this.width / 2 - 32) * p5.cos(angle),
          (this.height / 2 - 32) * p5.sin(angle)
        );
      }
      p5.pop();
    }
    // Draw seconds ticks around the clock
    for (let i = 0; i < 60; i += 1) {
      const second = i + 1;
      const angle = ((second % 60) / 60) * 360 - 90;
      p5.push();
      {
        p5.translate(this.x, this.y);
        p5.stroke("#000");
        p5.strokeWeight(1);
        p5.line(
          (this.width / 2 - 12) * p5.cos(angle),
          (this.width / 2 - 12) * p5.sin(angle),
          (this.width / 2 - 18) * p5.cos(angle),
          (this.width / 2 - 18) * p5.sin(angle)
        );
      }
      p5.pop();
    }
    // Draw hands
    for (let [i, hand] of ["seconds", "minutes", "hours"].entries()) {
      p5.push();
      {
        p5.angleMode(p5.DEGREES);
        p5.translate(this.x, this.y);
        p5.fill(this.handColors[hand] ?? "#000");
        p5.noStroke();
        const angle = this.getHandAngle(hand, "DEGREES");
        p5.rotate(angle);
        // using the order of the hands, from smallest to biggest to calc thickness of rect
        const handThickness = (i + 1) * 2;
        // similarly, using order of hands to calc the long side
        const handShorterBy = i * 12;
        p5.rect(
          0,
          0 - handThickness / 2,
          this.width / 2 - (32 + handShorterBy),
          handThickness,
          4
        );
      }
      p5.pop();
    }
  }
}
