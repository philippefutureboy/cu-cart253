import P5Runtime from "./p5/runtime.js";
import MenuScene from "./menu.js";
import RedScene from "./variations/red.js";
import GreenScene from "./variations/green.js";
import BlueScene from "./variations/blue.js";
import MultiSceneGame from "./variations/multi-scene/game.js";

import FontBook from "./utils/fonts.js";

/**
 * Instantiate the runtime
 */
const RUNTIME = new P5Runtime({
  frameRate: 60,
  width: 800,
  height: 800,

  setup(p5) {
    // Load fonts ahead of time.
    FontBook.load(
      p5,
      "mayas-script",
      "assets/fonts/Mayas_Script/Mayas_Script.ttf"
    );
  },
});

// Games
const MULTI = new MultiSceneGame();
const RED = new RedScene();
const GREEN = new GreenScene();
const BLUE = new BlueScene();

// Menu
const MENU = new MenuScene({
  [MULTI.key]: MULTI.label,
  [RED.key]: RED.label,
  [GREEN.key]: GREEN.label,
  [BLUE.key]: BLUE.label,
});

/**
 * Register scenes, with MenuScene as current scene
 */
RUNTIME.registerScene(MENU, { current: true });
RUNTIME.registerScene(MULTI);
RUNTIME.registerScene(RED);
RUNTIME.registerScene(GREEN);
RUNTIME.registerScene(BLUE);

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
