/**
 * Half-block character renderer for 2x vertical resolution.
 *
 * Uses Unicode half-block characters ▀ (U+2580, upper half) and ▄ (U+2584, lower half)
 * to render two pixels per terminal cell vertically, doubling effective resolution.
 *
 * The top half uses ▀ (foreground = top color, background = bottom color).
 * The bottom half uses ▄ (foreground = bottom color, background = top color).
 *
 * For full-cell fill with two colors, use ▀ with foreground=top, background=bottom.
 */

import type { Rgb } from "../color/index.js";
import type { Renderer } from "../renderer/renderer.js";

/** Convert pixel coordinates (at 2x vertical density) to terminal cell + half. */
export function halfBlockPos(y: number): { row: number; isUpper: boolean } {
  const row = Math.floor(y / 2);
  const isUpper = y % 2 === 0;
  return { row, isUpper };
}

/**
 * Render a half-block pixel into the renderer at sub-cell coordinates.
 * `y` is in pixel coordinates where 2 pixels = 1 terminal row.
 */
export function halfBlockSet(
  renderer: Renderer,
  x: number,
  y: number,
  color: Rgb
): void {
  const { row, isUpper } = halfBlockPos(y);
  const grid = renderer.grid;
  if (row < 0 || row >= grid.rows || x < 0 || x >= grid.cols) return;

  const cell = grid.next[row]![x]!;
  if (isUpper) {
    cell.char = "▀";
    cell.fg = color;
  } else {
    cell.char = "▄";
    cell.fg = color;
  }
}

/**
 * Fill a half-block region. `height` is in pixel coordinates (2x terminal rows).
 */
export function halfBlockRect(
  renderer: Renderer,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Rgb
): void {
  for (let py = y; py < y + height; py++) {
    for (let px = x; px < x + width; px++) {
      halfBlockSet(renderer, px, py, color);
    }
  }
}
