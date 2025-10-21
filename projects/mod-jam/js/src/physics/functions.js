// ============================ SMALL VEC HELPERS ===============================

// rot2(theta, v)
// Rotates a 2D vector `v = {x, y}` by an angle `theta` (in radians) using the standard
// 2×2 rotation matrix:
//     [ cosθ  -sinθ ] [x]
//     [ sinθ   cosθ ] [y]
// Returns the rotated vector { x', y' } in world coordinates.
export function rot2(theta, v) {
  const c = Math.cos(theta),
    s = Math.sin(theta);
  return { x: c * v.x - s * v.y, y: s * v.x + c * v.y };
}

// 2D "ω × r" helper: scalar ω with vector r = (x, y) → (-ω y, ω x)
export function omegaCrossR(omega, r) {
  return { x: -omega * r.y, y: omega * r.x };
}

// =========================== PHYSICS HELPERS =======================

/**
 * Clear accumulated force on an object.
 */
export function clearForces(o) {
  o.fx = 0;
  o.fy = 0;
}

/**
 * Clear accumulated rotational force (torque) on an object.
 */
export function clearTorque(o) {
  o.torque = 0;
}

/**
 * Add a force to an object (will be applied in the next integration).
 */
export function addForce(o, fx, fy) {
  o.fx += fx;
  o.fy += fy;
}

/**
 * Semi-implicit Euler (a.k.a. symplectic Euler) for linear motion:
 *   v_{t+dt} = v_t + a * dt
 *   x_{t+dt} = x_t + v_{t+dt} * dt
 * More stable for stiff systems than explicit Euler.
 */
export function integrateSemiImplicit(o, dt) {
  if (o.invMass === 0) return; // kinematic object
  const ax = o.fx * o.invMass; // F = ma; a = F/m; a = F * (1/m)
  const ay = o.fy * o.invMass; // F = ma; a = F/m; a = F * (1/m)
  o.xv += ax * dt; // velocity = acceleration * time
  o.yv += ay * dt; // velocity = acceleration * time
  o.x += o.xv * dt; // distance = velocity * time
  o.y += o.yv * dt; // distance = velocity * time
}

export function integrateAngularSemiImplicit(o, dt) {
  const angAcc = o.inertia > 0 ? o.torque / o.inertia : 0; // ω <- ω + (τ/I) dt ; θ <- θ + ω dt
  o.av += angAcc * dt; // ω = α * s  // angularVelocity = angularAcceleration * dt
  o.a += o.av * dt; // θ = θ + angularAcceleration * dt
}

/**
 * Hooke spring + axial dashpot between two nodes.
 *   d = xj - xi,  ℓ = |d|, ê = d/ℓ
 *   Fs = k (ℓ - L) ê             (spring along +ê on node i)
 *   Fd = c ((vj - vi)·ê) ê       (damper along +ê on node i)
 * Equal & opposite on each node.
 * If `audit` is provided, we record power terms:
 *   P_spring = Fs * s      (can be ±; springs can add/remove energy)
 *   P_damper = -c * s^2    (must be ≤ 0 if damping is correct)
 */
export function applyEdgeSpring(ni, nj, L, k, c, audit /* optional */) {
  const dx = nj.x - ni.x;
  const dy = nj.y - ni.y;
  const dist = Math.hypot(dx, dy);
  if (!isFinite(dist) || dist < 1e-8) return;

  const tx = dx / dist,
    ty = dy / dist; // ê
  const elong = dist - L; // (ℓ - L)
  const dvx = nj.xv - ni.xv,
    dvy = nj.yv - ni.yv; // relative velocity
  const s = dvx * tx + dvy * ty; // along-edge relative speed

  const Fs = k * elong;
  const Fd = c * s;
  const F = Fs + Fd; // total along ê

  const fx = F * tx,
    fy = F * ty;

  // Apply equal & opposite
  addForce(ni, +fx, +fy);
  addForce(nj, -fx, -fy);

  // ---- Audit energy flow (optional) ----
  if (audit) {
    // Spring power along the edge DOF
    const Ps = Fs * s; // can be ± (springs can do work or absorb)
    const Pd = -c * s * s; // MUST be ≤ 0 if the sign is correct

    audit.springPower += Ps;
    audit.damperPower += Pd;
    audit.maxAbsSv = Math.max(audit.maxAbsSv, Math.abs(s));
    audit.maxAbsElong = Math.max(audit.maxAbsElong, Math.abs(elong));
    audit.edges += 1;
  }
}
