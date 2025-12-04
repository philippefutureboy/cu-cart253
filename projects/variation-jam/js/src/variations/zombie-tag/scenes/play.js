import { BaseScene, SceneRequest } from "../../../p5/scene.js";
import { KeyboardInput, MouseInput } from "../../../engine/inputs.js";
import { GridGraph } from "../../../engine/navigation/grid-graph.js";
import { GridGraphBFSField } from "../../../engine/navigation/distance-fields/bfs-field.js";
import { GridGraphEuclideanField } from "../../../engine/navigation/distance-fields/euclidean-field.js";
import NPC from "../../../engine/npc.js";
import { Player } from "../../../engine/player/player.js";
import { areCirclesColliding } from "../../../engine/collision/circle.js";

import FontBook from "../../../utils/fonts.js";
import SoundBook from "../../../utils/sounds.js";
import * as theme from "../../../theme.js";

/**
 * ZombieTag.PlayScene
 *
 * Runs the Zombie Tag game.
 * All of the other NPCs are infected, and all want to target you.
 * Originally I wanted to make a "classical schoolyard" type of zombie tag,
 * but with my limited time, and the possible complexity that would arise out
 * of having to make the NPCs switch target when the get close to other non-infected
 * NPCs, I figured it would be just easier to make all the NPCs zombies, and keep
 * only one GridGraphBFSField pointing towards the player.
 *
 * Turns out it was also a great opportunity to build a creepy game.
 *
 * Worked a bit on the NPCs to support applying temporary modifiers to their
 * speed/effectiveness/color to emulate "rusher" zombies when in proximity of the player.
 *
 * Plays a creepy background sound effect to get in the mood of horror;
 * Plays zombie sound effect whenever the player gets too close to a zombie.
 * The point of adding sound effects is to reinforce the feeling of being pursued by zombies.
 *
 * I'm pretty satisfied of the outcome!
 *
 * Leverages a whole game engine created using GenAI to manage NPC AI's and movement patterns.
 * @see src/engine
 *
 */
export default class PlayScene extends BaseScene {
  static key = "zombie-tag-game.play";
  static label = "Zombie Tag Game: Play Scene";

  /**
   * @param {Object} opts
   * @param {number} opts.duration How long this scenes stays up
   */
  constructor({ duration = 30 } = {}) {
    super();
    this.font = null;
    this.sceneDuration = duration;
    this._setupped = false;

    this.inputs = null;

    /** @type {Player|null} */
    this.player = null;
    /** @type {Array<NPC>|null} */
    this.zombies = null;
    /** @type {Array<number>|null} */

    /** @type {GridGraph|null} */
    this.grid = null;
    /** @type {GridGraphBFSField|null} */
    this.pathFieldFromPlayer = null;
    /** @type {GridGraphEuclideanField|null} */
    this.evadeFieldFromPlayer = null;

    /** @type {import('p5.sound').SoundFile|null} */
    this.zombieSoundEffect = null;
    /** @type {import('p5.sound').SoundFile|null} */
    this.creepyMusic = null;

    this.startAt = null;
  }

  /**
   * Load assets. Only once.
   *
   * @param {import("p5")} p5
   */
  setup(p5) {
    if (this._setupped) return;

    // Load font
    FontBook.getPromise("mayas-script").then((font) => {
      this.font = font;
    });

    // Load sounds
    SoundBook.load(
      p5,
      "zombie-growl",
      "assets/sounds/Minecraft zombie sound effect Youtube-79oF78kaQrk.mp3"
    ).then((soundFile) => {
      this.zombieSoundEffect = soundFile;
    });
    SoundBook.load(
      p5,
      "creepy-music",
      "assets/sounds/Creepy Bass Ambience - Sound Effect for editing Youtube-qUX2fT4H4L0.mp3"
    ).then((soundFile) => {
      this.creepyMusic = soundFile;
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
      mode: "evader",
      keyboard: this.inputs.keyboard,
      mouse: this.inputs.mouse, // not used by keyboard controller, but available for future
      radius: 20,
      colorKey: "evader",
      maxSpeed: 2.5,
      maxForce: 0.25,
    });

    // --- NPC initial position: random, not too close to player ---
    let nx = null;
    let ny = null;
    const margin = 40;
    const minDist = 120;

    this.zombies = [];
    this.zombieTimeouts = [];
    for (let i = 0; i < 30; i++) {
      while (true) {
        nx = p5.random(margin, p5.width - margin);
        ny = p5.random(margin, p5.height - margin);
        const dx = nx - playerX;
        const dy = ny - playerY;
        const distSq = dx * dx + dy * dy;
        if (distSq >= minDist * minDist) break;
      }
      this.zombies.push(
        new NPC(p5, {
          x: nx,
          y: ny,
          radius: 20,
          mode: "pursuer",
          maxSpeed: 0.4,
          maxForce: 0.5,
          fillColorKey: "pursuer",
          strokeColorKey: "pursuer",
          effectivenessPursue: 0.7,
        })
      );
    }

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
    this.zombies = null;

    this.grid = null;
    this.pathFieldFromPlayer = null;
    this.evadeFieldFromPlayer = null;

    this.startAt = null;
  }

