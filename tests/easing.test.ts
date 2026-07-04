import { describe, test, expect } from "bun:test";
import { easing, getEasing } from "../src/easing/index.ts";

describe("easing functions", () => {
  test("linear is identity", () => {
    expect(easing.linear(0)).toEqual(0);
    expect(easing.linear(0.5)).toEqual(0.5);
    expect(easing.linear(1)).toEqual(1);
  });

  test("easeInQuad", () => {
    expect(easing.easeInQuad(0)).toEqual(0);
    expect(easing.easeInQuad(0.5)).toBeCloseTo(0.25, 5);
    expect(easing.easeInQuad(1)).toEqual(1);
  });

  test("easeOutQuad", () => {
    expect(easing.easeOutQuad(0)).toEqual(0);
    expect(easing.easeOutQuad(0.5)).toBeCloseTo(0.75, 5);
    expect(easing.easeOutQuad(1)).toEqual(1);
  });

  test("easeInOutQuad", () => {
    expect(easing.easeInOutQuad(0)).toEqual(0);
    expect(easing.easeInOutQuad(0.5)).toEqual(0.5);
    expect(easing.easeInOutQuad(1)).toEqual(1);
  });

  test("easeInCubic", () => {
    expect(easing.easeInCubic(0)).toEqual(0);
    expect(easing.easeInCubic(0.5)).toBeCloseTo(0.125, 5);
    expect(easing.easeInCubic(1)).toEqual(1);
  });

  test("easeOutCubic at boundaries", () => {
    expect(easing.easeOutCubic(0)).toEqual(0);
    expect(easing.easeOutCubic(1)).toEqual(1);
  });

  test("easeInOutCubic at boundaries", () => {
    expect(easing.easeInOutCubic(0)).toEqual(0);
    expect(easing.easeInOutCubic(1)).toEqual(1);
    expect(easing.easeInOutCubic(0.5)).toBeCloseTo(0.5, 5);
  });

  test("easeInBack overshoots", () => {
    expect(easing.easeInBack(0)).toBeCloseTo(0, 10);
    expect(easing.easeInBack(0.1)).toBeLessThan(0); // overshoots negative
    expect(easing.easeInBack(1)).toBeCloseTo(1, 10);
  });

  test("easeOutBack overshoots", () => {
    expect(easing.easeOutBack(0)).toBeCloseTo(0, 10);
    expect(easing.easeOutBack(1)).toBeCloseTo(1, 10);
    expect(easing.easeOutBack(0.9)).toBeGreaterThan(1); // overshoots
  });

  test("easeInOutBack at boundaries", () => {
    expect(easing.easeInOutBack(0)).toBeCloseTo(0, 10);
    expect(easing.easeInOutBack(1)).toBeCloseTo(1, 10);
    expect(easing.easeInOutBack(0.5)).toBeCloseTo(0.5, 5);
  });

  test("easeInElastic", () => {
    expect(easing.easeInElastic(0)).toEqual(0);
    expect(easing.easeInElastic(1)).toEqual(1);
    // Should wobble before settling
    expect(easing.easeInElastic(0.2)).toBeLessThan(1);
  });

  test("easeOutElastic", () => {
    expect(easing.easeOutElastic(0)).toEqual(0);
    expect(easing.easeOutElastic(1)).toEqual(1);
  });

  test("easeInBounce", () => {
    expect(easing.easeInBounce(0)).toEqual(0);
    expect(easing.easeInBounce(1)).toEqual(1);
  });

  test("easeOutBounce completes", () => {
    expect(easing.easeOutBounce(0)).toEqual(0);
    expect(easing.easeOutBounce(1)).toEqual(1);
  });

  test("easeInOutBounce at mid", () => {
    expect(easing.easeInOutBounce(0)).toEqual(0);
    expect(easing.easeInOutBounce(1)).toEqual(1);
    expect(easing.easeInOutBounce(0.5)).toBeCloseTo(0.5, 5);
  });

  test("all easings output 0..1 range", () => {
    const names = Object.keys(easing) as (keyof typeof easing)[];
    for (const name of names) {
      const fn = easing[name];
      for (let t = 0; t <= 1; t += 0.1) {
        const v = fn(t);
        // Some easings overshoot (back, elastic) so allow slight out-of-range
        expect(v).toBeGreaterThanOrEqual(-0.3);
        expect(v).toBeLessThanOrEqual(1.3);
      }
    }
  });

  test("getEasing returns correct function", () => {
    expect(getEasing("easeOutQuad")).toBe(easing.easeOutQuad);
    expect(getEasing("linear")).toBe(easing.linear);
  });
});
