# CART 253 – Art Jam Response

AUTHOR: Philippe Hébert

## Ima Williams' "The Ever So Changing Color Portrait"

**Links**:

  - Page: [Link](https://ima-cart.github.io/cart253/Jams/Art-Jam/)
  - Repo: [Link](https://github.com/Ima-CART/cart253/tree/main/Jams/Art-Jam)

**Review**:

Ima's piece was pretty impressive to me.

Ima's use of simple shapes to build a more complex & clearly recognizable human face/body
with a respectable amount of detail contrasted with my art jam submission and made me question my artistic process.

Indeed, having done a very literal self-portrait by drawing a vector over my own personal photo and importing it as an asset, I was impressed by how Ima was able to draw with ellipses, arcs, and simple vectorial shapes and create a believable avatar that takes inspiration from japanese mangas.

Also, while I did not understand at first, her use of changing color background as a way to signify that people are multifaceted/that others relate differently to them depending on their perspective is a deep bit of meaning to add to a small assignment like this!

Code-wise the code is well structured and simple to read. A few small improvements to suggest:

- In JavaScript, the casing convention for function names is in camelCase, not PascalCase
- Indentation could be improved, especially on comments which should be on the same level as the code they precede

So overall a cool project which made me reflect about my own artistic process!

(200 words)

## Christie Leung's "Art Jam!"

**Links**:

  - Page: [Link](https://christieleung.github.io/cart253/assignments/art-jam/)
  - Repo: [Link](https://github.com/christieleung/cart253/tree/main/assignments/art-jam)

**Review**:

Christie's piece is \*adorable\*! 😄

Her use of a serene/peaceful expression, of an enveloping/voluminous & velvety "mane" of hair evoking the feeling of a heavy duvet cover, and the little snowflakes turning into flowers makes the piece soothing. The piece evokes the experience of a good hot-cocoa while watching the snow fall, or of reading a book sitting against a tree in the early summer, surrounded by greenery and flowers (I hadn't read the code when I wrote this, I swear!)

When it comes to the code, it is well structured, and satisfies the expectations for someone who is new to coding. A few suggested improvements:

- L569-577,L580-632: Could be simplified significantly using an array of dots & for-of loop;
- L25-238: The use of top-of-file objects that are constants and used in a single spot is redundant (DRY principle); albeit it does add clarity
  at the usage site

In conclusion, I think this piece speaks to Christie's soft and bubbly personality just as much as it speaks to her design background. I was impressed by the simplicity of the shapes vs the amount they were able to convey on an emotional & visual vocabulary level.

(194 words)


## Lucas Meldrum's "MEyes Portrait"

**Links**:

  - Page: [Link](https://lucasmeldrum.github.io/CART253/topics/assignments/art-jam/)
  - Repo: [Link](https://github.com/LucasMeldrum/CART253/tree/main/topics/assignments/art-jam)

**Review**:

My first experience with Lucas' piece left me impressed, amused, perplexed, and curious:

- Impressed: I was surprised that anyone decided to do 3D.

- Amused: The piece is playful; lots of colors, simple shapes & bounciness used for comedic effect.

- Perplexed: The piece felt a bit disconnected from the idea of a self-portrait (in any 
  literal/close-to-literal sense).

- Curious: Before I knew of the Art Reponse assignement, I already checked his code
  because I wanted to understand how he built it.

Reading the code, I was impressed by its:

- Cleanliness: Proper style, clear use of comments & empty lines to define logical blocks
  
- Elegance in simplicity: I was impressed by Lucas' use of trigonometry to display objects
  in a spherical fashion (fn drawSphere, L111), as well as his use of scale with frameCount with pulse as a guard (L93-96).

Lucas' piece clearly demonstrates his technical knowhow as a Comp-Sci joint major.

(148 words)

## Word Count - Total

(542 words)

---

## Additional note

I've noticed in both Christie and Lucas' work, they both reuse the same object to draw
in multiple places, updating the state of the object between each draw of the same object.
That's peculiar, but could be seen as a form of memory optimization. I'll remember that!