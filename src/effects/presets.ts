import type { Drawable } from "../scene/scene.js";
import type { Renderer } from "../renderer/renderer.js";
import { AnimatedValue } from "../primitives/animated-value.js";
import { type Rgb, hexToRgb, dimColor } from "../color/index.js";
import { type EasingFn, easing } from "../easing/index.js";

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_SIMPLE = ["|", "/", "-", "\\"];

/**
 * A spinning indicator at a fixed position.
 */
export class SpinnerEffect implements Drawable {
  isDone = false;
  private _elapsed = 0;
  private _frame = 0;
  private _interval: number;
  private _frames: string[];
  private _label: string;
  private _fg: Rgb | null = null;

  constructor(
    private _col: number,
    private _row: number,
    opts?: { label?: string; color?: string | Rgb; type?: "braille" | "ascii" }
  ) {
    this._label = opts?.label ?? "";
    this._fg = typeof opts?.color === "string" ? hexToRgb(opts.color) : (opts?.color ?? null);
    this._frames = opts?.type === "ascii" ? SPINNER_SIMPLE : SPINNER_FRAMES;
    this._interval = 80;
  }

  update(deltaMs: number): boolean {
    this._elapsed += deltaMs;
    this._frame = Math.floor(this._elapsed / this._interval) % this._frames.length;
    return true;
  }

  draw(renderer: Renderer): void {
    const frame = this._frames[this._frame]!;
    const full = `${frame} ${this._label}`;
    renderer.writeString(this._col, this._row, full, this._fg);
  }

  stop(): void {
    this.isDone = true;
  }

  done(): Promise<void> {
    return Promise.resolve();
  }
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

/**
 * A gradient-filled progress bar.
 */
export class ProgressBarEffect implements Drawable {
  private _anim: AnimatedValue;
  private _resolve: (() => void) | null = null;
  private _promise: Promise<void>;
  private _resolved = false;

  constructor(
    private _col: number,
    private _row: number,
    private _width: number,
    opts?: {
      duration?: number;
      fromColor?: string | Rgb;
      toColor?: string | Rgb;
      bgChar?: string;
      fillChar?: string;
      easing?: EasingFn;
    }
  ) {
    this._anim = new AnimatedValue({
      from: 0,
      to: 1,
      duration: opts?.duration ?? 2000,
      easing: opts?.easing ?? easing.easeOutCubic,
    });
    this._promise = new Promise((r) => { this._resolve = r; });
  }

  get isDone(): boolean {
    return this._resolved;
  }

  update(deltaMs: number): boolean {
    const running = this._anim.tick(deltaMs);
    if (!running && !this._resolved) {
      this._resolved = true;
      this._resolve?.();
    }
    return running;
  }

  draw(renderer: Renderer): void {
    const progress = this._anim.value;
    const filled = Math.round(this._width * progress);
    for (let x = 0; x < this._width; x++) {
      const t = x / Math.max(1, this._width - 1);
      const col: Rgb = [
        Math.round(46 + (x < filled ? 100 : 0)),
        Math.round(204 - t * 100),
        Math.round(113 - t * 50),
      ];
      const c = x < filled ? "█" : "░";
      renderer.setCell(this._col + x, this._row, c, col);
    }
  }

  done(): Promise<void> {
    return this._promise;
  }
}

// ---------------------------------------------------------------------------
// Typewriter text
// ---------------------------------------------------------------------------

/**
 * Reveals text character by character, typewriter-style.
 */
export class TypewriterEffect implements Drawable {
  private _anim: AnimatedValue;
  private _resolve: (() => void) | null = null;
  private _promise: Promise<void>;
  private _resolved = false;

  constructor(
    private _text: string,
    private _col: number,
    private _row: number,
    opts?: {
      duration?: number;
      color?: string | Rgb;
      cursor?: boolean;
      cursorColor?: string | Rgb;
    }
  ) {
    this._anim = new AnimatedValue({
      from: 0,
      to: this._text.length,
      duration: opts?.duration ?? this._text.length * 80,
      easing: easing.linear,
    });
    this._promise = new Promise((r) => { this._resolve = r; });
  }

