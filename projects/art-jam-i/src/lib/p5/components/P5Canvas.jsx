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
import { AbstractP5Scene } from "../types/scene";
import { SceneContext } from "../types/scene-context";

// ---------- small helpers

const isFiniteNumber = (n) => typeof n === "number" && Number.isFinite(n);

/** True only if the concrete class defines the method on its own prototype (not inherited). */
const isOwnOverride = (inst, methodName) => {
  const Ctor = inst?.constructor;
  if (!Ctor || !Ctor.prototype) return false;
  return Object.prototype.hasOwnProperty.call(Ctor.prototype, methodName);
};

/** Throw a crisp error if a required scene method is missing. */
const ensureImplemented = (sceneName, inst, methodName) => {
  const fn = inst?.[methodName];
  if (typeof fn !== "function") {
    throw new Error(
      `Scene "${sceneName}" is missing required method: ${methodName}(). ` +
        `Did you extend AbstractP5Scene and implement ${methodName}()?`,
    );
  }
};

// ---------- component

/**
 * <P5.Canvas id width height renderer className style scene>
 * Children should be <P5.Scene> elements.
 */
export function Canvas({
  id,
  width,
  height,
  renderer = "P2D",
  className,
  style,
  scene, // initial or controlled scene name
  setup, // optional global setup: runs once per p5 instance before scenes
  children,
}) {
  if (!id) throw new Error("<P5.Canvas> requires an 'id' prop.");

  // Validate width/height early (clear errors instead of silent misbehavior)
  if (!isFiniteNumber(width) || !isFiniteNumber(height)) {
    throw new Error(
      `<P5.Canvas id="${id}"> requires numeric width/height; got width=${String(
        width,
      )}, height=${String(height)}`,
    );
  }

  // DOM host for p5 instance
  const hostDivRef = useRef(null);

  // p5 instance + canvas
  const p5Ref = useRef(null);
  const canvasRef = useRef(null);

  // global (non-scene) setup function
  const globalSetupRef = useRef(
    /** @type {null | ((p5:any, ctx:any)=>any)} */ (null),
  );

  // boot + recreate
  const [bootReady, setBootReady] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  // listeners: Map<eventName, Map<listenerId, fn>>
  const listenersRef = useRef(new Map());
  const sceneSubscriptionsRef = useRef(new Set()); // Set<() => void> auto-removed on scene switch

  // scenes: Map<name, { cls, instance?, status?:'idle'|'preloaded'|'setup', _setupRunning?:boolean }>
  const scenesRef = useRef(new Map());
  const preloadPromisesRef = useRef(new Map());
  const requestedPreloadsRef = useRef(new Set()); // preloads requested before p5 exists
  const currentSceneRef = useRef(null);

  const { registerCanvas, updateCanvas, unregisterCanvas } =
    useContext(RegistryContext) || {};
  if (!registerCanvas)
    throw new Error("<P5.Canvas> must be used inside <P5.ContextProvider>.");

  // internal refs
  const apiRef = useRef({
    setScene: /** @type {null | ((name:string)=>Promise<void>)} */ (null),
    preloadScene: /** @type {null | ((name:string)=>Promise<void>)} */ (null),
  });

  // ---- utilities

  const makeId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `l_${Math.random().toString(36).slice(2)}`;

  const addEventListener = useCallback((eventName, fn, opts = {}) => {
    if (!eventName || typeof fn !== "function") return () => {};
    let m = listenersRef.current.get(eventName);
    if (!m) {
      m = new Map();
      listenersRef.current.set(eventName, m);
    }
    const id = opts.id || makeId();
    m.set(id, fn);
    return () => {
      const mm = listenersRef.current.get(eventName);
      if (!mm) return;
      mm.delete(id);
      if (mm.size === 0) listenersRef.current.delete(eventName);
    };
  }, []);

  const removeEventListener = useCallback((eventName, id) => {
    const m = listenersRef.current.get(eventName);
    if (!m) return;
    m.delete(id);
    if (m.size === 0) listenersRef.current.delete(eventName);
  }, []);

  const addEventListenerScoped = useCallback(
    (eventName, fn, opts = {}) => {
      const unsub = addEventListener(eventName, fn, opts);
      sceneSubscriptionsRef.current.add(unsub);
      return () => {
        try {
          unsub();
        } finally {
          sceneSubscriptionsRef.current.delete(unsub);
        }
      };
    },
    [addEventListener],
  );

  const clearSceneSubscriptions = () => {
    for (const unsub of sceneSubscriptionsRef.current) {
      try {
        unsub();
        // eslint-disable-next-line no-empty
      } catch {}
    }
    sceneSubscriptionsRef.current.clear();
  };

  const dispatch = (eventName, arg) => {
    const m = listenersRef.current.get(eventName);
    if (!m || m.size === 0) return undefined;
    let anyTruthy = false;
    for (const fn of m.values()) {
      try {
        const res = fn(p5Ref.current, arg);
        if (res) anyTruthy = true;
      } catch (e) {
        console.error(`[P5.Canvas:${id}] listener error for ${eventName}`, e);
      }
    }
    return anyTruthy;
  };

  // ---- scene management

  const registerScene = useCallback(
    (name, cls) => {
      if (!name || !cls) return;
      if (!(cls.prototype instanceof AbstractP5Scene)) {
        console.warn(
          `[P5.Canvas:${id}] Scene "${name}" does not extend AbstractP5Scene`,
        );
      }
      if (!scenesRef.current.has(name)) {
        scenesRef.current.set(name, {
          cls,
          status: "idle",
          instance: null,
          _setupRunning: false,
        });
      } else {
        const rec = scenesRef.current.get(name);
        rec.cls = cls;
      }
    },
    [id],
  );

  const unregisterScene = useCallback((name) => {
    scenesRef.current.delete(name);
    if (currentSceneRef.current === name) {
      // leave selection to caller; or auto-switch if you prefer
    }
  }, []);

  const makeSceneContext = useCallback(() => {
    return new SceneContext({
      id,
      preload: async (name) => {
        const fn = apiRef.current.preloadScene;
        if (fn) return fn(name);
      },
      setScene: async (name) => {
        const fn = apiRef.current.setScene;
        if (fn) return fn(name);
      },
      addEventListener,
      addEventListenerScoped,
      removeEventListener,
    });
  }, [id, addEventListener, addEventListenerScoped, removeEventListener]);

  const preloadScene = useCallback(
    async (name) => {
      const rec = scenesRef.current.get(name);
      if (!rec) return;

      // If no p5 yet, remember to preload at setup time
      if (!p5Ref.current) {
        requestedPreloadsRef.current.add(name);
        return;
      }

      if (preloadPromisesRef.current.has(name))
        return preloadPromisesRef.current.get(name);

      const run = async () => {
        const p5 = p5Ref.current;
        if (!p5) return;
        if (!rec.instance) rec.instance = new rec.cls(p5, makeSceneContext());
        ensureImplemented(name, rec.instance, "preload");
        await rec.instance.preload(p5, makeSceneContext());
        rec.status = "preloaded";
      };

      const prom = run().catch((e) => {
        console.error(`[P5.Canvas:${id}] preload failed for "${name}"`, e);
        rec.status = "idle";
      });
      preloadPromisesRef.current.set(name, prom);
      return prom;
    },
    [id, makeSceneContext],
  );

  const setScene = useCallback(
    async (name) => {
      if (!name || currentSceneRef.current === name) return;
      const p5 = p5Ref.current;
      const next = scenesRef.current.get(name);
      if (!next) {
        console.warn(`[P5.Canvas:${id}] Unknown scene "${name}"`);
        return;
      }

      const prevName = currentSceneRef.current;
      const prev = prevName ? scenesRef.current.get(prevName) : null;

      // destroy previous (only if subclass overrides destroy)
      if (prev?.instance && isOwnOverride(prev.instance, "destroy")) {
        Promise.resolve(prev.instance.destroy(p5, makeSceneContext())).catch(
          (e) => console.error(`[P5.Canvas:${id}] destroy("${prevName}")`, e),
        );
      }
      clearSceneSubscriptions();

      // preload + setup next
      if (p5) {
        if (!next.instance)
          next.instance = new next.cls(p5, makeSceneContext());
        // preload if not yet done
        if (
          next.status !== "preloaded" &&
          isOwnOverride(next.instance, "preload")
        ) {
          await preloadScene(name);
        }
        // setup (required)
        ensureImplemented(name, next.instance, "setup");
        const maybeSetup = next.instance.setup(p5, makeSceneContext());
        if (maybeSetup && typeof maybeSetup.then === "function") {
          await maybeSetup;
        }
        next.status = "setup";
      } else {
        // no instance yet -> mark preload request
        requestedPreloadsRef.current.add(name);
      }

      currentSceneRef.current = name;
      updateCanvas(id, { currentScene: name });
    },
    [id, makeSceneContext, preloadScene, updateCanvas],
  );

  // Register the (preloadScene, setScene) functions to make them available to makeSceneContext
  useEffect(() => {
    apiRef.current.preloadScene = preloadScene;
  }, [preloadScene]);

  useEffect(() => {
    apiRef.current.setScene = setScene;
  }, [setScene]);

  // ---- boot barrier (let children register scenes first)
  useEffect(() => {
    setBootReady(true);
  }, []);

  // keep latest global setup in a ref (no rerender/recreate)
  useEffect(() => {
    globalSetupRef.current = typeof setup === "function" ? setup : null;
  }, [setup]);

  // ---- registry lifecycle
  useEffect(() => {
    registerCanvas(id, {
      p5Ref,
      canvasRef,
      ready: false,
      size: { width, height },
      // Public runtime methods through the registry/useP5
      setScene,
      preload: preloadScene,
      addEventListener,
      addEventListenerScoped,
      removeEventListener,
    });
    return () => unregisterCanvas(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // keep size up to date in registry
  useEffect(() => {
    updateCanvas(id, { size: { width, height } });
  }, [id, width, height, updateCanvas]);

  // ---- create / recreate p5 instance
  useEffect(() => {
    if (!bootReady) return;

    const host = hostDivRef.current;
    if (!host) return;

    while (host.firstChild) host.removeChild(host.firstChild);

    const sketch = (p5) => {
      p5Ref.current = p5;

      // Multiplexed events
      p5.mouseMoved = (e) => dispatch("mouseMoved", e);
      p5.mousePressed = (e) => dispatch("mousePressed", e);
      p5.mouseDragged = (e) => dispatch("mouseDragged", e);
      p5.mouseReleased = (e) => dispatch("mouseReleased", e);
      p5.doubleClicked = (e) => dispatch("doubleClicked", e);
      p5.mouseWheel = (e) => dispatch("mouseWheel", e);
      p5.keyPressed = (e) => dispatch("keyPressed", e);
      p5.keyReleased = (e) => dispatch("keyReleased", e);
      p5.keyTyped = (e) => dispatch("keyTyped", e);
      p5.touchStarted = (e) => dispatch("touchStarted", e);
      p5.touchMoved = (e) => dispatch("touchMoved", e);
      p5.touchEnded = (e) => dispatch("touchEnded", e);

      p5.setup = async () => {
        const rendererConst = renderer === "WEBGL" ? p5.WEBGL : p5.P2D;
        const cnv = p5.createCanvas(width, height, rendererConst);
        canvasRef.current = cnv.elt;

        // --- global (non-scene) setup hook, if provided
        const gsetup = globalSetupRef.current;
        if (gsetup) {
          try {
            const maybe = gsetup(p5, makeSceneContext());
            if (maybe && typeof maybe.then === "function") {
              await maybe;
            }
          } catch (e) {
            console.error(`[P5.Canvas:${id}] global setup() failed`, e);
          }
        }

        // Initial scene resolution
        const initialName =
          scene ||
          (scenesRef.current.size > 0
            ? Array.from(scenesRef.current.keys())[0]
            : null);

        if (initialName) {
          // instantiate + preload (if requested/available) + setup
          const rec = scenesRef.current.get(initialName);
          if (!rec.instance) rec.instance = new rec.cls(p5, makeSceneContext());

          // run any preloads requested before p5 existed
          if (
            requestedPreloadsRef.current.has(initialName) ||
            isOwnOverride(rec.instance, "preload")
          ) {
            // If subclass has its own preload, run it. We also honor prior preload requests.
            try {
              ensureImplemented(initialName, rec.instance, "preload");
              await rec.instance.preload(p5, makeSceneContext());
              rec.status = "preloaded";
            } catch (e) {
              console.error(`[P5.Canvas:${id}] preload("${initialName}")`, e);
            } finally {
              requestedPreloadsRef.current.delete(initialName);
            }
          }

          // setup (required)
          try {
            ensureImplemented(initialName, rec.instance, "setup");
            const maybeSetup = rec.instance.setup(p5, makeSceneContext());
            if (maybeSetup && typeof maybeSetup.then === "function") {
              await maybeSetup;
            }
            rec.status = "setup";
          } catch (e) {
            console.error(`[P5.Canvas:${id}] setup("${initialName}")`, e);
          }

          currentSceneRef.current = initialName;
          updateCanvas(id, { currentScene: initialName, ready: true });
        } else {
          updateCanvas(id, { ready: true });
        }

        // Single draw delegator (required)
        p5.draw = () => {
          const name = currentSceneRef.current;
          if (!name) return;
          const rec = scenesRef.current.get(name);
          if (!rec || !rec.instance) return;

          // Ensure one-time setup before first draw for this scene.
          if (rec.status !== "setup") {
            if (!rec._setupRunning) {
              rec._setupRunning = true;
              (async () => {
                try {
                  const p5i = p5;
                  // If scene overrides preload and hasn't been preloaded yet, do it now.
                  if (
                    isOwnOverride(rec.instance, "preload") &&
                    rec.status !== "preloaded"
                  ) {
                    await rec.instance.preload(p5i, makeSceneContext());
                    rec.status = "preloaded";
                  }
                  // Run setup exactly once.
                  ensureImplemented(name, rec.instance, "setup");
                  const maybe = rec.instance.setup(p5i, makeSceneContext());
                  if (maybe && typeof maybe.then === "function") await maybe;
                  rec.status = "setup";
                } catch (e) {
                  console.error(
                    `[P5.Canvas:${id}] setup-on-draw("${name}")`,
                    e,
                  );
                } finally {
                  rec._setupRunning = false;
                }
              })();
            }
            // Skip drawing until setup completes.
            return;
          }

          try {
            ensureImplemented(name, rec.instance, "draw");
            rec.instance.draw(p5, makeSceneContext());
          } catch (e) {
            // draw is required; surface error but keep loop running
            console.error(`[P5.Canvas:${id}] draw("${name}")`, e);
          }
        };
        p5.loop();
      };
    };

    const inst = new p5js(sketch, host);

    return () => {
      updateCanvas(id, { ready: false });
      try {
        inst.remove();
        // eslint-disable-next-line no-empty
      } catch {}
      if (p5Ref.current === inst) p5Ref.current = null;
      canvasRef.current = null;
      while (host.firstChild) host.removeChild(host.firstChild);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootReady, instanceKey, width, height, renderer, scene]);

  // ---- resize / renderer change
  useEffect(() => {
    const inst = p5Ref.current;
    if (!inst) return;

    const currentRenderer = inst._renderer?.GL?.RENDERER;
    const desired = renderer === "WEBGL" ? inst.WEBGL : inst.P2D;

    if (currentRenderer === desired) {
      if (isFiniteNumber(width) && isFiniteNumber(height)) {
        inst.resizeCanvas(width, height);
        updateCanvas(id, { size: { width, height } });
      }
    } else {
      // renderer changed -> recreate
      setInstanceKey((k) => k + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, renderer]);

  // ---- respond to controlled scene prop changes (no recreate)
  useEffect(() => {
    if (!bootReady || !p5Ref.current) return;
    if (!scene) return;
    if (scene !== currentSceneRef.current) {
      setScene(scene);
    }
  }, [scene, bootReady, setScene]);

  const canvasCtxValue = useMemo(
    () => ({
      id,
      registerScene,
      unregisterScene,
      // Exposed runtime controls for advanced use/components:
      setScene,
      preload: preloadScene,
      addEventListener,
      addEventListenerScoped,
      removeEventListener,
    }),
    [
      id,
      registerScene,
      unregisterScene,
      setScene,
      preloadScene,
      addEventListener,
      addEventListenerScoped,
      removeEventListener,
    ],
  );

  // Let children (e.g., <P5.Scene>) register themselves
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
