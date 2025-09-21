import { useContext, useEffect } from "react";
import { CanvasContext } from "../context/CanvasContext";

/** Use inside <P5.Canvas> to define the draw routine (hot-swappable without recreate). */
export function Draw({ fn, params }) {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error("<P5.Draw> must be used inside <P5.Canvas>.");

  useEffect(() => {
    ctx.setDraw(fn, params);
    return () => ctx.setDraw(null, undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn, params]);

  return null;
}
