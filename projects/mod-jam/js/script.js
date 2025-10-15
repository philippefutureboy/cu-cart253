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
var DEBUG_MESSAGE_INDEX = 0;
var DEBUG_ALL_MESSAGES = null;

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

/**
 * NASASpeechSynthesizer
 *
 * Exposes a processed voice that gives a retro/NASA-ground-control feeling.
 * Uses the browser's text to speech API to play some text utterance to the user.
 *
 * This code and the conceptualisation was authored by ChatGPT-5 (OpenAI), and then integrated
 * by Philippe Hebert.
 * Full conversation available at ./docs/ATTRIBUTION/chatgpt-log-speech-2025-10-14.html
 *
 */
class NASASpeechSynthesizer {
  constructor() {
    this._initializeVoiceProcessing();
    this.defaultVoice = this.pickRetroVoice();
  }

  _initializeVoiceProcessing() {
    const ctx = new AudioContext();

    // Speech output destination via Web Audio
    const dest = ctx.createMediaStreamDestination();
    const audio = new Audio();
    audio.srcObject = dest.stream;
    audio.play();

    // Simple "radio" EQ
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200; // NASA-radio mid tone
    filter.Q.value = 0.7;
    filter.connect(ctx.destination);

    // Connect stream to filter
    const source = ctx.createMediaStreamSource(dest.stream);
    source.connect(filter);
  }

  pickRetroVoice() {
    const voices = this.getVoices();

    // Try macOS “Fred”
    let voice = voices.find((v) => /Fred/i.test(v.name));

    // Otherwise pick the most robotic or male Google/Microsoft voice
    if (!voice)
      voice = voices.find((v) =>
        /Google UK English Male|Microsoft David/i.test(v.name)
      );

    // Fallback to default
    return voice || voices.find((v) => v.default) || voices[0];
  }

  getVoices() {
    return window.speechSynthesis.getVoices();
  }

