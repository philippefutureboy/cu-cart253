/**
 * ./portrait.svg is created from an Adobe Illustrator vector file using an online converter
 * (because I don't have Adobe Illustrator yet, and Inkscape doesn't install on my Mac), which
 * itself is an export of a manual pen-tool path I've made in Adobe Photoshop over my personal
 * profile picture.
 * This is just a P5/canvas-friendly wrapper for the portrait.svg file
 */

import SVGDrawer from "../utils/svg";
// `?raw` tells vite to return the import as a string rather than wrap it as a React component
import portraitSvgRaw from "./portrait.svg?raw";
// import portraitGlassesSvgRaw from './portrait-glasses.svg?raw';

export default class Portrait {
  constructor({
    padding = [20, 20, 20, 20],
    styles = {},
    globalStyles = {},
  } = {}) {
    this.portraitSvg = new SVGDrawer(portraitSvgRaw, {
      padding,
      styles,
      globalStyles,
    });
  }

  draw(p5) {
    this.portraitSvg.draw(p5);
  }
}
