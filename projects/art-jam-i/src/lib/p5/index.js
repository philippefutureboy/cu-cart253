import { Canvas } from "./components/P5Canvas";
import { Scene } from "./components/P5Scene";
import { ContextProvider } from "./context/RegistryContext";
import { useP5 } from "./hooks/useP5";
import { useP5List } from "./hooks/useP5List";

export const P5 = {
  ContextProvider,
  Canvas,
  Scene,
};

export * from "./types/scene";
export { useP5, useP5List };
