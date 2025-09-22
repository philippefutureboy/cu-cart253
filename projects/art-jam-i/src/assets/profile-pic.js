/**
 * ./profile-pic.svg is created from an Adobe Illustrator vector file using an online converter
 * (because I don't have Adobe Illustrator yet, and Inkscape doesn't install on my Mac), which
 * itself is an export of a manual pen-tool path I've made in Adobe Photoshop over my personal
 * profile picture.
 * This is just a P5/canvas-friendly wrapper for the profile-pic.svg file
 */

import SVGDrawer from '../utils/svg';
// `?raw` tells vite to return the import as a string rather than wrap it as a React component
import profilePicSvgRaw from './profile-pic.svg?raw';

export default class ProfilePic {
  constructor() {
    this.svg = new SVGDrawer(profilePicSvgRaw);
  }

  draw(p5) {
    this.svg.draw(p5);
  }
}
