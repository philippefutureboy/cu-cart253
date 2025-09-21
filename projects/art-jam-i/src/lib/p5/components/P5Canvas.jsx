import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  Children,
} from "react";
import p5js from "p5";
import { RegistryContext } from "../context/RegistryContext";
import { CanvasContext } from "../context/CanvasContext";

/**
 * <P5.Canvas id width height renderer className style>
 * Children should include <P5.Setup/> and/or <P5.Draw/>, but any children are allowed.
 */
export function Canvas({ id, width, height, renderer = "P2D", className, style, children }) {
  const hostDivRef = useRef(null);

  // per-instance refs/state
  const p5Ref = useRef(null);
  const canvasRef = useRef(null);
  const setupSpecRef = useRef({ fn: null, params: undefined });
  const drawSpecRef = useRef({ fn: null, params: undefined });

  const [ready, setReady] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  const { registerCanvas, updateCanvas, unregisterCanvas } = useContext(RegistryContext) || {};

  if (!registerCanvas) {
    throw new Error("<P5.Canvas> must be used inside <P5.ContextProvider>.");
  }
  if (!id) {
    throw new Error("<P5.Canvas> requires an 'id' prop for multi-instance support.");
  }

  const recreate = useCallback(() => setInstanceKey((k) => k + 1), []);

  const setSetupSpec = useCallback(
    (spec) => {
      setupSpecRef.current = spec || { fn: null, params: undefined };
      // Contract: setup changes trigger full recreation
      recreate();
    },
    [recreate]
  );

  const setDraw = useCallback((fn, params) => {
    drawSpecRef.current = { fn, params };
    const inst = p5Ref.current;
    if (inst) {
      if (fn) {
        inst.draw = () => fn(inst, drawSpecRef.current.params);
        inst.loop();
      } else {
        inst.noLoop();
        inst.draw = () => {};
      }
    }
  }, []);

  // Register in global registry on mount; unregister on unmount
  useEffect(() => {
    registerCanvas(id, {
      p5Ref,
      canvasRef,
      ready: false,
      size: { width, height },
      setDraw,
      setSetupSpec,
      recreate,
    });
    return () => unregisterCanvas(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Keep size up to date in registry
  useEffect(() => {
    updateCanvas(id, { size: { width, height } });
  }, [id, width, height, updateCanvas]);

  // Create/recreate p5 instance when instanceKey/size/renderer change
  useEffect(() => {
    const host = hostDivRef.current;
    if (!host) return;

    const sketch = (p5) => {
      p5Ref.current = p5;

      p5.setup = () => {
        const rendererConst = renderer === "WEBGL" ? p5.WEBGL : p5.P2D;
        const cnv = p5.createCanvas(width, height, rendererConst);
        canvasRef.current = cnv.elt;

        // run user setup
        const { fn: setupFn, params: sparams } = setupSpecRef.current || {};
        if (setupFn) Promise.resolve(setupFn(p5, sparams)).catch(console.error);

        // bind user draw
        const { fn: drawFn, params: dparams } = drawSpecRef.current || {};
        if (drawFn) {
          p5.draw = () => drawFn(p5, dparams);
          p5.loop();
        } else {
          p5.noLoop();
          p5.draw = () => {};
        }

        setReady(true);
        updateCanvas(id, { ready: true });
      };
    };

    const inst = new p5js(sketch, host);

    return () => {
      setReady(false);
      updateCanvas(id, { ready: false });
      try {
        inst.remove();
      // eslint-disable-next-line no-unused-vars
      } catch (e) {
        // noop
      }
      if (p5Ref.current === inst) p5Ref.current = null;
      canvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceKey, width, height, renderer]);

  // By default, change in width/height/renderer => recreate
  // Handle resize / renderer change
  useEffect(() => {
    const inst = p5Ref.current;
    if (inst && (renderer === "WEBGL" ? inst.WEBGL : inst.P2D) === inst._renderer?.GL?.RENDERER) {
      // same renderer → resize only
      inst.resizeCanvas(width, height);
      updateCanvas(id, { size: { width, height } });
    } else {
      // renderer changed → must recreate
      recreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, renderer]);


  const canvasCtxValue = useMemo(
    () => ({ id, setSetupSpec, setDraw, recreate }),
    [id, setSetupSpec, setDraw, recreate]
  );

  // Let children render (Setup/Draw will hook via CanvasCtx)
  const renderedChildren = Children.map(children, (child) => child);

  return (
    <CanvasContext.Provider value={canvasCtxValue}>
      <div 
        ref={hostDivRef}
        className={className}
        style={style}
        data-testid={`p5-host-${id}`}
        suppressHydrationWarning
      />
      {renderedChildren}
    </CanvasContext.Provider>
  );
}