  get isDone(): boolean {
    return this._resolved;
  }

  update(deltaMs: number): boolean {
    const running = this._anim.tick(deltaMs);
    if (!running && !this._resolved) {
      this._resolved = true;
      this._resolve?.();
    }
    return running;
  }

  draw(renderer: Renderer): void {
    const chars = Math.round(this._anim.value);
    const visible = this._text.slice(0, chars);
    renderer.writeString(this._col, this._row, visible);
  }

  done(): Promise<void> {
    return this._promise;
  }
}

// ---------------------------------------------------------------------------
// Fade effect (wraps any drawable)
// ---------------------------------------------------------------------------

/**
 * Fade a region of the screen in or out.
 */
export class FadeEffect implements Drawable {
  private _anim: AnimatedValue;
  private _resolve: (() => void) | null = null;
  private _promise: Promise<void>;
  private _resolved = false;

  constructor(
    private _col: number,
    private _row: number,
    private _width: number,
    private _height: number,
    opts?: {
      duration?: number;
      direction?: "in" | "out";
      color?: Rgb;
      easing?: EasingFn;
    }
  ) {
    this._anim = new AnimatedValue({
      from: opts?.direction === "out" ? 1 : 0,
      to: opts?.direction === "out" ? 0 : 1,
      duration: opts?.duration ?? 500,
      easing: opts?.easing ?? easing.easeInOutQuad,
    });
    this._promise = new Promise((r) => { this._resolve = r; });
  }

  get isDone(): boolean {
    return this._resolved;
  }

  update(deltaMs: number): boolean {
    const running = this._anim.tick(deltaMs);
    if (!running && !this._resolved) {
      this._resolved = true;
      this._resolve?.();
    }
    return running;
  }

  draw(renderer: Renderer): void {
    const opacity = this._anim.value;
    const grid = renderer.grid;
    for (let r = this._row; r < this._row + this._height && r < grid.rows; r++) {
      for (let c = this._col; c < this._col + this._width && c < grid.cols; c++) {
        const cell = grid.next[r]![c]!;
        if (cell.bg) {
          cell.bg = dimColor(cell.bg, opacity);
        }
        if (cell.fg) {
          cell.fg = dimColor(cell.fg, opacity);
        }
      }
    }
  }

  done(): Promise<void> {
    return this._promise;
  }
}

// ---------------------------------------------------------------------------
// Slide effect
// ---------------------------------------------------------------------------

type SlideDir = "left" | "right" | "top" | "bottom";

/**
 * Slide a rectangular region on/off screen.
 */
export class SlideEffect implements Drawable {
  private _anim: AnimatedValue;
  private _resolve: (() => void) | null = null;
  private _promise: Promise<void>;
  private _resolved = false;

  constructor(
    private _width: number,
    private _height: number,
    private _dir: SlideDir,
    private _drawContent: (renderer: Renderer, offsetX: number, offsetY: number) => void,
    opts?: {
      duration?: number;
      direction?: "in" | "out";
      easing?: EasingFn;
    }
  ) {
    this._anim = new AnimatedValue({
      from: opts?.direction === "out" ? 0 : -1,
      to: opts?.direction === "out" ? -1 : 0,
      duration: opts?.duration ?? 400,
      easing: opts?.easing ?? easing.easeOutCubic,
    });
    this._promise = new Promise((r) => { this._resolve = r; });
  }

  get isDone(): boolean {
    return this._resolved;
  }

  update(deltaMs: number): boolean {
    const running = this._anim.tick(deltaMs);
    if (!running && !this._resolved) {
      this._resolved = true;
      this._resolve?.();
    }
    return running;
  }

  draw(renderer: Renderer): void {
    const t = this._anim.value;
    let ox = 0;
    let oy = 0;
    switch (this._dir) {
      case "left": ox = Math.round(this._width * t); break;
      case "right": ox = Math.round(-this._width * t); break;
      case "top": oy = Math.round(this._height * t); break;
      case "bottom": oy = Math.round(-this._height * t); break;
    }
    this._drawContent(renderer, ox, oy);
  }

