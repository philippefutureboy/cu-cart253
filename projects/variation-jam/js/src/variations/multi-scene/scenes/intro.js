import { BaseScene, SceneRequest } from "../../../p5/scene.js";

export default class IntroScene extends BaseScene {
  static key = "multi-scene.intro";
  static label = "Multi-Scene Game: Intro Scene";

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
    p5.text("INTRO", p5.width / 2, p5.height / 2);
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
    if (event.key.toLowerCase() === "n") {
      event.stopPropagation();
      return new SceneRequest("multi-scene.play");
    }
  }
}
