/**
 * @typedef {import('p5')} P5
 *
 * @typedef {import('src/components/p5/components/bar')} Bar
 * @typedef {import('src/components/p5/components/portrait')} Portrait
 * @typedef {import('src/lib/p5').SceneContext} SceneContext
 */

import VideoOverlay from "src/components/p5/components/video-overlay";
import { FRAME_RATE } from "src/constants";
import { AbstractP5Scene, Store } from "src/lib/p5";

export default class Scene2 extends AbstractP5Scene {
  static scene = "scene2";

  constructor(p5, ctx) {
    super(p5, ctx);
    this._objects = {};
    this._videosDone = {
      transcendent: false,
      meow: false,
    };
    this._videosStartedFrame = {
      transcendent: null,
      meow: null,
    };
  }

  /**
   * Preloads the video overlay 'Transcendence - Limitless', then registers
   * a global event listener to unlock the video+sound playback
   * @param {P5} p5
   * @param {SceneContext} ctx
   * @returns {void|Promise<void>}
   */
  async preload(p5, ctx) {
    const transcendent = new VideoOverlay({
      name: "transcendent",
      uri: "src/assets/Pedro Krause - Transcendence - Limitless - h3p_9-R_siI.mp4",
      opacity: 1,
      saturation: 1,
    });
    const meow = new VideoOverlay({
      name: "meow",
      uri: "src/assets/JLesis - mmaaAAAaah - SWkMYO9V_-k.mp4",
      opacity: 0,
      saturation: 1,
    });
    this._objects.videos = {};
    this._objects.videos.transcendent = transcendent;
    this._objects.videos.meow = meow;
    transcendent.load(p5);
    meow.load(p5);

    // Global event listener so we can catch release events on Scene 1
    // to unlock the video early
    ctx.addEventListener(
      "mousePressed",
      (p5) => {
        transcendent.unlock();
        meow.unlock();
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
    // this._objects.portrait.globalStyles = { stroke: { color: "#fff" } };
  }

  /**
   * Draw loop (called each frame).
   * @param {P5} p5
   * @param {SceneContext} ctx
   * @returns {void}
   */
  draw(p5, ctx) {
    const { portrait, bar, videos } = this._objects;

    p5.background(255);

    // TRANSCENDENT VIDEO DRAW --------------------

    // start
    const transcendentStarted = this._videosStartedFrame.transcendent !== null;
    if (!transcendentStarted) {
      videos.transcendent.play();
      this._videosStartedFrame.transcendent = p5.frameCount;
    }
    // playback
    if (videos.transcendent.time < 99 && !this._videosDone.transcendent) {
      videos.transcendent.draw(p5);
    }
    if (videos.transcendent.time >= 99 && !this._videosDone.transcendent) {
      this._videosDone.transcendent = true;
      videos.transcendent.stop();
    }

    // PORTRAIT + CHARGING BAR DRAW --------------------
    // draw portrait and bar until 1:30 into transcendent
    if (videos.transcendent.time < 90 && !this._videosDone.transcendent) {
      portrait.draw(p5);
      bar.draw(p5);
    }

    // MEOW DRAW --------------------
    let meowStarted = this._videosStartedFrame.meow !== null;
    const meowDone = this._videosDone.meow;

    // start meow playback at 1:35 of transcendent
    if (!meowStarted && videos.transcendent.time >= 90) {
      console.log("meow play");
      videos.meow.play();
      this._videosStartedFrame.meow = p5.frameCount;
      meowStarted = true;
    }
    // playback
    if (meowStarted && !meowDone) {
      const secondsSinceStarted =
        (p5.frameCount - this._videosStartedFrame.meow) / FRAME_RATE;
      // increase opacity gradually until we hit the 5 seconds mark
      if (secondsSinceStarted < 5) {
        videos.meow.opacity = Math.min(
          (p5.frameCount - this._videosStartedFrame.meow) / (FRAME_RATE / 1.5),
          100,
        );
        // decrease opacity gradually until the end of the vid
      } else {
        const decreaseStartFrame = p5.frameCount + 5 * FRAME_RATE;
        videos.meow.opacity = Math.max(
          100 -
            (decreaseStartFrame - this._videosStartedFrame.meow) /
              (FRAME_RATE / 1.5),
          0,
        );
      }
      videos.meow.draw(p5);
    }
    // stop right meow
    if (videos.meow.time === 9 && !meowDone) {
      videos.meow.stop();
      this._videosDone.meow = true;
    }
  }
}
