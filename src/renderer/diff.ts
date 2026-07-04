import type { Cell, CellStyle } from "./buffer.js";

/** A single changed cell entry — what the renderer needs to emit. */
export interface CellDiff {
  col: number;
  row: number;
  char: string;
  fg: [number, number, number] | null;
  bg: [number, number, number] | null;
  style: CellStyle;
}

/**
 * Compare two buffers cell-by-cell and return an array of diffs
 * for only the cells that changed.
 */
export function computeDiffs(
  current: Cell[][],
  next: Cell[][],
  rows: number,
  cols: number
): CellDiff[] {
  const diffs: CellDiff[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cur = current[r]![c]!;
      const nxt = next[r]![c]!;

      const changed =
        cur.char !== nxt.char ||
        !sameFg(cur.fg, nxt.fg) ||
        !sameBg(cur.bg, nxt.bg) ||
        !sameStyle(cur.style, nxt.style);

      if (changed) {
        diffs.push({
          col: c,
          row: r,
          char: nxt.char,
          fg: nxt.fg,
          bg: nxt.bg,
          style: { ...nxt.style },
        });
      }
    }
  }

  return diffs;
}

function sameFg(
  a: [number, number, number] | null,
  b: [number, number, number] | null
): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function sameBg(
  a: [number, number, number] | null,
  b: [number, number, number] | null
): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function sameStyle(a: CellStyle, b: CellStyle): boolean {
  return (
    a.bold === b.bold &&
    a.dim === b.dim &&
    a.italic === b.italic &&
    a.underline === b.underline &&
    a.blink === b.blink &&
    a.inverse === b.inverse &&
    a.hidden === b.hidden &&
    a.strikethrough === b.strikethrough
  );
}

/**
 * Generate the minimal ANSI escape sequence string for a set of diffs.
 */
export function generateAnsi(diffs: CellDiff[]): string {
  if (diffs.length === 0) return "";

  const sorted = [...diffs].sort(
    (a, b) => a.row - b.row || a.col - b.col
  );

  const parts: string[] = [];
  let lastRow = -1;
  let lastCol = -1;
  let lastStyle: string | null = null;
  let batchChars = "";

  function flushbatch(): void {
    if (batchChars.length > 0) {
      parts.push(batchChars);
      batchChars = "";
    }
  }

  for (const diff of sorted) {
    const styleCode = sgrCode(diff.fg, diff.bg, diff.style);
    const needsStyleChange = styleCode !== lastStyle;
    const isConsecutive =
      diff.row === lastRow &&
      diff.col === lastCol + 1 &&
      !needsStyleChange;

    if (!isConsecutive) {
      flushbatch();
      parts.push(`\x1b[${diff.row + 1};${diff.col + 1}H`);
      lastRow = diff.row;
      lastCol = diff.col;
    }

    if (needsStyleChange) {
      flushbatch();
      parts.push(styleCode);
      lastStyle = styleCode;
    }

    batchChars += diff.char;
    lastCol = diff.col + diff.char.length - 1;
  }

  flushbatch();
  return parts.join("");
}

/**
 * Build the SGR (Select Graphic Rendition) portion of an ANSI escape
 * for a cell's foreground, background, and style.
 */
export function sgrCode(
  fg: [number, number, number] | null,
  bg: [number, number, number] | null,
  style: CellStyle
): string {
  const codes: number[] = [];

  codes.push(0);

  if (style.bold) codes.push(1);
  if (style.dim) codes.push(2);
  if (style.italic) codes.push(3);
  if (style.underline) codes.push(4);
  if (style.blink) codes.push(5);
  if (style.inverse) codes.push(7);
  if (style.hidden) codes.push(8);
  if (style.strikethrough) codes.push(9);

  if (fg) {
    codes.push(38, 2, fg[0], fg[1], fg[2]);
  }
  if (bg) {
    codes.push(48, 2, bg[0], bg[1], bg[2]);
  }

  return `\x1b[${codes.join(";")}m`;
}
