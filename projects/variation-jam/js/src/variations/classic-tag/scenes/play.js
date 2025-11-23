import { BaseScene, SceneRequest } from "../../../p5/scene.js";
import { KeyboardInput, MouseInput } from "../../../engine/inputs.js";
import { GridGraph } from "../../../engine/navigation/grid-graph.js";
import { GridGraphDistanceField } from "../../../engine/navigation/distance-field.js";
import NPC from "../../../engine/npc.js";
import { Player } from "../../../engine/player/player.js";

import FontBook from "../../../utils/fonts.js";
import * as theme from "../../../theme.js";

/**
 * BasicTag.PlayScene
 *
 * Runs the Classic Tag game.
 * Leverages a whole game engine created using GenAI to manage NPC AI's and movement patterns.
 * @see src/engine
 *
 */
export default class PlayScene extends BaseScene {
  static key = "classic-tag-game.play";
  static label = "Classic Tag Game: Play Scene";

  /**
   * @param {Object} opts
   * @param {number} opts.duration How long this scenes stays up
   */
  constructor({ duration = 5 } = {}) {
    super();
    this.font = null;
    this.sceneDuration = duration;
    this._setupped = false;

    this.inputs = null;

    /** @type {Player|null} */
    this.player = null;
    /** @type {NPC|null} */
    this.npc = null;

    /** @type {GridGraph|null} */
    this.grid = null;
    /** @type {GridGraphDistanceField|null} */
    this.distanceFromPlayer = null;

    this.startAt = null;
  }

  /**
   * Load assets. Only once.
   *
   * @param {import("p5")} p5
   */
  setup(p5) {
    if (this._setupped) return;

    FontBook.getPromise("mayas-script").then((font) => {
      this.font = font;
    });

    this._setupped = true;
  }

  /**
   * Prepares state
   *
   * @param {import('p5')} p5
   * @param {Scene|SceneManager|null} prevScene
   */
  onEnter(p5, prevScene) {
    // --- Inputs ---
    this.inputs = {
      keyboard: new KeyboardInput(),
      mouse: new MouseInput(),
    };
    this.inputs.mouse.setup(p5);

    // --- Navigation (shared world state) ---
    const CELL_SIZE = 32;
    this.grid = new GridGraph(p5.width, p5.height, CELL_SIZE, "8");
    this.distanceFromPlayer = new GridGraphDistanceField(this.grid);

    // --- Player ---
    const playerX = p5.width / 2;
    const playerY = p5.height / 2;

    this.player = new Player(p5, {
      x: playerX,
      y: playerY,
      keyboard: this.inputs.keyboard,
      mouse: this.inputs.mouse, // not used by keyboard controller, but available for future
      radius: 20,
      colorKey: "player", // ensure theme.colors.player exists, or change this key
    });

    // --- NPC initial position: random, not too close to player ---
    let nx = null;
    let ny = null;
    const margin = 40;
    const minDist = 120;

    while (true) {
      nx = p5.random(margin, p5.width - margin);
      ny = p5.random(margin, p5.height - margin);
      const dx = nx - playerX;
      const dy = ny - playerY;
      const distSq = dx * dx + dy * dy;
      if (distSq >= minDist * minDist) break;
    }

    this.npc = new NPC(p5, {
      x: nx,
      y: ny,
      radius: 20,
      mode: "pursuer", // or "evader"
    });

    this.startAt = null;
  }

  /**
   * Resets state
   *
   * @param {import('p5')} p5
   * @param {Scene|SceneManager|null} nextScene
   */
  onExit(p5, nextScene) {
    this.inputs = null;

    this.player = null;
    this.npc = null;

    this.grid = null;
    this.distanceFromPlayer = null;

    this.startAt = null;
  }

  /**
   * Main loop
   *
   * @param {import('p5')} p5
   */
  draw(p5) {
    // --- Scene timer ---
    this.startAt = this.startAt ?? new Date();
    const secondsElapsed = Math.floor((new Date() - this.startAt) / 1000);
    const sceneDuration = this.sceneDuration;
    const secondsLeft = Math.max(sceneDuration - secondsElapsed, 0);

    // --- Clear background ---
    p5.background(theme.colors.background);

    if (this.grid && this.distanceFromPlayer && this.player) {
      // 1) Distance field from player
      this.distanceFromPlayer.compute(this.player.agent.pos);

      // 2) Update player (input → intent → movement)
      this.player.update(p5, this.grid, this.distanceFromPlayer);

      // 3) Update NPC using shared nav + distance field + player agent
      if (this.npc) {
        this.npc.update(p5, {
          grid: this.grid,
          distanceField: this.distanceFromPlayer,
          playerAgent: this.player.agent,
        });
      }
    }

    // --- Draw entities ---
    if (this.player) {
      this.player.draw(p5);
    }
    if (this.npc) {
      this.npc.draw(p5);
    }

    // --- Scene transition on timeout ---
    if (secondsLeft === 0) {
      return new SceneRequest("classic-tag-game.win");
    }
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
    if (this.inputs?.keyboard) {
      this.inputs.keyboard.keyPressed(p5, event);
    }
  }

  /**
   * @param {import('p5')} p5
   * @param {KeyboardEvent} event
   */
  keyReleased(p5, event) {
    if (this.inputs?.keyboard) {
      this.inputs.keyboard.keyReleased(p5, event);
    }
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mouseClicked(p5, event) {
    if (this.inputs?.mouse) {
      this.inputs.mouse.mouseClicked(p5, event);
    }
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mousePressed(p5, event) {
    if (this.inputs?.mouse) {
      this.inputs.mouse.mousePressed(p5, event);
    }
  }

  /**
   * @param {import('p5')} p5
   * @param {MouseEvent} event
   */
  mouseReleased(p5, event) {
    if (this.inputs?.mouse) {
      this.inputs.mouse.mouseReleased(p5, event);
    }
  }
}
