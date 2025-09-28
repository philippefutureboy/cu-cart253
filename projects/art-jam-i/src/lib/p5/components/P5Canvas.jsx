import {
  Children,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CanvasContext } from "../context/CanvasContext";
import { RegistryContext } from "../context/RegistryContext";
import p5js from "../p5";

export function Canvas({
  id,
  width,
  height,
  renderer = "P2D",
  className,
  style,
  children,
}) {
  const hostDivRef = useRef(null);

  // per-instance refs/state
  const p5Ref = useRef(null);
  const canvasRef = useRef(null);
  const preloadSpecRef = useRef({ fn: null, params: undefined });
  const setupSpecRef = useRef({ fn: null, params: undefined });
  const drawSpecRef = useRef({ fn: null, params: undefined });

  // boot + lifecycle flags
  const [bootReady, setBootReady] = useState(false); // gate first creation until after children effects
  const [instanceKey, setInstanceKey] = useState(0);
  const hasInstanceRef = useRef(false); // becomes true after the first successful create

  const { registerCanvas, updateCanvas, unregisterCanvas } =
    useContext(RegistryContext) || {};

  if (!registerCanvas) {
    throw new Error("<P5.Canvas> must be used inside <P5.ContextProvider>.");
  }
  if (!id) {
    throw new Error(
      "<P5.Canvas> requires an 'id' prop for multi-instance support.",
    );
  }

  // Boot barrier: allow children (Preload/Setup) to run their useEffect first
  useEffect(() => {
    setBootReady(true);
  }, []);

  const recreate = useCallback(() => {
    // Only recreate after an instance has actually been created
    if (hasInstanceRef.current) {
      // console.log("[P5.Canvas] recreate");
      setInstanceKey((k) => k + 1);
    }
  }, []);

  const setPreloadSpec = useCallback(
    (spec) => {
      const prev = preloadSpecRef.current;
      preloadSpecRef.current = spec || { fn: null, params: undefined };

      // Do NOT recreate during boot (first-time wiring).
      // After first instance exists, changing preload requires full recreate.
      const isInitialSet =
        !hasInstanceRef.current && !prev?.fn && !!preloadSpecRef.current.fn;
      if (!isInitialSet && hasInstanceRef.current) {
        recreate();
      }
    },
    [recreate],
  );

  const setSetupSpec = useCallback(
    (spec) => {
      const prev = setupSpecRef.current;
      setupSpecRef.current = spec || { fn: null, params: undefined };

      // Do NOT recreate during boot (first-time wiring).
      // After first instance exists, changing setup requires full recreate.
      const isInitialSet =
        !hasInstanceRef.current && !prev?.fn && !!setupSpecRef.current.fn;
      if (!isInitialSet && hasInstanceRef.current) {
        recreate();
      }
    },
    [recreate],
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

  // registry lifecycle
  useEffect(() => {
    registerCanvas(id, {
      p5Ref,
      canvasRef,
      ready: false,
      size: { width, height },
      setDraw,
      setPreloadSpec,
      setSetupSpec,
      recreate,
    });
    return () => unregisterCanvas(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // keep size up to date
  useEffect(() => {
    updateCanvas(id, { size: { width, height } });
  }, [id, width, height, updateCanvas]);

  // Create/recreate p5 instance (gated by bootReady)
  useEffect(() => {
    if (!bootReady) return; // wait for one tick so children can set specs

    const host = hostDivRef.current;
    if (!host) return;

    // Ensure no stale nodes are left (StrictMode / plugin side-effects)
    while (host.firstChild) host.removeChild(host.firstChild);

    const sketch = (p5) => {
      p5Ref.current = p5;

      // optional: support user preload if provided
      const { fn: preloadFn, params: plParams } = preloadSpecRef.current || {};
      if (preloadFn) {
        p5.preload = () => {
          try {
            return preloadFn(p5, plParams);
          } catch (e) {
            console.error(e);
          }
        };
      }

      p5.setup = () => {
        const rendererConst = renderer === "WEBGL" ? p5.WEBGL : p5.P2D;
        const cnv = p5.createCanvas(width, height, rendererConst);
        canvasRef.current = cnv.elt;

        const { fn: setupFn, params: sparams } = setupSpecRef.current || {};
        if (setupFn) Promise.resolve(setupFn(p5, sparams)).catch(console.error);

        const { fn: drawFn, params: dparams } = drawSpecRef.current || {};
        if (drawFn) {
          p5.draw = () => drawFn(p5, dparams);
          p5.loop();
        } else {
          p5.noLoop();
          p5.draw = () => {};
        }

        hasInstanceRef.current = true; // mark that we have created at least once
        updateCanvas(id, { ready: true });
      };
    };

    const inst = new p5js(sketch, host);

    return () => {
      updateCanvas(id, { ready: false });
      try {
        inst.remove();
      } catch {}
      if (p5Ref.current === inst) p5Ref.current = null;
      canvasRef.current = null;

      // Defensive clean
      while (host.firstChild) host.removeChild(host.firstChild);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootReady, instanceKey, width, height, renderer]);

  // Resize vs renderer change
  useEffect(() => {
    const inst = p5Ref.current;
    if (!inst) return; // don’t trigger recreate during boot

    const currentRenderer = inst._renderer?.GL?.RENDERER;
    const desired = renderer === "WEBGL" ? inst.WEBGL : inst.P2D;

    if (currentRenderer === desired) {
      inst.resizeCanvas(width, height);
      updateCanvas(id, { size: { width, height } });
    } else {
      recreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, renderer]);

  const canvasCtxValue = useMemo(
    () => ({ id, setPreloadSpec, setSetupSpec, setDraw, recreate }),
    [id, setPreloadSpec, setSetupSpec, setDraw, recreate],
  );

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
