/**
 * Vector-based arc, to work with complex shapes (beginShape, endShape).
 * Supports drawing points in clockwise/counter-clockwise order, to allow endShape to close
 * composite shapes made out vertices.
 *
 * Example:
 *   Drawing a crescent moon:
 *   ```
 *     push();
 *     fill("white");
 *     beginShape();
 *     stroke("black");
 *     // counter-clockwise, bottom curve
 *     vectorArc(0, 30, 60, 60, -PI / 4 + 0.12, (10 / 8) * PI - 0.12);
 *     // clockwise, top curve
 *     vectorArc(0, 1.5, 50, 50, PI + PI / 8 - 0.95, -PI / 8 + 0.95);
 *     // closes the shape
 *     endShape(CLOSE);
 *     pop();
 *   ```
 *
 * @param {number} cx x coordinate of center of arc
 * @param {number} cy y coordinate of center of arc
 * @param {number} dx x diameter of arc
 * @param {number} dy y diameter of arc
 * @param {number} a1 start angle
 * @param {number} a2 stop angle
 */
export function vectorArc(p5, cx, cy, dx, dy, a1, a2) {
  const clockwise = a1 <= a2;
  const rx = dx / 2,
    ry = dy / 2;
  for (
    let a = a1;
    clockwise ? a <= a2 : a >= a2;
    a += clockwise ? 0.01 : -0.01
  ) {
    let px = cx + p5.cos(a) * rx;
    let py = cy + p5.sin(a) * ry;
    p5.vertex(px, py);
  }
}
