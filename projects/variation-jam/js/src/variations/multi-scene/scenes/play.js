import { BaseScene, SceneRequest } from "../../../p5/scene.js";

export default class PlayScene extends BaseScene {
  static key = "multi-scene.play";
  static label = "Multi-Scene Game: Play Scene";

  constructor(store) {
    super();
    this.store = store;
  }

  /**
   * @param {import('p5')} p5
   */
  draw(p5) {
    p5.background("#fff");
    p5.push();
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.text("PLAY", p5.width / 2, p5.height / 2);
    p5.pop();
    return undefined;
  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyPressed(p5, event) {
    if (event.key === "Backspace") {
      event.stopPropagation();
      return new SceneRequest("menu");
    }
    if (event.key.toLowerCase() === "w") {
      event.stopPropagation();
      return new SceneRequest("multi-scene.win");
    }
    if (event.key.toLowerCase() === "l") {
      event.stopPropagation();
      return new SceneRequest("multi-scene.lose");
    }
  }
}
