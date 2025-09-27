import React from "react";
import { renderHook } from "@testing-library/react";
import { P5, useP5List } from "src/lib/p5";

describe("useP5List hook", () => {
  it("throws if used outside provider", () => {
    expect(() => renderHook(() => useP5List())).toThrow(
      /useP5List must be used inside <P5\.ContextProvider>/,
    );
  });

  it("returns [] with no canvases", () => {
    const wrapper = ({ children }) => (
      <P5.ContextProvider>{children}</P5.ContextProvider>
    );
    const { result } = renderHook(() => useP5List(), { wrapper });
    expect(result.current).toEqual([]);
  });
});
