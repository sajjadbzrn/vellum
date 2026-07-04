/**
 * Example: Full scene composition — text + box with slide/fade effects.
 *
 * Run: bun run examples/composition.ts
 */

import { createScene, text, box, getTermSize } from "../src/index.ts";

const { cols, rows } = getTermSize();
const scene = createScene({ fps: 30, altScreen: true });

// Title that fades in
scene.add(
  text("VELLUM").at(Math.floor(cols / 2) - 3, 2).color("#ff6b6b").bold().fadeIn(600)
);

// Subtitle with typewriter
const subtitle = text("Professional terminal animation engine")
  .at(Math.floor(cols / 2) - 19, 4)
  .color("#4a90e2")
  .typewrite(1500);

// Start typewriter after fade
setTimeout(() => {
  scene.add(subtitle);
}, 700);

// Box that slides in from left
scene.add(
  box(30, 3)
    .at(Math.floor(cols / 2) - 15, 7)
    .color("#2c3e50")
    .foreground("#ecf0f1")
    .fillChar(" ")
    .slideIn("left", 800, "easeOutBack")
);

// Box that slides in from right slightly later
scene.add(
  box(20, 3)
    .at(Math.floor(cols / 2) - 10, 12)
    .color("#8e44ad")
    .slideIn("right", 600, "easeOutCubic")
);

// Wait for everything to finish
await scene.play();
