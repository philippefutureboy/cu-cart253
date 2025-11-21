import { BaseScene, SceneRequest } from "./p5/scene.js";
import P5Runtime from "./p5/runtime.js";
import MenuScene from "./menu.js";
import RedScene from "./variations/red.js";
import GreenScene from "./variations/green.js";
import BlueScene from "./variations/blue.js";
import MultiSceneGame from "./variations/multi-scene/game.js";
import ClockTagGame from "./variations/clock-tag/game.js";

import FontBook from "./utils/fonts.js";

const INIT_TIME = new Date();

/**
 * Instantiate the runtime
 */
const RUNTIME = new P5Runtime({
  frameRate: 60,
  width: 800,
  height: 800,
});

/**
 * Create a scene class that acts as a loading screen
 *
 * Waits until a set of conditions are completed before
 * moving to the menu screen. If the loading grace period is exhausted,
 * then we only enforce that all non-optional conditions are completed.
 */
class LoadingScene extends BaseScene {
  static key = "loading";
  static label = "Loading Scene";

  constructor() {
    super();
    this.conditions = [];
  }

  setup(p5) {
    // Load shared fonts ahead of time.
    FontBook.load(
      p5,
      "mayas-script",
      "assets/fonts/Mayas_Script/Mayas_Script.ttf"
    );

    this.conditions = [
      {
        key: "fonts.mayas-script",
        optional: true,
        test: () => !FontBook.isSentinel(FontBook.get("mayas-script")),
      },
      {
        key: "p5.sound",
        optional: true,
        test: () => typeof p5.loadSound === "function",
      },
    ];
    this.passed = new Set();
  }

  /**
   * Blocks moving to menu until all required conditions have passed.
   *
   * @param {import('p5')} p5
   * @returns {SceneRequest|void} Request to menu
   */
  draw(p5) {
    // Evaluate conditions
    const testResults = this.conditions.map((c) => ({
      ...c,
      result: c.test(),
    }));

    // Aggregate result & log loading successes
    let allPassed = true;
    let allRequiredPassed = true;
    for (let tr of testResults) {
      if (tr.result && !this.passed.has(tr.key)) {
        console.log(`${tr.key}: OK`);
        this.passed.add(tr.key);
      }
      allPassed &= tr.result;
      allRequiredPassed &= tr.optional || tr.result;
    }

    // Calculate how much time remaining before we automatically move
    // to menu
    const loadingGracePeriod = Math.max(5 - (new Date() - INIT_TIME) / 1000, 0);

    // Block moving to menu until loadingGracePeriod expires, or allRequiredPassed.
    // Transition early if allPassed within the loadingGracePeriod.
    const withinWindowAndNotDone = loadingGracePeriod >= 0 && !allPassed;
    if (withinWindowAndNotDone || !allRequiredPassed) {
      p5.push();
      {
        p5.textSize(32);
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.text("loading", p5.width / 2, p5.height / 2);
      }
      p5.pop();
    } else {
      return new SceneRequest("menu");
    }
  }
}

// Loading Screen
const LOADING = new LoadingScene();

// Games
const MULTI = new MultiSceneGame();
const CLOCK = new ClockTagGame();
const RED = new RedScene();
const GREEN = new GreenScene();
const BLUE = new BlueScene();

// Menu
const MENU = new MenuScene({
  [MULTI.key]: MULTI.label,
  [CLOCK.key]: CLOCK.label,
  [RED.key]: RED.label,
  [GREEN.key]: GREEN.label,
  [BLUE.key]: BLUE.label,
});

/**
 * Register scenes, with LoadingScene as starting scene
 */
RUNTIME.registerScene(LOADING, { current: true });
RUNTIME.registerScene(MENU);
RUNTIME.registerScene(CLOCK);
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
