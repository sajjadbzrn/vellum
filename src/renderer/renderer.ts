import { GridBuffer } from "./buffer.js";
import { computeDiffs, generateAnsi } from "./diff.js";

/**
 * A renderer that manages a double-buffered grid and writes
 * minimal ANSI escape sequences to stdout.
 *
 * Uses diff-based rendering: only changed cells are emitted,
 * producing zero-flicker animations with minimal terminal chatter.
 */
export class Renderer {
  private buffer: GridBuffer;
  private target: { write(s: string): void };

  constructor(
    cols: number,
    rows: number,
    out?: { write(s: string): void }
  ) {
    this.buffer = new GridBuffer(cols, rows);
    this.target = out ?? process.stdout;
  }

  get grid(): GridBuffer {
    return this.buffer;
  }

  get cols(): number {
    return this.buffer.cols;
  }

  get rows(): number {
    return this.buffer.rows;
  }

  /**
   * Render the current frame: compute diffs between current and next
   * buffer, generate ANSI codes, write to output in one batch.
   * Then flip buffers (current <- next, clear next).
   */
  render(): void {
    const diffs = computeDiffs(
      this.buffer.current,
      this.buffer.next,
      this.buffer.rows,
      this.buffer.cols
    );

    if (diffs.length > 0) {
      const ansi = generateAnsi(diffs);
      this.target.write(ansi);
    }

    this.buffer.flip();
  }

  /**
   * Write a single complete frame from a display buffer directly
   * (bypassing the diff system) — useful for initial render or
   * full-redraw scenarios.
   */
  writeFull(): void {
    const lines: string[] = [];
    for (let r = 0; r < this.buffer.rows; r++) {
      const row = this.buffer.next[r]!;
      const chars: string[] = [];
      for (let c = 0; c < this.buffer.cols; c++) {
        chars.push(row[c]!.char);
      }
      lines.push(chars.join(""));
    }
    // Use single-call write for full buffer
    let out = "\x1b[H"; // home cursor
    for (let r = 0; r < lines.length; r++) {
      out += `\x1b[${r + 1}H` + lines[r];
    }
    this.target.write(out);
    this.buffer.flip();
  }

  /** Resize the internal grid to new dimensions. */
  resize(cols: number, rows: number): void {
    this.buffer.resize(cols, rows);
  }

  /** Write a string into the next buffer using the grid's writeString. */
  writeString(
    col: number,
    row: number,
    str: string,
    fg?: [number, number, number] | null,
    bg?: [number, number, number] | null
  ): void {
    this.buffer.writeString(col, row, str, fg, bg);
  }

  /** Set a single cell in the next buffer. */
  setCell(
    col: number,
    row: number,
    char: string,
    fg?: [number, number, number] | null,
    bg?: [number, number, number] | null
  ): void {
    this.buffer.setCell(col, row, {
      char,
      fg: fg ?? null,
      bg: bg ?? null,
      style: {
        bold: false,
        dim: false,
        italic: false,
        underline: false,
        blink: false,
        inverse: false,
        hidden: false,
        strikethrough: false,
      },
    });
  }

  /** Fill a rectangle in the next buffer. */
  fillRect(
    x: number,
    y: number,
    w: number,
    h: number,
    char: string,
    fg?: [number, number, number] | null,
    bg?: [number, number, number] | null
  ): void {
    this.buffer.fillRect(x, y, w, h, {
      char,
      fg: fg ?? null,
      bg: bg ?? null,
      style: {
        bold: false,
        dim: false,
        italic: false,
        underline: false,
        blink: false,
        inverse: false,
        hidden: false,
        strikethrough: false,
      },
    });
  }
}
