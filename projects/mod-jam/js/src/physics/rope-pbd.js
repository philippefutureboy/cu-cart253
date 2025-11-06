/**
 * PBD Rope (framework-agnostic)
 * --------------------------------
 * Deterministic, fixed-step friendly PBD rope specialized for a “frog tongue”.
 * - Verlet-like kinematics with prev positions.
 * - Distance constraints (stretch & soft cap), light bend stabilization.
 * - Alignment motor during expansion toward captured launch direction.
 * - Spin advection from a rotating mouth with angular friction & clamp.
 * - Tip attach/pin & timed retract logic.
 *
 * Public API:
 *   new RopePBD(opts)
 *   initializeAt(mouthPos: {x,y})
 *   setMouthAnchor(v: {x,y})
 *   setLaunchFromAngle(theta: number)
 *   launch(), startRetract(), unpinTip()
 *   step(dt, mouthPos, mouthVel, mouthOmega)
 *   tip(): {x,y}, isIdle(): boolean
 *   attachTip(), detachTip()
 */

/** @typedef {{x:number,y:number}} Vec2 */
/** @typedef RopePBDOptions
 * @property {number} numPoints
 * @property {number} restSegLen
 * @property {number} iterations
 * @property {number} substeps
 * @property {number} stretchStiffness
 * @property {number} bendStiffness
 * @property {Vec2} gravity
 * @property {number} airDrag
 * @property {number} maxScale
 * @property {number} extendSpeed              // interpreted per-frame by default (legacy semantics)
 * @property {number} retractSpeed             // interpreted per-frame by default (legacy semantics)
 * @property {boolean} speedsArePerSecond      // if true, multiply speeds by dt
 * @property {number} epsilonScale
 * @property {number} minShootScale
 * @property {number} alignK
 * @property {number} alignFade
 * @property {number} alignWhileSpinningFactor
 * @property {number} spinAdvection
 * @property {number} spinImpulseGain
 * @property {number} spinFalloff
 * @property {number} spinVelClamp
 * @property {number} omegaMaxFactor
 * @property {number} angularFriction
 * @property {number} maxExtraStretchPerBone
 * @property {number} mouthMass
 * @property {boolean} useAnchor
 * @property {Vec2} mouthAnchor
 * @property {number} mouthAnchorK
 * @property {number} mouthAnchorC
 * @property {boolean} keepCollapsedLocked     // when idle+collapsed, hard-lock all points to mouth each step
 */

export default class RopePBD {
  /** @param {Partial<RopePBDOptions>} opts */
  constructor(opts = {}) {
    /** @type {RopePBDOptions} */
    const o = {
      numPoints: 60,
      restSegLen: 2,
      iterations: 8,
      substeps: 2,
      stretchStiffness: 0.9,
      bendStiffness: 0.25,
      gravity: { x: 0, y: 0 },
      airDrag: 0.1,
      maxScale: 3.2,
      extendSpeed: 0.14, // legacy: per frame
      retractSpeed: 0.035, // legacy: per frame
      speedsArePerSecond: false, // IMPORTANT: keep legacy behaviour by default
      epsilonScale: 0.02,
      minShootScale: 0.2,
      alignK: 0.3,
      alignFade: 0.86,
      alignWhileSpinningFactor: 0.5,
      spinAdvection: 1.0,
      spinImpulseGain: 0.05,
      spinFalloff: 0.6,
      spinVelClamp: 0.25,
      omegaMaxFactor: 1.2,
      angularFriction: 0.18,
      maxExtraStretchPerBone: 5,
      mouthMass: 8.0,
      useAnchor: true,
      mouthAnchor: { x: 0, y: 0 },
      mouthAnchorK: 0.25,
      mouthAnchorC: 0.65,
      keepCollapsedLocked: true,
      ...opts,
    };

    Object.assign(this, o);

    /** @type {Vec2[]} */ this.x = [];
    /** @type {Vec2[]} */ this.xPrev = [];
    /** @type {number[]} */ this.invMass = [];

    for (let i = 0; i < this.numPoints; i++) {
      this.x.push({ x: 0, y: 0 });
      this.xPrev.push({ x: 0, y: 0 });
      this.invMass.push(1);
    }

    this.scale = 0;
    this.shooting = false;
    this.retracting = false;

    // Alignment state
    this.aimDir = { x: 0, y: -1 };
    this._alignGain = 0;

    // For parity with the standalone file (debug only; not used by solver)
    this.virtualTargetDir = { x: 0, y: -1 };

    this.tipAttached = false;
    this.stickFrames = 0;
    this.maxStickFrames = 30;

    // mouth angular velocity (rad/s) supplied by caller each step
    this.mouthOmega = 0;

    // pin “mouth” (index 0) with mass
    this.invMass[0] = this.mouthMass > 0 ? 1 / this.mouthMass : 0;

    // spinner HUD phase (optional)
    this._theta = 0;
  }

