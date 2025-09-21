import React from "react";
import { render } from "@testing-library/react";
import { P5 } from "src/lib/p5";

describe("RegistryContext", () => {
  it("allows provider to render with no canvases", () => {
    render(<P5.ContextProvider><div>ok</div></P5.ContextProvider>);
  });
});
