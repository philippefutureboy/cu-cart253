class MouseCursor {
  draw() {
    const onCanvas =
      mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;

    if (onCanvas) {
      fill("white");
      textAlign(LEFT, BOTTOM);
      text(` (${Math.floor(mouseX)}, ${Math.floor(mouseY)})`, mouseX, mouseY);
    }
  }
}

const mouseCursor = new MouseCursor();

function setup() {
  createCanvas(600, 600);
}

function draw() {
  background(0);
  mouseCursor.draw();
}
