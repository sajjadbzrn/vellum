/**
 * Braille-pattern renderer for 2x3 sub-pixel density.
 *
 * Each terminal cell renders as a braille pattern with 6 dots arranged as:
 *
 *   1  4   (top row)
 *   2  5   (middle row)
 *   3  6   (bottom row)
 *
 * Dot bits: dot1=0x01, dot2=0x02, dot3=0x04, dot4=0x08, dot5=0x10, dot6=0x20.
 * The Unicode codepoint is U+2800 + dot bits.
 *
 * This gives 2x horizontal resolution and 3x vertical resolution per cell.
 * Ideal for smooth curves, waveforms, and low-res plots.
 */

import type { Renderer } from "../renderer/renderer.js";

/** Bit positions for braille dots. */
const DOT1 = 0x01; // top-left
const DOT2 = 0x02; // middle-left
const DOT3 = 0x04; // bottom-left
const DOT4 = 0x08; // top-right
const DOT5 = 0x10; // middle-right
const DOT6 = 0x20; // bottom-right

/** Braille Unicode base. */
const BRAILLE_BASE = 0x2800;

/**
 * Map sub-cell pixel coordinates (px, py) to (terminalCol, terminalRow, dotBit).
 *
 * Pixel grid: `px` ranges 0..(cols*2-1), `py` ranges 0..(rows*3-1).
 * Returns the terminal cell and which dot bit to set.
 */
export function pixelToBraille(px: number, py: number): {
  col: number;
  row: number;
  bit: number;
} {
  const col = Math.floor(px / 2);
  const row = Math.floor(py / 3);
  const subX = px % 2; // 0 = left, 1 = right
  const subY = py % 3; // 0 = top, 1 = middle, 2 = bottom

  // Map (subX, subY) to dot bit
  const dotMap: Record<string, number> = {
    "0,0": DOT1,
    "1,0": DOT4,
    "0,1": DOT2,
    "1,1": DOT5,
    "0,2": DOT3,
    "1,2": DOT6,
  };

  return { col, row, bit: dotMap[`${subX},${subY}`] ?? 0 };
}

/** Dot bit to braille character. */
function dotsToChar(dots: number): string {
  return String.fromCodePoint(BRAILLE_BASE + dots);
}

/**
 * Draw a single sub-cell pixel within the braille grid.
 * Builds up an in-memory accumulator per terminal cell and flushes on render.
 *
 * For direct per-frame use, call `brailleFill` instead which handles
 * accumulation and rendering in one pass.
 */

/**
 * Render a 1-bit (on/off) buffer at braille sub-pixel resolution.
 *
 * `pixels` is a 2D boolean array at 2x*3y resolution:
 * pixels[py][px] where py ranges 0..(rows*3-1) and px ranges 0..(cols*2-1).
 */
export function brailleRender(
  renderer: Renderer,
  pixels: boolean[][],
  onFg?: [number, number, number],
  _offFg?: [number, number, number]
): void {
  const grid = renderer.grid;
  const rows = grid.rows;
  const cols = grid.cols;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let dots = 0;

      for (let subX = 0; subX < 2; subX++) {
        for (let subY = 0; subY < 3; subY++) {
          const px = col * 2 + subX;
          const py = row * 3 + subY;
          if (pixels[py]?.[px]) {
            const { bit } = pixelToBraille(px, py);
            dots |= bit;
          }
        }
      }

      const cell = grid.next[row]![col]!;
      if (dots === 0) {
        cell.char = " ";
      } else {
        cell.char = dotsToChar(dots);
        if (onFg) cell.fg = onFg;
      }
    }
  }
}

/**
 * Draw a waveform/function into a braille-precision grid.
 *
 * `fn` is called for each pixel row (py) and returns the x offset (in sub-pixel coords)
 * where the wave crosses. Points at that x are lit.
 */
export function brailleWaveform(
  renderer: Renderer,
  height: number,
  fn: (py: number) => number,
  onFg?: [number, number, number]
): void {
  const cols = renderer.grid.cols;
  const pyMax = height * 3;

  // Build pixel buffer
  const pixels: boolean[][] = Array.from({ length: pyMax }, () =>
    new Array(cols * 2).fill(false)
  );

  for (let py = 0; py < pyMax; py++) {
    const x = fn(py);
    const px = Math.round(x);
    if (px >= 0 && px < cols * 2) {
      pixels[py]![px] = true;
    }
  }

  brailleRender(renderer, pixels, onFg);
}
