import { ConvenientImage, blink } from "../utils/drawing.js";

export default class TitleScreenOverlay {
  /**
   * TitleScreenOverlay
   *
   * This title screen is an overlay over the simulation of the game.
   * It draws the title & press-start text over the rest of the rendered content.
   */
  constructor() {
    this.titleImg = null;
    this.pressStartImg = null;
    this.ready = false;
  }

  /**
   * setup
   *
   * Setup the images that are part of the overlay
   * (loading the images, setting their size and positions)
   *
   * @param {import('p5')} p5
   */
  setup(p5) {
    // instantiate images
    this.titleImg = new ConvenientImage(
      "title",
      "assets/images/frogfrogfrog-title.png",
      {
        // 2/5th of the width, looks about right
        maxWidth: p5.width / 2.5,
        imageMode: "CENTER",
      }
    );
    this.pressStartImg = new ConvenientImage(
      "press-start",
      "assets/images/frogfrogfrog-press-start.png",
      {
        // 50% of the width of the titleImg
        maxWidth: (p5.width / 2.5) * 0.5,
        imageMode: "CENTER",
      }
    );

    // load images & then wait for readiness before auto-calc width/height
    Promise.all([this.titleImg.setup(p5), this.pressStartImg.setup(p5)]).then(
      () => {
        // set x,y for both based on calculated width,height
        this.titleImg.x = p5.width / 2 - this.titleImg.width / 2; // center horizontally, but half offset left
        this.titleImg.y = p5.height / 2; // center vertically

        this.pressStartImg.x = this.titleImg.x;
        this.pressStartImg.y = this.titleImg.y + this.titleImg.height / 2 + 50; // 50px below the title

        // binding this.pressStartImg.draw to have a stable ref when blinking (in draw func)
        this.pressStartImg.draw = this.pressStartImg.draw.bind(
          this.pressStartImg
        );

        this.ready = true;
      }
    );
  }

  /**
   * draw
   *
   * Draws the text overlays - title normally, and press-start blinking.
   *
   * @param {import('p5')} p5
   */
  draw(p5) {
    this.titleImg.draw(p5);
    blink(p5, this.pressStartImg.draw, 60, 35);
  }
}
