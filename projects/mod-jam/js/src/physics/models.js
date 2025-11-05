/**
 * PhysicsObjectModel
 *
 * An "abstract class" (acknowledging interfaces/abstract classes don't exist in Javascript)
 * which represents an object with physical properties.
 * This object contains the state necessary to perform physics calculations, and is to be extended
 * by concrete types that need the physics-related state.
 */
export class PhysicsObjectModel {
  constructor({
    id = null,
    x = 0,
    y = 0,
    xVelocity = 0,
    yVelocity = 0,
    angle = 0,
    angularVelocity = 0,
    mass = 0,
  } = {}) {
    this.id = id;
    this.mass = mass ?? 0;
    this.invMass = this.mass > 0 ? 1 / this.mass : 0; // kinematic if 0
    this._x = x ?? 0;
    this._y = y ?? 0;
    this._angle = angle ?? 0; // radians
    this._xv = xVelocity ?? 0;
    this._yv = yVelocity ?? 0;
    this._linearScale = 1;
    this._angularv = angularVelocity ?? 0;
    this._angularScale = 1;

    // force accumulator (cleared every step)
    this.fx = 0;
    this.fy = 0;
  }

  get a() {
    return this._angle;
  }
  set a(value) {
    this._angle = value;
  }

  get angle() {
    return this._angle;
  }
  set angle(value) {
    this._angle = value;
  }

  get x() {
    return this._x;
  }
  set x(value) {
    this._x = value;
  }

  get y() {
    return this._y;
  }
  set y(value) {
    this._y = value;
  }

  get xv() {
    return this._xv;
  }
  set xv(value) {
    this._xv = value * this._linearScale;
  }

  get yv() {
    return this._yv;
  }
  set yv(value) {
    this._yv = value * this._linearScale;
  }

  get av() {
    return this._angularv;
  }
  set av(value) {
    this._angularv = value * this._angularScale;
  }

  /**
   * Scales the velocities with a uniform multiplier.
   * Saves the scale on the object so that any modification done via the setters/getters
   * still apply the scaling factor.
   *
   * Added for the Game Over screen to slow down the movements of the objects on screen
   *
   * @param {number} factor Scaling factor, expected (not enforced) to be [0, Infinity]
   * @param {boolean} scaleLinearV Whether or not to scale this.xv, this.yv. Defaults to true.
   * @param {boolean} scaleAngularV Whether or not to scale this.av. Defaults to true.
   */
  scaleVelocities(factor, scaleLinearV = true, scaleAngularV = true) {
    const debugInfo = {
      factor,
      scaleLinearV,
      scaleAngularV,
      before: [this.xv, this.yv, this.av],
      after: [],
    };
    if (scaleLinearV) {
      this._linearScale = factor;
      this.xv = this.xv;
      this.yv = this.yv;
    }
    if (scaleAngularV) {
      this._angularScale = factor;
      this.av = this.av;
    }
    debugInfo.after = [this.xv, this.yv, this.av];
    // console.log(`PhysicsObjectModel{${this.id}}.scalingVelocities:`, debugInfo);
  }
}
