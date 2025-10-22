export default class HungerBar {
  constructor({ text, x, y, w, h, points = 100, hungerHz = 3 } = {}) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.text = text;
    this.points = points;
    this.hungerHz = hungerHz;
    this.lastHungerCheck = null;
  }

  update(p5, points = 0) {
    let result = this.points;
    const ms = p5.millis();

    if (this.lastHungerCheck === null) {
      this.lastHungerCheck = ms;
    } else {
      const deltaMs = ms - this.lastHungerCheck;
      if (deltaMs > 1000) {
        result -= Math.floor(deltaMs / 1000) * this.hungerHz;
        this.lastHungerCheck = ms;
      }
    }
    result += points ?? 0;

    this.points = result < 0 ? 0 : result > 100 ? 100 : result;
  }

  draw(p5) {
    const { x, y, w, h, points } = this;

    p5.push();
    p5.fill("white");
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.text(this.text, x + w / 2, y);
    p5.pop();

    const by = y + 12;
    let fillColor;
    if (points >= 90) fillColor = "#0f0";
    else if (points >= 70) fillColor = "#cf0";
    else if (points >= 50) fillColor = "#ff0";
    else if (points >= 30) fillColor = "#ffa500";
    else if (points >= 15) fillColor = "#f00";
    else fillColor = "#950606";

    p5.push();
    p5.stroke("white");
    p5.strokeWeight(1.7);
    p5.noFill();
    p5.rect(x, by, w, h, 2);
    p5.noStroke();
    p5.fill(fillColor);
    p5.rect(x + 1, by + 1, (w - 2) * (points / 100), h - 2);
    p5.pop();
  }
}
