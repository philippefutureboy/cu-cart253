# CART 253 – Mod Jam Response

AUTHOR: Philippe Hébert

## Ima Williams' "Frog in a swamp"

**Links**:

  - Page: [Link](https://ima-cart.github.io/cart253/Jams/Mod-Jam/)
  - Repo: [Link](https://github.com/Ima-CART/cart253/tree/main/Jams/Mod-Jam)

Frog in a swamp is a charming little game with a nice use of images & shapes, but does suffer from some design issues and a little programming bug.

The title screen displays a cute little frog on a lily pad eating flies, and sets a friendly tone. The instructions are clear and feel a bit like a collage.
The design of the lily pads and the grass blades using arc & bezier curve respectively, is well done.

The use of a day/night cycle in the game to introduce bats is a great idea.
The bats however introduce a design problem: The bats are too fast for the tongue retraction, causing the player to be unable to react fast enough to avoid losing hit points. Also, the occasional bat will hit the frog body directly, which is completely unavoidable and removes agency from the player.

There's also a little bug on the title screen: the instruction button is only clickable on its top-left quadrant because in the code, the check for click is the following (`script.js:L612`):

```js
    mouseX < instructionsButton.x + instructionsButton.length / 2 &&
    mouseY < instructionsButton.y + instructionsButton.height / 2
```

when the correct check would be

```js
    mouseX >= instructionsButton.x &&
    mouseX <= instructionsButton.x + instructionsButton.length &&   
    mouseY >= instructionsButton.y &&
    mouseY <= instructionsButton.y + instructionsButton.height
```

Overall, Ima's submission is a fun little game with some charming graphical choices, with a few design flaws holding it back.
  
## Christie Leung's "goodnight frog"

**Links**:

  - Page: [Link](https://christieleung.github.io/cart253/assignments/mod-jam/)
  - Repo: [Link](https://github.com/christieleung/cart253/tree/main/assignments/mod-jam)

Christie follows up her serene/peaceful art jam with a cozy, bedtime relaxing game. Ever the design student, she mixes color choices with small design details to create a homey feel to her game.

Starting with her title screen, she uses muted colors, slow rotation on the lily pads, and vertical lines in the background to instill that relaxing feeling. The muted colors are less stimulating, the slow rotation gives a sense of calm waters, and the vertical lines in the background are reminescent of an old-school cottage wallpaper.

On the instruction screen, she leverages simple shapes and clear graphics to
accompany the text instructing how to play, making the instruction clear and easy to understand.

The main game is a lot more standard, and doesn't reinvent the wheel much, but still matches the tone of the rest of the game.
The use of bubbles around the flies reminds of how bubbles are often used to show sleepiness. The flies use a simple sinusoidal function for y positioning and changing speed to give different fly behaviours.

In the code, all the flies share the same object, and the object is reset every time a fly is either caught or exits the screen. This not the most optimal approach, as it doesn't allow to have multiple flies at the same time without having a new variable for each extra fly. A better approach would be to have a factory function, `createFly` that returns a fly object, and discard that object whenever the `resetFly` function would have been called.

The two end game screens are both cute with simple, chibi-style artwork of the frog, and continue to enhance the tone of the game.

In summary, Christie's game is great at creating a mood and maintaining it throughout the experience; the game could be a bit more bold when it comes to the game mechanics, and the code could be a bit better structure. Overall a nice little cozy experience.

## Lucas Meldrum's "FrogFrogFrog"

**Links**:

  - Page: [Link](https://lucasmeldrum.github.io/CART253/topics/assignments/mod-jam/)
  - Repo: [Link](https://github.com/LucasMeldrum/CART253/tree/main/topics/assignments/mod-jam)


Lucas' FrogFrogFrog entry brings a classical gaming twist to the entry with a multiphase boss.
His implementation is clear and clean, which shows his experience as a developer.

The title screen is simple, but conveys the theme of the game effectively.
The lack of instructions about controls however caused me confusion. I thought for a while
that there wasn't any left-right controls because the arrow keys wouldn't work. After
trying a bunch of other keys, I realized the control scheme was centered around WASD.
An improved version should stipulate that on an instruction screen or in the game itself.

The first phase of the game, prior to the boss, includes a few interesting additions:

- A glass jar for the caught flies, which while a bit weird, is an interesting choice nevertheless, and the effect of flies in the glass jar is also cool.
- Background music loop, which is a nice addition.

The movement of the flies in the first phase is as basic as can be, being fully linear.

Eating a fly triggers a series of events - first three captions are printed, and then a big fly (boss) appears with a change in tone. The music becomes stressful, and the tension rises up.
The boss is surprisingly cool, with three phases. I especially liked the part where the boss launches flies that act like homing missiles trying to hit you. This balances out the basic movement of flies in the phase one and is an interesting usage of a unique movement pattern.

The code is clear & clean, the structure is easy to follow, and well commented.
Like Christie, Lucas reuses the same fly object instead of recreating it, which could be an improvement.

Overall, Lucas' submission is dynamic and fun, and is well implemented.