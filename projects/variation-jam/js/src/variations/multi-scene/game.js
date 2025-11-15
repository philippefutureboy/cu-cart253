import { BaseSceneManager } from "../../p5/scene.js";
import IntroScene from "./scenes/intro.js";
import PlayScene from "./scenes/play.js";
import LoseScene from "./scenes/lose.js";
import WinScene from "./scenes/win.js";
import Store from "./store.js";

export default class MultiSceneGame extends BaseSceneManager {
  key = "multi-scene";
  label = "Multi Scene";

  constructor({ root = false } = {}) {
    super({ root: root ?? false });
    this.store = new Store();
    this.registerScene(new IntroScene(this.store), { current: true });
    this.registerScene(new PlayScene(this.store));
    this.registerScene(new LoseScene(this.store));
    this.registerScene(new WinScene(this.store));
  }
}
