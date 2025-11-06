# CART 253 – Making Challenge

Author: PHILIPPE HEBERT

## IdEas

### Side to side swinging tongue (spring)

**Details**

Have the tongue swing from left to right, either by winding it with the mouse or via some other event.

**Implementation:**

Find the equation for spring transversal movement, retrofit to p5 logic using a bezierCurve. Alternatively, to equation, dampen the arc motion over time with a lerp over 0, angle

### Snake-like tongue (moves left/right, tracing a path)

**Details**

Something like the classical snake game, but the tongue starts from the frog.
Then we can make it a puzzle by having some labyrinth and you can't collide with your tongue (game over).
The fly is somewhere that needs to be reached.

A more advanced version could have interactable elements + a rewind mechanic that may or may not affect the interactable elements.

**Implementation**

Assuming a grid, we can make the tongue turn at 90 angles only, which can be achieved with rectangles with rounded corners (radius = 1/2 smallest dimension (width) of tongue), printed over each other.


### Fly that grows bigger over time (and maybe the fly becomes the predator)?

**Details**

Be a fly, avoid the tongue to grow big enough to become the predator!

**Implementation**

Increase the shape of the ellipse over time, and make the fly controllable instead
of the frog.
Build a basic AI for the frog, or make this a two player game.


### Inverted game: The frog tries to eat on its own, but you gotta help it

**Details**

Move the frog to help it eat the fly!

**Implementation**

Variations:

- Drag and drop the frog with mousePressed, mouseReleased, and moving the frog along mouseX/mouseY; use keyPressed(left/right) to turn it towards the fly
- Drag and drop on a catapult with mousePressed/mouseReleased with delta(mouseX, mouseY) over time to throw the frog near to the fly. If you make it close enough (dist(fly, frog) <= value), the frog turns towards the fly and eats it.


### Inverted game: Hurl the frog using its tongue

**Details**

Mario64 has nothing on this one! Grab the frog by the tongue and spin it until
it squashes the fly with its tongue or itself!

**Implementation**

- Not sure how the input would work to make it feel diegetic
- Based on input, draw the frog sprite with a `rotate` call at a distance `dist` from the center, with the tongue being a rectangle in rectMode(CORNER) drawn from the center and rotated

### Inverted game: The fly tries to escape the frog (Yoshi’s Island)

**Details**

Get gulped by the frog, and try to escape its stomach!

**Implementation**

