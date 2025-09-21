import { useContext } from "react";
import { RegistryContext } from "../context/RegistryContext";

/**
 * Access a p5 canvas by id. If id is omitted and there is exactly one canvas,
 * returns that one. If multiple exist and id is omitted, throws.
 */
export function useP5(id) {
  const regCtx = useContext(RegistryContext);
  if (!regCtx) throw new Error("useP5 must be used inside <P5.ContextProvider>.");

  const { registry } = regCtx;

  const entry =
    id != null
      ? registry.get(id)
      : registry.size === 1
      ? Array.from(registry.values())[0]
      : undefined;

  if (!entry) {
    if (id == null && registry.size > 1) {
      throw new Error("useP5(): multiple canvases found; pass an 'id' to select one.");
    }
    return { id, p5: null, canvas: null, ready: false, size: { width: 0, height: 0 } };
  }

  return {
    id,
    p5: entry.p5Ref?.current || null,
    canvas: entry.canvasRef?.current || null,
    ready: !!entry.ready,
    size: entry.size,
  };
}
