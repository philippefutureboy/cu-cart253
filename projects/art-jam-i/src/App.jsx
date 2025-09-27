import { useCallback, useMemo } from "react";
import Portrait from "src/components/p5/portrait";
import { P5 } from "src/lib/p5";
import "./App.css";

function App() {
  return (
    <>
      <div className="card">
        <Project />
      </div>
    </>
  );
}

function Project() {
  const [width, height] = [800, 800];
  const [mouthX, mouthY] = [0.512 * width, 0.42 * height];
  const portrait = useMemo(
    () => new Portrait({ globalStyles: { stroke: { weight: 1 } } }),
    [],
  );

  const setupFn = useCallback((p5) => {
    p5.background(255);
    p5.frameRate(60);
  }, []);

  const drawParams = useMemo(() => ({}), []);
  const drawFn = useCallback(
    (p5) => {
      p5.background(255);

      portrait.draw(p5);
      p5.push();
      p5.strokeWeight(2);
      p5.ellipse(mouthX, mouthY, 30, 30);
      p5.pop();
    },
    [mouthX, mouthY, portrait],
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

export default App;