- Initial cutscene where the frog eats the fly
- Second scene where you are inside its stomach (https://www.youtube.com/watch?v=gzj1b8xWi2Q)


### Inverted game: The fly hunts the frog

**Details**

The horse fly wants its pound of flesh!
You are a frog chased by a big fat juicy fly too big to swallow. Gotta hide before it eats you away!

- Have safe zones (rectangles of different colors)
- Try to reach the end of the scrolling track without being eaten by the fly/flies

**Implementation**

- Sprites for frog jump used with `image`
- Sprites for fly flying, used with `image`
- Move using `keyPressed/keyIsDown/keyReleased`, with a clear cadence for the jumps
- Write some sort of proximity AI for the fly, where it leaves if you are hiding for long enough
- When fly position is on the frog, game over
- When reach end of scrolling, game won


###  Multiplayers game: Multiple frogs eat flies (like the crocodiles with marbles game)

![Guzzlin Gators](https://cf.geekdo-images.com/xZ2cRNNGRdWI9NTKrc-b8g__itemrep/img/4SUwT7gz-RcR0Vgkq9CvNUtz0Po=/fit-in/246x300/filters:strip_icc()/pic301385.jpg)

**Implementation:**

Multiplayer: Either use websockets + server (simple firestore will do) for real-time events to match the actions across multiple computer, or have different key maps per player on the same computer.

- let T = max tongue length
- let vectors: Map<flyId, vector> = vectors between the center of each fly and the current frog, filtered by max tongue length
- if any vector is matched by the tongue's vector (magnitude, angle), consider the fly caught by the frog
- add 1 to the score of that player
- whoever has caught more flies in within the time, wins


### Frog in a centrigual chamber / in a washing machine

Oh noes! The frog is now trapped in the washing machine. Better eat the flies or go hungry!
When the tub is turning, the tongue flaps against the centrifugal force. when the tub is not turning the frog is in the water and can aim up to get the flies

**Implementation**

- Use setInterval to set a recurring spin cycle
- Use setTimout to set the full time of a game
- Spin the frog using the angle * the time delta from the start of the cycle + `rotate` to rotate the sprite
- float the frog in the water using `sin`
- move the frog left and right using keyPressed/keyIsDown/keyReleased


### Frog in gradually heating up water

**Details**

The proverbial frog in boiling water.
Pesky flies keep holding up the switches that make the water heat up.
Catch them fast enough to prevent the water from reaching a boiling point!
Game over at boiling point, high score is time spent in water.


**Implementation**

- Use deltaTime to increase the time/score counter/ alternatively save the timestamp of start and delta with timestamp of end.
- float the frog in the water using `sin` and a bit of `rotate` to feel like waves
- Send the tongue up to catch the flies
- The flies by default will hoard on specific points which increase the temp
- When a fly is captured, it is removed from the switch.
- The difficulty comes from the fact that you are being swayed by the water, and the hotter it is, the more sway you have
  

### Frog in free fall (bottom-scroller/ top-down)

**Details**

Catch as many flies as you can until you meet your demise on the hard floor!
You can release your tongue like a rope, bit by bit, and it's blown by the wind upwards.

**Implementation**

- Tongue would be drawn using a bezierCurve, especially with it waving in the wind, and would be animated in cycle. The curve would probably be calculated based on the length.
- You can move left and right using the usual keyPressed/...
- If the tongue curve overlaps with a fly (probably would make a thin rectangle collision box, or if the curve can be plotted as a mathematical function, then we can check if the (x,y) position of the fly is on the tongue)

### Frog, as in the “frog” word

**Details**

You are the word frog, walking along the text of a Word document. Catch all the nits (dots) by colliding with them. The score is calculated based on how many dots you get within a set amount of time!

**Implementation**

- A lot of `text` usage
- Move your `frog` text across the lines using keyPressed/...
- Jump using a `y(t) = y0 + vy0*t + (1/2)*g*t^2` gravity equation
- No tongue, just collision between your `frog` word and the characters


### Frog chases fly, with hurdles along the way (side-scroll or top-scroll)

**Details**

Recreate the Chrome offline game, but you are a frog that wants to catch a fly!
If you catch the fly before the end of the level, you win. If you don't you lose!
Jump over obstacles to gain speed. Touch an obstacle to lose speed.

**Implementation**

- Jump using a `y(t) = y0 + vy0*t + (1/2)*g*t^2` gravity equation
- Scroll through a landscape of pre-determined objects
- Calculate collision and slowdown by checking overlap between the center/start/end of the frog and the object


### Another animal eats the frog / recursive eating

**Details**

The chain of predators!
Eat the flies as the frog to become a fox that eats frogs
Eat the frogs to become a wolf that eats foxes
etc.

**Implementation**

- Each animal has its own sprites & animation for moving
- Write an AI for each where they have "grazing" and "fleeing" mode
- Grazing is their default behaviour, with set patterns
- Fleeing calculates the next move depending on the direction of the predator.

### Color filters that make fly/tongue/frog show up/disappear (multiplayer? Think talk and nobody explodes)

**Details**

Two player game on two separate computers where one sees the fly, the other one sees the frog, or there's an invisible labyrinth that the other player sees.

**Implementation**

Multiplayer: Either use websockets + server (simple firestore will do) for real-time events to match the actions across multiple computers

- Matchmaking: Game allows to generate a unique id for your game. Send that link to your friend. Sender is automatically the frog, the other one the seer.
- Render the fly on one screen, the frog on the other screen. Use verbal communication to get closer to the fly. Shoot your tongue as usual to get the fly.
- Additional: Have color filters that can be applied as "dimensions" for an extra dimension to discuss (after x,y)


### Capitalist frog with tophat eats flies

**Details**

Start screen allows you to choose if you are born in a rich family, a middle class family, or a poor family of frogs.
The gameplay loop would be some busywork, like typing back the words on screen,
but you'd see your score versus that of the other wealthier/poorer, that get a lot more points per word typed. Each of the three wealth levels would be frogs eating flies, the wealthiest having reserves and reservces of flies.


### Fly bartender

**Details**

A game where you are a fly bartender at a frog bar, and you must serve your patron their requested drinks before they grow frustrated and eat you.

**Implementation**

- Lots of arts - fly bartender, 3-4 frogs with different clothings at the bar, the bar itself, the drink shelves, etc.
- Drag and drop ingredients in the drink (mousePressed, mouseReleased), with a shaking by checking for recent positions of mouse
- Recipes in a book for the steps for the right drink


### Pac Frog

**Details**

You are the Pac Frog!
Catch all the frogs (phantoms) before you are full from eating berries.
Phantoms have an algorithm to walk around, but evade you when you are in their line of sight. So you have to rest most of the time, and avoid being seen, then strike at the opportune moment.


**Implementation**

Use a grid:

```
const grid = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];
```

and determine an integer value for each type of element that can be on the game,

ex.

- 0 = walkable track
- 1 = wall

and then prevent walking on slots with non-walkable elements.

- Evade AI: Path traversal algorithm (graph) for the labyrinth to see the longest available path without cycle, then move in the direction opposite to the position of the player.


### Inverted game: A fly escaping a random field of frogs

**Details**

A game where you are a fly in the middle of the game, and turn by turn you can move one spot to reach a poop pile, but the whole canvas is populated by frogs, and there are a bunch of buttons randomly associated with the frogs, and you have to click one of them to see which frog will launch its tongue (and possibly eat you)

**Implementation**

- Use a grid like the one for the PacMan idea.
- Assign values for the content of every space (nothing, frog, poop)
- Use a combination of buttons around the canvas + CSS grid + addEventListener() to catch click on buttons
- Assign random action for a frog to each button.


### Minesweeper

**Details**

A minesweeper game where you are the fly, and every time you click to a new spot, if there’s a frog on your square you die. 

**Implementation**

- Use a grid like the one for the PacMan idea.
- Assign values for the content of every space (nothing, frog, poop)
- Show a press animation on mousePressed, and a symbol on the square on mouseRelease
- Use a breadth-first search algorithm to tag which spaces to reveal around the current space.