  done(): Promise<void> {
    return this._promise;
  }
}

// ---------------------------------------------------------------------------
// Matrix rain effect
// ---------------------------------------------------------------------------

const MATRIX_CHARS = "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾝ0123456789";

/**
 * Matrix digital rain effect.
 */
export class MatrixEffect implements Drawable {
  isDone = false;
  private _drops: number[] = [];
  private _cols: number;
  private _rows: number;
  private _elapsed = 0;
  private _interval = 50;

  constructor(
    cols: number,
    rows: number
  ) {
    this._cols = cols;
    this._rows = rows;
    this._drops = new Array(cols).fill(0).map(() => Math.floor(Math.random() * rows));
  }

  update(deltaMs: number): boolean {
    this._elapsed += deltaMs;
    if (this._elapsed < this._interval) return true;
    this._elapsed = 0;

    for (let c = 0; c < this._cols; c++) {
      const drop = this._drops[c]!;
      this._drops[c] = drop + 1 >= this._rows * 2 ? 0 : drop + 1;
    }
    return true;
  }

  draw(renderer: Renderer): void {
    const grid = renderer.grid;
    for (let c = 0; c < this._cols && c < grid.cols; c++) {
      const drop = this._drops[c]!;
      for (let r = 0; r < grid.rows; r++) {
        if (r === drop) {
          const cell = grid.next[r]![c]!;
          cell.char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]!;
          cell.fg = [180, 255, 180];
          cell.style.bold = true;
        } else if (r === drop - 1) {
          const cell = grid.next[r]![c]!;
          cell.char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]!;
          cell.fg = [100, 200, 100];
        } else if (r === drop - 2) {
          const cell = grid.next[r]![c]!;
          cell.char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]!;
          cell.fg = [50, 150, 50];
        }
      }
    }
  }

  stop(): void {
    this.isDone = true;
  }

  done(): Promise<void> {
    return Promise.resolve();
  }
}

// ---------------------------------------------------------------------------
// Firework particle burst
// ---------------------------------------------------------------------------

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  char: string;
  color: Rgb;
}

export class FireworkEffect implements Drawable {
  private _isDone = false;
  private _particles: Particle[] = [];
  private _elapsed = 0;
  private _resolve: (() => void) | null = null;
  private _promise: Promise<void>;

  constructor(
    private _x: number,
    private _y: number,
    opts?: { count?: number; color?: Rgb }
  ) {
    const count = opts?.count ?? 30;
    const baseColor = opts?.color ?? [255, 200, 0];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 6;
      this._particles.push({
        x: this._x,
        y: this._y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.5,
        life: 0,
        maxLife: 500 + Math.random() * 500,
        char: "•",
        color: baseColor,
      });
    }
    this._promise = new Promise((r) => { this._resolve = r; });
  }

  get isDone(): boolean {
    return this._isDone;
  }

  update(deltaMs: number): boolean {
    this._elapsed += deltaMs;
    let anyAlive = false;
    for (const p of this._particles) {
      p.life += deltaMs;
      if (p.life < p.maxLife) {
        p.vy += 0.1;
        p.x += p.vx * (deltaMs / 16);
        p.y += p.vy * (deltaMs / 16);
        anyAlive = true;
      }
    }
    if (!anyAlive) {
      this._isDone = true;
      this._resolve?.();
    }
    return anyAlive;
  }

  draw(renderer: Renderer): void {
    for (const p of this._particles) {
      if (p.life >= p.maxLife) continue;
      const progress = p.life / p.maxLife;
      const dimmed = dimColor(p.color, 1 - progress);
      const col = Math.round(p.x);
      const row = Math.round(p.y);
      if (col >= 0 && row >= 0) {
        renderer.setCell(col, row, p.char, dimmed);
      }
    }
  }

  done(): Promise<void> {
    return this._promise;
  }
}
