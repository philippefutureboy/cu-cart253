import React from "react";
import { renderHook } from "@testing-library/react";
import { P5, useP5 } from "src/lib/p5";

describe("useP5 hook", () => {
  it("throws if used outside provider", () => {
    expect(() => renderHook(() => useP5("foo"))).toThrow(
      /useP5 must be used inside <P5\.ContextProvider>/,
    );
  });

  it("returns defaults if no canvas with id", () => {
    const wrapper = ({ children }) => (
      <P5.ContextProvider>{children}</P5.ContextProvider>
    );
    const { result } = renderHook(() => useP5("missing"), { wrapper });
    expect(result.current.ready).toBe(false);
  });
});
