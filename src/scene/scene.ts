import { Renderer } from "../renderer/renderer.js";
import { FrameLoop } from "../primitives/frame-loop.js";
import { AnimatedValue } from "../primitives/animated-value.js";
import { type EasingFn, easing } from "../easing/index.js";
import { type Rgb, hexToRgb } from "../color/index.js";
import {
  hideCursor,
  showCursor,
  enterAltScreen,
  exitAltScreen,
  onResize,
  getTermSize,
} from "../renderer/lifecycle.js";

// ---------------------------------------------------------------------------
// Scene entity types
// ---------------------------------------------------------------------------

/** Drawing primitives that can be added to a scene. */
export interface Drawable {
  /** Called once per frame with delta ms. Return false when done. */
  update(deltaMs: number): boolean;
  /** Draw into the renderer's next buffer. */
  draw(renderer: Renderer): void;
  /** Promise that resolves when this entity is done animating. */
  done(): Promise<void>;
  /** Whether the entity has finished. */
  readonly isDone: boolean;
}

// ---------------------------------------------------------------------------
// Text entity
// ---------------------------------------------------------------------------

type TextAnim = "fadeIn" | "fadeOut" | "typewriter";

/**
 * A composable text entity with fluent chainable API.
 *
 * @example
 * ```ts
 * text("Hello").at(2, 1).color("#ff6b6b").fadeIn(400)
 * ```
 */
export class TextEntity implements Drawable {
  private _col: number = 0;
  private _row: number = 0;
  private _fg: Rgb | null = null;
  private _bg: Rgb | null = null;
  private _fontBold: boolean = false;
  private _fontDim: boolean = false;
  private _fontItalic: boolean = false;
  private _content: string;

  private _anims: { type: TextAnim; anim: AnimatedValue }[] = [];
  private _complete: boolean = false;
  private _resolve: (() => void) | null = null;
  private _promise: Promise<void>;
  private _resolved: boolean = false;

  constructor(content: string) {
    this._content = content;
    this._promise = new Promise((r) => {
      this._resolve = r;
    });
  }

  get isDone(): boolean {
    return this._complete;
  }

  /** Set position (column, row). Chainable. */
  at(col: number, row: number): this {
    this._col = col;
    this._row = row;
    return this;
  }

  /** Set foreground color (hex string or RGB). Chainable. */
  color(c: string | Rgb): this {
    this._fg = typeof c === "string" ? hexToRgb(c) : c;
    return this;
  }

  /** Set background color. Chainable. */
  background(c: string | Rgb): this {
    this._bg = typeof c === "string" ? hexToRgb(c) : c;
    return this;
  }

  /** Make text bold. Chainable. */
  bold(): this {
    this._fontBold = true;
    return this;
  }

  /** Make text dim. Chainable. */
  dim(): this {
    this._fontDim = true;
    return this;
  }

  /** Make text italic. Chainable. */
  italic(): this {
    this._fontItalic = true;
    return this;
  }

  /** Fade in over duration milliseconds. Chainable. */
  fadeIn(durationMs: number, easingFn?: EasingFn): this {
    this._anims.push({
      type: "fadeIn",
      anim: new AnimatedValue({
        from: 0,
        to: 1,
        duration: durationMs,
        easing: easingFn ?? easing.easeOutQuad,
      }),
    });
    return this;
  }

  /** Fade out over duration milliseconds. Chainable. */
  fadeOut(durationMs: number, easingFn?: EasingFn): this {
    this._anims.push({
      type: "fadeOut",
      anim: new AnimatedValue({
        from: 1,
        to: 0,
        duration: durationMs,
        easing: easingFn ?? easing.easeInQuad,
      }),
    });
    return this;
  }

  /** Typewriter reveal effect over duration milliseconds. Chainable. */
  typewrite(durationMs: number, easingFn?: EasingFn): this {
    this._anims.push({
      type: "typewriter",
      anim: new AnimatedValue({
        from: 0,
        to: this._content.length,
        duration: durationMs,
        easing: easingFn ?? easing.linear,
      }),
    });
    return this;
  }

  update(deltaMs: number): boolean {
    if (this._complete) return false;
    let allDone = true;
    for (const { anim } of this._anims) {
      if (anim.tick(deltaMs)) allDone = false;
    }
    if (allDone && !this._resolved) {
      this._resolved = true;
      this._resolve?.();
    }
    return !allDone;
  }

