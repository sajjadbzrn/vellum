/**
 * Example: Typewriter text effect.
 *
 * Run: bun run examples/typewriter.ts
 */

import { createScene, TypewriterEffect } from "../src/index.ts";

const scene = createScene({ fps: 30, altScreen: true });

scene.add(
  new TypewriterEffect("Hello, world! Welcome to vellum — the professional terminal animation engine.", 2, 3, {
    duration: 3000,
    color: "#4a90e2",
    cursor: true,
  })
);

await scene.play();
