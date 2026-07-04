import { describe, test, expect } from "bun:test";
import { GridBuffer, emptyCell, cell } from "../src/renderer/index.ts";
import { computeDiffs, generateAnsi, sgrCode } from "../src/renderer/index.ts";

describe("GridBuffer", () => {
  test("creates grid of correct dimensions", () => {
    const buf = new GridBuffer(10, 5);
    expect(buf.cols).toBe(10);
    expect(buf.rows).toBe(5);
    expect(buf.current.length).toBe(5);
    expect(buf.current[0]!.length).toBe(10);
  });

  test("setCell writes into next buffer", () => {
    const buf = new GridBuffer(10, 5);
    buf.setCell(3, 2, cell("X", [255, 0, 0]));
    expect(buf.next[2]![3]!.char).toBe("X");
    expect(buf.next[2]![3]!.fg).toEqual([255, 0, 0]);
  });

  test("flip swaps buffers", () => {
    const buf = new GridBuffer(10, 5);
    buf.setCell(0, 0, cell("A"));
    buf.flip();
    expect(buf.current[0]![0]!.char).toBe("A");
    expect(buf.next[0]![0]!.char).toBe(" ");
  });

  test("writeString writes multi-line text", () => {
    const buf = new GridBuffer(10, 5);
    buf.writeString(1, 1, "Hello\nWorld");
    expect(buf.next[1]![1]!.char).toBe("H");
    expect(buf.next[1]![5]!.char).toBe("o");
    expect(buf.next[2]![1]!.char).toBe("W");
    expect(buf.next[2]![5]!.char).toBe("d");
  });

  test("writeString clamps to grid bounds", () => {
    const buf = new GridBuffer(3, 3);
    buf.writeString(-1, -1, "ABCDEF"); // should not crash
    buf.writeString(0, 0, "ABCDEF"); // truncated
    expect(buf.next[0]![0]!.char).toBe("A");
    expect(buf.next[0]![2]!.char).toBe("C");
  });

  test("fillRect fills a rectangular region", () => {
    const buf = new GridBuffer(10, 5);
    buf.fillRect(2, 1, 4, 3, cell("#", [0, 255, 0]));
    expect(buf.next[1]![2]!.char).toBe("#");
    expect(buf.next[1]![5]!.char).toBe("#");
    expect(buf.next[3]![2]!.char).toBe("#");
    // Outside the rect
    expect(buf.next[1]![1]!.char).toBe(" ");
    expect(buf.next[4]![2]!.char).toBe(" ");
  });

  test("clearNext resets all cells", () => {
    const buf = new GridBuffer(3, 3);
    buf.setCell(0, 0, cell("X", [255, 0, 0]));
    buf.clearNext();
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        expect(buf.next[r]![c]!.char).toBe(" ");
        expect(buf.next[r]![c]!.fg).toBeNull();
      }
    }
  });

  test("resize creates new grids", () => {
    const buf = new GridBuffer(10, 5);
    buf.setCell(3, 2, cell("X"));
    buf.resize(20, 10);
    expect(buf.cols).toBe(20);
    expect(buf.rows).toBe(10);
    // Content is lost after resize
    expect(buf.current[2]![3]!.char).toBe(" ");
  });
});

describe("computeDiffs", () => {
  test("no diffs when buffers are identical", () => {
    const buf = new GridBuffer(5, 3);
    const diffs = computeDiffs(buf.current, buf.next, 3, 5);
    expect(diffs.length).toBe(0);
  });

  test("detects changed character", () => {
    const buf = new GridBuffer(5, 3);
    buf.setCell(2, 1, cell("X"));
    const diffs = computeDiffs(buf.current, buf.next, 3, 5);
    expect(diffs.length).toBe(1);
    expect(diffs[0]!.col).toBe(2);
    expect(diffs[0]!.row).toBe(1);
    expect(diffs[0]!.char).toBe("X");
  });

  test("detects changed color", () => {
    const buf = new GridBuffer(5, 3);
    buf.setCell(0, 0, cell(" ", [255, 0, 0]));
    const diffs = computeDiffs(buf.current, buf.next, 3, 5);
    expect(diffs.length).toBe(1);
    expect(diffs[0]!.fg).toEqual([255, 0, 0]);
  });

  test("multiple diffs detected", () => {
    const buf = new GridBuffer(5, 3);
    buf.setCell(0, 0, cell("A"));
    buf.setCell(2, 1, cell("B"));
    buf.setCell(4, 2, cell("C"));
    const diffs = computeDiffs(buf.current, buf.next, 3, 5);
    expect(diffs.length).toBe(3);
  });
});

describe("ANSI generation", () => {
  test("sgrCode generates reset for default cell", () => {
    const code = sgrCode(null, null, {
      bold: false,
      dim: false,
      italic: false,
      underline: false,
      blink: false,
      inverse: false,
      hidden: false,
      strikethrough: false,
    });
    expect(code).toBe("\x1b[0m");
  });

  test("sgrCode includes bold", () => {
    const code = sgrCode(null, null, {
      bold: true,
      dim: false,
      italic: false,
      underline: false,
      blink: false,
      inverse: false,
      hidden: false,
      strikethrough: false,
    });
    expect(code).toContain("1");
  });

  test("sgrCode includes truecolor foreground", () => {
    const code = sgrCode([255, 107, 107], null, {
      bold: false,
      dim: false,
      italic: false,
      underline: false,
      blink: false,
      inverse: false,
      hidden: false,
      strikethrough: false,
    });
    expect(code).toContain("38;2;255;107;107");
  });

  test("generateAnsi produces cursor movement and content", () => {
    const ansi = generateAnsi([
      { col: 5, row: 2, char: "X", fg: null, bg: null, style: { bold: false, dim: false, italic: false, underline: false, blink: false, inverse: false, hidden: false, strikethrough: false } },
    ]);
    // Should move to row 3, col 6 (1-indexed)
    expect(ansi).toContain("\x1b[3;6H");
    expect(ansi).toContain("X");
  });

  test("generateAnsi returns empty for no diffs", () => {
    expect(generateAnsi([])).toBe("");
  });
});
