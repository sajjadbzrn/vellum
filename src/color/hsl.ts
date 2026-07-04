import type { ColorDepth } from "../renderer/buffer.js";

/**
 * Detect the terminal's color support level.
 *
 * Checks COLORTERM, TERM, and environment variables to determine
 * if the terminal supports truecolor (16M), 256, 16, or no color.
 */
export function detectColorDepth(): ColorDepth {
  const colorterm = (process.env.COLORTERM ?? "").toLowerCase();
  const term = (process.env.TERM ?? "").toLowerCase();
  const termProgram = (process.env.TERM_PROGRAM ?? "").toLowerCase();

  if (
    process.env.NO_COLOR !== undefined ||
    process.env.TERM === "dumb"
  ) {
    return "none";
  }

  if (
    colorterm === "truecolor" ||
    colorterm === "24bit" ||
    term.includes("24bit") ||
    term.includes("truecolor") ||
    termProgram === "hyper" ||
    termProgram === "iterm.app" ||
    termProgram === "warp" ||
    termProgram === "wezterm" ||
    termProgram === "vscode" ||
    termProgram === "tabby"
  ) {
    return "truecolor";
  }

  if (
    term.includes("256color") ||
    term === "xterm" ||
    term === "screen" ||
    term === "tmux"
  ) {
    return "256";
  }

  if (
    term.includes("color") ||
    term === "ansi" ||
    term === "linux" ||
    term === "vt100"
  ) {
    return "16";
  }

  // Be optimistic: most modern terminals support truecolor
  return "truecolor";
}

/** RGB color triplet. */
export type Rgb = [number, number, number];

/** HSL color triplet (hue 0-360, saturation 0-100, lightness 0-100). */
export type Hsl = [number, number, number];

/** Convert an RGB triplet to HSL. */
export function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, Math.round(l * 100)];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === rn) {
    h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  } else if (max === gn) {
    h = ((bn - rn) / d + 2) / 6;
  } else {
    h = ((rn - gn) / d + 4) / 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/** Convert an HSL triplet to RGB. */
export function hslToRgb(h: number, s: number, l: number): Rgb {
  const sNorm = s / 100;
  const lNorm = l / 100;

  if (sNorm === 0) {
    const v = Math.round(lNorm * 255);
    return [v, v, v];
  }

  const hueToRgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q =
    lNorm < 0.5
      ? lNorm * (1 + sNorm)
      : lNorm + sNorm - lNorm * sNorm;
  const p = 2 * lNorm - q;
  const hNorm = h / 360;

  return [
    Math.round(hueToRgb(p, q, hNorm + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, hNorm) * 255),
    Math.round(hueToRgb(p, q, hNorm - 1 / 3) * 255),
  ];
}

/**
 * Interpolate between two RGB colors in HSL space for smooth,
 * non-muddy gradients.
 */
export function lerpColor(
  a: Rgb,
  b: Rgb,
  t: number
): Rgb {
  if (t <= 0) return a;
  if (t >= 1) return b;

  const hslA = rgbToHsl(...a);
  const hslB = rgbToHsl(...b);

  // Handle hue wrapping
  let hDelta = hslB[0] - hslA[0];
  if (Math.abs(hDelta) > 180) {
    hDelta = hDelta > 0 ? hDelta - 360 : hDelta + 360;
  }

  const h = ((hslA[0] + hDelta * t) % 360 + 360) % 360;
  const s = hslA[1] + (hslB[1] - hslA[1]) * t;
  const l = hslA[2] + (hslB[2] - hslA[2]) * t;

  return hslToRgb(h, s, l);
}

/** Parse a hex color string (e.g. "#ff6b6b" or "ff6b6b") to RGB. */
export function hexToRgb(hex: string): Rgb {
  const cleaned = hex.replace("#", "");
  if (cleaned.length === 3) {
    return [
      parseInt(cleaned[0]! + cleaned[0]!, 16),
      parseInt(cleaned[1]! + cleaned[1]!, 16),
      parseInt(cleaned[2]! + cleaned[2]!, 16),
    ];
  }
  return [
    parseInt(cleaned.slice(0, 2), 16),
    parseInt(cleaned.slice(2, 4), 16),
    parseInt(cleaned.slice(4, 6), 16),
  ];
}

/** Convert RGB to a hex string. */
export function rgbToHex([r, g, b]: Rgb): string {
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Built-in color preset palette. */
export const colors = {
  black: [0, 0, 0] as Rgb,
  white: [255, 255, 255] as Rgb,
  red: [255, 107, 107] as Rgb,
  coral: [255, 127, 80] as Rgb,
  orange: [255, 165, 0] as Rgb,
  gold: [255, 215, 0] as Rgb,
  yellow: [255, 234, 167] as Rgb,
  lime: [0, 255, 127] as Rgb,
  green: [46, 204, 113] as Rgb,
  teal: [0, 128, 128] as Rgb,
  cyan: [0, 255, 255] as Rgb,
  blue: [74, 144, 226] as Rgb,
  indigo: [75, 0, 130] as Rgb,
  purple: [155, 89, 182] as Rgb,
  pink: [255, 105, 180] as Rgb,
  magenta: [255, 0, 255] as Rgb,
  gray: [128, 128, 128] as Rgb,
  silver: [192, 192, 192] as Rgb,
} as const;

export type ColorName = keyof typeof colors;

/** Get a color by preset name. */
export function color(name: ColorName): Rgb {
  return [...colors[name]] as Rgb;
}

/**
 * Convert a "dim" level (0-1, where 1 is full brightness) to a perceived
 * brightness factor for an RGB color. Uses a simple linear dim by scaling
 * toward black.
 *
 * This is the "opacity" primitive for terminal animation — we can't do real
 * alpha blending in a terminal, but dimming toward the background approximates it.
 */
export function dimColor([r, g, b]: Rgb, factor: number): Rgb {
  const clamped = Math.max(0, Math.min(1, factor));
  return [
    Math.round(r * clamped),
    Math.round(g * clamped),
    Math.round(b * clamped),
  ];
}
