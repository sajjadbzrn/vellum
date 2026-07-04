/**
 * Example: Spinner with a label that completes after a few seconds.
 *
 * Run: bun run examples/spinner.ts
 */

import { createScene, SpinnerEffect } from "../src/index.ts";

const scene = createScene({ fps: 15, altScreen: true });

const spinner = new SpinnerEffect(2, 1, {
  label: "Loading modules...",
  color: "#4a90e2",
  type: "braille",
});
scene.add(spinner);

setTimeout(() => {
  spinner.stop();
}, 4000);

await scene.play();
