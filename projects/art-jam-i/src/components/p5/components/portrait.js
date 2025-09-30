/**
 * ./portrait.svg is created from an Adobe Illustrator vector file using an online converter
 * (because I don't have Adobe Illustrator yet, and Inkscape doesn't install on my Mac), which
 * itself is an export of a manual pen-tool path I've made in Adobe Photoshop over my personal
 * profile picture.
 * This is just a P5/canvas-friendly wrapper for the portrait.svg file
 */

import SVGDrawer from "src/components/p5/components/svg";
// `?raw` tells vite to return the import as a string rather than wrap it as a React component
import portraitSvgRaw from "src/assets/portrait.svg?raw";
// import portraitGlassesSvgRaw from './portrait-glasses.svg?raw';

export default class Portrait {
  constructor({
    padding = [20, 20, 20, 20],
    styles = {},
    globalStyles = {},
  } = {}) {
    this._showMouth = false;
    this._globalStyles = globalStyles;
    this._portraitSvg = new SVGDrawer(portraitSvgRaw, {
      padding,
      styles,
      globalStyles,
    });
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

  get showMouth() {
    return this._showMouth;
  }

  set showMouth(value) {
    this._showMouth = !!value;
  }

  toggleMouth() {
    this._showMouth != this._showMouth;
  }

  draw(p5) {
    this._portraitSvg.draw(p5);
  }

  drawMouth(p5, mouthX, mouthY) {
    if (this._showMouth) {
      p5.push();
      // x3 because it looks more coherent with the svg styling that way
      p5.strokeWeight(this._globalStyles?.stroke?.weight * 3 || 3);
      p5.ellipse(mouthX, mouthY, 30, 30);
      p5.pop();
    }
  }
}
