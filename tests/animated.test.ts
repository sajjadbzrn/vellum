import { describe, test, expect } from "bun:test";
import { AnimatedValue } from "../src/primitives/animated-value.ts";
import { easing } from "../src/easing/index.ts";

describe("AnimatedValue", () => {
  test("starts at 'from' value", () => {
    const anim = new AnimatedValue({ from: 0, to: 100, duration: 1000 });
    expect(anim.value).toBe(0);
    expect(anim.progress).toBe(0);
    expect(anim.isDone).toBe(false);
  });

  test("ticks toward target", () => {
    const anim = new AnimatedValue({ from: 0, to: 100, duration: 1000 });
    anim.tick(500);
    // Linear: should be at 50
    expect(anim.value).toBe(50);
    expect(anim.progress).toBe(0.5);
    expect(anim.isDone).toBe(false);
  });

  test("completes at duration", () => {
    const anim = new AnimatedValue({ from: 0, to: 100, duration: 1000 });
    anim.tick(1000);
    expect(anim.value).toBe(100);
    expect(anim.progress).toBe(1);
    expect(anim.isDone).toBe(true);
  });

  test("clamps at target", () => {
    const anim = new AnimatedValue({ from: 0, to: 100, duration: 1000 });
    anim.tick(2000);
    expect(anim.value).toBe(100);
    expect(anim.progress).toBe(1);
  });

  test("returns false when done", () => {
    const anim = new AnimatedValue({ from: 0, to: 100, duration: 1000 });
    expect(anim.tick(500)).toBe(true);
    expect(anim.tick(500)).toBe(false);
  });

  test("respects easing function", () => {
    const anim = new AnimatedValue({
      from: 0,
      to: 100,
      duration: 1000,
      easing: easing.easeInQuad,
    });
    anim.tick(500);
    // easeInQuad at t=0.5 is 0.25, so value = 25
    expect(anim.value).toBeCloseTo(25, 5);
  });

  test("onUpdate callback called", () => {
    let lastValue = -1;
    let lastProgress = -1;
    new AnimatedValue({
      from: 0,
      to: 100,
      duration: 1000,
      onUpdate: (v, p) => {
        lastValue = v;
        lastProgress = p;
      },
    }).tick(300);
    expect(lastValue).toBe(30);
    expect(lastProgress).toBe(0.3);
  });

  test("reset restores initial state", () => {
    const anim = new AnimatedValue({ from: 0, to: 100, duration: 1000 });
    anim.tick(800);
    anim.reset();
    expect(anim.value).toBe(0);
    expect(anim.progress).toBe(0);
    expect(anim.isDone).toBe(false);
  });

  test("toPromise resolves on completion", async () => {
    const anim = new AnimatedValue({ from: 0, to: 100, duration: 100 });
    anim.tick(100);
    await anim.toPromise();
    expect(anim.isDone).toBe(true);
  });

  test("toPromise for already done resolves immediately", async () => {
    const anim = new AnimatedValue({ from: 0, to: 100, duration: 100 });
    anim.tick(100);
    // Should resolve synchronously
    const p = anim.toPromise();
    const resolved = await Promise.race([
      p.then(() => "done"),
      new Promise((r) => setTimeout(() => r("timeout"), 10)),
    ]);
    expect(resolved).toBe("done");
  });
});
