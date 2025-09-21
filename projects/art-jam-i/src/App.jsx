import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import p5Logo from './assets/p5.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { P5 } from './lib/p5'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://p5js.org" target="_blank">
          <img src={p5Logo} className="logo p5" alt="p5.js logo" />
        </a>
      </div>
      <h1>Vite + React + P5</h1>
      <div className="card">
        <Example count={count} />
        <p>Count: {count}</p>
        <button onClick={() => setCount((count) => count + 1)}>
          Increase
        </button>
        <button onClick={() => setCount((count) => Math.max(0, count - 1))}>
          Decrease
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite, React and P5 logos to learn more
      </p>
    </>
  )
}

function Example({ count = 0, width = 400 , height = 400}) {
  // Use a ref to avoid extra rerenders; values persist within the session/page.
  const xsRef = useRef([]);
  const ysRef = useRef([]);

  // Calculate the default positions for our ellipses; we add 
  // Keep xsRef.current length in sync with `count` (session-stable randoms)
  useEffect(() => {
    const xs = xsRef.current;
    while (xs.length !== count) {
      if (xs.length < count) {
        xs.push(25 + Math.random() * (width - 50));
      } else {
        xs.pop()
      }
    }
    const ys = ysRef.current;
    while (ys.length !== count) {
      if (ys.length < count) {
        ys.push(25 + Math.random() * (height - 50));
      } else {
        ys.pop()
      }
    }
  }, [count, width, height]);

  // Wrap the setupFn in a useCallback to memoize it and avoid recreate canvas on every re-render
  const setupFn = useCallback((p5) => {
    p5.background(200)
  }, [])

  // Wrap drawParams in useMemo to stabilize on every render unless count changes
  const drawParams = useMemo(() => ({ count, xs: xsRef.current, ys: ysRef.current }), [count]);

  // Wrap the drawFn in useCallback because it is always stable across all render cycles
  const drawFn = useCallback((p5, { count, xs, ys }) => {
      p5.background(200);
      // Display {count} ellipses
      if (count === 0) return
      for (let i = 0; i < count; i++) {
        const indexHoverSpeed = p5.sin(i+1 * 0.25) || 0.1 // 0.1 as default speed
        const x = xs[i];
        const yHoverDelta = 10 * p5.sin(p5.frameCount * 0.05 * indexHoverSpeed)
        const y = ys[i] + yHoverDelta;
        p5.ellipse(x, y, 50, 50);
      }
  }, [])

  return (
    <P5.ContextProvider>
      <P5.Canvas id="demo" width={width} height={height}>
        <P5.Setup fn={setupFn} />
        <P5.Draw params={drawParams} fn={drawFn}/>
      </P5.Canvas>
    </P5.ContextProvider>
  );
}

export default App
