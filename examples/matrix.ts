/**
 * Example: Matrix digital rain effect.
 *
 * Run: bun run examples/matrix.ts
 */

import { createScene, MatrixEffect, getTermSize } from "../src/index.ts";

const { cols, rows } = getTermSize();
const scene = createScene({ fps: 15, altScreen: true });

scene.add(new MatrixEffect(cols, rows));

// Run for 10 seconds, then exit
setTimeout(() => scene.stop(), 10000);

await scene.play();
