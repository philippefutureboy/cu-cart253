import { BaseSceneManager } from "../../p5/scene.js";
import PlayScene from "./scenes/play.js";
import BailedOutScene from "./scenes/bailed-out.js";
import LoseScene from "./scenes/lose.js";
import WinScene from "./scenes/win.js";

/**
 * Realistic Tag
 *
 * A joke variation. Tells the player to get up from the computer, tag someone else,
 * and come back to claim their victory.
 */
export default class RealisticTag extends BaseSceneManager {
  key = "realistic-tag-game";
  label = "Realistic Tag";

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
    this.registerScene(new PlayScene(), { current: true });
    this.registerScene(new BailedOutScene());
    this.registerScene(new LoseScene());
    this.registerScene(new WinScene());
    super.setup(p5);
  }

  /**
   * onExit lifecycle phase handler
   *
   * Called when the RealisticTagGame is unloaded by the parent SceneManager
   * (P5Runtime).
   *
   * Unregisters the scenes to reset the state.
   */
  onExit() {
    this.unregisterScene("realistic-tag-game.play");
    this.unregisterScene("realistic-tag-game.bailed-out");
    this.unregisterScene("realistic-tag-game.win");
    this.unregisterScene("realistic-tag-game.lose");
  }
}
