import { useContext, useEffect } from "react";
import { CanvasContext } from "../context/CanvasContext";

/**
 * <P5.Scene name cls>
 * Registers a scene class under a given name (or cls.scene).
 */
export function Scene({ name, cls }) {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error("<P5.Scene> must be used inside <P5.Canvas>.");

  const sceneName = name || (cls && cls.scene);

  useEffect(() => {
    ctx.registerScene(sceneName, cls);
    return () => ctx.unregisterScene(sceneName);
  }, [ctx, sceneName, cls]);

  return null;
}
