const NULLISH = [undefined, null];

export default class GradientOverlay {
  constructor() {
    // no op for now
  }

  draw(p5, canvas, mouseDetected, mouseInBounds) {
    // early return, nothing to do
    if (mouseDetected === false) {
      return;
    }
    // missing params
    if (!(canvas?.width > 0) || !(canvas?.height > 0)) {
      throw new TypeError("Expected canvas.width and canvas.height to be set");
    }
    if (NULLISH.includes(mouseInBounds)) {
      throw new TypeError("Expected mouseInBounds to be set");
    }

    const w = canvas.width;
    const h = canvas.height;
    const cx = p5.mouseX;
    const cy = p5.mouseY;

    // longest radius: farthest corner from P
    const Rmax = Math.max(
      p5.dist(cx, cy, 0, 0),
      p5.dist(cx, cy, w, 0),
      p5.dist(cx, cy, 0, h),
      p5.dist(cx, cy, w, h),
    );

    // hue offset that advances 1°/frame
    // const hueOffset = p5.frameCount % 360;

    // Build a radial gradient centered at (cx,cy) up to Rmax
    const ctx = p5.drawingContext; // CanvasRenderingContext2D
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Rmax);

    // We'll add a handful of color stops (increase for smoother banding)
    // Using p5 colorMode HSB for intuitive control, but stops are RGB strings.
    p5.colorMode(p5.HSB, 360, 100, 100, 100);

    const stops = 32; // try 32 for extra smooth
    for (let i = 0; i <= stops; i++) {
      const t = i / stops; // 0..1 along radius
      const hue = (t * 360 - (p5.frameCount % 360) * 2) % 360;
      const col = p5.color(hue, 80, 80, 50);
      // Convert to CSS rgba string explicitly
      const r = Math.round(p5.red(col));
      const gC = Math.round(p5.green(col));
      const b = Math.round(p5.blue(col));
      const a = p5.alpha(col) / 100; // alpha 0..1
      g.addColorStop(t, `rgba(${r},${gC},${b},${a})`);
    }

    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
