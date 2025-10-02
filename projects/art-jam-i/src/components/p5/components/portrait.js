/**
 * @typedef {import('p5')} P5
 *
 **/

/**
 * ./portrait.svg is created from an Adobe Illustrator vector file using an online converter
 * (because I don't have Adobe Illustrator yet, and Inkscape doesn't install on my Mac), which
 * itself is an export of a manual pen-tool path I've made in Adobe Photoshop over my personal
 * profile picture.
 * This is just a P5/canvas-friendly wrapper for the portrait.svg file
 */

import SVGDrawer from "src/components/p5/components/svg";
import { loadSvgText } from "src/utils/assets";

// since vite doesn't process files under public/, we need to load svgs under public/ via
// a network request
const portraitSvgRaw = loadSvgText("assets/portrait.svg");

export default class Portrait {
  constructor({
    x,
    y,
    width,
    height,
    opacity,
    padding = [20, 20, 20, 20],
    styles = {},
    globalStyles = {},
  } = {}) {
    this.showMouth = false;
    this._globalStyles = globalStyles;
    this._portraitSvg = new SVGDrawer(portraitSvgRaw, {
      x,
      y,
      width,
      height,
      padding,
      opacity,
      styles,
      globalStyles,
    });
  }

  get x() {
    return this._portraitSvg.x;
  }

  set x(value) {
    this._portraitSvg.x = value;
  }

  get y() {
    return this._portraitSvg.y;
  }

  set y(value) {
    this._portraitSvg.y = value;
  }

  get width() {
    return this._portraitSvg.width;
  }

  set width(value) {
    this._portraitSvg.width = value;
  }

  get height() {
    return this._portraitSvg.height;
  }

  set height(value) {
    this._portraitSvg.height = value;
  }

  get opacity() {
    return this._portraitSvg.opacity;
  }

  set opacity(value) {
    this._portraitSvg.opacity = value;
  }

  get styles() {
    return this._styles;
  }

  set styles(newStyles) {
    this._styles = newStyles;
    this._portraitSvg.styles = newStyles;
  }

  get globalStyles() {
    return this._globalStyles;
  }

  set globalStyles(gstyles) {
    this._globalStyles = gstyles;
    this._portraitSvg.globalStyles = gstyles;
  }

  /**
   * Drawing function for this class
   * @param {P5} p5
   */
  draw(p5, { debug = false } = {}) {
    this._portraitSvg.draw(p5, { debug });
    // if (this.showMouth) {
    //   this._drawMouth(p5);
    // }
  }

  /**
   * Draws the mouth using an ellipse
   * @param {P5} p5
   */
  // _drawMouth(p5) {
  //   console.log("drawing mouth!");
  //   withP5Space(p5, "P2D", () => {
  //     p5.push();
  //     p5.fill(255);
  //     // x3 because it looks more coherent with the svg styling that way
  //     p5.strokeWeight(this._globalStyles?.stroke?.weight * 3 || 3);
  //     const width = this.width ?? p5.width;
  //     const height = this.height ?? p5.height;
  //     p5.ellipse(
  //       (this.x ?? 0) + width * 0.5 + this.padding[0],
  //       (this.y ?? 0) + height * 0.42 + this.padding[3],
  //       width / 2,
  //       height / 5,
  //     );
  //     p5.pop();
  //   });
  // }
}
