import Scene1 from "src/components/p5/scenes/scene-1.mjs";
import { FRAME_RATE } from "src/constants";
import { P5 } from "src/lib/p5";
import "./App.css";

// MAIN -----

function setup(p5) {
  p5.frameRate(FRAME_RATE);
}

function Project() {
  const [width, height] = [1280, 720];

  return (
    <>
      <P5.Canvas
        id="art-jam-i"
        renderer={"WEBGL"}
        width={width}
        height={height}
        setup={setup}
      >
        <P5.Scene cls={Scene1} />
      </P5.Canvas>
    </>
  );
}

export default function App() {
  return (
    <>
      <div className="card">
        <P5.ContextProvider>
          <Project />
        </P5.ContextProvider>
      </div>
    </>
  );
}
