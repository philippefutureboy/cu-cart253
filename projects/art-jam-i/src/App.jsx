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
  const profilePic = useMemo(() => new ProfilePic(), []);

  const setupFn = useCallback((p5) => {
    p5.background(255);
    p5.frameRate(1);
  }, []);

  const drawParams = useMemo(() => ({}), []);
  const drawFn = useCallback(
    (p5) => {
      profilePic.draw(p5);
    },
    [profilePic],
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
