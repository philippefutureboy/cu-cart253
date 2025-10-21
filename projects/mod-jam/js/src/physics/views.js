export class PhysicsObjectView {
  _drawDebugInfo(p5, x, y, model) {
    let lines = [
      `pos: (${p5.round(x)}, ${p5.round(y)})`,
      `v⃗: (${p5.round(model.xVelocity, 3)}, ${p5.round(model.yVelocity, 3)})`,
      `Θ: ${p5.round(model.angle, 3)}`,
      `ω: ${p5.round(model.angularVelocity, 3)}`,
    ];
    p5.push();
    p5.fill("white");
    p5.noStroke();
    p5.textSize(10);
    p5.textAlign(p5.LEFT, p5.TOP);
    const topY = y - (lines.length / 2) * 12;
    for (let [i, line] of lines.entries()) {
      p5.text(line, x, topY + i * 12);
    }
    p5.pop();
  }
}
