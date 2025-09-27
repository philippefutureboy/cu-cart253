import { useCallback, useMemo } from "react";
import Bar from "src/components/p5/components/bar";
import Encouragement from "src/components/p5/components/encouragement";
import Portrait from "src/components/p5/components/portrait";
import VideoOverlay from "src/components/p5/components/video-overlay";
import { P5 } from "src/lib/p5";
import "./App.css";

// FIXME: Dual canvas seem to interfere with clickCount

// constants

const FRAME_RATE = 60;
const HOLD_THRESHOLD = FRAME_RATE / 3;
const SECONDS_TO_FILL_BAR = 3;
const BAR_FILL_PERCENT_PER_FRAME = 1 / (FRAME_RATE * SECONDS_TO_FILL_BAR);
const ENCOURAGEMENT_DEFAULT_STYLE = {
  font: "Chalkduster",
  fontSize: 30,
  fontStyle: "NORMAL",
  textAlign: "CENTER",
  marginBottom: 10,
};
const ENCOURAGEMENT_ROTATING_STYLES = [
  ENCOURAGEMENT_DEFAULT_STYLE,
  {
    font: "Gill Sans",
    fontSize: 32,
    fontStyle: "ITALIC",
    textAlign: "CENTER",
    marginBottom: 10,
  },
  {
    font: "Chalkduster",
    fontSize: 30,
    fontStyle: "NORMAL",
    textAlign: "CENTER",
    marginBottom: 20,
  },
  {
    font: "Impact",
    fontSize: 24,
    fontStyle: "BOLD",
    textAlign: "CENTER",
    marginBottom: 5,
  },
];

// mouse helper state & functions

let mouseHasBeenDetected = false;
let clickCount = 0;
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
  // no previous press
  if (lastPress === null) {
    return false;
  }
  // we released already
  if (lastRelease !== null && lastRelease >= lastPress) {
    return false;
  }
  return true;
}

function isHeld(p5, holdThreshold = HOLD_THRESHOLD) {
  // has the press been long enough for us to acknowledge it?
  return isPressed() && p5.frameCount - lastPress >= holdThreshold;
}

function hasHeldInLastNFrames(p5, frames = 1, holdThreshold = HOLD_THRESHOLD) {
  // no previous release
  if (lastRelease === null) {
    return false;
  }
  // doesn't register as a press by our standards
  if (lastRelease - lastPress < holdThreshold) {
    return false;
  }
  // was last hold recent enough?
  return lastRelease > p5.frameCount - frames;
}

// timing functions

// returns how many debounce frames since initialFrame
function debounceIndex(p5, frames, initialFrame = 0) {
  return Math.floor((p5.frameCount - initialFrame) / frames);
}

// MAIN -----

function Project() {
  const [width, height] = [800, 800];
  const [portrait, bar, encouragement, videoOverlay] = useMemo(
    // portrait automatically resizes to canvas size based on provided padding
    () => [
      new Portrait({ globalStyles: { stroke: { color: "#000", weight: 1 } } }),
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
      // new GradientOverlay(),
      new VideoOverlay({
        uri: "src/assets/Pedro Krause - Transcendence - Limitless - h3p_9-R_siI.mp4",
      }),
    ],
    [width, height],
  );

  const preloadFn = useCallback(
    (p5) => {
      videoOverlay.preload(p5);
    },
    [videoOverlay],
  );

  const setupFn = useCallback(
    (p5) => {
      p5.background(255);
      p5.frameRate(FRAME_RATE);
      p5.mouseClicked = () => {
        lastClick = p5.frameCount;
        // oh boy, implicit typecast
        clickCount += isMouseInBounds(p5, width, height);
      };
      p5.mousePressed = () => {
        lastPress = p5.frameCount;
      };
      p5.mouseReleased = () => {
        lastRelease = p5.frameCount;
      };
      videoOverlay.setup(p5);
      // videoOverlay.play();
    },
    [width, height, videoOverlay],
  );

  const drawParams = useMemo(() => ({}), []);
  const drawFn = useCallback(
    (p5) => {
      const mouseDetected = hasMouseBeenDetected(p5);
      const mouseInBounds = isMouseInBounds(p5, width, height);

      p5.background(255);
      p5.push();
      p5.stroke("black");
      p5.ellipse(0, 0, 50, 50);
      p5.pop();
      portrait.draw(p5);
      // portrait.showMouth = true;
      // const [mouthX, mouthY] = [0.512 * width, 0.42 * height]; // approx, on fixed canvas size
      // portrait.drawMouth(p5, mouthX, mouthY);

      // ENCOURAGEMENT DRAW --------------------
      // if (mouseInBounds && isHeld(p5)) {
      //   if (bar.fillPercent !== 1) {
      //     encouragement.text = "Hold!";
      //     Object.assign(
      //       encouragement,
      //       ENCOURAGEMENT_ROTATING_STYLES[
      //         debounceIndex(p5, FRAME_RATE / 3, lastPress ?? 0) %
      //           ENCOURAGEMENT_ROTATING_STYLES.length
      //       ],
      //     );
      //   } else {
      //     Object.assign(encouragement, ENCOURAGEMENT_DEFAULT_STYLE);
      //     encouragement.text = "Release!";
      //   }
      // } else if (
      //   mouseInBounds &&
      //   !hasHeldInLastNFrames(p5, FRAME_RATE / 4 + 1) &&
      //   hasClickedInNFrames(p5, FRAME_RATE / 4)
      // ) {
      //   Object.assign(encouragement, ENCOURAGEMENT_DEFAULT_STYLE);
      //   const clickTexts = ["Click!", "Click?", "Try holding!"];
      //   encouragement.text = clickTexts[clickCount % clickTexts.length];
      //   encouragement.fontSize = 24;
      // }
      // encouragement.draw(p5);

      // VIDEO OVERLAY DRAW
      // videoOverlay.draw(p5);

      // GRADIENT DRAW --------------------
      // if (bar.superCharged && !isHeld(p5)) {
      //   gradient.draw(p5, { width, height }, mouseDetected, mouseInBounds);
      // }

      // CHARGING BAR DRAW --------------------

      // if mouse on canvas, fill bar slowly, else empty slowly
      // FIXME: Extract to Bar; but consider pattern implications
      if (!mouseDetected) {
        // do nothing
      } else if (mouseInBounds && isHeld(p5)) {
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
    [width, height, portrait, bar, encouragement, videoOverlay],
  );

  return (
    <P5.ContextProvider>
      <P5.Canvas
        id="art-jam-i"
        renderer={"WEBGL"}
        width={width}
        height={height}
      >
        <P5.Preload fn={preloadFn} />
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
