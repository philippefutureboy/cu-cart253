import { Canvas } from "./components/P5Canvas";
import { Draw } from "./components/P5Draw";
import { Preload } from "./components/P5Preload";
import { Setup } from "./components/P5Setup";
import { ContextProvider } from "./context/RegistryContext";

import { useP5 } from "./hooks/useP5";
import { useP5List } from "./hooks/useP5List";

export const P5 = {
  ContextProvider,
  Canvas,
  Preload,
  Setup,
  Draw,
};

export { useP5, useP5List };
