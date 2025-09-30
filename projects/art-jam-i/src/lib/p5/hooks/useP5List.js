import { useContext, useMemo } from "react";
import { RegistryContext } from "../context/RegistryContext";

/** Returns an array of registered canvas IDs. */
export function useP5List() {
  const reg = useContext(RegistryContext);
  if (!reg)
    throw new Error("useP5List must be used inside <P5.ContextProvider>.");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => reg.list(), [reg, reg.version]);
}
