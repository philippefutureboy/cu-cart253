# React-P5 Declarative Integration

This package provides a **declarative React integration for p5.js**, designed as a more flexible and composable alternative to [`@p5-wrapper/react`](https://github.com/p5-wrapper/react).

It enables you to use `p5` sketches directly inside React applications in a way that feels idiomatic: components, hooks, and context providers rather than imperative setup.

---

## ✨ Key Advantages Over `@p5-wrapper/react`

- **Declarative API**  
  Define `<P5.Setup>` and `<P5.Draw>` directly inside JSX. Lifecycle is tied to React’s reconciliation, not imperative re-instantiation.

- **Hot-swap draw functions**  
  Replace `<P5.Draw fn={...} />` on the fly without tearing down the canvas. Enables **multi-scene** workflows and interactive transitions.

- **Multiple p5 instance support**  
  Use `<P5.Canvas id="...">` to mount multiple independent canvases. Each canvas is registered in global context for hooks and management.

- **React state & interactivity**  
  Pass `params` into setup/draw functions. Combine with React state, props, or context to declaratively control visual state. Ideal for building **data models** or **state-driven scenes**.

- **Easy integration in React apps**  
  Fits into existing component trees and tooling (Vite, Babel, Jest). Plays nicely with standard React patterns (hooks, context, state).

- **Extends p5 with modern app features**  
  Because you are in React, you can seamlessly integrate:  
  - Network requests (REST, GraphQL, etc.)  
  - Local caching and persistence (React Query, SWR)  
  - Real-time multiplayer via WebSockets or WebRTC  

  ```jsx
  import { P5 } from "src/lib/p5";
  import { useState, useEffect } from "react";

  function MultiplayerCanvas({ socket }) {
    const [players, setPlayers] = useState({});

    useEffect(() => {
      socket.on("players:update", (payload) => setPlayers(payload));
    }, [socket]);

    return (
      <P5.Canvas id="game" width={800} height={600} renderer="WEBGL">
        <P5.Setup fn={(p5) => p5.background(0)} />
        <P5.Draw fn={(p5) => {
          p5.background(0);
          Object.values(players).forEach(({ x, y }) => {
            p5.ellipse(x, y, 20, 20);
          });
        }} />
      </P5.Canvas>
    );
  }
````

---

## 📦 Installation

This code lives inside your project under `src/lib/p5`.
No npm install step is required, but you do need `p5`:

```bash
npm install p5
```

---

## 🚀 Basic Usage

```jsx
import { P5 } from "src/lib/p5";

function Example() {
  return (
    <P5.ContextProvider>
      <P5.Canvas id="demo" width={400} height={300}>
        <P5.Setup fn={(p5) => p5.background(200)} />
        <P5.Draw fn={(p5) => {
          p5.background(200);
          p5.ellipse(p5.width / 2, p5.height / 2, 50, 50);
        }} />
      </P5.Canvas>
    </P5.ContextProvider>
  );
}
```

### Hooks

* `useP5(id)` → access `{ ready, p5Ref, canvasRef, size }` for a specific canvas
* `useP5List()` → get an array of all registered canvas IDs

---

## ⚠️ Limitations & Disadvantages

* **SSR caveats**: p5 requires DOM APIs. This lib guards against hydration mismatches, but server-side rendering won’t render sketches. Use `typeof window !== "undefined"` to defer if needed.
* **No pixel snapshots in tests**: The Jest setup mocks p5. Automated tests validate lifecycle/registry logic, not actual rendering output.
* **Draw hot-swap is one-at-a-time**: Only the most recent `<P5.Draw>` child defines `draw`. You can replace dynamically but not run multiple draws in parallel.
* **Canvas resize vs recreate**: Changing `width/height` resizes, but changing renderer (`P2D` ↔ `WEBGL`) forces a full re-create.

---

## 📖 API Reference

### `<P5.ContextProvider>`

Global registry provider. Wrap once near the root of your app.

### `<P5.Canvas id width height renderer className style>`

Mount a p5 canvas.

* `id` (string) – required, unique
* `width`, `height` (number) – canvas size
* `renderer` (`"P2D" | "WEBGL"`) – defaults to `"P2D"`

### `<P5.Setup fn params />`

One-time setup function. Changing `fn` triggers full canvas recreate.

### `<P5.Draw fn params />`

Draw loop function. Changing `fn` hot-swaps without recreate.

### `useP5(id)`

Access registry entry for a given canvas:

```ts
{
  ready: boolean;
  p5Ref: Ref<p5|null>;
  canvasRef: Ref<HTMLCanvasElement|null>;
  size: { width: number, height: number };
}
```

### `useP5List()`

Returns all registered canvas IDs.

---

## 👥 Attribution

* **Primary Architect**: Philippe Hébert
* **Primary Implementer**: ChatGPT (OpenAI)
* Original design rationale and conversation logs are available in:
  `src/lib/p5/ATTRIBUTION/*.html`

---

## 📄 License

MIT

This code was written primarily by ChatGPT (OpenAI). Works generated entirely by a machine without human creative input are generally not copyrightable.
That means there might be no copyright holder at all, and the output may effectively be in the public domain.

This being said, I, as the author, Philippe Hebert, have made some creative choices, especially around architecting/directing
the structure of this solution, and as such, I am de-facto the "author" of this work.
This being said, given that ChatGPT is trained using the work of countless developers, most of then time irrespectively of licensing, I also included "The Internet Collective" as a noteworthy, but non-enforceable copyright holder.

Full license is available in LICENSE.md.