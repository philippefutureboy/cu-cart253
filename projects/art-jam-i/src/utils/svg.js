import merge from "lodash.merge";

export default class SVGDrawer {
  constructor(
    rawSvg,
    { padding = [20, 20, 20, 20], styles = {}, globalStyles = {} } = {},
  ) {
    // Assuming a raw svg string,
    // we can load it as a DOM to query it for its content
    // @see https://stackoverflow.com/a/24109000
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvg, "image/svg+xml");
    const svgEl = doc.documentElement;

    // We load the viewbox from the svg to have a coordinate system we'll
    // use as reference for scaling to the canvas
    // @see https://dev.to/hendrikras/coding-a-game-of-asteroids-while-dealing-with-svg-paths-in-p5-4baa
    const [minX, minY, width, height] = svgEl
      .getAttribute("viewBox")
      .split(/\s+/)
      .map(Number);
    this.viewbox = { minX, minY, width, height };

    // From there we can load all the paths using the usual
    // vanilla javascript DOM API
    const pathEls = Array.from(svgEl.querySelectorAll("path"));
    // With these elements we then convert to a language that
    // the CanvasRenderer2DContext API can understand
    // @see https://dev.to/hendrikras/coding-a-game-of-asteroids-while-dealing-with-svg-paths-in-p5-4baa
    // @see https://developer.mozilla.org/en-US/docs/Web/API/Path2D
    // @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/stroke
    this.paths = pathEls.map((el, i) => ({
      id: el.getAttribute("id") || i,
      path: new Path2D(el.getAttribute("d")),
      styles: {
        fill: el.getAttribute("fill"),
        stroke: {
          color: el.getAttribute("stroke"),
          weight: el.getAttribute("stroke-width"),
        },
      },
    }));

    this.padding = {
      top: padding[0],
      right: padding[1],
      bottom: padding[2],
      left: padding[3],
    };
    this.styles = styles;
    this.globalStyles = globalStyles;
    // Calculate styles once and index by path.id (fallback to order index)
    this.calculateStyles();
  }

  calculateStyles() {
    this.calcStyles = Object.fromEntries(
      this.paths.map((p) => [
        p.id,
        merge(
          // defaults
          { fill: undefined, stroke: { color: "#000", weight: 2 } },
          // override in order - native styles, global styles, specific overriden styles
          p.styles,
          this.globalStyles ?? {},
          this.styles[p.id] ?? {},
        ),
      ]),
    );
  }

  draw(p5) {
    const ctx = p5.drawingContext;

    // Get the available space
    const availW = p5.width - (this.padding.left + this.padding.right);
    const availH = p5.height - (this.padding.top + this.padding.bottom);
    // Now we get the scaling factor by mapping the viewbox to the bounding box of the canvas;
    // we the minimum scale because we want the svg to fit on the drawing
    const scale = Math.min(
      availW / this.viewbox.width,
      availH / this.viewbox.height,
    );

    const drawnW = this.viewbox.width * scale;
    const drawnH = this.viewbox.height * scale;
    const offsetX = (availW - drawnW) / 2;
    const offsetY = (availH - drawnH) / 2;

    if (p5.frameCount == 1) console.log(offsetX, offsetY, drawnW, drawnH);
    ctx.save(); // p5.push equivalent for canvas

    // Future improvement: We could have an option "translate" with a sizeX, sizeY so that we know
    // where to draw; for now we just draw so it takes the whole canvas minus padding
    ctx.translate(this.padding.left + offsetX, this.padding.top + offsetY);
    // set scale to minimum scale to fit
    ctx.scale(scale, scale);
    // handle viewbox offset (within scale)
    ctx.translate(-this.viewbox.minX, -this.viewbox.minY);

    for (let p of this.paths) {
      // push a context for the styles of this specific path
      ctx.save();
      // obtain calculated styles for path
      const styles = this.calcStyles[p.id];

      // apply styles
      if (styles.fill) {
        ctx.fill = styles.fill ?? undefined; // default
      }
      if (styles.stroke.color) {
        ctx.strokeStyle = styles.stroke.color || "#000"; // default
      }
      if (styles.stroke.weight) {
        ctx.lineWidth = styles.stroke.weight || "#000"; // default
      }

      // only print if we expect something to show
      if (ctx.strokeStyle && ctx.lineWidth) {
        ctx.stroke(p.path);
      }

      // pop the context
      ctx.restore();
    }

    ctx.restore(); // p5.pop equivalent for canvas
  }
}
