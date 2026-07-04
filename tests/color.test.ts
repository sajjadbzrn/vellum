import { describe, test, expect } from "bun:test";
import { hexToRgb, rgbToHex, lerpColor, dimColor, colors, color, rgbToHsl, hslToRgb } from "../src/color/index.ts";

describe("color system", () => {
  test("hexToRgb parses 6-digit hex", () => {
    expect(hexToRgb("#ff6b6b")).toEqual([255, 107, 107]);
    expect(hexToRgb("000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("ffffff")).toEqual([255, 255, 255]);
  });

  test("hexToRgb parses 3-digit hex", () => {
    expect(hexToRgb("#f06")).toEqual([255, 0, 102]);
    expect(hexToRgb("abc")).toEqual([170, 187, 204]);
  });

  test("hexToRgb parses without hash", () => {
    expect(hexToRgb("ff6b6b")).toEqual([255, 107, 107]);
  });

  test("rgbToHex converts correctly", () => {
    expect(rgbToHex([255, 107, 107])).toBe("#ff6b6b");
    expect(rgbToHex([0, 0, 0])).toBe("#000000");
    expect(rgbToHex([255, 255, 255])).toBe("#ffffff");
  });

  test("rgbToHsl - pure red", () => {
    const hsl = rgbToHsl(255, 0, 0);
    expect(hsl[0]).toBe(0);
    expect(hsl[1]).toBe(100);
    expect(hsl[2]).toBe(50);
  });

  test("rgbToHsl - pure green", () => {
    const hsl = rgbToHsl(0, 255, 0);
    expect(hsl[0]).toBe(120);
    expect(hsl[1]).toBe(100);
    expect(hsl[2]).toBe(50);
  });

  test("rgbToHsl - pure blue", () => {
    const hsl = rgbToHsl(0, 0, 255);
    expect(hsl[0]).toBe(240);
    expect(hsl[1]).toBe(100);
    expect(hsl[2]).toBe(50);
  });

  test("rgbToHsl - white", () => {
    const hsl = rgbToHsl(255, 255, 255);
    expect(hsl[1]).toBe(0);
    expect(hsl[2]).toBe(100);
  });

  test("rgbToHsl - black", () => {
    const hsl = rgbToHsl(0, 0, 0);
    expect(hsl[1]).toBe(0);
    expect(hsl[2]).toBe(0);
  });

  test("hslToRgb roundtrip", () => {
    const original: [number, number, number] = [255, 107, 107];
    const [h, s, l] = rgbToHsl(...original);
    const result = hslToRgb(h, s, l);
    // Allow 1-unit rounding error
    expect(result[0]).toBeCloseTo(original[0], 0);
    expect(result[1]).toBeCloseTo(original[1], 0);
    expect(result[2]).toBeCloseTo(original[2], 0);
  });

  test("lerpColor at boundaries", () => {
    const a: [number, number, number] = [255, 0, 0]; // red
    const b: [number, number, number] = [0, 0, 255]; // blue

    expect(lerpColor(a, b, 0)).toEqual(a);
    expect(lerpColor(a, b, 1)).toEqual(b);
  });

  test("lerpColor at midpoint", () => {
    const a: [number, number, number] = [255, 255, 255]; // white
    const b: [number, number, number] = [0, 0, 0]; // black
    const mid = lerpColor(a, b, 0.5);
    // Midpoint in HSL space should be ~128 gray
    expect(mid[0]).toBeCloseTo(128, -1);
    expect(mid[1]).toBeCloseTo(128, -1);
    expect(mid[2]).toBeCloseTo(128, -1);
  });

  test("dimColor full brightness", () => {
    const result = dimColor([200, 100, 50], 1);
    expect(result).toEqual([200, 100, 50]);
  });

  test("dimColor half brightness", () => {
    const result = dimColor([200, 100, 50], 0.5);
    expect(result).toEqual([100, 50, 25]);
  });

  test("dimColor zero brightness", () => {
    const result = dimColor([200, 100, 50], 0);
    expect(result).toEqual([0, 0, 0]);
  });

  test("color presets are valid", () => {
    const keys = Object.keys(colors) as (keyof typeof colors)[];
    for (const k of keys) {
      const c = color(k);
      expect(c.length).toBe(3);
      expect(c[0]).toBeGreaterThanOrEqual(0);
      expect(c[0]).toBeLessThanOrEqual(255);
    }
  });
});
