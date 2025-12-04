import { BaseSceneManager } from "../../p5/scene.js";
import IntroScene from "./scenes/intro.js";
import PlayScene from "./scenes/play.js";
import LoseScene from "./scenes/lose.js";
import WinScene from "./scenes/win.js";

/**
 * Clock Tag
 *
 * A simple game displaying a clock with the seconds hand being "it".
 * The player has 15 seconds for the seconds hand to touch another hand to win.
 *
 * The Game is implemented as a SceneManager to allow multiple scenes -
 * an intro, play (main game loop), lose (game over), and win scene.
 *
 */
export default class ClockTagGame extends BaseSceneManager {
  key = "clock-tag-game";
  label = "Clock Tag";

  constructor() {
    super({ root: false });
  }

  /**
   * setup lifecycle phase handler
   *
   * Called by the parent SceneManager (P5Runtime) when key=clock-tag-game
   * is requested to setup any resources needed.
   *
   * We re-register the scenes every time, because we unload them in onExit handle.
   *
   * @param {import('p5')} p5
   */
  setup(p5) {
    this.registerScene(new IntroScene(), { current: true });
    this.registerScene(new PlayScene());
    this.registerScene(new LoseScene());
    this.registerScene(new WinScene());
    super.setup(p5);
  }

  /**
   * onExit lifecycle phase handler
   *
   * Called when the ClockTagGame is unloaded by the parent SceneManager
   * (P5Runtime).
   *
   * Unregisters the scenes to reset the state.
   */
  onExit() {
    this.unregisterScene("clock-tag-game.intro");
    this.unregisterScene("clock-tag-game.play");
    this.unregisterScene("clock-tag-game.win");
    this.unregisterScene("clock-tag-game.lose");
  }
}
