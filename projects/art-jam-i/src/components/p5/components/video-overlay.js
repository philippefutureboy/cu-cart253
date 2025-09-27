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
  constructor({ uri = null, loop = false } = {}) {
    if (uri === null) {
      throw TypeError("uri should be a valid uri string");
    }
    this.video_uri = uri;
    this.loop = loop;
    this.video = null;
    this.shader = null;
  }

  preload(p5) {
    this.shader = new p5.Shader(p5._renderer, vertSrc, fragSrc);
  }

  setup(p5) {
    this.video = p5.createVideo(this.video_uri, () =>
      this.loop ? this.video.loop() : this.video.noLoop(),
    );
    this.video.attribute("playsinline", "");
    // We hide the video player DOM element; we’ll sample it as a texture
    this.video.hide();
  }

  play() {
    this.video.play();
  }

  pause() {
    this.video.pause();
  }

  stop() {
    this.video.stop(); // stop and rewind to t=0
  }

  get time() {
    return this.video.time(); // in seconds
  }

  get duration() {
    return this.video.duration(); // in seconds
  }

  get progress() {
    return this.time / this.duration; // in percents, 0..1
  }

  draw(p5) {
    p5.resetShader();
    p5.shader(this.shader);
    this.shader.setUniform("tex0", this.video);
    this.shader.setUniform("u_saturation", 1.6); // saturation, 0..?
    this.shader.setUniform("u_alpha", 0.4); // opacity 0..1

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
}
