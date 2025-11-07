import { BaseScene, SceneRequest } from "../p5/scene.js";

/**
 * MenuScene
 *
 * A scene that sets the background black and requests Red/Green/Blue-Scene on
 * R/G/B keypress.
 * Logs enter & exit of scene.
 */
export default class MenuScene extends BaseScene {
  static name = "menu";
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
    p5.background("black");
    p5.push();
    {
      p5.fill("white");
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.translate(p5.width / 2, p5.height / 2);
      p5.text("R: Red Scene", 0, 0);
      p5.text("G: Green Scene", 0, 12);
      p5.text("B: Blue Scene", 0, 24);
      p5.text("Backspace: Return to menu", 0, 36);
    }
    p5.pop();
  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyPressed(p5, event) {
    // if 'ESC', catch the event and switch back to menu
    switch (event.key) {
      case "r":
      case "R":
        return new SceneRequest("red");
      case "g":
      case "G":
        return new SceneRequest("green");
      case "b":
      case "B":
        return new SceneRequest("blue");
      default:
        break;
    }
  }
}
