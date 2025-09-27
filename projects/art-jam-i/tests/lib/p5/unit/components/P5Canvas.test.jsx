import { cleanup, render, screen } from "@testing-library/react";
import { P5 } from "src/lib/p5";

afterEach(cleanup);

describe("<P5.Canvas>", () => {
  it("renders a div container", () => {
    render(
      <P5.ContextProvider>
        <P5.Canvas id="foo" width={200} height={100} />
      </P5.ContextProvider>,
    );

    const div = screen.getByTestId("p5-host-foo");
    expect(div).toBeInTheDocument();
  });

  it("unmounts cleanly", () => {
    const { unmount } = render(
      <P5.ContextProvider>
        <P5.Canvas id="foo" width={200} height={100} />
      </P5.ContextProvider>,
    );

    expect(() => unmount()).not.toThrow();
  });
});
