/** ANSI color depth levels supported by different terminals. */
export type ColorDepth = "truecolor" | "256" | "16" | "none";

/** Cell styling flags. */
export interface CellStyle {
  bold: boolean;
  dim: boolean;
  italic: boolean;
  underline: boolean;
  blink: boolean;
  inverse: boolean;
  hidden: boolean;
  strikethrough: boolean;
}

/** A single cell on the terminal grid. */
export interface Cell {
  char: string;
  fg: [number, number, number] | null; // RGB foreground or null for default
  bg: [number, number, number] | null; // RGB background or null for default
  style: CellStyle;
}

const EMPTY_STYLE: CellStyle = {
  bold: false,
  dim: false,
  italic: false,
  underline: false,
  blink: false,
  inverse: false,
  hidden: false,
  strikethrough: false,
};

/** Create a default empty cell. */
export function emptyCell(): Cell {
  return { char: " ", fg: null, bg: null, style: { ...EMPTY_STYLE } };
}

/** Create a cell with specified character and default styling. */
export function cell(
  char: string,
  fg?: [number, number, number] | null,
  bg?: [number, number, number] | null
): Cell {
  return { char, fg: fg ?? null, bg: bg ?? null, style: { ...EMPTY_STYLE } };
}

/**
 * Double-buffered terminal grid.
 *
 * Maintains two grids: `current` (what was last rendered) and `next`
 * (what is being drawn this frame). The diff renderer compares the two
 * and emits only changed cells.
 */
export class GridBuffer {
  /** The buffer currently displayed on screen. */
  current: Cell[][];
  /** The buffer being drawn into for the next frame. */
  next: Cell[][];
  readonly cols: number;
  readonly rows: number;

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.current = this.createGrid();
    this.next = this.createGrid();
  }

  /** Allocate a fresh grid filled with empty cells. */
  private createGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let r = 0; r < this.rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(emptyCell());
      }
      grid.push(row);
    }
    return grid;
  }

  /** Resize both buffers to a new size. All content is lost. */
  resize(cols: number, rows: number): void {
    (this as { cols: number; rows: number }).cols = cols;
    (this as { cols: number; rows: number }).rows = rows;
    this.current = this.createGrid();
    this.next = this.createGrid();
  }

  /**
   * Swap next into current and clear next for a fresh frame.
   * Call this after each render so the diff is always against the previous frame.
   */
  flip(): void {
    const temp = this.current;
    this.current = this.next;
    this.next = temp;
    this.clearNext();
  }

  /** Reset every cell in next to empty. */
  clearNext(): void {
    for (let r = 0; r < this.rows; r++) {
      const row = this.next[r]!;
      for (let c = 0; c < this.cols; c++) {
        const cel = row[c]!;
        cel.char = " ";
        cel.fg = null;
        cel.bg = null;
        Object.assign(cel.style, EMPTY_STYLE);
      }
    }
  }

  /** Write a cell into next at a given position. Clamped to grid bounds. */
  setCell(col: number, row: number, cel: Cell): void {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    this.next[row]![col] = cel;
  }

  /** Write a string into next starting at (col, row). Honors newlines. */
  writeString(
    col: number,
    row: number,
    str: string,
    fg?: [number, number, number] | null,
    bg?: [number, number, number] | null,
    style?: Partial<CellStyle>
  ): void {
    const lines = str.split("\n");
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li]!;
      const r = row + li;
      if (r < 0 || r >= this.rows) continue;
      for (let ci = 0; ci < line.length; ci++) {
        const c = col + ci;
        if (c < 0 || c >= this.cols) continue;
        const cel = this.next[r]![c]!;
        cel.char = line[ci]!;
        if (fg) cel.fg = fg;
        if (bg) cel.bg = bg;
        if (style) Object.assign(cel.style, style);
      }
    }
  }

  /** Fill a rectangular region in next with a cell. */
  fillRect(
    x: number,
    y: number,
    w: number,
    h: number,
    cel: Cell
  ): void {
    for (let r = y; r < y + h && r < this.rows; r++) {
      if (r < 0) continue;
      for (let c = x; c < x + w && c < this.cols; c++) {
        if (c < 0) continue;
        this.next[r]![c] = cel;
      }
    }
  }
}
