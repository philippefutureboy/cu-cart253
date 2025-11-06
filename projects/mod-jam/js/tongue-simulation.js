/**
 * PBD Frog Tongue — Virtual Launch Target + Alignment Motor (no click)
 * - On launch, aim along mouth's instantaneous angle (θ) toward a virtual max-length target
 * - Alignment motor pulls chain along that ray during expansion (stops on attach/retract)
 * - Weighted mouth (optional anchor), angular clamp & friction, ω controls
 *
 * Controls:
 *  Space: Launch -> Space: Retract
 *  Z / X: decrease / increase ω (rad/frame)
 *  A: toggle mouth anchor on/off (free-float when off)
 *  B: toggle bone debug
 *
 * Entirely generated using ChatGPT 5.0 Thinking.
 * Full conversation available at docs/ATTRIBUTION/PBD-rope-frog-tongue-2025-11-06.html
 */

let rope;
let fly;
let debugBones = false;

const OMEGA_STEP = 0.005; // rad/frame per tap
const OMEGA_HARD_LIMIT = 0.25; // safety limit for ω

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  noStroke();

  const mouthStart = createVector(width * 0.35, height * 0.65);

  rope = new Rope({
    // Dense rope as per your tuning
    numPoints: 60,
    restSegLen: 2,

    iterations: 8,
    substeps: 2,

    // Rope “material”
    stretchStiffness: 0.9,
    bendStiffness: 0.25,

    // Deep space with a bit of damping
    gravity: createVector(0, 0),
    airDrag: 0.1,

    // Length driver
    maxScale: 3.2,
    extendSpeed: 0.14,
    retractSpeed: 0.035,
    epsilonScale: 0.02,
    minShootScale: 0.2,

    // Alignment motor (re-enabled)
    alignK: 0.3,
    alignFade: 0.86,
    alignWhileSpinningFactor: 0.5,

    // Angular coupling
    mouthOmega: 0.02,
    spinAdvection: 1.0,
    spinImpulseGain: 0.05, // tiny; set 0 if you want strict advection
    spinFalloff: 0.6,
    spinVelClamp: 0.25,

    // Stretch soft cap
    maxExtraStretchPerBone: 5,

    // Anti-overspin
    omegaMaxFactor: 1.2,
    angularFriction: 0.18,

    // Mouth mass & optional anchor
    mouthMass: 8.0,
    useAnchor: true, // toggle with A
    mouthAnchor: mouthStart.copy(),
    mouthAnchorK: 0.25,
    mouthAnchorC: 0.65,
  });

  rope.initializeMouthAndChain(mouthStart);

  fly = new Fly({
    pos: createVector(width * 0.7, height * 0.35),
    radius: 12,
  });
}

function draw() {
  background(260, 30, 8, 100);

  rope.drive(); // scale & retract logic
  rope.simulate();

  handleFlyCatch();
  drawScene();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  const newAnchor = createVector(width * 0.35, height * 0.65);
  rope.setMouthAnchor(newAnchor);
}

function keyPressed() {
  if (key === " ") {
    if (!rope.shooting && !rope.retracting) {
      rope.unpinTip();
      fly.sticky = false;
      rope.shootFromMouthAngleWithVirtualTarget(); // ← NEW
    } else if (rope.shooting) {
      rope.startRetract();
    }
  } else if (key === "B" || key === "b") {
    debugBones = !debugBones;
  } else if (key === "x" || key === "X") {
    rope.mouthOmega = constrain(
      rope.mouthOmega + OMEGA_STEP,
      -OMEGA_HARD_LIMIT,
      OMEGA_HARD_LIMIT
    );
  } else if (key === "z" || key === "Z") {
    rope.mouthOmega = constrain(
      rope.mouthOmega - OMEGA_STEP,
      -OMEGA_HARD_LIMIT,
      OMEGA_HARD_LIMIT
    );
  } else if (key === "a" || key === "A") {
    rope.useAnchor = !rope.useAnchor;
  }
}

// --------------------- Fly ---------------------
class Fly {
  constructor({ pos, radius }) {
    this.p = pos.copy();
    this.v = createVector(0, 0);
    this.r = radius;
    this.sticky = false;
  }
  simulate() {
    if (!this.sticky) {
      this.p.add(this.v);
      // elastic bounds
      if (this.p.x < this.r) {
        this.p.x = this.r;
        this.v.x *= -1;
      } else if (this.p.x > width - this.r) {
        this.p.x = width - this.r;
        this.v.x *= -1;
      }
      if (this.p.y < this.r) {
        this.p.y = this.r;
        this.v.y *= -1;
      } else if (this.p.y > height - this.r) {
        this.p.y = height - this.r;
        this.v.y *= -1;
      }
    }
  }
  draw() {
    push();
    noStroke();
    fill(200, 80, this.sticky ? 40 : 70);
    circle(this.p.x, this.p.y, this.r * 2);
    pop();
  }
}

