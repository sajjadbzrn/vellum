/**
 * Example: Progress bar with gradient fill.
 *
 * Run: bun run examples/progress.ts
 */

import { createScene, ProgressBarEffect } from "../src/index.ts";

const scene = createScene({ fps: 30, altScreen: true });

scene.add(
  new ProgressBarEffect(5, 3, 40, {
    duration: 3000,
    fromColor: "#2ecc71",
    toColor: "#ff6b6b",
  })
);

await scene.play();
