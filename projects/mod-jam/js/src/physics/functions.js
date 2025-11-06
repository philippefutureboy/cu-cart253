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
  o.angle += o.av * dt; // θ = θ + angularAcceleration * dt
}
