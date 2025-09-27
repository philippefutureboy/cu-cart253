export default class Bar {
  constructor({ x, y, w, h, padding, fill, pulseHz = 1 }) {
    this._x = x;
    this._y = y;
    this._w = w;
    this._h = h;
    this._strokeWeight = 3;
    this._padding = padding;
    this._fill = fill;
    this._pulseHz = pulseHz;
    this._pulseStart = null;
    this._fillPercent = 0;
    this._superCharged = false;
  }

  get superCharged() {
    return this._superCharged;
  }

  get fillPercent() {
    return this._fillPercent;
  }

  set fillPercent(value) {
    if (value < 0 || value > 1) {
      throw new Error("Expected value to be within [0,1] range");
    }
    this._fillPercent = value;
    // SUPAH CHARGE RADY
    if (value >= 1) {
      this._superCharged = true;
    }
    // reset state when empty
    if (value === 0) {
      this._superCharged = false;
      this._pulseStart = null;
    }
  }

  draw(p5) {
    const {
      _x: x,
      _y: y,
      _w: w,
      _h: h,
      _padding: padding,
      _fillPercent: fillPercent,
      _fill: fill,
    } = this;

    let borderPulse = 0;
    if (this._superCharged) {
      // if we are just starting pulsating, let's note it
      // that way we can know where we are on the pulse cycle
      if (this._pulseStart === null) {
        this._pulseStart = p5.frameCount;
      }
      const framesSincePulse = p5.frameCount - this._pulseStart;
      const secondsSincePulse = framesSincePulse / p5.frameRate();
      // we multiply by a hundred to avoid floating point errors on modulus
      // returns a value [0, ~pulseHz)
      const progressOfPulse =
        ((secondsSincePulse * 100) % (this._pulseHz * 100)) / 100;
      // we normalize to [0, 1)
      const progressOfPulseNorm = progressOfPulse / this._pulseHz;
      // we normalize to radiants [0, 2π)
      const progressOfPulseRad = progressOfPulseNorm * 2 * Math.PI;
      // we abs the sin(angle) value to always have a positive borderPulse [0, this._strokeWeight)
      borderPulse = Math.abs(p5.sin(progressOfPulseRad));
    }

    p5.push();

    if (borderPulse !== 0) {
      p5.colorMode("HSB");
      p5.stroke(255 * borderPulse, 100, 80);
    } else {
      p5.stroke("#000");
    }

    p5.strokeWeight(this._strokeWeight * (1 + borderPulse));
    p5.fill("#fff");
    p5.rect(x, y, w, h);
    if (fillPercent !== 0) {
      p5.fill(fill);
      p5.rect(
        x + padding / 2,
        y + padding / 2,
        (w - padding) * fillPercent,
        h - padding,
      );
    }

    p5.pop();
  }
}
