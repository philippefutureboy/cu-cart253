# React-P5 Declarative Integration

This package provides a **declarative React integration for p5.js**, designed as a more flexible and composable alternative to [`@p5-wrapper/react`](https://github.com/p5-wrapper/react).

It enables you to use `p5` sketches directly inside React applications in a way that feels idiomatic: components, hooks, and context providers rather than imperative setup.

---

## ✨ Key Advantages Over `@p5-wrapper/react`

- **Declarative API**
  Define `<P5.Scene>` components with ES6 classes extending `AbstractP5Scene`. Lifecycle hooks (`preload`, `setup`, `draw`, `destroy`) map cleanly to p5 phases.

- **Scene support & hot-swapping**
  Register multiple `<P5.Scene>` children and switch between them with `ctx.setScene(name)`. Scenes encapsulate their own event handlers, resources, and teardown.

- **Multiple p5 instance support**
  Use `<P5.Canvas id="...">` to mount multiple independent canvases. Each canvas is registered in a global registry for hooks and state management.

- **Event listener management**
  Register multiple cursor/key/mouse event callbacks per scene with `ctx.addEventListener`. Scoped listeners are automatically removed on scene switch.

- **React state & interactivity**
  Scenes can react to external React state and props. Build declarative data-driven sketches that integrate tightly with your app.

- **Easy integration in React apps**
  Fits into existing component trees and tooling (Vite, Babel, Jest). Plays nicely with standard React patterns (hooks, context, state).

- **Extends p5 with modern app features**
  Because you are in React, you can seamlessly integrate:
  - Network requests (REST, GraphQL, etc.)
  - Local caching and persistence (React Query, SWR)
  - Real-time multiplayer via WebSockets or WebRTC

---

## 📦 Installation

This code lives inside your project under `src/lib/p5`.
No npm install step is required, but you do need `p5`:

```bash
npm install p5
```

Optional plugins (e.g. `p5.collide2d`) can be registered by importing them once after ensuring `window.p5` is set.

---

## 🚀 Basic Usage

```jsx
import { P5, AbstractP5Scene } from "src/lib/p5";

// Define a scene by subclassing AbstractP5Scene
class BouncingBallScene extends AbstractP5Scene {
  static scene = "bouncing";

  setup(p5, ctx) {
    this.x = p5.width / 2;
    this.y = p5.height / 2;
    this.vx = 2;
    this.vy = 3;
    p5.background(200);

    // Register event listener
    ctx.addEventListener("mousePressed", (p5) => {
      this.vx *= -1;
      this.vy *= -1;
    });
  }

  draw(p5) {
    p5.background(200);
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > p5.width) this.vx *= -1;
    if (this.y < 0 || this.y > p5.height) this.vy *= -1;
    p5.ellipse(this.x, this.y, 40, 40);
  }
}

function Example() {
  return (
    <P5.ContextProvider>
      <P5.Canvas id="demo" width={400} height={300} scene="bouncing">
        <P5.Scene cls={BouncingBallScene} />
      </P5.Canvas>
    </P5.ContextProvider>
  );
}
```

---

## 🎮 Scene API

All scenes must extend `AbstractP5Scene` and define a static `scene` string.

```ts
class MyScene extends AbstractP5Scene {
  static scene = "uniqueName";

  preload(p5: P5, ctx: SceneContext): void | Promise<void>;
  setup(p5: P5, ctx: SceneContext): void | Promise<void>;
  draw(p5: P5, ctx: SceneContext): void;
  destroy(p5: P5, ctx: SceneContext): void | Promise<void>;
}
```

- `preload` → load assets before first render (executed inside `setup` because `p5.preload` is deprecated in p5 2.0).
- `setup` → run once when the scene becomes active.
- `draw` → runs every frame.
- `destroy` → cleanup resources, unsubscribe events.

---

## 🎛 Context API

The second argument to scene methods is a `SceneContext` instance, exposing:

```ts
class SceneContext {
  preload(sceneName: string): Promise<void>;
  setScene(sceneName: string): Promise<void>;
  addEventListener(
    event: string,
    fn: (p5, evt) => any,
    opts?: { id?: string },
  ): () => void;
  addEventListenerScoped(
    event: string,
    fn: (p5, evt) => any,
    opts?: { id?: string },
  ): () => void;
  removeEventListener(event: string, id: string): void;
}
```

- `addEventListener` → subscribe to global p5 events.
- `addEventListenerScoped` → subscribe, but automatically unsubscribed when the scene is destroyed.
- `removeEventListener` → manually remove by event + id.

---

## ⚠️ Limitations & Disadvantages

- **SSR caveats**: p5 requires DOM APIs. This lib guards against hydration mismatches, but server-side rendering won’t render sketches. Use `typeof window !== "undefined"` to defer if needed.
- **No pixel snapshots in tests**: The Jest setup mocks p5. Automated tests validate lifecycle/registry logic, not actual rendering output.
- **Scene switching clears state**: When switching scenes, local variables in the scene instance are discarded unless you persist them externally.
- **Renderer changes recreate canvas**: Switching between `P2D` and `WEBGL` forces a full recreate.

---

## 👥 Attribution

- **Primary Architect**: Philippe Hébert
- **Primary Implementer**: ChatGPT (OpenAI)
- Original design rationale and conversation logs are available in:
  `src/lib/p5/ATTRIBUTION/*.html`, transcribed to HTML format using the Firefox Addon [ChatGPT Export](https://addons.mozilla.org/en-US/firefox/addon/chatgpt-export/)

---

## 📄 License

MIT

This code was written primarily by ChatGPT (OpenAI). Works generated entirely by a machine without human creative input are generally not copyrightable.
That means there might be no copyright holder at all, and the output may effectively be in the public domain.

This being said, I, as the author, Philippe Hébert, have made some creative choices, especially around architecting/directing the structure of this solution, and as such, I am de-facto the "author" of this work.
This being said, given that ChatGPT is trained using the work of countless developers, most of then time irrespectively of licensing, I also included "The Internet Collective" as a noteworthy, but non-enforceable copyright holder.

Full license is available in LICENSE.md.