  speak(text, { pitch = 0.9, rate = 0.9, volume = 1, voice = null } = {}) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice ?? this.defaultVoice;
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;
    window.speechSynthesis.speak(utterance);
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
  constructor({ x, y, angle = 0 } = {}) {
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

class FlyCounter {
  easterEggTexts = [
    ["A space fly", { pitch: 0.9, rate: 0.9, volume: 1.0 }],
    ["Did you see that?!", { pitch: 1.1, rate: 1.0, volume: 1.0 }],
    ["Another fly bites the dust!", { pitch: 0.9, rate: 1.0, volume: 1.0 }],
    ["RIP that fly.", { pitch: 0.9, rate: 0.8, volume: 1.0 }],
    ["That's not gonna fly", { pitch: 0.9, rate: 1.1, volume: 1.0 }],
    ["Ground Control to Major Tom!", { pitch: 1.4, rate: 0.8, volume: 1.0 }],
  ];

  constructor({ count = 0, synthesizer = null, easterEggTexts = null } = {}) {
    this.count = 0;
    this.synthesizer = synthesizer;
    this.easterEggTexts = easterEggTexts ?? this.easterEggTexts;
    this.easterEggIndex = 0;
    this.lastEasterEgg = null;
  }

  increment() {
    this.count += 1;
    // Little UX sugar, we add a little voiceover when a fly is caught
    if (this.synthesizer) {
      let msgConfig;
      // We have a few easter eggs, but gotta hide them amongst the usual counting
      // voiceovers
      if (
        this.count - (this.lastEasterEgg ?? 0) > 4 &&
        this.easterEggIndex < this.easterEggTexts.length &&
        Math.random() > 0.4
      ) {
        msgConfig = this.easterEggTexts[this.easterEggIndex];
        this.easterEggIndex += 1;
        this.lastEasterEgg = this.count;
        // Counts the number of flies caught verbally, uttered with default config
      } else {
        msgConfig = [`${this.count} ${this.count === 1 ? "fly" : "flies"}.`];
      }
      this.synthesizer.speak(...msgConfig);
    }
  }

  draw(x, y) {
    push();
    fill("white");
    textAlign(CENTER, CENTER);
    text("Flies", x + 10, y);
    textSize(20);
    textAlign(CENTER, BOTTOM);
    text(`${this.count}`, x + 10, y + 30);
    pop();
  }
}

class HungerBar {
  constructor({ points = 100, hungerHz = 3 } = {}) {
    this.points = points;
    this.hungerHz = hungerHz;
    this.lastHungerCheck = null;
  }

  update(points = 0) {
    let result = this.points;
    const ms = millis();

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

    this.points = constrain(result, 0, 100);
  }

  draw(x, y, w, h) {
    push();
    fill("white");
    textAlign(CENTER, CENTER);
    text("Energy", x + w / 2, y);
    pop();

    const by = y + 12;
    const { points } = this;
    let fillColor;
    if (points >= 90) fillColor = "#0f0";
    else if (points >= 70) fillColor = "#cf0";
    else if (points >= 50) fillColor = "#ff0";
    else if (points >= 30) fillColor = "#ffa500";
    else if (points >= 15) fillColor = "#f00";
    else fillColor = "#950606";

    push();
    stroke("white");
    strokeWeight(1.7);
    noFill();
    rect(x, by, w, h, 2);
    noStroke();
    fill(fillColor);
    rect(x + 1, by + 1, (w - 2) * (points / 100), h - 2);
    pop();
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
let hasFly = false;
let debuggerView;
let speechSynthesizer;
let flyCounter;
let hungerBar;
let frog;

// --- P5.js RUNTIME -------------------------------------------------------------------------------

function setup() {
  // FIXME: CANVAS AUTO RESIZE
  createCanvas(window.innerWidth, window.innerHeight);
  debuggerView = new DebuggerView(input);
  speechSynthesizer = new NASASpeechSynthesizer();
  flyCounter = new FlyCounter({ synthesizer: speechSynthesizer });
  hungerBar = new HungerBar();
  frog = new Frog({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
}

function draw() {
  // always reset frameRate to allow for step-by-step frame walk
  frameRate(FRAME_MODE_RATES[FRAME_MODE]);
  background(0);

  // updates
  frog.update(input);
  if (hasFly) {
    flyCounter.increment();
    hungerBar.update(10);
    hasFly = false;
  } else {
    hungerBar.update(0);
  }

  // draw
  frog.draw();
  flyCounter.draw(width - 30, 16);
  hungerBar.draw(width - 150, 16, 100, 12);
  if (DEBUG_MODE) {
    debuggerView.draw();
  }
}

function keyPressed() {
  // handle controls
  if (key.startsWith("Arrow")) {
    const direction = key.substring(5).toLowerCase();
    input[direction] = true;
    return;
  }
  if (key === " ") {
    input.space = true;
    return;
  }
  // handle debug controls
  switch (key) {
    // DEBUG_MODE toggler
    case "1":
      DEBUG_MODE = (DEBUG_MODE + 1) % 3;
      // resets FRAME_MODE to default if DEBUG_MODE is off
      if (DEBUG_MODE === 0) {
        FRAME_MODE = 2;
        frameRate(FRAME_MODE_RATES[FRAME_MODE]);
      }
      break;
    // FRAME_MODE toggler
    case "2":
      // enable FRAME_MODE only if DEBUG_MODE is on
      if (!DEBUG_MODE === 0) break;
      FRAME_MODE = (FRAME_MODE + 1) % 3;
      // force refresh if previously if FRAME_MODE === 0
      // otherwise p5 won't start rendering again
      if (FRAME_MODE === 1) frameRate(FRAME_MODE_RATES[FRAME_MODE]);
      break;
    // Frame by frame stepper
    case "3":
      // enable stepping only if DEBUG_MODE is on
      if (DEBUG_MODE === 0) break;
      // force refresh if in FRAME_MODE === 0
      if (FRAME_MODE === 0) frameRate(60);
      break;
    // Fly counter increment
    case "4":
      // enable flyCounter increment only if DEBUG_MODE is on
      if (DEBUG_MODE === 0) break;
      hasFly = true;
      break;
    case "0":
      // speak all easter egg messages only if DEBUG_MODE is on
      if (DEBUG_MODE === 0) break;
      if (DEBUG_ALL_MESSAGES === null) {
        DEBUG_ALL_MESSAGES = [...flyCounter.easterEggTexts];
      }
      speechSynthesizer.speak(...DEBUG_ALL_MESSAGES[DEBUG_MESSAGE_INDEX]);
      DEBUG_MESSAGE_INDEX =
        (DEBUG_MESSAGE_INDEX + 1) % DEBUG_ALL_MESSAGES.length;
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
