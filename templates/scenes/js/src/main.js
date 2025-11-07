import P5Runtime from "./p5/runtime.js";
import MenuScene from "./scenes/menu.js";
import VariationRedScene from "./scenes/red.js";
import VariationGreenScene from "./scenes/green.js";
import VariationBlueScene from "./scenes/blue.js";

const RUNTIME = new P5Runtime({
  frameRate: 60,
  width: window.innerWidth,
  height: window.innerHeight,
});

RUNTIME.registerScene(new MenuScene(), { current: true });
RUNTIME.registerScene(new VariationBlueScene());
RUNTIME.registerScene(new VariationRedScene());
RUNTIME.registerScene(new VariationGreenScene());

new window.p5(
  /**
   * @param {import('p5')} p5
   */
  function sketch(p5) {
    p5.setup = () => RUNTIME.setup(p5);
    p5.draw = () => RUNTIME.draw(p5);
    p5.keyPressed = (event) => RUNTIME.keyPressed(p5, event);
    p5.keyReleased = (event) => RUNTIME.keyReleased(p5, event);
    p5.mouseClicked = (event) => RUNTIME.mouseClicked(p5, event);
    p5.mousePressed = (event) => RUNTIME.mousePressed(p5, event);
    p5.mouseReleased = (event) => RUNTIME.mouseReleased(p5, event);
  }
);
