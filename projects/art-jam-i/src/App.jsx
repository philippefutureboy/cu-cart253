import { useCallback, useMemo } from 'react';
import './App.css';
import ProfilePic from './assets/profile-pic';
import { P5 } from './lib/p5';

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
  const profilePic = useMemo(() => new ProfilePic(), []);

  const setupFn = useCallback((p5) => {
    p5.background(255);
    p5.frameRate(60);
  }, []);

  const drawParams = useMemo(() => ({}), []);
  const drawFn = useCallback(
    (p5) => {
      p5.background(255);
      p5.push();
      p5.angleMode(p5.DEGREES);
      p5.colorMode(p5.HSB, 100);
      p5.noStroke();
      const hueStartAngle = p5.frameCount % 365;
      const mapper = (angle) => p5.map(angle, 0 - hueStartAngle, 365 - hueStartAngle, 0, 100);
      for (let i = 0; i < 365; i++) {
        p5.fill(p5.color(mapper(i), 80, 80, 80));
        p5.arc(p5.mouseX, p5.mouseY, width, height, i, i + 1);
      }

      // p5.colorMode(p5.HSB, 100);
      // const hue = p5.map(p5.constrain(p5.mouseX, 0, width), 0, width, 0, 100);
      // const saturation = p5.map(p5.constrain(p5.mouseY, 0, height), 0, height, 0, 100);
      // // console.log(p5.mouseX, p5.mouseY);
      p5.pop();

      profilePic.draw(p5);
      p5.push();
      p5.strokeWeight(2);
      p5.ellipse(mouthX, mouthY, 30, 30);
      p5.pop();
    },
    [width, height, mouthX, mouthY, profilePic],
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
