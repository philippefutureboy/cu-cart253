import { createContext } from "react";

/**
 * Per-canvas context so <P5.Setup> / <P5.Draw> target their owning canvas.
 * value: { id, setSetupSpec, setDraw, recreate }
 */
export const CanvasContext = createContext(null);
