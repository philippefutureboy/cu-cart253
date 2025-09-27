import React from "react";
import { render } from "@testing-library/react";
import { P5, useP5List } from "src/lib/p5";

function ListIds() {
  const ids = useP5List();
  return <div data-testid="ids">{ids.join(",")}</div>;
}

describe("integration: multiple canvases", () => {
  it("registers multiple canvases in registry", () => {
    const { getByTestId } = render(
      <P5.ContextProvider>
        <P5.Canvas id="a" width={100} height={100}>
          <P5.Draw fn={() => {}} />
        </P5.Canvas>
        <P5.Canvas id="b" width={200} height={200}>
          <P5.Draw fn={() => {}} />
        </P5.Canvas>
        <ListIds />
      </P5.ContextProvider>,
    );

    const ids = getByTestId("ids").textContent;
    expect(ids).toContain("a");
    expect(ids).toContain("b");
  });
});
