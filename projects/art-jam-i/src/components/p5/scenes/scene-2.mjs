/**
 * @typedef {import('p5')} P5
 *
 * @typedef {import('src/components/p5/components/bar')} Bar
 * @typedef {import('src/components/p5/components/portrait')} Portrait
 * @typedef {import('src/lib/p5').SceneContext} SceneContext
 */

import VideoOverlay from "src/components/p5/components/video-overlay";
import { AbstractP5Scene, Store } from "src/lib/p5";

export default class Scene2 extends AbstractP5Scene {
  static scene = "scene2";

  constructor(p5, ctx) {
    super(p5, ctx);
    this._objects = {};
    this._playRequested = false;
  }

  /**
   * Preloads the video overlay 'Transcendence - Limitless', then registers
   * a global event listener to unlock the video+sound playback
   * @param {P5} p5
   * @param {SceneContext} ctx
   * @returns {void|Promise<void>}
   */
  async preload(p5, ctx) {
    const videoOverlay = new VideoOverlay({
      uri: "src/assets/Pedro Krause - Transcendence - Limitless - h3p_9-R_siI.mp4",
      opacity: 1,
      saturation: 1,
    });
    this._objects.videoOverlay = videoOverlay;
    videoOverlay.load(p5);

    // Global event listener so we can catch release events on Scene 1
    // to unlock the video early
    ctx.addEventListener(
      "mouseReleased",
      (p5) => {
        videoOverlay.unlock();
        ctx.removeEventListener("scene2.video-overlay.unlock");
      },
      { id: "scene2.video-overlay.unlock" },
    );
  }

  /**
   * One-time setup right before the first draw of this scene.
   * @param {P5} p5
   * @param {SceneContext} ctx
   * @returns {void}
   */
  setup(p5, ctx) {
    // Copy objects over from Scene1
    this._objects.portrait = Store.get({ key: "portrait" });
    this._objects.bar = Store.get({ key: "bar" });
    this._objects.videoOverlay.play(); // FIXME: This doesn't seem to be doing anything

    // this._objects.portrait.globalStyles = { stroke: { color: "#fff" } };
  }

  /**
   * Draw loop (called each frame).
   * @param {P5} p5
   * @param {SceneContext} ctx
   * @returns {void}
   */
  draw(p5, ctx) {
    const { portrait, bar, videoOverlay } = this._objects;

    videoOverlay.play();
    // if (!this._playRequested) {
    //   this._playRequested = true;
    // }

    videoOverlay.draw(p5);
    p5.push();
    // p5.blendMode("exclusion");
    portrait.draw(p5);
    p5.pop();
    bar.draw(p5);
  }
}