// --------------------- Rope (PBD) ---------------------
class Rope {
  constructor(opts) {
    Object.assign(this, opts);

    this.x = [];
    this.xPrev = [];
    this.invMass = [];

    for (let i = 0; i < this.numPoints; i++) {
      this.x.push(createVector(0, 0));
      this.xPrev.push(createVector(0, 0));
      this.invMass.push(1);
    }

    this.scale = 0.0;
    this.shooting = false;
    this.retracting = false;

    // Alignment state
    this.aimDir = createVector(0, -1); // set on launch and held during expansion
    this._alignGain = 0;

    // Virtual "max length" target direction captured at launch (for HUD/debug if needed)
    this.virtualTargetDir = createVector(0, -1);

    this.tipAttached = false;
    this.stickFrames = 0;
    this.maxStickFrames = 30;

    this._theta = 0; // mouth spin phase
  }

  initializeMouthAndChain(mouthStart) {
    this.invMass[0] =
      this.mouthMass && this.mouthMass > 0 ? 1 / this.mouthMass : 0;

    this.x[0].set(mouthStart);
    this.xPrev[0].set(mouthStart);

    for (let i = 1; i < this.numPoints; i++) {
      const p = p5.Vector.add(
        mouthStart,
        createVector(0, -i * this.restSegLen)
      );
      this.x[i].set(p);
      this.xPrev[i].set(p);
      this.invMass[i] = 1;
    }

    if (!this.mouthAnchor) this.mouthAnchor = mouthStart.copy();
  }

  get mouthPos() {
    return this.x[0];
  }
  get tipIdx() {
    return this.numPoints - 1;
  }
  tipPos() {
    return this.x[this.tipIdx].copy();
  }

  setMouthAnchor(v) {
    this.mouthAnchor.set(v);
    if (this.scale <= this.epsilonScale && this.useAnchor) {
      this.x[0].set(v);
      this.xPrev[0].set(v);
    }
  }

  // NEW: Launch using current mouth angle; set alignment toward virtual max-length ray
  shootFromMouthAngleWithVirtualTarget() {
    this.tipAttached = false;
    this.scale = max(this.scale, this.minShootScale);

    // Direction from current spin phase
    const theta = this._theta;
    const dir = createVector(Math.cos(theta), Math.sin(theta)).normalize();
    this.aimDir = dir.copy();
    this.virtualTargetDir = dir.copy(); // for reference; motor uses aimDir

    // Lay out initial pose along this direction (seed pose)
    this.rebuildAlongAim(true);

    // Enable alignment motor (it will use aimDir and current segRest)
    this._alignGain = this.alignK;
    this.shooting = true;
    this.retracting = false;
    this.stickFrames = 0;
  }

  startRetract() {
    this.retracting = true;
    this.shooting = false;
  }

  rebuildAlongAim(zeroVel = false) {
    const segRest = this.restSegLen * this.scale;
    for (let i = 1; i < this.numPoints; i++) {
      const goal = p5.Vector.add(
        this.mouthPos,
        p5.Vector.mult(this.aimDir, segRest * i)
      );
      this.x[i].set(goal);
    }
    if (zeroVel)
      for (let i = 0; i < this.numPoints; i++) this.xPrev[i].set(this.x[i]);
  }

  collapseToMouth() {
    const m = this.mouthPos;
    for (let i = 0; i < this.numPoints; i++) {
      this.x[i].set(m.x, m.y);
      this.xPrev[i].set(m.x, m.y);
    }
    this.scale = 0.0;
    this._alignGain = 0.0;
    this.tipAttached = false;
  }

  // No mouse target; just extend/retract & alignment gain fading
  drive() {
    const spinning = Math.abs(this.mouthOmega) > 1e-6;
    const spinFactor = spinning ? this.alignWhileSpinningFactor : 1.0;

    if (this.shooting) {
      this.scale = min(this.scale + this.extendSpeed, this.maxScale);
      this._alignGain *= this.alignFade;
      this._alignGain = min(this._alignGain, this.alignK * spinFactor);
    } else if (this.retracting) {
      this.scale = max(this.scale - this.retractSpeed, 0.0);
      if (this.scale <= this.epsilonScale) {
        this.collapseToMouth();
        this.retracting = false;
      }
      this._alignGain *= this.alignFade;
      this._alignGain = min(this._alignGain, this.alignK * spinFactor);
    } else {
      if (this.scale <= this.epsilonScale) this.collapseToMouth();
      this._alignGain *= this.alignFade;
    }

    if (this.tipAttached) {
      this.stickFrames++;
      if (this.stickFrames > this.maxStickFrames && !this.retracting)
        this.startRetract();
    }
  }