  draw(renderer: Renderer): void {
    const grid = renderer.grid;
    const maxCols = grid.cols;
    const maxRows = grid.rows;

    // Compute effective opacity from fade animations
    let opacity = 1;
    let revealChars = -1;
    for (const { type, anim } of this._anims) {
      if (type === "fadeIn" || type === "fadeOut") {
        opacity = anim.value;
      }
      if (type === "typewriter") {
        revealChars = Math.round(anim.value);
      }
    }

    const chars =
      revealChars >= 0 ? this._content.slice(0, revealChars) : this._content;

    for (let ci = 0; ci < chars.length; ci++) {
      const c = this._col + ci;
      const r = this._row;
      if (c < 0 || c >= maxCols || r < 0 || r >= maxRows) continue;

      const cell = grid.next[r]![c]!;
      cell.char = chars[ci]!;

      if (this._fg) {
        cell.fg = [
          Math.round(this._fg[0] * opacity),
          Math.round(this._fg[1] * opacity),
          Math.round(this._fg[2] * opacity),
        ];
      }
      if (this._bg) {
        cell.bg = [
          Math.round(this._bg[0] * opacity),
          Math.round(this._bg[1] * opacity),
          Math.round(this._bg[2] * opacity),
        ];
      }
      if (this._fontBold) cell.style.bold = true;
      if (this._fontDim) cell.style.dim = true;
      if (this._fontItalic) cell.style.italic = true;
    }
  }

  done(): Promise<void> {
    return this._promise;
  }
}

// ---------------------------------------------------------------------------
// Box entity
// ---------------------------------------------------------------------------

type SlideDirection = "left" | "right" | "top" | "bottom";

/**
 * A filled rectangular box entity with chainable API.
 *
 * @example
 * ```ts
 * box(20, 5).at(10, 3).color("#2c3e50").slideIn("left", 300, "easeOutBack")
 * ```
 */
export class BoxEntity implements Drawable {
  private _col: number = 0;
  private _row: number = 0;
  private _width: number;
  private _height: number;
  private _fg: Rgb | null = null;
  private _bg: Rgb | null = null;
  private _fillChar: string = " ";

  private _anims: Array<{
    type: "fadeIn" | "slide";
    anim: AnimatedValue;
    dir?: SlideDirection;
  }> = [];
  private _complete: boolean = false;
  private _resolve: (() => void) | null = null;
  private _promise: Promise<void>;
  private _resolved: boolean = false;

  constructor(width: number, height: number) {
    this._width = width;
    this._height = height;
    this._promise = new Promise((r) => {
      this._resolve = r;
    });
  }

  get isDone(): boolean {
    return this._complete;
  }

  /** Set position. Chainable. */
  at(col: number, row: number): this {
    this._col = col;
    this._row = row;
    return this;
  }

  /** Set fill color (background). Chainable. */
  color(c: string | Rgb): this {
    this._bg = typeof c === "string" ? hexToRgb(c) : c;
    return this;
  }

  /** Set foreground/text color. Chainable. */
  foreground(c: string | Rgb): this {
    this._fg = typeof c === "string" ? hexToRgb(c) : c;
    return this;
  }

  /** Custom fill character. Chainable. */
  fillChar(ch: string): this {
    this._fillChar = ch;
    return this;
  }

  /** Fade in over duration. Chainable. */
  fadeIn(durationMs: number, easingFn?: EasingFn): this {
    this._anims.push({
      type: "fadeIn",
      anim: new AnimatedValue({
        from: 0,
        to: 1,
        duration: durationMs,
        easing: easingFn ?? easing.easeOutQuad,
      }),
    });
    return this;
  }

  /** Slide in from a direction over duration. Chainable. */
  slideIn(
    dir: SlideDirection,
    durationMs: number,
    easingName?: string
  ): this {
    const fn = typeof easingName === "string" ? easing[easingName as keyof typeof easing] ?? easing.easeOutCubic : easing.easeOutCubic;
    this._anims.push({
      type: "slide",
      dir,
      anim: new AnimatedValue({
        from: 0,
        to: 1,
        duration: durationMs,
        easing: fn,
      }),
    });
    return this;
  }