  /** @returns {number} */ get tipIndex() {
    return this.numPoints - 1;
  }
  /** @returns {Vec2} */ tip() {
    return { ...this.x[this.tipIndex] };
  }
  /** @param {Vec2} v */ setMouthAnchor(v) {
    this.mouthAnchor = { x: v.x, y: v.y };
  }

  /** @param {Vec2} mouth */
  initializeAt(mouth) {
    this.x[0].x = mouth.x;
    this.x[0].y = mouth.y;
    this.xPrev[0].x = mouth.x;
    this.xPrev[0].y = mouth.y;
    for (let i = 1; i < this.numPoints; i++) {
      this.x[i].x = mouth.x;
      this.x[i].y = mouth.y - i * this.restSegLen;
      this.xPrev[i].x = this.x[i].x;
      this.xPrev[i].y = this.x[i].y;
    }
  }

  /** @param {number} theta */
  setLaunchFromAngle(theta) {
    this.aimDir = { x: Math.cos(theta), y: Math.sin(theta) };
    this.virtualTargetDir = { ...this.aimDir };
  }

  launch() {
    this.tipAttached = false;
    this.scale = Math.max(this.scale, this.minShootScale);
    this._alignGain = this.alignK;
    this.shooting = true;
    this.retracting = false;
    this.stickFrames = 0;
  }

  startRetract() {
    this.shooting = false;
    this.retracting = true;
  }
  unpinTip() {
    this.tipAttached = false;
  }
  attachTip() {
    this.tipAttached = true;
    this.xPrev[this.tipIndex] = { ...this.x[this.tipIndex] };
  }
  detachTip() {
    this.tipAttached = false;
  }
  isIdle() {
    return (
      !this.shooting && !this.retracting && this.scale <= this.epsilonScale
    );
  }

  /**
   * @param {number} dt
   * @param {Vec2} mouthPos
   * @param {{xv:number,yv:number}} mouthVel
   * @param {number} mouthOmega
   */
  step(dt, mouthPos, mouthVel, mouthOmega) {
    // Drive scale once per *frame* using legacy semantics (or per-second if opted in)
    this._driveScale(this.speedsArePerSecond ? dt : 1.0);

    // If fully collapsed & idle, keep rope hard-locked to mouth (prevents tiny drift)
    if (this.keepCollapsedLocked && this.isIdle()) {
      this._pinMouth(mouthPos, mouthVel);
      const x0 = this.x[0];
      for (let i = 1; i < this.numPoints; i++) {
        this.x[i].x = x0.x;
        this.x[i].y = x0.y;
        this.xPrev[i].x = x0.x;
        this.xPrev[i].y = x0.y;
      }
      this._theta += mouthOmega * dt;
      return;
    }

    // kinematic mouth state
    const cx = mouthPos.x,
      cy = mouthPos.y;
    this.mouthOmega = mouthOmega;
    this._pinMouth(mouthPos, mouthVel);

    // deterministic sub-steps
    const steps = Math.max(1, Math.round(this.substeps));
    const h = dt / steps;

    for (let s = 0; s < steps; s++) {
      this._integrate(h);
      this._applyMouthRotationAndSwirl(h, cx, cy);
      this._applyAngularFrictionAndClamp(cx, cy);
      this._solveConstraints(h);
    }

    // spinner HUD phase
    this._theta += this.mouthOmega * dt;
  }

