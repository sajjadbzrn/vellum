# vellum

> A professional terminal animation engine — composable, delta-time-based, zero-flicker.

**vellum** brings framer-motion-style animation primitives to the terminal. Compose
declarative scenes with text, boxes, and effects. Everything runs on a diff-based
renderer that emits minimal ANSI sequences — no full-screen clears, no flicker.

```ts
const scene = createScene({ fps: 30 });
scene.add(text("Hello").at(2, 1).color("#ff6b6b").fadeIn(400));
scene.add(box(20, 5).at(10, 3).color("#2c3e50").slideIn("left", 300, "easeOutBack"));
await scene.play();
```

## Features

- **Double-buffered grid** with diff-based rendering — only changed cells are emitted
- **Delta-time frame loop** using `performance.now()` accumulator, not `setInterval`
- **30+ easing curves** — Penner-style: quad, cubic, quart, back, elastic, bounce
- **Truecolor ANSI** with HSL-space interpolation for smooth color gradients
- **Terminal-safe lifecycle** — cursor hide/restore, alternate screen buffer, SIGINT recovery
- **Sub-cell rendering** — half-block (2x vert) and braille (2x3) for smooth curves
- **Fluent composable API** — chain `.at()`, `.color()`, `.fadeIn()`, `.slideIn()`

## Install

```bash
npm install @sajjadbzn/vellum
# or
bun add @sajjadbzn/vellum
```

Requires Node.js >= 18 or Bun >= 1.0.

## Quick Start

```ts
import { createScene, text, box } from "@sajjadbzn/vellum";

const scene = createScene({ fps: 30, altScreen: true });

scene.add(
  text("Hello, vellum!")
    .at(2, 2)
    .color("#ff6b6b")
    .bold()
    .fadeIn(500)
);

scene.add(
  box(20, 3)
    .at(2, 5)
    .color("#2c3e50")
    .slideIn("left", 400, "easeOutBack")
);

await scene.play();
```

Run: `bun run script.ts` or `node script.mjs`

## API Reference

### Scene

```ts
const scene = createScene({
  fps?: number;          // target frames per second (default: 30)
  altScreen?: boolean;   // use alternate screen buffer (default: false)
  autoResize?: boolean;  // reflow on terminal resize (default: true)
});

scene.add(entity);       // add a drawable entity
await scene.play();      // start animation loop (resolves when all entities finish)
scene.stop();            // force stop
```

### Text

```ts
const t = text("Hello")
  .at(col, row)           // position
  .color("#ff6b6b")       // foreground color (hex or RGB)
  .background("#333")     // background color
  .bold()                 // bold
  .dim()                  // dim
  .italic()               // italic
  .fadeIn(ms, easing?)    // fade in over ms
  .fadeOut(ms, easing?)   // fade out over ms
  .typewrite(ms, easing?) // typewriter reveal over ms
```

### Box

```ts
const b = box(width, height)
  .at(col, row)                        // position
  .color("#2c3e50")                    // fill color (background)
  .foreground("#ecf0f1")               // foreground color
  .fillChar("█")                       // fill character (default: space)
  .fadeIn(ms, easing?)                 // fade in
  .slideIn(direction, ms, easingName?) // slide from "left"|"right"|"top"|"bottom"
```

### Effects

| Effect | Description |
|--------|-------------|
| `SpinnerEffect` | Animated spinner with label |
| `ProgressBarEffect` | Gradient-filled progress bar |
| `TypewriterEffect` | Character-by-character text reveal |
| `FadeEffect` | Fade a region in/out |
| `SlideEffect` | Slide a region on/off screen |
| `MatrixEffect` | Matrix digital rain |
| `FireworkEffect` | Particle burst |

All effects implement `Drawable` and can be added directly to a scene.

### Easing

```ts
import { easing } from "@sajjadbzn/vellum";

easing.linear       easing.easeInQuad     easing.easeOutQuad    easing.easeInOutQuad
easing.easeInCubic  easing.easeOutCubic   easing.easeInOutCubic
easing.easeInQuart  easing.easeOutQuart   easing.easeInOutQuart
easing.easeInQuint  easing.easeOutQuint   easing.easeInOutQuint
easing.easeInSine   easing.easeOutSine    easing.easeInOutSine
easing.easeInExpo   easing.easeOutExpo    easing.easeInOutExpo
easing.easeInCirc   easing.easeOutCirc    easing.easeInOutCirc
easing.easeInBack   easing.easeOutBack    easing.easeInOutBack
easing.easeInElastic easing.easeOutElastic easing.easeInOutElastic
easing.easeInBounce easing.easeOutBounce  easing.easeInOutBounce
```

### Color

```ts
import { colors, color, lerpColor, hexToRgb, dimColor } from "@sajjadbzn/vellum";

color("red")                        // get preset: [255, 107, 107]
colors.blue                         // direct access
hexToRgb("#ff6b6b")                // → [255, 107, 107]
lerpColor([255,0,0], [0,0,255], t) // HSL-space interpolation
dimColor(rgb, factor)              // dim toward black (factor 0..1)
```

### Sub-cell Renderers

```ts
import { halfBlockSet, brailleRender, brailleWaveform } from "@sajjadbzn/vellum";

// Half-block: 2x vertical resolution per cell
halfBlockSet(renderer, x, y, color);

// Braille: 2x3 sub-pixel per cell
brailleRender(renderer, pixels, onColor);
brailleWaveform(renderer, height, (py) => Math.sin(py * 0.1) * 20 + 30);
```

### Lifecycle

```ts
import { hideCursor, showCursor, enterAltScreen, exitAltScreen, onResize } from "@sajjadbzn/vellum";
```

All lifecycle state is automatically restored on process exit, SIGINT, and SIGTERM.

## Architecture

```
scene
  ├── entities (Text, Box, Effects)
  │     └── AnimatedValue  (from→to, duration, easing)
  ├── FrameLoop            (performance.now(), accumulator pattern)
  └── Renderer
        ├── GridBuffer     (Cell[][]: current + next)
        ├── computeDiffs   (minimal diff between buffers)
        └── generateAnsi   (cursor movement + SGR codes)
```

1. Each frame, entities update their `AnimatedValue`s with delta time
2. Entities draw into the renderer's **next** buffer
3. The renderer compares next vs current buffer cell-by-cell
4. Only changed cells produce ANSI escape sequences
5. A single `process.stdout.write()` emits the entire frame

## Examples

```bash
bun run examples/spinner.ts     # Braille spinner with label
bun run examples/progress.ts    # Gradient progress bar
bun run examples/typewriter.ts  # Typewriter text reveal
bun run examples/matrix.ts      # Matrix digital rain (10s)
bun run examples/composition.ts # Full scene: text + boxes + slide/fade
bun run examples/fireworks.ts   # Particle firework burst
```

## Testing

```bash
bun test              # run all tests
bun test --watch      # watch mode
bun test --coverage   # with coverage
```

## License

MIT — see [LICENSE](./LICENSE)
