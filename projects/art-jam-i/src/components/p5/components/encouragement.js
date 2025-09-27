export default class Encouragement {
  constructor({
    text = null,
    font = "Chalkduster",
    fontSize = 12,
    fontStyle = "NORMAL",
    textAlign = "LEFT",
    marginBottom = 10,
  } = {}) {
    this.text = text;
    this.font = font;
    this.fontSize = fontSize;
    this.fontStyle = fontStyle;
    this.textAlign = textAlign;
    this.marginBottom = marginBottom;
  }

  draw(p5) {
    // no text to print
    if (!this.text) {
      return;
    }

    const x = p5.mouseX;
    const y = p5.mouseY - this.marginBottom;

    p5.push();
    p5.textFont(this.font);
    p5.textSize(this.fontSize);
    if (p5[this.fontStyle] === undefined) {
      throw new Error(`fontStyle '${this.fontStyle}' is not recognized by p5!`);
    }
    p5.textStyle(p5[this.fontStyle]);
    if (p5[this.textAlign] === undefined) {
      throw new Error(`textAlign '${this.textAlign}' is not recognized by p5!`);
    }
    p5.textAlign(p5[this.textAlign]);
    p5.text(this.text, x, y);
    p5.pop();
  }
}
