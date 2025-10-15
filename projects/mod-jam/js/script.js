"use strict";

// --- DEBUG VARIABLES -----------------------------------------------------------------------------

/**
 * debug mode
 * 0 = no debug
 * 1 = show debugger
 * 2 = move into physics debug mode
 *
 * using a var statement to keep the variable hoisted up
 */
var DEBUG_MODE = 0;
/**
 * frame mode
 * 0 = frame by frame; press 'n' for next frame
 * 1 = 1 frame per second;
 * 2 = 60 frames per second (default);
 */
var FRAME_MODE = 2;
const FRAME_MODE_RATES = [0, 1, 60];

// --- CLASS DECLARATIONS --------------------------------------------------------------------------

class DebuggerView {
  constructor(input) {
    this.input = input;
  }

  draw() {
    const { up, down, left, right, space, clickAt } = this.input;

    // draw crosshair at last clicked position
    if (input && clickAt !== null) {
      push();
      stroke("blue");
      strokeWeight(1);
      line(clickAt[0], 0, clickAt[0], height);
      line(0, clickAt[1], width, clickAt[1]);
      pop();
    }
    // draw info
    let lines = [
      "Stats:",
      `  debugMode: ${DEBUG_MODE}`,
      `  frameMode: ${FRAME_MODE}`,
      `  frameModeRate: ${FRAME_MODE_RATES[FRAME_MODE]}`,
      `  frameCount: ${frameCount}`,
      `  time: ${Math.floor(millis() / 1000)} s`,
      `  size: (${width}, ${height})`,
      "",
      "Inputs:",
      `  up: ${up}`,
      `  down: ${down}`,
      `  left: ${left}`,
      `  right: ${right}`,
      `  space: ${space}`,
      `  mouse: (${Math.floor(mouseX)}, ${Math.floor(mouseY)})`,
      clickAt !== null
        ? `  click: (${Math.floor(clickAt[0])}, ${Math.floor(clickAt[1])})`
        : "  click:",
    ];
    push();
    fill("white");
    textSize(11);
    textAlign(LEFT, TOP);
    for (let [i, line] of lines.entries()) {
      text(line, 5, 5 + i * 14);
    }
    pop();

    // draw cursor position next to it
    const onCanvas =
      mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;

    if (onCanvas) {
      push();
      fill("white");
      textSize(11);
      textAlign(LEFT, BOTTOM);
      text(` (${Math.floor(mouseX)}, ${Math.floor(mouseY)})`, mouseX, mouseY);
      pop();
    }
  }
}

class PhysicsObjectModel {
  constructor({
    x = 0,
    y = 0,
    xVelocity = 0,
    yVelocity = 0,
    angle = 0,
    angularVelocity = 0,
    mass = 0,
  } = {}) {
    // mass
    this.mass = mass ?? 0;
    // position
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.a = angle ?? 0;
    // velocity
    this.xv = xVelocity ?? 0;
    this.yv = yVelocity ?? 0;
    this.av = angularVelocity ?? 0;
  }

  get angle() {
    return this.a;
  }
  set angle(value) {
    this.a = value;
  }
  get xVelocity() {
    return this.xv;
  }
  set xVelocity(value) {
    this.xv = value;
  }
  get yVelocity() {
    return this.yv;
  }
  set yVelocity(value) {
    this.yv = value;
  }
  get angularVelocity() {
    return this.av;
  }
  set angularVelocity(value) {
    this.av = value;
  }
}

class PhysicsObjectView {
  _drawDebugInfo(x, y, model) {
    let lines = [
      `pos: (${round(x)}, ${round(y)})`,
      `v⃗: (${round(model.xVelocity, 3)}, ${round(model.yVelocity, 3)})`,
      `Θ: ${round(model.angle, 3)}`,
      `ω: ${round(model.angularVelocity, 3)}`,
    ];
    push();
    fill("white");
    textSize(10);
    textAlign(LEFT, TOP);
    const topY = y - (lines.length / 2) * 12;
    for (let [i, line] of lines.entries()) {
      text(line, x, topY + i * 12);
    }
    pop();
  }
}

