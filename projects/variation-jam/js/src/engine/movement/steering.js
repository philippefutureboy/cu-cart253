/**
 * Compute a steering acceleration that moves an agent from `pos`
 * towards `targetPos`, given its current `vel`, and movement limits.
 *
 * - Includes a simple "arrive" behavior when close to target.
 * - Pure math: does not mutate pos/vel/targetPos.
 *
 * @attribution GenAI usage: 100%.
 *              Full conversation available at src/engine/ATTRIBUTION/ChatGPT-engine-discussion.html
 *
 * @param {import("p5")} p5
 * @param {p5.Vector} pos
 * @param {p5.Vector} vel
 * @param {p5.Vector | {x:number, y:number}} targetPos
 * @param {number} maxSpeed
 * @param {number} maxForce
 * @returns {p5.Vector} steering vector (acceleration)
 */
export function computeSteer(p5, pos, vel, targetPos, maxSpeed, maxForce) {
  const target = targetPos.copy
    ? targetPos.copy()
    : p5.createVector(targetPos.x, targetPos.y);

  // Desired direction from pos to target
  const desired = p5.createVector(target.x - pos.x, target.y - pos.y);
  const d = desired.mag();

  if (d === 0) {
    // Already on target
    return p5.createVector(0, 0);
  }

  // Desired velocity
  desired.normalize();
  desired.mult(maxSpeed);

  // Arrival behavior when close
  const arriveRadius = 30;
  if (d < arriveRadius) {
    const scaledSpeed = p5.map(d, 0, arriveRadius, 0, maxSpeed);
    desired.setMag(scaledSpeed);
  }

  // Steering = desired - velocity
  const steer = p5.createVector(desired.x - vel.x, desired.y - vel.y);

  // Limit steering force
  if (steer.mag() > maxForce) {
    steer.setMag(maxForce);
  }

  return steer;
}
