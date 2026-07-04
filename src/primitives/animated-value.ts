import type { EasingFn } from "../easing/index.js";
import { easing } from "../easing/index.js";

export interface AnimatedValueConfig {
  from: number;
  to: number;
  duration: number; // milliseconds
  easing?: EasingFn;
  /** Called every frame with the current value (0..1 progress and interpolated value). */
  onUpdate?: (value: number, progress: number) => void;
}

/**
 * A single tweened numeric value.
 *
 * This is the atomic building block: position, opacity, color channels,
 * rotation — everything composes down to AnimatedValues.
 *
 * Driven externally by the frame loop passing delta time; the value
 * interpolates from `from` to `to` with the given easing curve.
 */
export class AnimatedValue {
  readonly from: number;
  readonly to: number;
  readonly duration: number;
  readonly easingFn: EasingFn;
  readonly onUpdate?: ((value: number, progress: number) => void) | undefined;

  private _elapsed: number = 0;
  private _value: number;
  private _progress: number = 0;
  private _done: boolean = false;
  private _resolve: (() => void) | null = null;
  private _promise: Promise<void> | null = null;

  constructor(config: AnimatedValueConfig) {
    this.from = config.from;
    this.to = config.to;
    this.duration = config.duration;
    this.easingFn = config.easing ?? easing.linear;
    this.onUpdate = config.onUpdate;
    this._value = config.from;
  }

  /** Current interpolated value. */
  get value(): number {
    return this._value;
  }

  /** Current progress 0..1. */
  get progress(): number {
    return this._progress;
  }

  /** Whether the animation has completed. */
  get isDone(): boolean {
    return this._done;
  }

  /**
   * Advance the animation by deltaMs milliseconds.
   * Returns `true` if the animation is still running, `false` if finished.
   */
  tick(deltaMs: number): boolean {
    if (this._done) return false;

    this._elapsed += deltaMs;
    this._progress = Math.min(1, this._elapsed / this.duration);
    const eased = this.easingFn(this._progress);
    this._value = this.from + (this.to - this.from) * eased;

    this.onUpdate?.(this._value, this._progress);

    if (this._progress >= 1) {
      this._done = true;
      this._resolve?.();
      return false;
    }
    return true;
  }

  /** Reset the animation to the beginning. */
  reset(): void {
    this._elapsed = 0;
    this._progress = 0;
    this._value = this.from;
    this._done = false;
    this._promise = null;
    this._resolve = null;
  }

  /** Returns a promise that resolves when the animation completes. */
  toPromise(): Promise<void> {
    if (this._done) return Promise.resolve();
    if (!this._promise) {
      this._promise = new Promise((resolve) => {
        this._resolve = resolve;
      });
    }
    return this._promise;
  }
}
