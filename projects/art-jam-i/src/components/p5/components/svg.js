import merge from "lodash.merge";
import P5 from "p5"; // for typing

export default class SVGDrawer {
  constructor(
    rawSvg,
    { padding = [20, 20, 20, 20], styles = {}, globalStyles = {} } = {},
  ) {
    // processed svg path elements
    this._paths = null;
    // viewbox of the svg
    this._viewbox = null;
    // padding for the svg, assuming centered and max-sized
    this._padding = {
      top: padding[0],
      right: padding[1],
      bottom: padding[2],
      left: padding[3],
    };
    // individual path style overrides
    this._styles = styles;
    // global path style overrides
    this._globalStyles = globalStyles;
    // calculated (merged) styles
    this._calcStyles = null;
    // For rendering on a separate canvas if main canvas is a WebGLRenderingContext/WebGL2RenderingContext
    this._pathLayer = null;

    this._processSvg(rawSvg);
  }

  /**
   * Branches between drawWebGL / draw2D drawing methods based on canvas rendering context type.
   *
   * If we are using WebGLRenderingContext, we can't draw Path2D objects like we would on a
   * CanvasRenderingContext2D (p5.P2D mode). Thus we have two separate draw implementations that we
   * branch between based on canvas rendering context type.
   *
   * This code and the conceptualisation was authored by ChatGPT-5 (OpenAI), and then integrated
   * by Philippe Hebert.
   * Full conversation available at ./ATTRIBUTION/chatgpt-log-svg-webgl-2025-09-27.html
   *
   * @param {P5} p5
   * @author ChatGPT-5 (OpenAI)
   */
  draw(p5) {
    const ctx = p5.drawingContext;

    if (
      ctx instanceof WebGLRenderingContext ||
      ctx instanceof WebGL2RenderingContext
    ) {
      this._drawWebGL(p5);
    } else {
      this._draw2D(ctx, p5.width, p5.height);
    }
  }

  /**
   * Create an invisible CanvasRenderingContext2D canvas to render our SVG on.
   *
   * WebGLRenderingContext cannot draw Path2D objects like CanvasRenderingContext2D can,
   * so we need another canvas to work with if our primary canvas is in WEBGL mode.
   *
   * We want to avoid expensive operations, so we prevent the creation of a new canvas
   * on every render cycle by guarding it so it creates only when the original canvas changes
   * size or pixel density.
   *
   * This code and the conceptualisation was authored by ChatGPT-5 (OpenAI), and then integrated
   * by Philippe Hebert.
   * Full conversation available at ./ATTRIBUTION/chatgpt-log-svg-webgl-2025-09-27.html
   *
   * @param {p5} p5
   * @author ChatGPT-5 (OpenAI)
   */
  _createGraphics(p5) {
    if (
      !this._pathLayer ||
      this._pathLayer.width !== p5.width ||
      this._pathLayer.height !== p5.height ||
      this._pathLayer.pixelDensity() !== p5.pixelDensity()
    ) {
      this._pathLayer = p5.createGraphics(p5.width, p5.height); // P2D
      this._pathLayer.pixelDensity(p5.pixelDensity());
    }
  }

  /**
   * Draws the SVG when using a WebGLRenderingContext.
   *
   * Creates a separate CanvasRenderingContext2D canvas, delegates rendering to _draw2D with
   * said canvas as context, and
   *
   * If we are using WebGLRenderingContext, we can't draw Path2D objects like we would on a
   * CanvasRenderingContext2D (p5.P2D mode). Thus we have two separate draw implementations that we
   * branch between based on canvas rendering context type.
   *
   * This code and the conceptualisation was authored by ChatGPT-5 (OpenAI), and then integrated
   * by Philippe Hebert.
   * Full conversation available at ./ATTRIBUTION/chatgpt-log-svg-webgl-2025-09-27.html
   *
   * @param {P5} p5
   * @author ChatGPT-5 (OpenAI)
   */
  _drawWebGL(p5) {
    this._createGraphics(p5);
    this._pathLayer.clear(); // setting clear background
    this._draw2D(this._pathLayer.drawingContext, p5.width, p5.height); // draw on side canvas

    // composite the 2D buffer into the WEBGL canvas
    // (optional) ensure it draws on top of 3D by disabling depth test just for this blit
    const gl = p5.drawingContext;
    const hadDepth = gl.isEnabled ? gl.isEnabled(gl.DEPTH_TEST) : true;
    if (hadDepth) gl.disable(gl.DEPTH_TEST);

    p5.push();
    p5.resetShader?.(); // avoid any active custom shader
    p5.translate(-p5.width / 2, -p5.height / 2); // align top-left
    p5.image(this._pathLayer, 0, 0); // draw 1:1
    p5.pop();

    if (hadDepth) gl.enable(gl.DEPTH_TEST);
  }

