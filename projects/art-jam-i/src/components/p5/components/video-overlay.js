import P5 from "p5"; // for typing

/**
 * VideoOverlay component
 *
 * Displays a video on a WebGLRenderingContext canvas.
 *
 * This code and the conceptualisation was authored by ChatGPT-5 (OpenAI), and then integrated
 * by Philippe Hebert.
 * Full conversation available at ./ATTRIBUTION/chatgpt-log-video-overlay-2025-09-27.html
 */
const READY_STATES = {
  HAVE_NOTHING: 0,
  HAVE_METADATA: 1,
  HAVE_CURRENT_DATA: 2,
  HAVE_FUTURE_DATA: 3,
  HAVE_ENOUGH_DATA: 4,
};

const vertSrc = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;
void main() {
  vTexCoord = aTexCoord;
  // full-screen quad
  gl_Position = vec4(aPosition, 1.0);
}
`;

const fragSrc = `
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex0;     // video
uniform float u_saturation; // 1.0 = original, >1 boosts, <1 reduces
uniform float u_alpha;      // 0..1
varying vec2 vTexCoord;

// Rec. 709 luminance
vec3 saturateBoost(vec3 color, float s) {
  float l = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(l), color, s);
}

void main() {
  vec4 c = texture2D(tex0, vTexCoord);
  vec3 boosted = saturateBoost(c.rgb, u_saturation);
  gl_FragColor = vec4(boosted, u_alpha);
}
`;

export default class VideoOverlay {
  constructor({
    uri = null,
    loop = false,
    opacity = 1, // 0..1
    saturation = 1, // 0..2 (<1 lower saturation, 1 = original saturation, >1 = increased saturation)
  } = {}) {
    if (uri === null) {
      throw TypeError("uri should be a valid uri string");
    }
    this._uri = uri;
    this._loop = loop;
    this._opacity = opacity;
    this._saturation = saturation;
    this._video = null;
    this._shader = null;
    this._renderer = null;
    this._unlocked = false;
  }

  /**
   * Unlocks the autoplay with sound.
   *
   * Since browsers prevent autoplay of videos when sound is not muted, we need to have a user
   * event listener to enable sound.
   * This method can be called as part of an event listener - whether a native DOM event listener,
   * or a p5 event listener.
   *
   */
  unlock() {
    // unlock only once
    if (this._unlocked) {
      return;
    }
    const v = this._video;

    v.attribute("playsinline", ""); // keep this for iOS
    v.removeAttribute("muted"); // (optional) clear boolean attribute
    v.elt.muted = false; // property
    v.play();
    v.pause(); // pause immediately; element is now “unlocked”
    v.time(0);
    v.volume(1.0); // p5 helper (0..1)

    // mark unlocked
    this._unlocked = true;
  }

  play() {
    this._video?.play();
  }

  pause() {
    this._video?.pause();
  }

  stop() {
    this._video?.stop(); // stop and rewind to t=0
  }

  get time() {
    return this._video?.time() ?? 0; // in seconds
  }

  get duration() {
    return this._video?.duration() ?? NaN; // in seconds
  }

  get progress() {
    return this.duration > 0 ? this.time / this.duration : 0;
  }

  setup(p5) {
    this._ensureResources(p5);
  }

  /**
   * Draws the video as a shader on the WebGL canvas.
   * Ensures first that the video is loaded
   *
   * @param {P5} p5
   * @returns
   */
  draw(p5) {
    // Ensure shader matches the current renderer
    this._ensureResources(p5);

    // const seconds = Math.floor(p5.frameCount / FRAME_RATE);
    // const onTheDot = p5.frameCount % FRAME_RATE === 0;
    let shouldLog = false;
    // exponential fallback
    // if (seconds <= 5) {
    //   shouldLog = onTheDot;
    // } else if (seconds < 20) {
    //   shouldLog = onTheDot && seconds % 2 === 0;
    // } else {
    //   shouldLog = onTheDot && seconds % 10 === 0;
    // }

    const v = this._video?.elt;
    if (shouldLog) {
      console.log(p5.frameCount, "[VideoOverlay] State: ", {
        video: this._video,
        elt: v,
        rs: v?.readyState, // 0..4
        vw: v?.videoWidth,
        vh: v?.videoHeight,
        paused: v?.paused,
        ended: v?.ended,
        currentTime: v?.currentTime,
      });
    }

    if (!v) return;

    // Gate until the video actually has pixels
    if (
      v.readyState < READY_STATES.HAVE_CURRENT_DATA ||
      v.videoWidth === 0 ||
      v.videoHeight === 0
    ) {
      return;
    }

    p5.resetShader();
    p5.shader(this._shader);
    this._shader.setUniform("tex0", this._video);
    this._shader.setUniform("u_saturation", this._saturation); // saturation, 0..?
    this._shader.setUniform("u_alpha", this._opacity); // opacity 0..1

    // Draw a full-canvas rectangle in clip space
    p5.beginShape();
    // left-bottom
    p5.vertex(-1, -1, 0, 0, 1);
    // left-top
    p5.vertex(-1, 1, 0, 0, 0);
    // right-top
    p5.vertex(1, 1, 0, 1, 0);
    // right-bottom
    p5.vertex(1, -1, 0, 1, 1);
    p5.endShape(p5.CLOSE);
    p5.resetShader();
  }

  _ensureResources(p5) {
    // Need to recreate the shader because React forces recreation of canvas
    // a few times, and a shader needs to be loaded on the same context it will
    // be used.
    // Otherwise we get:
    //
    // "Error: The shader being run is attached to a different context.
    //  Do you need to copy it to this context first with .copyToContext()?"
    if (!this._shader || this._renderer !== p5._renderer) {
      this._shader = p5.createShader(vertSrc, fragSrc);
      this._renderer = p5._renderer;
    }

    if (!this._video) {
      this._video = p5.createVideo(this._uri, () => {
        this._loop ? this._video.loop() : this._video.noLoop();
      });
      this._video.attribute("playsinline", "");
      this._video.attribute("crossOrigin", "anonymous");
      // Most web browsers will prevent video autoplay if not muted
      this._video.attribute("muted", "");
      this._video.elt.muted = true;
      // We hide the video player DOM element; we’ll sample it as a texture
      this._video.hide();
      // Optional debug hooks
      this._video.elt.load();
      this._video.elt.addEventListener("loadedmetadata", () => {
        console.log(
          "[VideoOverlay] metadata",
          this._video.elt.videoWidth,
          this._video.elt.videoHeight,
        );
      });
      this._video.elt.addEventListener("canplay", () =>
        console.log("[VideoOverlay] canplay"),
      );
      this._video.elt.addEventListener("error", (e) =>
        console.error("[VideoOverlay] video error", e),
      );
    }
  }
}
