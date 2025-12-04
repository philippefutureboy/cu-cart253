import { BaseSceneManager } from "../../p5/scene.js";
import IntroScene from "./scenes/intro.js";
import PlayScene from "./scenes/play.js";
import LoseScene from "./scenes/lose.js";
import WinScene from "./scenes/win.js";

/**
 * Classic Tag
 *
 * Classic Tag game with a timer.
 * You have 15s and at the end you must not be it!
 */
export default class ClassicTag extends BaseSceneManager {
  key = "classic-tag-game";
  label = "Classic Tag";

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
    this.unregisterScene("classic-tag-game.intro");
    this.unregisterScene("classic-tag-game.play");
    this.unregisterScene("classic-tag-game.win");
    this.unregisterScene("classic-tag-game.lose");
  }
}
