class P5 {
  constructor(sketch, node) {
    this.P2D = "P2D";
    this.WEBGL = "WEBGL";
    this._renderer = { GL: { RENDERER: this.P2D } };
    this.frameCount = 0;

    // minimal API your code touches
    this.createCanvas = (w, h, renderer) => {
      this._renderer.GL.RENDERER =
        renderer === this.WEBGL ? this.WEBGL : this.P2D;
      const elt =
        typeof document !== "undefined"
          ? document.createElement("canvas")
          : { nodeName: "CANVAS" };
      return { elt };
    };
    this.resizeCanvas = () => {};
    this.noLoop = () => {};
    this.loop = () => {};
    this.remove = () => {};

    // allow assigning/replacing draw
    this._draw = () => {};
    Object.defineProperty(this, "draw", {
      get: () => this._draw,
      set: (fn) => {
        this._draw = typeof fn === "function" ? fn : () => {};
      },
    });

    // run the provided sketch
    if (typeof sketch === "function") {
      sketch(this);
      if (typeof this.setup === "function") this.setup();
    }
  }
}

export default P5;