  simulate() {
    for (let s = 0; s < this.substeps; s++) {
      this.integrate();
      this.applyMouthRotationAndSwirl();
      this.applyAngularFrictionAndClamp();
      this.solveConstraints();
    }
    this._theta += this.mouthOmega;
  }

  integrate() {
    const drag = 1 - this.airDrag;

    for (let i = 0; i < this.numPoints; i++) {
      if (this.invMass[i] === 0) continue;

      const p = this.x[i];
      const prev = this.xPrev[i];

      // Current velocity
      let vx = p.x - prev.x;
      let vy = p.y - prev.y;

      // Acceleration
      let ax = this.gravity.x;
      let ay = this.gravity.y;

      // Mouth-only: optional damped anchor spring
      if (i === 0 && this.useAnchor) {
        const dx = p.x - this.mouthAnchor.x;
        const dy = p.y - this.mouthAnchor.y;

        let Fx = -this.mouthAnchorK * dx - this.mouthAnchorC * vx;
        let Fy = -this.mouthAnchorK * dy - this.mouthAnchorC * vy;

        const invm = this.invMass[0];
        ax += Fx * invm;
        ay += Fy * invm;
      }

      // Verlet step (dt=1)
      this.xPrev[i].set(p.x, p.y);
      p.x += vx * drag + ax;
      p.y += vy * drag + ay;
    }
  }

  // Rotate around current mouth; tiny swirl impulse
  applyMouthRotationAndSwirl() {
    if (!(this.shooting || this.retracting)) return;
    if (this.scale <= this.epsilonScale) return;

    const sub = this.substeps;
    const cx = this.mouthPos.x,
      cy = this.mouthPos.y;

    // 1) Kinematic advection
    const dtheta = (this.mouthOmega * this.spinAdvection) / sub;
    const c = Math.cos(dtheta),
      s = Math.sin(dtheta);
    for (let i = 1; i < this.numPoints; i++) {
      let px = this.x[i].x - cx,
        py = this.x[i].y - cy;
      this.x[i].x = cx + (c * px - s * py);
      this.x[i].y = cy + (s * px + c * py);

      let qx = this.xPrev[i].x - cx,
        qy = this.xPrev[i].y - cy;
      this.xPrev[i].x = cx + (c * qx - s * qy);
      this.xPrev[i].y = cy + (s * qx + c * qy);
    }

    // 2) Tiny swirl impulse
    if (Math.abs(dtheta) < 1e-8) return;
    const gain = this.spinImpulseGain / sub;
    if (gain <= 0) return;

    const vmax = this.spinVelClamp;
    const n = this.numPoints - 1;

    for (let i = 1; i < this.numPoints; i++) {
      const p = this.x[i];
      const rx = p.x - cx,
        ry = p.y - cy;

      let dvx = -dtheta * ry * gain;
      let dvy = dtheta * rx * gain;

      if (this.spinFalloff > 0) {
        const t = i / n;
        const w = Math.max(0, 1 - this.spinFalloff * t);
        dvx *= w;
        dvy *= w;
      }
      const mag = Math.hypot(dvx, dvy);
      if (mag > vmax) {
        const k = vmax / (mag + 1e-9);
        dvx *= k;
        dvy *= k;
      }

      this.xPrev[i].x -= dvx;
      this.xPrev[i].y -= dvy;
    }
  }

  // Clamp angular speed per point and apply angular friction
  applyAngularFrictionAndClamp() {
    const k = this.omegaMaxFactor ?? 1.2;
    const omegaMax = k * Math.abs(this.mouthOmega);
    const angFric = this.angularFriction ?? 0.15;

    const cx = this.mouthPos.x,
      cy = this.mouthPos.y;

    for (let i = 1; i < this.numPoints; i++) {
      const p = this.x[i];
      const prev = this.xPrev[i];

      let vx = p.x - prev.x;
      let vy = p.y - prev.y;

      const rx = p.x - cx,
        ry = p.y - cy;
      const r = Math.hypot(rx, ry);
      if (r < 1e-6) {
        vx *= 1 - angFric;
        vy *= 1 - angFric;
        this.xPrev[i].set(p.x - vx, p.y - vy);
        continue;
      }

      const invr = 1 / r;
      const rxu = rx * invr,
        ryu = ry * invr;
      const tx = -ry * invr,
        ty = rx * invr;

      const vr = vx * rxu + vy * ryu;
      const vt = vx * tx + vy * ty;

      let vtNew = vt * (1 - angFric);
      const vtMax = omegaMax * r;
      if (Math.abs(vtNew) > vtMax) vtNew = Math.sign(vtNew) * vtMax;

      const vxNew = vr * rxu + vtNew * tx;
      const vyNew = vr * ryu + vtNew * ty;

      this.xPrev[i].set(p.x - vxNew, p.y - vyNew);
    }
  }