  update(deltaMs: number): boolean {
    if (this._complete) return false;
    let allDone = true;
    for (const { anim } of this._anims) {
      if (anim.tick(deltaMs)) allDone = false;
    }
    if (allDone && !this._resolved) {
      this._resolved = true;
      this._resolve?.();
    }
    return !allDone;
  }

  draw(renderer: Renderer): void {
    let x = this._col;
    let y = this._row;
    let w = this._width;
    let h = this._height;
    let opacity = 1;

    for (const { type, anim, dir } of this._anims) {
      if (type === "fadeIn") {
        opacity = anim.value;
      }
      if (type === "slide" && dir) {
        const p = anim.value;
        switch (dir) {
          case "left":
            x = this._col - Math.round(this._width * (1 - p));
            break;
          case "right":
            x = this._col + Math.round(this._width * (1 - p));
            break;
          case "top":
            y = this._row - Math.round(this._height * (1 - p));
            break;
          case "bottom":
            y = this._row + Math.round(this._height * (1 - p));
            break;
        }
      }
    }

    const dimBg: [number, number, number] | null = this._bg
      ? [
          Math.round(this._bg[0] * opacity),
          Math.round(this._bg[1] * opacity),
          Math.round(this._bg[2] * opacity),
        ]
      : null;

    renderer.fillRect(x, y, w, h, this._fillChar, this._fg, dimBg);
  }

  done(): Promise<void> {
    return this._promise;
  }
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export interface SceneConfig {
  fps?: number;
  altScreen?: boolean;
  autoResize?: boolean;
}

/**
 * A scene is the top-level composition container.
 *
 * Add entities, then call `play()` to start the animation loop.
 */
export class Scene {
  private entities: Drawable[] = [];
  private renderer: Renderer;
  private loop: FrameLoop | null = null;
  private config: Required<SceneConfig>;
  private running: boolean = false;
  private unsubscribeResize: (() => void) | null = null;

  constructor(config: SceneConfig = {}) {
    this.config = {
      fps: config.fps ?? 30,
      altScreen: config.altScreen ?? false,
      autoResize: config.autoResize ?? true,
    };

    const { cols, rows } = getTermSize();
    this.renderer = new Renderer(cols, rows);
  }

  /** Add an entity to the scene. Returns the entity for chaining. */
  add<T extends Drawable>(entity: T): T {
    this.entities.push(entity);
    return entity;
  }

  /** Remove all entities. */
  clear(): void {
    this.entities = [];
  }

  /** Access the underlying renderer. */
  get r(): Renderer {
    return this.renderer;
  }

  /**
   * Start playing the animation loop.
   * Returns a promise that resolves when all entities finish.
   */
  play(): Promise<void> {
    if (this.running) return Promise.resolve();

    return new Promise((resolve) => {
      this.running = true;

      if (this.config.altScreen) enterAltScreen();
      hideCursor();

      if (this.config.autoResize) {
        this.unsubscribeResize = onResize((cols, rows) => {
          this.renderer.resize(cols, rows);
        });
      }

      const checkDone = (): void => {
        if (!this.running) return;
        if (
          this.entities.length > 0 &&
          this.entities.every((e) => e.isDone)
        ) {
          this.stop();
          resolve();
        }
      };

      this.loop = new FrameLoop(
        this.config.fps,
        (deltaMs) => {
          if (!this.running) return;
          for (const entity of this.entities) {
            entity.update(deltaMs);
          }
          checkDone();
        },
        () => {
          if (!this.running) return;
          this.renderer.grid.clearNext();
          for (const entity of this.entities) {
            entity.draw(this.renderer);
          }
          this.renderer.render();
        }
      );

      this.loop.start();
    });
  }

  /** Stop the scene and restore terminal state. */
  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.loop?.stop();
    this.loop = null;
    this.unsubscribeResize?.();
    showCursor();
    if (this.config.altScreen) exitAltScreen();
  }

  /** Wait for all entities to finish. */
  async done(): Promise<void> {
    await Promise.all(this.entities.map((e) => e.done()));
  }
}

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

/**
 * Create a new scene.
 */
export function createScene(config?: SceneConfig): Scene {
  return new Scene(config);
}

/**
 * Create a text entity.
 */
export function text(content: string): TextEntity {
  return new TextEntity(content);
}

/**
 * Create a box entity.
 */
export function box(width: number, height: number): BoxEntity {
  return new BoxEntity(width, height);
}
