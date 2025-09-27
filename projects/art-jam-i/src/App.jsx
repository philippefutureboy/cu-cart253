import { useCallback, useMemo } from "react";
import Bar from "src/components/p5/bar";
import Portrait from "src/components/p5/portrait";
import { P5 } from "src/lib/p5";
import "./App.css";

// constants
const FRAME_RATE = 60;
const SECONDS_TO_FILL_BAR = 3;
const BAR_FILL_PERCENT_PER_FRAME = 1 / (FRAME_RATE * SECONDS_TO_FILL_BAR);

// global state
let mouseDetected = false;

function Project() {
  const [width, height] = [800, 800];
  const portrait = useMemo(
    () => new Portrait({ globalStyles: { stroke: { weight: 1 } } }),
    [],
  );

  const bar = useMemo(
    () =>
      new Bar({
        x: 50,
        y: height - 50,
        w: width - 100,
        h: 40,
        padding: 5,
        fill: "#0f0",
      }),
    [width, height],
  );

  const setupFn = useCallback((p5) => {
    p5.background(255);
    p5.frameRate(FRAME_RATE);
  }, []);

  const drawParams = useMemo(() => ({}), []);
  const drawFn = useCallback(
    (p5) => {
      mouseDetected = mouseDetected || p5.mouseX + p5.mouseY !== 0;
      const mouseInBounds =
        p5.mouseX >= 0 &&
        p5.mouseX <= width &&
        p5.mouseY >= 0 &&
        p5.mouseY <= height;

      p5.background(255);
      portrait.draw(p5);
      // if mouse on canvas, fill bar slowly, else empty slowly
      if (!mouseDetected) {
        // do nothing
      } else if (mouseInBounds) {
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
      portrait.showMouth = true;
      const [mouthX, mouthY] = [0.512 * width, 0.42 * height];
      portrait.drawMouth(p5, mouthX, mouthY);
    },
    [width, height, portrait, bar],
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
