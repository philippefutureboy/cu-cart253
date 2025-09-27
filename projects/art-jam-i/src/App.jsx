import { useCallback, useMemo } from "react";
import Bar from "src/components/p5/bar";
import Encouragement from "src/components/p5/encouragement";
import Portrait from "src/components/p5/portrait";
import { P5 } from "src/lib/p5";
import "./App.css";

// constants

const FRAME_RATE = 60;
const SECONDS_TO_FILL_BAR = 3;
const BAR_FILL_PERCENT_PER_FRAME = 1 / (FRAME_RATE * SECONDS_TO_FILL_BAR);

// mouse helper state & functions

let mouseHasBeenDetected = false;
let lastClick = null;
let lastPress = null;
let lastRelease = null;

function hasMouseBeenDetected(p5) {
  if (!mouseHasBeenDetected) {
    // p5 seems to leave the mouseX and mouseY at 0,0 if the window is not focused
    mouseHasBeenDetected = p5.mouseX !== 0 || p5.mouseY !== 0;
  }
  return mouseHasBeenDetected;
}

function isMouseInBounds(p5, width, height) {
  return (
    p5.mouseX >= 0 &&
    p5.mouseX <= width &&
    p5.mouseY >= 0 &&
    p5.mouseY <= height
  );
}

function hasClickedInNFrames(p5, frames = 1) {
  return lastClick !== null && lastClick > p5.frameCount - frames;
}

function isPressed() {
  return (
    lastPress !== null && (lastRelease === null || lastRelease < lastPress)
  );
}

function hasReleasedInNFrames(p5, frames = 1) {
  return lastRelease !== null && lastRelease > p5.frameCount - frames;
}

function Project() {
  const [width, height] = [800, 800];
  const [portrait, bar, encouragement] = useMemo(
    // portrait automatically resizes to canvas size based on provided padding
    () => [
      new Portrait({ globalStyles: { stroke: { weight: 1 } } }),
      new Bar({
        x: 50,
        y: height - 50,
        w: width - 100,
        h: 40,
        padding: 5,
        fill: "#0f0",
      }),
      new Encouragement({
        fontSize: 30,
        fontStyle: "BOLD",
        textAlign: "CENTER",
      }),
    ],
    [width, height],
  );

  const setupFn = useCallback((p5) => {
    p5.background(255);
    p5.frameRate(FRAME_RATE);
    p5.mouseClicked = () => {
      lastClick = p5.frameCount;
    };
    p5.mousePressed = () => {
      lastPress = p5.frameCount;
    };
    p5.mouseReleased = () => {
      lastRelease = p5.frameCount;
    };
  }, []);

  const drawParams = useMemo(() => ({}), []);
  const drawFn = useCallback(
    (p5) => {
      const mouseDetected = hasMouseBeenDetected(p5);
      const mouseInBounds = isMouseInBounds(p5, width, height);

      p5.background(255);
      portrait.draw(p5);
      // portrait.showMouth = true;
      // const [mouthX, mouthY] = [0.512 * width, 0.42 * height]; // approx, on fixed canvas size
      // portrait.drawMouth(p5, mouthX, mouthY);

      if (
        mouseInBounds &&
        (isPressed(p5) || hasReleasedInNFrames(p5, FRAME_RATE / 4))
      ) {
        encouragement.text = "Hold!";
        encouragement.draw(p5);
      } else if (mouseInBounds && hasClickedInNFrames(p5, FRAME_RATE / 4)) {
        encouragement.text = "Click!";
        encouragement.draw(p5);
      }

      // if mouse on canvas, fill bar slowly, else empty slowly
      // FIXME: Extract to Bar; but consider pattern implications
      if (!mouseDetected) {
        // do nothing
      } else if (mouseInBounds && isPressed(p5)) {
        bar.fillPercent = Math.min(
          1,
          bar.fillPercent + BAR_FILL_PERCENT_PER_FRAME,
        );
      } else {
        bar.fillPercent = Math.max(
          0,
          bar.fillPercent - BAR_FILL_PERCENT_PER_FRAME,
        );
      }
      bar.draw(p5);
    },
    [width, height, portrait, bar, encouragement],
  );

  return (
    <P5.ContextProvider>
      <P5.Canvas id="art-jam-i" width={width} height={height}>
        <P5.Setup fn={setupFn} />
        <P5.Draw params={drawParams} fn={drawFn} />
      </P5.Canvas>
    </P5.ContextProvider>
  );
}

export default function App() {
  return (
    <>
      <div className="card">
        <Project />
      </div>
    </>
  );
}
