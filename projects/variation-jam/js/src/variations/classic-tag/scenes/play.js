import { BaseScene, SceneRequest } from "../../../p5/scene.js";
import { KeyboardInput, MouseInput } from "../../../engine/inputs.js";
import { GridGraph } from "../../../engine/navigation/grid-graph.js";
import { GridGraphBFSField } from "../../../engine/navigation/distance-fields/bfs-field.js";
import { GridGraphEuclideanField } from "../../../engine/navigation/distance-fields/euclidean-field.js";
import NPC from "../../../engine/npc.js";
import { Player } from "../../../engine/player/player.js";
import { areCirclesColliding } from "../../../engine/collision/circle.js";

import FontBook from "../../../utils/fonts.js";
import * as theme from "../../../theme.js";

/**
 * ClassicTag.PlayScene
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
  constructor({ duration = 15 } = {}) {
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
    /** @type {GridGraphBFSField|null} */
    this.pathFieldFromPlayer = null;
    /** @type {GridGraphEuclideanField|null} */
    this.evadeFieldFromPlayer = null;

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
    this.pathFieldFromPlayer = new GridGraphBFSField(this.grid);
    this.evadeFieldFromPlayer = new GridGraphEuclideanField(this.grid);

    // --- Player ---
    const playerX = p5.width / 2;
    const playerY = p5.height / 2;

    this.player = new Player(p5, {
      x: playerX,
      y: playerY,
      mode: "pursuer",
      keyboard: this.inputs.keyboard,
      mouse: this.inputs.mouse, // not used by keyboard controller, but available for future
      radius: 20,
      colorKey: "pursuer",
      maxSpeed: 2.5,
      maxForce: 0.25,
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
      mode: "evader",
      maxSpeed: 2.5,
      maxForce: 0.25,
      effectivenessEvade: 0.9,
      effectivenessPursue: 0.9,
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
    this.pathFieldFromPlayer = null;
    this.evadeFieldFromPlayer = null;

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

    // --- Update phase ---
    if (
      this.grid &&
      this.pathFieldFromPlayer &&
      this.evadeFieldFromPlayer &&
      this.player
    ) {
      // 1) Distance field from player
      this.pathFieldFromPlayer.lazyCompute(this.player.agent.pos);
      this.evadeFieldFromPlayer.lazyCompute(this.player.agent.pos);

      // 2) Update player (input → intent → movement)
      this.player.update(p5, this.grid, this.distanceFromPlayer);

      // 3) Update NPC using shared nav + distance field + player agent
      if (this.npc) {
        this.npc.update(p5, {
          grid: this.grid,
          fields: {
            pathFromPlayer: this.pathFieldFromPlayer,
            evadeFromPlayer: this.evadeFieldFromPlayer,
          },
          playerAgent: this.player.agent,
        });
      }
      handleTagCollision(this.player, this.npc);
    }

    // --- Render phase ---
    p5.background(theme.colors.background);

    if (this.player) {
      this.player.draw(p5);
    }
    if (this.npc) {
      this.npc.draw(p5);
    }

    // Render time counter
    p5.push();
    {
      p5.textAlign(p5.LEFT, p5.TOP);
      if (!FontBook.isSentinel(this.font) && this.font !== null) {
        p5.textSize(theme.typo["mayas-script"].h1.size);
        p5.textFont(this.font);
      } else {
        p5.textSize(theme.typo["default"].h1.size);
      }
      p5.fill(
        secondsLeft > 10 ? theme.colors.textDefault : theme.colors.textBad
      );
      p5.textAlign(p5.LEFT, p5.BOTTOM);
      p5.text(`TIME: ${secondsLeft}`, p5.width - 200, 0 + 80);
    }
    p5.pop();

    // --- Scene transition on timeout ---
    if (secondsLeft === 0) {
      const scene =
        this.player.mode === "pursuer"
          ? "classic-tag-game.lose"
          : "classic-tag-game.win";
      return new SceneRequest(scene);
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

/**
 * Pairwise tag collision check for circle-represented characters
 *
 * @param {import('p5')} p5
 * @param {Player|NPC} character
 * @param {Player|NPC} otherCharacter
 */
function handleTagCollision(character, otherCharacter) {
  // No action if either doesn't have an agent
  if (!character.agent || !otherCharacter.agent) return;
  // No action if no collision
  if (!areCirclesColliding(character.agent, otherCharacter.agent)) return;
  // No action if mode is the same (nothing to transmit from one to the other)
  if (character.mode === otherCharacter.mode) return;
  // No action if transition is already happening.
  if (character.modeTransition || otherCharacter.modeTransition) return;

  character.setMode(otherCharacter.mode, 1250);
  otherCharacter.setMode(character.mode, 1250);
}
