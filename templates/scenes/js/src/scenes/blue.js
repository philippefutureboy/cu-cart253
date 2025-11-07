import { BaseScene, SceneRequest } from "../p5/scene.js";

/**
 * BlueScene
 *
 * A scene that sets the background blue and requests MenuScene on
 * 'backspace' keypress.
 * Logs enter & exit of scene
 */
export default class BlueScene extends BaseScene {
  static name = "blue";
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
    p5.background("blue");
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
