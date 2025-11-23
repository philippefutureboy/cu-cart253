# Variation Jam

[View this project online](https://philippefutureboy.github.io/cu-cart253/projects/variation-jam)

## Description

We're playing tag with this one. Wacky, surprising, weird, normal, all sorts of tag!
Each game plays fairly differently.

## Screenshots

TODO

## Variations

**Classic Tag** 

1-1 old-fashioned tag. Touch the adversary to make it "it", and vice-versa.
Time-bound to make games short-and-sweet, especially given the visual and game mechanic simplicity.

**Clock Tag**

As a child, ever looked at a traditional clock and followed the clock's seconds hand with intense
focus, impatiently awaiting for it to reach a certain time - either the minute mark, or the other hands
themselves, and rejoice of yet another turn around the clock?

Well this game is just that. Watch the seconds hand try to get to the minutes/hours hand in time, 
but with only 15 seconds to spare!

Ultimately this is a waiting game, and does not provide much agency to the player.
The only action the player can take is to choose when to start a game.
This leads to interesting emotional responses - confusion (no controls?), frustration (can't make it go faster?),
confusion again (I won? I lost?), frustration again (what kind of game is that?), but also comedy
(this is stupid and funny (especially with the soundtrack)) and curiosity (is there an Easter egg?
What does winning/losing look like?).

## Creative Process

I was really excited for this variation jam! 
Really. I think the idea of exploring all the wacky, surprising ways that you can stretch
a simple game to learn the medium of Game Design is an absolutely great idea.
I think this approach really creates stronger Game Design (Artists?) because it practices the fundamentals
of interactivity and the exploration of the medium, and helps create game makers who can build
strong games without relying on good graphics & flashy juiciness to create great experiences.

In this spirit, I wanted to find the simplest idea possible, which required the least visual flair
to work. I did a few Google Search for "simple games", "children games", "simple board games", and
I found the "tag" game (someone is it, touches another person, and that person becomes it) a very
fertile ground for ideas.

So I did a little brainstorm of ideas, trying to stretch the idea of "tag" across as many dimensions
as possible to distill what the game of "tag" is, and how far I can get before the game loses its
essence. I came with the conclusion that "tag" was a game of pursuing, catching, and evading.
With this distilled essence, I was able to expand my horizons.

Given the tag game is a children's game, I wanted to keep my project lighthearted, humorous, and
a bit taunting. So quickly my mind gravitated to the Impossible Quiz (a classic), and I took the
aesthetic from there.

### Developping the Game AI Engine

This is my first steps into the world of in-game AIs and state machines.
I knew this would be a complex endeavour, and indeed it was!
This being said, in comparison to making the FrogFrogFrog physics-simulated tongue,
this was a lot easier.

Having learnt data structures in SOEN back in 2013, and knowing a good deal about Graphs and Graph
theory, I had a solid inkling that movement would be done using a distance calculation algorithm,
like Djikstra's distance algorithm, on a grid-based graph of nodes with edges to all their neighbours.

What was fuzzier was what would be the appropriate design patterns to employ to bridge this pathfinding
algorithm with the in-game NPC and the display logic.

The resulting engine was developed entirely using GenAI and can be found under `js/src/engine`.

## Improvements & Areas to Improve

### What have I improved since the Mod Jam?

TODO

### What can I still improve?

TODO

## Structure of the code

While more complex at a glance than the Mod Jam, I think that when it comes down to the details, 
this project is a lot simpler in implementation & conceptually than the Mod Jam.

TODO

```
TODO FILETREE
```


## Attribution & GenAI

### Assets

TODO

### Distribution of GenAI Contributions Across Files

TODO

<!-- This bit should attribute any code, assets or other elements used taken from other sources. For example:

> - This project uses [p5.js](https://p5js.org).
> - The clown image is a capture of the clown from the Apple emoji character set.
> - The barking sound effect is "single dog bark 1" by crazymonke9 from freesound.org: https://freesound.org/people/crazymonke9/sounds/418107/ -->

## License

_This project adheres to the [License section in the root README of this repository](https://github.com/philippefutureboy/cu-cart253/#License)._
