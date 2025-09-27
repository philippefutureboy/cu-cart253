import { useContext, useMemo } from "react";
import { RegistryContext } from "../context/RegistryContext";

/** Returns an array of registered canvas IDs. */
export function useP5List() {
  const regCtx = useContext(RegistryContext);
  if (!regCtx)
    throw new Error("useP5List must be used inside <P5.ContextProvider>.");
  return useMemo(() => Array.from(regCtx.registry.keys()), [regCtx.registry]);
}