  /** @param {Vec2} pos @param {{xv:number,yv:number}} vel */
  _pinMouth(pos, vel) {
    this.x[0].x = pos.x;
    this.x[0].y = pos.y;
    this.xPrev[0].x = pos.x - vel.x; // set prev so (x - xPrev) ~ vel
    this.xPrev[0].y = pos.y - vel.y;
  }

  /** @param {number} timeUnit either dt (if per-second) or 1 (if per-frame) */
  _driveScale(timeUnit) {
    const spinning = Math.abs(this.mouthOmega) > 1e-6;
    const spinFactor = spinning ? this.alignWhileSpinningFactor : 1.0;

    if (this.shooting) {
      this.scale = Math.min(
        this.scale + this.extendSpeed * timeUnit,
        this.maxScale
      );
      this._alignGain = Math.min(
        this._alignGain * this.alignFade,
        this.alignK * spinFactor
      );
    } else if (this.retracting) {
      this.scale = Math.max(this.scale - this.retractSpeed * timeUnit, 0.0);
      if (this.scale <= this.epsilonScale) {
        this._collapseToMouth();
        this.retracting = false;
      }
      this._alignGain = Math.min(
        this._alignGain * this.alignFade,
        this.alignK * spinFactor
      );
    } else {
      if (this.scale <= this.epsilonScale) this._collapseToMouth();
      this._alignGain *= this.alignFade;
    }

    if (this.tipAttached) {
      this.stickFrames++;
      if (this.stickFrames > this.maxStickFrames && !this.retracting)
        this.startRetract();
    }
  }

  _collapseToMouth() {
    const m = this.x[0];
    for (let i = 0; i < this.numPoints; i++) {
      this.x[i].x = m.x;
      this.x[i].y = m.y;
      this.xPrev[i].x = m.x;
      this.xPrev[i].y = m.y;
    }
    this.scale = 0;
    this._alignGain = 0;
    this.tipAttached = false;
  }

  /** @param {number} dt */
  _integrate(dt) {
    const drag = 1 - this.airDrag;
    for (let i = 1; i < this.numPoints; i++) {
      const px = this.x[i].x,
        py = this.x[i].y;
      const vx =
        (this.x[i].x - this.xPrev[i].x) * drag + this.gravity.x * dt * dt;
      const vy =
        (this.x[i].y - this.xPrev[i].y) * drag + this.gravity.y * dt * dt;
      this.xPrev[i].x = px;
      this.xPrev[i].y = py;
      this.x[i].x += vx;
      this.x[i].y += vy;
    }
  }

