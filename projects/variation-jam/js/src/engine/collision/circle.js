/**
 * src/engine/collision/circle.js
 *
 * Simple collision handling.
 *
 * @attribution GenAI usage: 100%.
 *              Full conversation available at src/engine/ATTRIBUTION/ChatGPT-engine-discussion.html
 */

export function areCirclesColliding(a, b) {
  const dx = a.pos.x - b.pos.x;
  const dy = a.pos.y - b.pos.y;
  const r = a.radius + b.radius;
  return dx * dx + dy * dy <= r * r;
}
