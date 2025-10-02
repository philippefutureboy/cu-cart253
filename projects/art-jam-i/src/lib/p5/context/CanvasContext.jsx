import { createContext } from "react";

/**
 * CanvasContext is used by components rendered as children of <P5.Canvas>,
 * such as <P5.Scene>, to register themselves and to access Canvas wiring.
 * Scene classes DO NOT consume this; they get a SceneContext instance instead.
 */
export const CanvasContext = createContext(null);