  _applyMouthRotationAndSwirl(dt, cx, cy) {
    if (!(this.shooting || this.retracting)) return;
    if (this.scale <= this.epsilonScale) return;

    const dtheta = this.mouthOmega * this.spinAdvection * dt;
    const c = Math.cos(dtheta),
      s = Math.sin(dtheta);

    // advect positions & prev positions
    for (let i = 1; i < this.numPoints; i++) {
      const px = this.x[i].x - cx,
        py = this.x[i].y - cy;
      this.x[i].x = cx + (c * px - s * py);
      this.x[i].y = cy + (s * px + c * py);
      const qx = this.xPrev[i].x - cx,
        qy = this.xPrev[i].y - cy;
      this.xPrev[i].x = cx + (c * qx - s * qy);
      this.xPrev[i].y = cy + (s * qx + c * qy);
    }

    // small swirl impulse (velocity tweak) with falloff
    if (Math.abs(dtheta) < 1e-8 || this.spinImpulseGain <= 0) return;
    const vmax = this.spinVelClamp;
    const gain = this.spinImpulseGain;
    const n = this.numPoints - 1;

    for (let i = 1; i < this.numPoints; i++) {
      const rx = this.x[i].x - cx,
        ry = this.x[i].y - cy;
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

  _applyAngularFrictionAndClamp(cx, cy) {
    const omegaMax = (this.omegaMaxFactor ?? 1.2) * Math.abs(this.mouthOmega);
    const angFric = this.angularFriction ?? 0.15;

    for (let i = 1; i < this.numPoints; i++) {
      const p = this.x[i],
        prev = this.xPrev[i];
      let vx = p.x - prev.x,
        vy = p.y - prev.y;

      const rx = p.x - cx,
        ry = p.y - cy;
      const r = Math.hypot(rx, ry);
      if (r < 1e-6) {
        vx *= 1 - angFric;
        vy *= 1 - angFric;
        this.xPrev[i].x = p.x - vx;
        this.xPrev[i].y = p.y - vy;
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
      this.xPrev[i].x = p.x - vxNew;
      this.xPrev[i].y = p.y - vyNew;
    }
  }

  /** @param {number} _dt (unused but kept for parity if you later want time-based fades) */
  _solveConstraints(_dt) {
    const segRest = Math.max(0, this.restSegLen * this.scale);
    const iters = this.iterations;

    for (let k = 0; k < iters; k++) {
      // stretch to rest
      if (segRest > 0) {
        for (let i = 0; i < this.numPoints - 1; i++) {
          this._enforceDistance(i, i + 1, segRest, this.stretchStiffness);
        }
      }

      // soft cap beyond rest
      if (segRest >= 0) {
        for (let i = 0; i < this.numPoints - 1; i++) {
          this._enforceMaxStretchRestPlus(
            i,
            i + 1,
            segRest,
            this.maxExtraStretchPerBone,
            1.0
          );
        }
      }

      // light bend stabilizer
      if (segRest > 0) {
        const bendRest = 2 * segRest;
        for (let i = 0; i < this.numPoints - 2; i++) {
          this._enforceDistance(i, i + 2, bendRest, this.bendStiffness);
        }
      }

      // alignment motor during expansion
      if (this.shooting && !this.tipAttached && segRest > 0) {
        let g = this._alignGain;
        if (Math.abs(this.mouthOmega) > 1e-6) {
          g = Math.min(g, this.alignK * this.alignWhileSpinningFactor);
        }
        if (g > 1e-4) {
          for (let i = 1; i < this.numPoints; i++) {
            const goalX = this.x[0].x + this.aimDir.x * segRest * i;
            const goalY = this.x[0].y + this.aimDir.y * segRest * i;
            this.x[i].x += (goalX - this.x[i].x) * g;
            this.x[i].y += (goalY - this.x[i].y) * g;
          }
        }
      }

      // tiny pull on tip during retract
      if (this.retracting && this.tipAttached && segRest > 0) {
        const t = this.tipIndex;
        const pull = 0.08;
        const dx = this.x[0].x - this.x[t].x;
        const dy = this.x[0].y - this.x[t].y;
        this.x[t].x += dx * pull;
        this.x[t].y += dy * pull;
      }
    }
  }

  _enforceDistance(i, j, restLen, stiffness) {
    const xi = this.x[i],
      xj = this.x[j];
    const w1 = this.invMass[i],
      w2 = this.invMass[j];
    const wsum = w1 + w2;
    if (wsum === 0) return;

    const dx = xj.x - xi.x,
      dy = xj.y - xi.y;
    const d2 = dx * dx + dy * dy;
    if (!isFinite(d2) || d2 === 0) return;
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

  _enforceMaxStretchRestPlus(i, j, restLen, maxExtra, stiffness = 1.0) {
    const xi = this.x[i],
      xj = this.x[j];
    const w1 = this.invMass[i],
      w2 = this.invMass[j];
    const wsum = w1 + w2;
    if (wsum === 0) return;

    const dx = xj.x - xi.x,
      dy = xj.y - xi.y;
    const d2 = dx * dx + dy * dy;
    if (!isFinite(d2) || d2 === 0) return;
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
}
