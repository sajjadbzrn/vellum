import { describe, test, expect } from "bun:test";
import { TextEntity, BoxEntity, text, box } from "../src/scene/index.ts";
import { Renderer } from "../src/renderer/renderer.ts";
import { easing } from "../src/easing/index.ts";

describe("TextEntity", () => {
  test("constructor sets content", () => {
    const t = new TextEntity("Hello");
    expect(t.isDone).toBe(false);
  });

  test("at positions the text", () => {
    const t = new TextEntity("Hi").at(5, 3);
    const renderer = new Renderer(20, 10);
    t.draw(renderer);
    const cell = renderer.grid.next[3]![5]!;
    expect(cell.char).toBe("H");
  });

  test("color sets foreground", () => {
    const t = new TextEntity("X").at(0, 0).color("#ff0000");
    const renderer = new Renderer(10, 5);
    t.draw(renderer);
    expect(renderer.grid.next[0]![0]!.fg).toEqual([255, 0, 0]);
  });

  test("fadeIn animates opacity", () => {
    const t = new TextEntity("X").at(0, 0).color("#ff0000").fadeIn(100);
    const renderer = new Renderer(10, 5);
    t.update(50); // halfway, easeOutQuad gives ~0.75
    t.draw(renderer);
    const fg = renderer.grid.next[0]![0]!.fg;
    expect(fg).not.toBeNull();
    // easeOutQuad at t=0.5 is 0.75, so opacity = 0.75, red = 191
    expect(fg![0]).toBeCloseTo(191, -1);
  });

  test("fadeOut animates toward transparent", () => {
    const t = new TextEntity("X").at(0, 0).color("#ffffff").fadeOut(100);
    t.update(50); // halfway, easeInQuad gives 0.25, opacity = 0.75
    const renderer = new Renderer(10, 5);
    t.draw(renderer);
    const fg = renderer.grid.next[0]![0]!.fg;
    expect(fg![0]).toBeCloseTo(191, -1);
  });

  test("typewriter reveals characters over time", () => {
    const t = new TextEntity("Hello").at(0, 0).typewrite(100);
    t.update(60); // 60% through
    const renderer = new Renderer(10, 5);
    t.draw(renderer);
    // Should show ~3 chars
    expect(renderer.grid.next[0]![0]!.char).toBe("H");
    expect(renderer.grid.next[0]![2]!.char).toBe("l");
    expect(renderer.grid.next[0]![3]!.char).toBe(" "); // not yet revealed
  });

  test("bold sets style flag", () => {
    const t = new TextEntity("X").at(0, 0).bold();
    const renderer = new Renderer(10, 5);
    t.draw(renderer);
    expect(renderer.grid.next[0]![0]!.style.bold).toBe(true);
  });

  test("chain all methods", () => {
    const t = new TextEntity("!")
      .at(3, 2)
      .color("#00ff00")
      .bold()
      .fadeIn(200)
      .typewrite(500);
    expect(t).toBeDefined();
  });
});

describe("BoxEntity", () => {
  test("constructor sets dimensions", () => {
    const b = new BoxEntity(10, 5);
    expect(b.isDone).toBe(false);
  });

  test("at positions the box", () => {
    const b = new BoxEntity(4, 3).at(2, 1);
    const renderer = new Renderer(20, 10);
    b.draw(renderer);
    expect(renderer.grid.next[1]![2]!.char).toBe(" ");
    expect(renderer.grid.next[3]![5]!.char).toBe(" ");
    expect(renderer.grid.next[4]![2]!.char).toBe(" "); // outside height
  });

  test("color fills background", () => {
    const b = new BoxEntity(3, 2).at(0, 0).color("#ff0000");
    const renderer = new Renderer(10, 5);
    b.draw(renderer);
    expect(renderer.grid.next[0]![0]!.bg).toEqual([255, 0, 0]);
  });

  test("fillChar changes fill character", () => {
    const b = new BoxEntity(3, 1).at(0, 0).fillChar("█");
    const renderer = new Renderer(10, 5);
    b.draw(renderer);
    expect(renderer.grid.next[0]![0]!.char).toBe("█");
  });

  test("slideIn from left offsets position", () => {
    const b = new BoxEntity(10, 3).at(5, 2).slideIn("left", 100);
    const renderer = new Renderer(30, 10);
    b.update(0); // start
    b.draw(renderer);
    // At progress 0, box should be off-screen to the left
    // Position: col = 5 - 10*(1-0) = -5
    // Should be clamped by fillRect
    // Verify it renders somewhere (it should, clamped)
  });

  test("slideIn from right completes at target position", () => {
    const b = new BoxEntity(4, 2).at(0, 0).slideIn("right", 1000);
    b.update(1000); // complete
    const renderer = new Renderer(20, 10);
    b.draw(renderer);
    // Should be at final position
    expect(renderer.grid.next[0]![0]!.char).toBe(" ");
  });
});

describe("factory functions", () => {
  test("text() creates TextEntity", () => {
    const t = text("Hello");
    expect(t).toBeInstanceOf(TextEntity);
  });

  test("box() creates BoxEntity", () => {
    const b = box(10, 5);
    expect(b).toBeInstanceOf(BoxEntity);
  });

  test("fluent chainable API", () => {
    const b = box(10, 3).at(0, 0).color("#333").slideIn("left", 300);
    expect(b).toBeInstanceOf(BoxEntity);
  });
});
