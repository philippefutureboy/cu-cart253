import Bar from "src/components/p5/components/bar";
import Encouragement from "src/components/p5/components/encouragement";
import Portrait from "src/components/p5/components/portrait";
import { FRAME_RATE } from "src/constants";
import { AbstractP5Scene, SceneContext, Store } from "src/lib/p5";
import { hasMouseBeenDetected, isMouseInBounds } from "src/utils/p5/mouse";

/**
 * @typedef {import('p5')} P5
 */

const HOLD_THRESHOLD = FRAME_RATE / 3;
const SECONDS_TO_FILL_BAR = 3;
const BAR_FILL_PERCENT_PER_FRAME = 1 / (FRAME_RATE * SECONDS_TO_FILL_BAR);

export default class Scene1 extends AbstractP5Scene {
  static scene = "scene1";

  constructor(p5, ctx) {
    super(p5, ctx);
    this._objects = {};
    this.mouseEvents = {
      lastClick: null,
      lastPress: null,
      lastRelease: null,
      clickCount: 0,
    };
  }

  /**
   * One-time setup right before the first draw of this scene.
   * @param {P5} p5
   * @param {SceneContext} ctx
   * @returns {void}
   */
  setup(p5, ctx) {
    p5.frameRate(FRAME_RATE); // FIXME: Maybe have a bootstrap function on lib/p5 P5.Canvas?
    p5.background(255);

    // Register mouse events
    ctx.addEventListenerScoped("mousePressed", (p5) => {
      this.mouseEvents.lastPress = p5.frameCount;
    });
    ctx.addEventListenerScoped("mouseReleased", (p5) => {
      this.mouseEvents.lastRelease = p5.frameCount;
    });
    ctx.addEventListenerScoped("mouseClicked", (p5) => {
      this.mouseEvents.lastClick = p5.frameCount;
      const isInBounds = isMouseInBounds(p5);
      // oh boy, implicit typecast
      this.mouseEvents.clickCount += isInBounds;
    });

    const portrait = new Portrait({
      globalStyles: { stroke: { color: "#000", weight: 1 } },
    });
    const bar = new Bar({
      x: 50,
      y: p5.height - 50,
      w: p5.width - 100,
      h: 40,
      padding: 5,
      fill: "#0f0",
      mode: "P2D",
    });

    const encouragement = new Encouragement({
      fontSize: 30,
      fontStyle: "BOLD",
      textAlign: "CENTER",
    });

    // save these objects for the draw cycle
    this._objects.portrait = portrait;
    this._objects.bar = bar;
    this._objects.encouragement = encouragement;

    // save these objects for next scenes
    Store.set({ key: "portrait", value: portrait });
    Store.set({ key: "bar", value: bar });
  }

  /**
   * Draw loop (called each frame).
   * @param {P5} p5
   * @param {SceneContext} ctx
   * @returns {void}
   */
  draw(p5, ctx) {
    const mouseDetected = hasMouseBeenDetected(p5);
    const mouseInBounds = isMouseInBounds(p5);

    // BASE DRAW --------------------
    p5.background(255);

    // PORTRAIT DRAW --------------------
    this._objects.portrait.draw(p5);

    // CHARGING BAR DRAW --------------------
    // if mouse on canvas, fill bar slowly, else empty slowly
    // FIXME: Extract to Bar; but consider pattern implications
    if (!mouseDetected) {
      // do nothing
    } else if (mouseInBounds && this._isHeld(p5)) {
      this._objects.bar.fillPercent = Math.min(
        1,
        this._objects.bar.fillPercent + BAR_FILL_PERCENT_PER_FRAME,
      );
    } else {
      if (!this._objects.bar.superCharged) {
        this._objects.bar.fillPercent = Math.max(
          0,
          this._objects.bar.fillPercent - BAR_FILL_PERCENT_PER_FRAME,
        );
      }
    }
    this._objects.bar.draw(p5);
  }

  // utilities -----

  _isPressed() {
    const { lastPress, lastRelease } = this.mouseEvents;
    // no previous press
    if (lastPress === null) {
      return false;
    }
    // we released already
    if (lastRelease !== null && lastRelease >= lastPress) {
      return false;
    }
    return true;
  }

  _isHeld(p5) {
    // has the press been long enough for us to acknowledge it?
    return (
      this._isPressed() &&
      p5.frameCount - this.mouseEvents.lastPress >= HOLD_THRESHOLD
    );
  }
}
