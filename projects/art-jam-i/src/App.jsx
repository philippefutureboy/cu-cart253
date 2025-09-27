import { useCallback, useMemo } from "react";
import "./App.css";
import Portrait from "./assets/portrait";
import { P5 } from "./lib/p5";

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

// Raycast helper: from (cx,cy) along angle 'deg', find distance to first hit on canvas rect.
function rayToCanvasDist(p5, cx, cy, width, height, deg) {
  const theta = p5.radians(deg); // p5 trig uses radians
  const L = Math.max(width, height) * 4; // long segment
  const x2 = cx + Math.cos(theta) * L;
  const y2 = cy + Math.sin(theta) * L;

  // Ask collide2D for intersection points with the canvas rect [0,width]x[0,height]
  const hit = p5.collideLineRect(cx, cy, x2, y2, 0, 0, width, height, true);

  // Collect any valid intersections and pick the nearest one along the ray
  const pts = [hit.top, hit.right, hit.bottom, hit.left].filter(
    (pt) => pt && pt.x !== false && pt.y !== false,
  );

  if (pts.length === 0) return 0; // shouldn't happen if the ray points toward the canvas

  let minD = Infinity;
  for (const pt of pts) {
    const dx = pt.x - cx,
      dy = pt.y - cy;
    // Only keep points in the *forward* direction of the ray
    if (dx * Math.cos(theta) + dy * Math.sin(theta) >= 0) {
      const d = Math.hypot(dx, dy);
      if (d < minD) minD = d;
    }
  }
  return minD === Infinity ? 0 : minD;
}

export default App;
