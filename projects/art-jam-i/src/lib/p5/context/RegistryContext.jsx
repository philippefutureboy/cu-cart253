import React, { createContext, useCallback, useMemo, useState } from "react";

export const RegistryContext = createContext(null);

/**
 * Global provider that keeps a registry of canvases.
 * Each entry: id -> { p5Ref, canvasRef, ready, size, setDraw, setSetupSpec, recreate }
 */
export function ContextProvider({ children }) {
  const [registry, setRegistry] = useState(() => new Map());

  const registerCanvas = useCallback((id, api) => {
    setRegistry((prev) => {
      const next = new Map(prev);
      next.set(id, api);
      return next;
    });
  }, []);

  const updateCanvas = useCallback((id, patch) => {
    setRegistry((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.set(id, { ...prev.get(id), ...patch });
      return next;
    });
  }, []);

  const unregisterCanvas = useCallback((id) => {
    setRegistry((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ registry, registerCanvas, updateCanvas, unregisterCanvas }),
    [registry, registerCanvas, updateCanvas, unregisterCanvas]
  );

  return <RegistryContext.Provider value={value}>{children}</RegistryContext.Provider>;
}