  solveConstraints() {
    const iters = this.iterations;
    const segRest = this.restSegLen * this.scale;
    const maxExtra = this.maxExtraStretchPerBone;

    for (let k = 0; k < iters; k++) {
      // 1) stretch toward rest
      if (segRest > 0) {
        for (let i = 0; i < this.numPoints - 1; i++) {
          this.enforceDistance(i, i + 1, segRest, this.stretchStiffness);
        }
      }

      // 2) soft cap beyond rest
      if (segRest >= 0) {
        for (let i = 0; i < this.numPoints - 1; i++) {
          this.enforceMaxStretchRestPlus(i, i + 1, segRest, maxExtra, 1.0);
        }
      }

      // 3) bend (second neighbors)
      if (segRest > 0) {
        const bendRest = 2 * segRest;
        for (let i = 0; i < this.numPoints - 2; i++) {
          this.enforceDistance(i, i + 2, bendRest, this.bendStiffness);
        }
      }

      // 4) ALIGNMENT MOTOR during expansion, aiming along the launch ray
      //    For each point i, the goal is mouthPos + aimDir * (i * segRest)
      if (this.shooting && !this.tipAttached && segRest > 0) {
        let g = this._alignGain;
        if (Math.abs(this.mouthOmega) > 1e-6) {
          g = min(g, this.alignK * this.alignWhileSpinningFactor);
        }
        if (g > 1e-4) {
          for (let i = 1; i < this.numPoints; i++) {
            if (this.invMass[i] === 0) continue;
            const goalX = this.mouthPos.x + this.aimDir.x * segRest * i;
            const goalY = this.mouthPos.y + this.aimDir.y * segRest * i;
            this.x[i].x += (goalX - this.x[i].x) * g;
            this.x[i].y += (goalY - this.x[i].y) * g;
          }
        }
      }

      // 5) tiny pull on tip during retract for crispness
      if (this.retracting && this.tipAttached && segRest > 0) {
        const t = this.tipIdx;
        const pull = 0.08;
        const dx = this.mouthPos.x - this.x[t].x;
        const dy = this.mouthPos.y - this.x[t].y;
        this.x[t].x += dx * pull;
        this.x[t].y += dy * pull;
      }
    }
  }

  enforceDistance(i, j, restLen, stiffness) {
    const xi = this.x[i],
      xj = this.x[j];
    const w1 = this.invMass[i],
      w2 = this.invMass[j];
    const wsum = w1 + w2;
    if (wsum === 0) return;

    const dx = xj.x - xi.x,
      dy = xj.y - xi.y;
    const d2 = dx * dx + dy * dy;
    if (d2 === 0) return;
    const d = Math.sqrt(d2);
    const diff = (d - restLen) / d;

    const corrX = stiffness * diff * dx;
    const corrY = stiffness * diff * dy;

    if (w1 > 0) {
      xi.x += corrX * (w1 / wsum);
      xi.y += corrY * (w1 / wsum);
    }
    if (w2 > 0) {
      xj.x -= corrX * (w2 / wsum);
      xj.y -= corrY * (w2 / wsum);
    }
  }

  enforceMaxStretchRestPlus(i, j, restLen, maxExtra, stiffness = 1.0) {
    const xi = this.x[i],
      xj = this.x[j];
    const w1 = this.invMass[i],
      w2 = this.invMass[j];
    const wsum = w1 + w2;
    if (wsum === 0) return;

    const dx = xj.x - xi.x,
      dy = xj.y - xi.y;
    const d2 = dx * dx + dy * dy;
    if (d2 === 0) return;
    const d = Math.sqrt(d2);

    const maxLen = restLen + maxExtra;
    if (d <= maxLen) return;

    const excess = (d - maxLen) / d;
    const corrX = stiffness * excess * dx;
    const corrY = stiffness * excess * dy;

    if (w1 > 0) {
      xi.x += corrX * (w1 / wsum);
      xi.y += corrY * (w1 / wsum);
    }
    if (w2 > 0) {
      xj.x -= corrX * (w2 / wsum);
      xj.y -= corrY * (w2 / wsum);
    }
  }

