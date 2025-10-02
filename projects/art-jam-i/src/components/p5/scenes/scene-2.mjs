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

const TRANSCENDENT_TIME_OFFSET = 7.6; // seconds

export default class Scene2 extends AbstractP5Scene {
  static scene = "scene2";

  constructor(p5, ctx) {
    super(p5, ctx);
    this._objects = {};
    this._videosDone = {
      transcendent: false,
      meow: false,
    };
    this._startFrames = {
      scene: null,
      transcendent: null,
      meow: null,
    };
    this.acts = new Acts({ timeOffset: TRANSCENDENT_TIME_OFFSET });
    this.stop = false;
  }

  /**
   * Preloads the video overlay 'Transcendence - Limitless', then registers
   * a global event listener to unlock the video+sound playback
   * @param {P5} p5
   * @param {SceneContext} ctx
   * @returns {void|Promise<void>}
   */
  async preload(p5, ctx) {
    // Vite serves public/ at the web root and copies it verbatim to the build
    // this is the easiest way to load static video files on production build
    const ASSETS = `${import.meta.env.BASE_URL}assets`;
    const transcendent = new VideoOverlay({
      name: "transcendent",
      uri: `${ASSETS}/Pedro Krause - Transcendence - Limitless - h3p_9-R_siI.mp4`,
      opacity: 1,
      saturation: 1,
    });
    const meow = new VideoOverlay({
      name: "meow",
      uri: `${ASSETS}/JLesis - mmaaAAAaah - SWkMYO9V_-k.mp4`,
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
        transcendent.unlock({ muted: false });
        transcendent.volume = 0.4;
        meow.unlock({ muted: false });
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
    this._startFrames.scene = p5.frameCount;
  }

  /**
   * Draw loop (called each frame).
   * @param {P5} p5
   * @param {SceneContext} ctx
   * @returns {void}
   */
  draw(p5, ctx) {
    // for debugging
    if (this.stop) {
      return;
    }
    const { portrait, bar, videos } = this._objects;

    // TRANSCENDENT VIDEO DRAW --------------------

    // start
    const transcendentStarted = this._startFrames.transcendent !== null;
    const transcendentDone = this._videosDone.transcendent;
    if (!transcendentStarted) {
      videos.transcendent.time = TRANSCENDENT_TIME_OFFSET; // start at 7.6 seconds for a punch
      videos.transcendent.play();
      this._startFrames.transcendent = p5.frameCount;
    }

    // playback
    if (!transcendentDone && videos.transcendent.time < 99) {
      if (videos.transcendent.volume !== 1) {
        // increase volume over 2 seconds
        videos.transcendent.volume = p5.constrain(
          (p5.frameCount - this._startFrames.transcendent) / (FRAME_RATE * 2),
          0.4,
          1,
        );
      }
      videos.transcendent.draw(p5);
    }
    if (videos.transcendent.time >= 99 && !this._videosDone.transcendent) {
      this._videosDone.transcendent = true;
      videos.transcendent.stop();
    }

    // PORTRAIT + CHARGING BAR DRAW --------------------
    // draw portrait and bar until 1:30 into transcendent

    const sceneFrameCount = p5.frameCount - this._startFrames.scene;
    const videoTime = videos.transcendent.time;
    const [ACT, ACT_START_FRAME] = this.acts.getAct(sceneFrameCount);
    const ACT_FRAME = sceneFrameCount - ACT_START_FRAME;

    // ACT 1 - ZOOM
    if (ACT === 1) {
      this.acts.logAct(ACT, videoTime, sceneFrameCount);
      // portrait.showMouth = true;
      portrait.height =
        p5.height * p5.constrain(ACT_FRAME / (FRAME_RATE / 2), 1, 2.5);
      portrait.draw(p5);
      bar.draw(p5);

      // ACT 2 - POUAAAAAAAHHHHH
    } else if (ACT === 2) {
      this.acts.logAct(ACT, videoTime, sceneFrameCount);
      portrait.x =
        (p5.frameCount % 2 === 0 ? -5 : +5) * Math.ceil(ACT_FRAME / FRAME_RATE);
      // reduce opacity over 4 seconds
      portrait.opacity =
        1 -
        p5.constrain(
          Math.ceil((ACT_FRAME - ACT_START_FRAME - 240) / FRAME_RATE),
          0,
          1,
        );
      portrait.draw(p5);
      bar.draw(p5);

      // ACT 3 - INTERLUDE 1
    } else if (ACT === 3) {
      // reset props, once
      if (!this.acts.hasAct(ACT)) {
        portrait.x = undefined;
        portrait.opacity = 1;
      }
      // log after to register act late
      this.acts.logAct(ACT, videoTime, sceneFrameCount);

      // ACT 4 - EARTH
    } else if (ACT === 4) {
      this.acts.logAct(ACT, videoTime, sceneFrameCount);
      portrait.x =
        (p5.frameCount % 2 === 0 ? -5 : +5) * Math.ceil(ACT_FRAME / FRAME_RATE);
      portrait.y =
        (p5.frameCount % 2 === 0 ? -5 : +5) * Math.ceil(ACT_FRAME / FRAME_RATE);
      portrait.draw(p5);

      // ACT 5 - INTERLUDE 2
    } else if (ACT === 5) {
      // reset props, once
      if (!this.acts.hasAct(ACT)) {
        portrait.x = undefined;
        portrait.y = undefined;
        portrait.opacity = 1;
      }
      // log after to register act late
      this.acts.logAct(ACT, videoTime, sceneFrameCount);

      // ACT 6 - SCATTER
    } else if (ACT === 6) {
      this.acts.logAct(ACT, videoTime, sceneFrameCount);
      // frames % 20 === 0 : once every third of a sec
      if (Math.floor(ACT_FRAME) % (FRAME_RATE / 6) === 0) {
        // change portrait color
        p5.push();
        p5.colorMode(p5.HSB);
        let color = p5.color(
          `hsb(${Math.floor(255 * Math.random())}, 100%, 80%)`,
        );
        // color.toString('#rrggbb') does not work as advertised
        // so we need to parse the output (`rgb(% % %)`) as a workaround
        color = rgbPercentToHex(color.toString());

        portrait.globalStyles = { stroke: { color, weight: 1 } };
        p5.pop();

        // change height + position
        portrait.height = Math.ceil(p5.height / 1.5);
        portrait.x = p5.random(0, p5.width - portrait.height / 2);
        portrait.y = p5.random(0, p5.height - portrait.height / 1.5);
      }
      // draw only after we've updated the properties
      if (portrait.x !== undefined) {
        // console.log({
        //   x: portrait.x,
        //   y: portrait.y,
        //   height: portrait.height,
        //   width: portrait.width,
        //   strokeColor: portrait.globalStyles.stroke.color,
        //   opacity: portrait.opacity,
        // });
        portrait.draw(p5);
      }

      // ACT 7 - INTERLUDE 3
    } else if (ACT === 7) {
      // reset props, once
      if (!this.acts.hasAct(ACT)) {
        portrait.x = undefined;
        portrait.y = undefined;
        portrait.width = undefined;
        portrait.height = undefined;
        portrait.globalStyles = { stroke: { color: "#fff", weight: 1 } };
        portrait.opacity = 1;
      }
      // log after to register act late
      this.acts.logAct(ACT, videoTime, sceneFrameCount);

      // ACT 8 - ROTATE
    } else if (ACT === 8) {
      this.acts.logAct(ACT, videoTime, sceneFrameCount);
      const every2Seconds = 2 * FRAME_RATE;
      p5.push();
      p5.rotateZ(2 * Math.PI * ((ACT_FRAME % every2Seconds) / every2Seconds));
      portrait.draw(p5);
      p5.pop();
    } else {
      if (!this._videosDone.transcendent) {
        this.acts.logAllActsEverySecond(
          "Finished going through acts. Recap:",
          videoTime,
          sceneFrameCount,
        );
      }
    }

    // MEOW DRAW --------------------
    let meowStarted = this._startFrames.meow !== null;
    const meowDone = this._videosDone.meow;

    // start meow playback at 1:35 of transcendent
    if (!meowStarted && videos.transcendent.time >= 90) {
      console.log("meow play");
      videos.meow.play();
      this._startFrames.meow = p5.frameCount;
      meowStarted = true;
    }
    // playback
    if (meowStarted && !meowDone) {
      const secondsSinceStarted =
        (p5.frameCount - this._startFrames.meow) / FRAME_RATE;
      // increase opacity gradually until we hit the 5 seconds mark
      if (secondsSinceStarted < 5) {
        videos.meow.opacity = Math.min(
          (p5.frameCount - this._startFrames.meow) / (FRAME_RATE / 1.5),
          100,
        );
        // decrease opacity gradually until the end of the vid
      } else {
        const decreaseStartFrame = this._startFrames.meow + 5 * FRAME_RATE;
        videos.meow.opacity = Math.max(
          1 - (p5.frameCount - decreaseStartFrame) / (FRAME_RATE / 1.5),
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

class Acts {
  constructor({ timeOffset = 0 } = {}) {
    // start, duration, end
    this.actFrames = [
      [0, 75, 75],
      [75, 300, 375],
      [375, 960, 1335],
      [1335, 120, 1455],
      [1455, 550, 2005],
      [2005, 1200, 3205],
      [3205, 720, 3925],
      [3925, 500, 4425],
    ];
    this.actsTiming = [];
    this.timeOffset = timeOffset;
  }

  getAct(sceneFrameCount) {
    const idx = this.actFrames.findIndex(
      ([start, _, end]) => sceneFrameCount >= start && sceneFrameCount <= end,
    );
    if (idx === -1) {
      return [undefined, NaN];
    }
    return [idx + 1, this.actFrames[idx][0]];
  }

  hasAct(act) {
    return this.actsTiming.length >= act;
  }

  logTime(time, sceneFrameCount) {
    console.log(msToTime(time * 1000), Math.floor(time), sceneFrameCount);
  }

  logAct(act, time, sceneFrameCount) {
    if (act === undefined || act > this.actFrames.length) {
      console.error("Received invalid act value", {
        act,
        time,
        sceneFrameCount,
      });
    }
    if (this.actsTiming.length === act) {
      return;
    }
    this.actsTiming.push([time, sceneFrameCount]);
    console.clear();
    console.log(`SCENE 2 - ACT ${act}`);
    const [start, _, end] = this.actFrames[act - 1];
    const startTime = start / FRAME_RATE + this.timeOffset;
    console.log(
      `Start (expected): ${msToTime(startTime * 1000)} ${start / FRAME_RATE} ${start}`,
    );
    console.log(
      `Start (received): ${msToTime(time * 1000)} ${time} ${sceneFrameCount}`,
    );
  }

  logAllActsEverySecond(msg, time, sceneFrameCount) {
    if (Math.floor(sceneFrameCount) % FRAME_RATE === 0) {
      console.clear();
      console.log(msg);
      for (let i = 0; i < this.actFrames.length; i++) {
        const start = this.actFrames[i][0];
        const startTime = start / FRAME_RATE + this.timeOffset;
        const [time, actStartFrame] = this.actsTiming[i];
        console.log(
          `SCENE 2 - ACT ${i + 1}: [${msToTime(startTime * 1000)} ${start} / ${msToTime(time * 1000)} ${actStartFrame}]`,
        );
      }
      this.logTime(time, sceneFrameCount);
    }
  }
}

function msToTime(ms) {
  let hours = Math.floor(ms / 3600000);
  let minutes = Math.floor((ms % 3600000) / 60000);
  let seconds = Math.floor((ms % 60000) / 1000);
  let milliseconds = ms % 1000;

  // Format with leading zeros
  let hh = String(hours).padStart(2, "0");
  let mm = String(minutes).padStart(2, "0");
  let ss = String(seconds).padStart(2, "0");
  let ssss = String(milliseconds).padStart(4, "0"); // pad to 4 digits

  return `${hh}:${mm}:${ss},${ssss}`;
}

function rgbPercentToHex(rgbString) {
  // Extract percentages
  const matches = rgbString.match(/(\d+)%/g);
  if (!matches || matches.length !== 3) {
    throw new Error("Input must be in format 'rgb(X% Y% Z%)'");
  }

  // Convert percentages to 0–255 values
  const rgb = matches.map((v) => Math.round((parseInt(v) * 255) / 100));

  // Convert to hex string
  return "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
}
