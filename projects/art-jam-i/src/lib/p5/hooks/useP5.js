import { useContext, useMemo } from "react";
import { RegistryContext } from "../context/RegistryContext";

/**
 * Access a canvas entry by id: status + controls.
 */
export function useP5(id) {
  const reg = useContext(RegistryContext);
  if (!reg) throw new Error("useP5 must be used inside <P5.ContextProvider>.");

  const entry = reg.get(id);
  return useMemo(() => {
    if (!entry) return null;
    const {
      p5Ref,
      canvasRef,
      size,
      // scene controls
      setScene,
      preload,
      // events
      addEventListener,
      addEventListenerScoped,
      removeEventListener,
      // ready & anything else the canvas stores:
      ...rest
    } = entry;

    return {
      p5Ref,
      canvasRef,
      size,
      ready: !!entry.ready,
      currentScene: entry.currentScene || null,
      setScene,
      preload,
      addEventListener,
      addEventListenerScoped,
      removeEventListener,
      ...rest,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, reg.version]);
}