/**
 * View (MVC pattern) for the Frog
 */
class FrogBodyView extends PhysicsObjectView {
  draw(model) {
    const { x, y, angle } = model;

    if (DEBUG_MODE === 2) {
      push();
      fill("#0f0");
      ellipse(x, y, 50, 50);
      stroke("black");
      strokeWeight(1);
      line(x, y, x + 25 * cos(angle), y + 25 * sin(angle));
      this._drawDebugInfo(x + 30, y, model);
    } else {
      push();
      translate(x, y);
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

      translate(-x, -y);
      pop();
    }
  }
}

/**
 * Model (MVC pattern) for the Frog
 */
class FrogBodyModel extends PhysicsObjectModel {}

/**
 * Controller (MVC pattern) for the Frog
 */
class Frog {
  constructor(x, y, angle = 0) {
    this.body = {
      model: new FrogBodyModel({ x, y, angle }),
      view: new FrogBodyView(),
    };
  }

  update(input) {
    if (input.up) this.body.model.yVelocity -= 0.04;
    if (input.down) this.body.model.yVelocity += 0.04;
    if (input.left) this.body.model.angularVelocity -= 0.0001;
    if (input.right) this.body.model.angularVelocity += 0.0001;

    this.body.model.y = this.body.model.y + this.body.model.yVelocity;
    this.body.model.angle =
      this.body.model.angle + this.body.model.angularVelocity * 2 * PI;
  }

  draw() {
    this.body.view.draw(this.body.model);
  }
}

// --- RUNTIME VARIABLES ---------------------------------------------------------------------------

const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  space: false,
  clickAt: null,
};
const debuggerView = new DebuggerView(input);
const frog = new Frog(300, 300);

// --- P5.js RUNTIME -------------------------------------------------------------------------------

function setup() {
  createCanvas(600, 600);
}

function draw() {
  // always reset frameRate to allow for step-by-step frame walk
  frameRate(FRAME_MODE_RATES[FRAME_MODE]);
  background(0);
  frog.update(input);
  frog.draw();
  if (DEBUG_MODE) {
    debuggerView.draw();
  }
}

function keyPressed() {
  if (key.startsWith("Arrow")) {
    const direction = key.substring(5).toLowerCase();
    input[direction] = true;
    return;
  }
  switch (key) {
    case " ":
      input.space = true;
      break;
    case "d":
      DEBUG_MODE = (DEBUG_MODE + 1) % 3;
      // resets frameMode to default if debugMode is off
      if (DEBUG_MODE === 0) {
        FRAME_MODE = 2;
        frameRate(FRAME_MODE_RATES[FRAME_MODE]);
      }
      break;
    case "n":
      // force refresh if in frameMode === 0
      if (FRAME_MODE === 0) frameRate(60);
      break;
    case "f":
      // enable frameMode only in debugMode is on
      if (!DEBUG_MODE === 0) break;
      FRAME_MODE = (FRAME_MODE + 1) % 3;
      // force refresh if previously in frameMode === 0
      // otherwise p5 won't start rendering again
      if (FRAME_MODE === 1) frameRate(FRAME_MODE_RATES[FRAME_MODE]);
      break;
    case " ":
      input.space = true;
      break;
    default:
      break;
  }
}

function keyReleased() {
  if (key.startsWith("Arrow")) {
    const direction = key.substring(5).toLowerCase();
    input[direction] = false;
  } else if (key === " ") {
    input.space = false;
  }
}

function mouseClicked(event) {
  const onCanvas =
    mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
  // left click
  if (event.button === 0) {
    if (onCanvas) input.clickAt = [mouseX, mouseY];
    else input.clickAt = null;
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