  pinTipTo() {
    this.tipAttached = true;
    const t = this.tipIdx;
    this.xPrev[t].set(this.x[t]);
  }
  unpinTip() {
    this.tipAttached = false;
  }
}

// --------------------- Catch logic ---------------------
function handleFlyCatch() {
  fly.simulate();

  const tip = rope.tipPos();

  if (fly.sticky && rope.tipAttached) {
    fly.p.set(tip);
    if (!rope.retracting && rope.scale <= rope.epsilonScale) {
      fly.sticky = false;
      rope.unpinTip();
    }
  } else {
    const d = p5.Vector.dist(tip, fly.p);
    if (
      d < fly.r + 10 &&
      !rope.tipAttached &&
      (rope.shooting || rope.retracting)
    ) {
      fly.sticky = true;
      rope.pinTipTo();
      rope.startRetract();
      rope.stickFrames = 0;
    }
  }
}

// --------------------- Scene / UI ---------------------
function drawScene() {
  // stars
  push();
  noStroke();
  for (let i = 0; i < 60; i++) {
    const x = (i * 73) % width,
      y = (i * 131) % height;
    fill(220, 10, 90, 70);
    circle(x, y, 1.5);
  }
  pop();

  drawRope();
  fly.draw();
  drawHUD();
}

function drawRope() {
  const w = 8;
  push();
  noStroke();

  for (let i = 0; i < rope.numPoints - 1; i++) {
    const a = rope.x[i],
      b = rope.x[i + 1];
    const t = i / (rope.numPoints - 1);
    const hue = lerp(350, 5, t);
    fill(hue, 80, 80, 95);

    const nx = b.y - a.y,
      ny = -(b.x - a.x);
    const nlen = Math.hypot(nx, ny) || 1;
    const ux = (nx / nlen) * w * 0.5,
      uy = (ny / nlen) * w * 0.5;

    quad(
      a.x - ux,
      a.y - uy,
      a.x + ux,
      a.y + uy,
      b.x + ux,
      b.y + uy,
      b.x - ux,
      b.y - uy
    );

    if (debugBones) {
      stroke(200, 0, 90);
      strokeWeight(1.5);
      line(a.x, a.y, b.x, b.y);
      noStroke();
    }
  }

  // tip
  const tip = rope.x[rope.tipIdx];
  fill(5, 90, 90);
  circle(tip.x, tip.y, 10);

  // mouth (movable) + spinner showing θ
  const m = rope.mouthPos;
  push();
  translate(m.x, m.y);
  if (rope.useAnchor) {
    stroke(40, 20, 90, 120);
    line(0, 0, rope.mouthAnchor.x - m.x, rope.mouthAnchor.y - m.y);
    noStroke();
  }
  fill(110, 60, 40);
  circle(0, 0, 16);
  const r = 10;
  fill(40, 20, 90);
  const theta = rope._theta % TWO_PI;
  circle(Math.cos(theta) * r, Math.sin(theta) * r, 3);
  pop();

  pop();
}

function drawHUD() {
  push();
  noStroke();
  fill(0, 0, 100, 90);
  rect(14, 14, 920, 196, 10);
  fill(230, 20, 20);
  textSize(13);
  textLeading(18);
  const state = rope.shooting
    ? "Expanding"
    : rope.retracting
    ? "Retracting"
    : "Idle";
  text(
    [
      "PBD Frog Tongue — virtual-target launch + alignment motor",
      "Space: Launch -> Space: Retract   Z/X: -/+ ω   A: Toggle Anchor   B: Debug",
      `State: ${state}`,
      `Segments: ${rope.numPoints - 1}  RestLen: ${
        rope.restSegLen
      }px  Scale: ${rope.scale.toFixed(2)}  Iter: ${rope.iterations}  Sub: ${
        rope.substeps
      }`,
      `ω (rad/frame): ${rope.mouthOmega.toFixed(3)}  adv:${
        rope.spinAdvection
      }  swirlGain:${rope.spinImpulseGain}  swirlClampΔv:${rope.spinVelClamp}`,
      `ω clamp factor: ${rope.omegaMaxFactor.toFixed(
        2
      )}  angular friction: ${rope.angularFriction.toFixed(
        2
      )}  airDrag: ${rope.airDrag.toFixed(2)}`,
      `Mouth mass: ${rope.mouthMass.toFixed(2)}  Anchor: ${
        rope.useAnchor ? "ON" : "OFF"
      }`,
    ].join("\n"),
    24,
    34
  );
  pop();
}
