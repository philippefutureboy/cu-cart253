import P5Runtime from "./p5/runtime.js";
import MenuScene from "./scenes/menu.js";
import RedScene from "./scenes/red.js";
import GreenScene from "./scenes/green.js";
import BlueScene from "./scenes/blue.js";

/**
 * Instantiate the runtime
 */
const RUNTIME = new P5Runtime({
  frameRate: 60,
  width: window.innerWidth,
  height: window.innerHeight,
});

/**
 * Register scenes, with MenuScene as current scene
 */
RUNTIME.registerScene(new MenuScene(), { current: true });
RUNTIME.registerScene(new BlueScene());
RUNTIME.registerScene(new RedScene());
RUNTIME.registerScene(new GreenScene());

/**
 * Create a p5 sketch in instance mode, and register the P5Runtime (SceneManager)
 * methods as handlers for the p5 lifecycle methods
 */
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
