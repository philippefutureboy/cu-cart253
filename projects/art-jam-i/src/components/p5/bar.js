export default class Bar {
  constructor({ x, y, w, h, padding, fill }) {
    this._x = x;
    this._y = y;
    this._w = w;
    this._h = h;
    this._padding = padding;
    this._fill = fill;
    this._fillPercent = 0;
  }

  get fillPercent() {
    return this._fillPercent;
  }

  set fillPercent(value) {
    if (value < 0 || value > 1) {
      throw new Error("Expected value to be within [0,1] range");
    }
    this._fillPercent = value;
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
    p5.push();

    p5.stroke("#000");
    p5.strokeWeight(3);
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
