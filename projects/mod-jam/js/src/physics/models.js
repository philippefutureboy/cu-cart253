export class PhysicsObjectModel {
  constructor({
    x = 0,
    y = 0,
    xVelocity = 0,
    yVelocity = 0,
    angle = 0,
    angularVelocity = 0,
    mass = 0,
  } = {}) {
    this.mass = mass ?? 0;
    this.invMass = this.mass > 0 ? 1 / this.mass : 0; // kinematic if 0
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.a = angle ?? 0; // radians
    this.xv = xVelocity ?? 0;
    this.yv = yVelocity ?? 0;
    this.av = angularVelocity ?? 0;

    // force accumulator (cleared every step)
    this.fx = 0;
    this.fy = 0;
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
