import { PhysicsObjectModel } from "../physics/models.js";
import { CoordinatesBox } from "../utils/coordinates.js";
import { vectorArc } from "../utils/drawing.js";

export default class Fly {
  constructor({
    id,
    x,
    y,
    angle,
    reorientFrequency,
    accelerationPerStep,
  } = {}) {
    this.id = id;
    this.box = new CoordinatesBox({
      xMin: x - 15,
      xMax: x + 15,
      yMin: y - 15,
      yMax: y + 15,
    });
    this.model = new PhysicsObjectModel({ id, x, y, angle });
    this.reorientFrequency = reorientFrequency;
    this.lastReorient = null;
    this.accelerationPerStep = accelerationPerStep;
  }

  /**
   * Setup function to be called during the setup phase.
   * Currently a no-op. Kept to keep a standard API for drawable objects.
   *
   * @param {import('p5')} p5
   */
  setup(p5) {
    // NO-OP
  }

  /**
   * Updates the fly position/velocity/angle
   * The intent here is to have the fly move erratically in straight lines as if they had jet packs.
   * I thought it would be cool to make them move that way since they don't have usable wings in space
   *
   * @param {import('p5')} p5
   * @param {number} time In-simulation time
   */
  update(p5, time) {
    const deltaReorient = time - this.lastReorient; // NaN if lastReorient is null
    // initial setup
    if (this.lastReorient === null) {
      this.lastReorient = time;
    }
    // accelerating phase
    else if (deltaReorient < this.reorientFrequency / 2) {
      this.model.xv -=
        p5.cos(this.model.angle + p5.PI / 2) * this.accelerationPerStep;
      this.model.yv -=
        p5.sin(this.model.angle + p5.PI / 2) * this.accelerationPerStep;
      this.model.x += this.model.xv;
      this.model.y += this.model.yv;
    }
    // decelerating phase
    else if (deltaReorient < this.reorientFrequency) {
      this.model.xv +=
        p5.cos(this.model.angle + p5.PI / 2) * this.accelerationPerStep;
      this.model.yv +=
        p5.sin(this.model.angle + p5.PI / 2) * this.accelerationPerStep;
      this.model.x += this.model.xv;
      this.model.y += this.model.yv;
    }
    // resetting angle (reorienting) phase
    else if (deltaReorient >= this.reorientFrequency) {
      this.model.angle = p5.random(0, 2 * p5.PI);
      this.model.xv = 0;
      this.model.yv = 0;
      this.lastReorient = time;
    }
  }

  /**
   * Scales the movement of the fly using `factor`.
   * Used when game moves to game-over state to slow down the movements and give a "slow motion" feel.
   *
   * @param {number} factor Scaling factor, expected (not enforced) to be [0, Infinity]
   */
  scaleMovement(factor) {
    this.model.scaleVelocities(factor);
    // adjust reorientFrequency, otherwise the fly keeps changing the orientation at the same
    // pace, while the velocities are adjusted, giving a weird kind of effect
    this.reorientFrequency = this.reorientFrequency / factor;
  }

  /**
   * Returns whether or not the fly is within the viewport.
   * p5 is passed as first param only to standardize the API across its surface.
   *
   * @param {import('p5')} p5
   * @param {CoordinatesBox} viewport
   * @returns {boolean} Whether or not the Fly is within viewport
   */
  isInView(p5, viewport) {
    return viewport.overlaps(this.box);
  }

  draw(p5) {
    p5.push();
    {
      p5.translate(this.model.x, this.model.y);
      p5.rotate(this.model.angle);
      // fly helmet lens
      p5.fill(p5.color(255, 255, 255, 40));
      p5.ellipse(0, 0, 15, 15);

      // fly head
      p5.fill("black");
      p5.ellipse(0, 0, 10, 10);

      // eyes
      p5.noStroke();
      p5.fill("#d0312d");
      p5.ellipse(0 - 3, 0 - 3, 3, 3);
      p5.ellipse(0 + 3, 0 - 3, 3, 3);

      // helmet glass top contour
      p5.push();
      {
        p5.stroke("white");
        p5.noFill();
        p5.arc(0, 0, 15, 15, p5.PI, 2 * p5.PI);
      }
      p5.pop();

      // helmet occlusion
      p5.push();
      {
        p5.fill("#D9DEEB");
        p5.beginShape();
        vectorArc(0, 0 - 1, 15, 14, 0, p5.PI);
        p5.stroke("#D9DEEB");
        vectorArc(0, 0 - 3, 12, 12, p5.PI + p5.PI / 8, -p5.PI / 8);
        p5.endShape(p5.CLOSE);
      }
      p5.pop();

      // spacesuit
      p5.push();
      {
        p5.fill("#F5F7FB");
        p5.stroke("black");
        p5.beginShape();
        vectorArc(p5, 0, 0, 15, 15, 0, p5.PI);
        vectorArc(p5, 0, 0, 15, 5, p5.PI + p5.PI / 6, -p5.PI / 6);
        p5.endShape(p5.CLOSE);
      }
      p5.pop();

      // wings
      // TODO if time allows
    }
    p5.pop();
  }
}
