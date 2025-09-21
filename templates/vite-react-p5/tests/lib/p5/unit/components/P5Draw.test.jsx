import React from "react";
import { render } from "@testing-library/react";
import { P5 } from "src/lib/p5";

describe("<P5.Draw>", () => {
  it("mounts without crashing inside a canvas", () => {
    render(
      <P5.ContextProvider>
        <P5.Canvas id="foo" width={200} height={100}>
          <P5.Draw fn={() => {}} />
        </P5.Canvas>
      </P5.ContextProvider>
    );
  });
});
