import { useContext, useEffect } from "react";
import { CanvasContext } from "../context/CanvasContext";

/** Use inside <P5.Canvas> to define the setup routine (triggers full recreate on change). */
export function Preload({ fn, params }) {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error("<P5.Preload> must be used inside <P5.Canvas>.");

  useEffect(() => {
    ctx.setPreloadSpec({ fn, params });
    // Full recreate happens inside setPreloadSpec -> recreate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn, params]);

  return null;
}
