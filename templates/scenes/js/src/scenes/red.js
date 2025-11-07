import { BaseScene, SceneRequest } from "../p5/scene.js";

export default class VariationRedScene extends BaseScene {
  static name = "red";
  static instance = null;

  /**
   * @template {BaseScene} Scene
   * @param {import('p5')} p5
   * @param {Scene} prevScene
   */
  onEnter(p5, prevScene) {
    console.log(`Entering '${this.name}' from '${prevScene.name}'`);
  }

  /**
   * @template {BaseScene} Scene
   * @param {import('p5')} p5
   * @param {Scene} nextScene
   */
  onExit(p5, nextScene) {
    console.log(`Exiting '${this.name}' to '${nextScene.name}'`);
  }

  /**
   * @param {import('p5')} p5
   */
  draw(p5) {
    p5.background("red");
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
  }
}
