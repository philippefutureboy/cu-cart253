# CART 253 – Mod Jam

Author: PHILIPPE HEBERT

[View this project online](https://philippefutureboy.github.io/cu-cart253/projects/mod-jam)

## Description

A Frog, lost in space, doomed to die.
Use (space) to launch/retract tongue, (← , ↑ , ↓ , →) to move the frog, and (z , x) to add angular velocity.
Try to catch as many flies as possible before your oxygen runs out, even if that may be pointless in the end.

## Creative process

Far from me the intention to create a doomer game, but the creative process and my discussions with
Pippin brought serendipitously brought me to this setting.

I wanted to experiment with the concept of a physics-simulated tongue, that would affect movement.
I wanted to make a movement scheme that would allow great depth with minimal control choices.

Originally, in my infinite scope-creep anti-wisdom, I wanted asteroids as well; the idea was to
have to avoid the asteroids with the janky controls to survive the longest.
But I quickly realized that I wouldn't have the capacity (time, energy) to pull this out; so I built
a simple "hunger" bar that would deplete steadily/refill when eating a fly.
After implementing it, I wasn't satisfied - what's the first thing that would actually run out in space?
Energy or oxygen? And so I converted the hunger bar to an oxygen timer.
The oxygen timer effectively sets the game duration, and so dooms the player to lose, no matter what.

In order to further the emotional narrative, following a discussion with Pippin, I also chose to
add the ability to scale back to very very large space viewport by moving to the boundaries of the screen.
This addition's intended goal is to make the player feel a sense of helplessness given the space is so
large that you soon lose sight of your own character.

## Improvements & Areas to Improve

### What have I improved since the Art Jam?

I think I've made a significant departure from my previous project, and that this is a great improvement. The improvements are mainly:

- Improved documentation & commits comments, integrating the creative process in the comments
- Improved player experience - the resulting experience is playable, coherent, and has an emotional tonality to it.
- Reduced complexity - Not only is my code leaner - less "frameworky", but I've also made a significant amount of decisions to arrive at something that was hard-to-achieve-but-still-achievable in the timeframe given.
- I think I made informed and tactical choices regarding my usage of AI, which allowed me to do things
  I clearly wouldn't have been able to do within the time frame without it.

### What can I still improve?
 
I must admit I still feel like I overcommitted comparatively to what I would have liked to invest.
I will carefully measure my decisions for the Variation Jam.

## Structure of the code

Simpler than the previous assignment, this project is still very ambitious (possibly moreso than the
previous one).
As such it became quickly impossible to hold all of the code in a single file.
I leveraged javascript's modules & browser support to split my code into more self-contained units of
logic.

You'll find:

```
.
├── main.js                              # Entrypoint of the code; the "main runner" so to speak
├── libraries
│   ├── p5.min.js
│   └── p5.sound.min.js
└── src
    ├── environments
    │   └── starry-sky.js                # The renderer for the stars in the background & ability to scale out
    ├── globals.js                       # Global constants and variables used across the project files.
    ├── objects
    │   ├── fly.js                       # Fly class
    │   └── frog.js                      # Frog class (FrogBody, FrogTongue) & its models/views
    ├── physics
    │   ├── functions.js                 # Physics utilities
    │   ├── models.js                    # Physic model base class
    │   ├── rope-pbd.js                  # Particle-Based Dynamics Rope, used as tongue
    │   ├── simulation.js                # Simulation class - Used for handling time/steps in physics simulation
    │   └── views.js                     # Phyics model view base class
    ├── ui
    │   ├── controls-hud.js              # Displays cues to the player for the controls
    │   ├── counter.js                   # Fly counter class
    │   ├── digital-clock-countdown.js   # Oxygen counter class
    │   ├── game-over-screen.js          # Game Over Screen class
    │   ├── hud.js                       # Heads-Up Display for debugging purposes
    │   └── title-screen.js              # Title Screen class
    └── utils
        ├── coordinates.js               # CoordinateBox/CoordinatePoint utility classes
        ├── drawing.js                   # A few p5 drawing helper functions
        ├── speech-synthesizer.js        # A class wrapping around the web standard SpeechSynthesis API
        └── tracer.js                    # A class to trace/debug and download the result as a file
```

### Attribution & GenAI

Any use of Generative AI will have proper attribution at the site of usage.

Overview of usage:

```
.
├── main.js                              # 10% or less – mainly the Simulation stepping
├── libraries
│   ├── p5.min.js
│   └── p5.sound.min.js
└── src
    ├── environments
    │   └── starry-sky.js                # 33% - SKY RENDER HELPERS section
    ├── globals.js                       # 0%
    ├── objects
    │   ├── fly.js                       # 20-25% - Tongue-stick handling
    │   └── frog.js                      # 35-37% - Anything related to physics/rope handling
    ├── physics
    │   ├── functions.js                 # 100%
    │   ├── models.js                    # 0%
    │   ├── rope-pbd.js                  # 100%
    │   ├── simulation.js                # 80% - I ported original logic from functional to oop
    │   └── views.js                     # 0%
    ├── ui
    │   ├── controls-hud.js              # 0%
    │   ├── counter.js                   # 0%
    │   ├── digital-clock-countdown.js   # 0%
    │   ├── game-over-screen.js          # 5% - GameOverScreenOverlay._drawColorFilter()
    │   ├── hud.js                       # 10% - Hud._drawSimDebugHud()
    │   └── title-screen.js              # 0%
    └── utils
        ├── coordinates.js               # 0%
        ├── drawing.js                   # 0%
        ├── speech-synthesizer.js        # 80% - I ported original logic from functional to oop
        └── tracer.js                    # 80% - I ported original logic from functional to oop
```

## License

_This project adheres to the [License section in the root README of this repository](https://github.com/philippefutureboy/cu-cart253/#License)._