  /**
   * Main loop
   *
   * Plays the creepy music,
   * Updates the zombies positions & behaviour,
   * Renders the zombies,
   * Renders the counter for the game duration.
   *
   * @param {import('p5')} p5
   */
  draw(p5) {
    // --- Scene timer ---
    this.startAt = this.startAt ?? new Date();
    const secondsElapsed = Math.floor((new Date() - this.startAt) / 1000);
    const sceneDuration = this.sceneDuration;
    const secondsLeft = Math.max(sceneDuration - secondsElapsed, 0);

    // --- Play Background Music ---
    if (!SoundBook.isSentinel(this.creepyMusic) && this.creepyMusic !== null) {
      if (!this.creepyMusic.isPlaying()) {
        this.creepyMusic.play(0, 1, 0.2);
      }
    }

    // --- Play Zombie Growl ---
    // Play on proximity.
    const zombieProximityFlags = this.zombies.map((zombie) => {
      // vectorial distance arithmetic
      let v1 = this.player.agent.pos;
      let v2 = zombie.agent.pos;
      let dx = v2.x - v1.x;
      let dy = v2.y - v1.y;
      let dist = p5.sqrt(dx * dx + dy * dy);
      return dist < this.player.radius + zombie.radius + 50;
    });
    const closeToZombie = zombieProximityFlags.some((v) => v);
    if (
      !SoundBook.isSentinel(this.zombieSoundEffect) &&
      this.zombieSoundEffect !== null
    ) {
      // At most once per sec
      if (closeToZombie && p5.frameCount % 60 === 0) {
        this.zombieSoundEffect.play();
      }
    }

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
      for (let [i, zombie] of (this.zombies ?? []).entries()) {
        if (zombie) {
          // 1 zombie out of 4 will start chasing the player
          // when the player gets too close.
          // Check is only done once per second to avoid doing 60 checks = 100%
          // conversion to aggressive zombie rate.
          // Gives the sense that the zombie go on a frenzy when they
          // pass by the player!
          if (
            p5.frameCount % 60 === 0 &&
            p5.random(0, 1) >= 0.75 &&
            zombieProximityFlags[i]
          ) {
            zombie.applyModifier(
              {
                // Sudden increase in speed & effectiveness to create rusher
                maxSpeed: 2,
                effectivenessPursue: 1,
                // Change the color to emphasize "berserker/rusher" mode.
                strokeColorKey: "superPursuer",
              },
              // pursue for anywhere between 3-10 seconds
              180 + p5.floor(p5.random(0, 420))
            );
          }
          // Update the zombie agent
          zombie.update(p5, {
            grid: this.grid,
            fields: {
              pathFromPlayer: this.pathFieldFromPlayer,
              evadeFromPlayer: this.evadeFieldFromPlayer,
            },
            playerAgent: this.player.agent,
          });
        }
        handleTagCollision(this.player, zombie);
      }
    }

    // --- Render phase ---
    // Black background to cause a visual shock and increase the tension
    p5.background("#000");

    if (this.player) {
      this.player.draw(p5);
    }
    for (let zombie of this.zombies ?? []) {
      if (zombie) {
        zombie.draw(p5);
      }
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
      p5.fill(secondsLeft > 10 ? theme.colors.textWhite : theme.colors.textBad);
      p5.textAlign(p5.LEFT, p5.BOTTOM);
      p5.text(`TIME: ${secondsLeft}`, p5.width - 200, 0 + 80);
    }
    p5.pop();

    // --- Scene transition on timeout ---
    if (secondsLeft === 0 || this.player.mode === "pursuer") {
      // Stop sound effects before transition not to have them bleed over
      if (
        !SoundBook.isSentinel(this.zombieSoundEffect) &&
        this.zombieSoundEffect !== null
      ) {
        this.zombieSoundEffect.stopAll();
      }
      if (
        !SoundBook.isSentinel(this.creepyMusic) &&
        this.creepyMusic !== null
      ) {
        this.creepyMusic.stopAll();
      }
      const scene =
        this.player.mode === "pursuer"
          ? "zombie-tag-game.lose"
          : "zombie-tag-game.win";
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
      // Stop any sound playing before transitioning
      // to avoid bleeding into the menu.
      if (
        !SoundBook.isSentinel(this.creepyMusic) &&
        this.creepyMusic !== null
      ) {
        this.creepyMusic.stopAll();
      }
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
function handleTagCollision(player, zombie) {
  // No action if either doesn't have an agent
  if (!player.agent || !zombie.agent) return;
  // No action if no collision
  if (!areCirclesColliding(player.agent, zombie.agent)) return;
  // No action if mode is the same (nothing to transmit from one to the other)
  if (player.mode === zombie.mode) return;
  // No action if transition is already happening.
  if (player.modeTransition || zombie.modeTransition) return;

  player.setMode(zombie.mode, 1250);
}
