/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useMemo, useRef, useState } from "react";

/**
 * Shape per canvas:
 * {
 *   p5Ref, canvasRef,
 *   ready: boolean,
 *   size: {width, height},
 *   setScene, preload, addEventListener, addEventListenerScoped, removeEventListener
 * }
 */
export const RegistryContext = createContext(null);

export function ContextProvider({ children }) {
  const [version, setVersion] = useState(0);
  const mapRef = useRef(new Map());

  const registerCanvas = useCallback((id, entry) => {
    mapRef.current.set(id, { ...(mapRef.current.get(id) || {}), ...entry });
    setVersion((v) => v + 1);
  }, []);

  const unregisterCanvas = useCallback((id) => {
    mapRef.current.delete(id);
    setVersion((v) => v + 1);
  }, []);

  const updateCanvas = useCallback((id, patch) => {
    const prev = mapRef.current.get(id);
    if (!prev) return;
    mapRef.current.set(id, { ...prev, ...patch });
    setVersion((v) => v + 1);
  }, []);

  const value = useMemo(
    () => ({
      registerCanvas,
      unregisterCanvas,
      updateCanvas,
      get: (id) => mapRef.current.get(id),
      list: () => Array.from(mapRef.current.keys()),
      version, // allow subscribers to react to changes
    }),
    [registerCanvas, unregisterCanvas, updateCanvas, version],
  );

  return (
    <RegistryContext.Provider value={value}>
      {children}
    </RegistryContext.Provider>
  );
}
