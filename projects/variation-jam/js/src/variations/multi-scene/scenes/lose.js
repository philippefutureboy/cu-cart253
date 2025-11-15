import { BaseScene, SceneRequest } from "../../../p5/scene.js";

export default class LoseScene extends BaseScene {
  static key = "multi-scene.lose";
  static label = "Multi-Scene Game: Lose Scene";

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
    p5.text("LOSE", p5.width / 2, p5.height / 2);
    p5.pop();
    return undefined;
  }
}
