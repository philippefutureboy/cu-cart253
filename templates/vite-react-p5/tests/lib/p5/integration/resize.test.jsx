import React from "react";
import { render } from "@testing-library/react";
import { P5, useP5 } from "src/lib/p5";

// Test helper: display size info from useP5
function ShowSize({ id }) {
  const { size } = useP5(id);
  return <div data-testid={`size-${id}`}>{`${size.width}x${size.height}`}</div>;
}

describe("integration: resize behavior", () => {
  it("updates canvas size when width/height change", () => {
    const { rerender, getByTestId } = render(
      <P5.ContextProvider>
        <P5.Canvas id="foo" width={100} height={100}>
          <P5.Draw fn={() => {}} />
        </P5.Canvas>
        <ShowSize id="foo" />
      </P5.ContextProvider>
    );

    // initial size
    expect(getByTestId("size-foo").textContent).toBe("100x100");

    // change width/height props
    rerender(
      <P5.ContextProvider>
        <P5.Canvas id="foo" width={200} height={150}>
          <P5.Draw fn={() => {}} />
        </P5.Canvas>
        <ShowSize id="foo" />
      </P5.ContextProvider>
    );

    // should update without error
    expect(getByTestId("size-foo").textContent).toBe("200x150");
  });

  it("recreates canvas when renderer changes", () => {
    const { rerender, getByTestId } = render(
      <P5.ContextProvider>
        <P5.Canvas id="foo" width={100} height={100} renderer="P2D">
          <P5.Draw fn={() => {}} />
        </P5.Canvas>
        <ShowSize id="foo" />
      </P5.ContextProvider>
    );

    expect(getByTestId("size-foo").textContent).toBe("100x100");

    // Switch to WEBGL -> should trigger recreate, but still ends up with new size
    rerender(
      <P5.ContextProvider>
        <P5.Canvas id="foo" width={100} height={100} renderer="WEBGL">
          <P5.Draw fn={() => {}} />
        </P5.Canvas>
        <ShowSize id="foo" />
      </P5.ContextProvider>
    );

    // We can only assert that size info is still valid after recreate
    expect(getByTestId("size-foo").textContent).toBe("100x100");
  });
});
