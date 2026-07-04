/**
 * Example: Firework particle burst effect.
 *
 * Run: bun run examples/fireworks.ts
 */

import { createScene, FireworkEffect, getTermSize } from "../src/index.ts";

const { cols, rows } = getTermSize();
const scene = createScene({ fps: 30, altScreen: true });

// Launch multiple fireworks from center
const cx = Math.floor(cols / 2);
const cy = Math.floor(rows / 2);

scene.add(new FireworkEffect(cx, cy - 4, { count: 40, color: [255, 200, 0] }));

setTimeout(() => {
  scene.add(new FireworkEffect(cx - 10, cy - 2, { count: 25, color: [255, 107, 107] }));
}, 500);

setTimeout(() => {
  scene.add(new FireworkEffect(cx + 10, cy - 3, { count: 30, color: [74, 144, 226] }));
}, 1000);

// Stop after 5 seconds
setTimeout(() => scene.stop(), 5000);

await scene.play();
