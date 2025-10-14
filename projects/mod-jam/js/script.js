// --- CLASS DECLARATIONS --------------------------------------------------------------------------

class GameController {
  constructor() {
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
  }

  draw() {
    push();
    fill("white");
    textAlign(LEFT, TOP);
    text("Controller:", 5, 5);
    text(`  up: ${this.up}`, 5, 20);
    text(`  down: ${this.down}`, 5, 35);
    text(`  left: ${this.left}`, 5, 50);
    text(`  right: ${this.right}`, 5, 65);
    pop();
  }
}

class MouseCursor {
  draw() {
    const onCanvas =
      mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;

    if (onCanvas) {
      push();
      fill("white");
      textAlign(LEFT, BOTTOM);
      text(` (${Math.floor(mouseX)}, ${Math.floor(mouseY)})`, mouseX, mouseY);
      pop();
    }
  }
}

/**
 * View (MVC pattern) for the Frog
 */
class FrogView {
  draw(fx, fy, tx, ty, angle = 0) {
    push();
    translate(fx, fy);
    rotate(angle);

    // frog helmet lens
    fill(color(255, 255, 255, 40));
    ellipse(0, 0, 50, 50);

    // frog head
    fill("#0f0");
    ellipse(0, 5, 40, 40);

    // left eye
    fill("#fff");
    ellipse(-12, -8, 10, 10);
    fill("black");
    ellipse(-12, -10, 3, 3);

    // right eye
    fill("#fff");
    ellipse(12, -8, 10, 10);
    fill("black");
    ellipse(12, -10, 3, 3);

    // helmet glass top contour
    push();
    stroke("white");
    noFill();
    arc(0, -8, 44, 35, PI, 2 * PI);
    ellipse(0, 0, 50, 50);
    pop();

    // helmet occlusion
    push();
    fill("#F5F7FB");
    beginShape();
    vectorArc(0, -8, 45, 35, 0, PI);
    stroke("white");
    vectorArc(0, 0, 50, 50, PI + PI / 8, -PI / 8);
    endShape(CLOSE);
    pop();

    // helmet glass bottom contour
    push();
    stroke("black");
    noFill();
    arc(0, -8, 44, 35, 0, PI);
    pop();

    // body
    push();
    fill("#F5F7FB");
    beginShape();
    stroke("black");
    vectorArc(0, 30, 60, 60, -PI / 4 + 0.12, (10 / 8) * PI - 0.12);
    vectorArc(0, 1.5, 50, 50, PI + PI / 8 - 0.95, -PI / 8 + 0.95);
    endShape(CLOSE);
    pop();

    translate(-fx, -fy);
    pop();
  }
}

/**
 * Model (MVC pattern) for the Frog
 */
class FrogModel {
  constructor(x, y, angle = 0) {
    this.x = x;
    this.y = y;
    this.angle = angle;
  }
}

/**
 * Controller (MVC pattern) for the Frog
 */
class Frog {
  constructor(x, y, angle = 0) {
    this.model = new FrogModel(x, y, angle);
    this.view = new FrogView();
  }

  draw() {
    const { x, y, angle } = this.model;
    this.view.draw(x, y, angle);
  }
}

// --- GLOBAL VARIABLES ----------------------------------------------------------------------------

const gameController = new GameController();
const mouseCursor = new MouseCursor();
const frog = new Frog(300, 300);

// --- P5.js RUNTIME -------------------------------------------------------------------------------

function setup() {
  createCanvas(600, 600);
}

function draw() {
  background(0);
  frog.draw();
  gameController.draw();
  mouseCursor.draw();
}

function keyPressed() {
  if (key.startsWith("Arrow")) {
    const direction = key.substring(5).toLowerCase();
    gameController[direction] = true;
  }
}

function keyReleased() {
  if (key.startsWith("Arrow")) {
    const direction = key.substring(5).toLowerCase();
    gameController[direction] = false;
  }
}

// --- HELPER FUNCTIONS ----------------------------------------------------------------------------

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
function vectorArc(cx, cy, dx, dy, a1, a2) {
  const clockwise = a1 <= a2;
  const rx = dx / 2,
    ry = dy / 2;
  for (
    let a = a1;
    clockwise ? a <= a2 : a >= a2;
    a += clockwise ? 0.01 : -0.01
  ) {
    let px = cx + cos(a) * rx;
    let py = cy + sin(a) * ry;
    vertex(px, py);
  }
}