  /**
   * Renders the SVG on a CanvasRenderingContext2D of size { width, height }.
   *
   * @param {CanvasRenderingContext2D} ctx Canvas
   * @param {Number} width Canvas width in pixel (integer)
   * @param {Number} height Canvas height in pixel (integer)
   */
  _draw2D(ctx, width, height) {
    // Get the available space
    const availW = width - (this._padding.left + this._padding.right);
    const availH = height - (this._padding.top + this._padding.bottom);
    // Now we get the scaling factor by mapping the viewbox to the bounding box of the canvas;
    // we the minimum scale because we want the svg to fit on the drawing
    const scale = Math.min(
      availW / this._viewbox.width,
      availH / this._viewbox.height,
    );

    const drawnW = this._viewbox.width * scale;
    const drawnH = this._viewbox.height * scale;
    const offsetX = (availW - drawnW) / 2;
    const offsetY = (availH - drawnH) / 2;

    ctx.save(); // p5.push equivalent for canvas

    // Future improvement: We could have an option "translate" with a sizeX, sizeY so that we know
    // where to draw; for now we just draw so it takes the whole canvas minus padding
    ctx.translate(this._padding.left + offsetX, this._padding.top + offsetY);
    // set scale to minimum scale to fit
    ctx.scale(scale, scale);
    // handle viewbox offset (within scale)
    ctx.translate(-this._viewbox.minX, -this._viewbox.minY);

    for (let p of this._paths) {
      // push a context for the styles of this specific path
      ctx.save();

      // obtain calculated styles for path
      const styles = this._calcStyles[p.id];
      const stroke = styles.stroke || {};
      const hasFill = styles.fill && styles.fill !== "none";
      const hasStroke =
        stroke.color && stroke.color !== "none" && (stroke.weight ?? 0) > 0;

      // apply styles & only apply if the path will result in something being printed.
      if (hasStroke) {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.weight;
        ctx.stroke(p.path);
      }
      if (hasFill) {
        ctx.fillStyle = styles.fill;
        ctx.fill(p.path);
      }

      // pop the context
      ctx.restore();
    }

    ctx.restore(); // p5.pop equivalent for canvas
  }

  /**
   * Inspects and processes the provided SVG string; extracts styling, path commands, and stores
   * the resulting Path2D + metadata/styling info into this._paths.
   *
   * @param {String} rawSvg An SVG document, as a raw (utf-8 encoded) string
   */
  _processSvg(rawSvg) {
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
    this._viewbox = { minX, minY, width, height };

    // From there we can load all the paths using the usual
    // vanilla javascript DOM API
    const pathEls = Array.from(svgEl.querySelectorAll("path"));
    // With these elements we then convert to a language that
    // the CanvasRenderer2DContext API can understand
    // @see https://dev.to/hendrikras/coding-a-game-of-asteroids-while-dealing-with-svg-paths-in-p5-4baa
    // @see https://developer.mozilla.org/en-US/docs/Web/API/Path2D
    // @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/stroke
    this._paths = pathEls.map((el, i) => ({
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

    // Calculate styles once and index by path.id (fallback to order index);
    // merges the styles (default <- path.styles <- globalStyles <- custom per-path styles)
    this._calcStyles = Object.fromEntries(
      this._paths.map((p) => [
        p.id,
        merge(
          // defaults
          { fill: undefined, stroke: { color: "#000", weight: 2 } },
          // override in order - native styles, global styles, specific overriden styles
          p.styles,
          this._globalStyles ?? {},
          this._styles[p.id] ?? {},
        ),
      ]),
    );
  }
}
