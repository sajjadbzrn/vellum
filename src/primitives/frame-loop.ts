/**
 * A timestamp-corrected frame loop using the accumulator pattern.
 *
 * NOT setInterval — uses performance.now() for accurate timing,
 * exposes delta milliseconds to update callbacks so motion is
 * frame-rate independent. Supports configurable target FPS.
 */
export class FrameLoop {
  private frameTime: number;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private running: boolean = false;
  private rafId: ReturnType<typeof setTimeout> | null = null;
  private updateCallback: (deltaMs: number) => void;
  private renderCallback: () => void;

  constructor(
    fps: number,
    onUpdate: (deltaMs: number) => void,
    onRender: () => void
  ) {
    this.frameTime = 1000 / fps;
    this.updateCallback = onUpdate;
    this.renderCallback = onRender;
  }

  /** Change the target FPS at runtime. */
  setFps(fps: number): void {
    this.frameTime = 1000 / fps;
  }

  /** Start the frame loop. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.scheduleFrame();
  }

  /** Stop the frame loop. */
  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      clearTimeout(this.rafId);
      this.rafId = null;
    }
  }

  private scheduleFrame(): void {
    if (!this.running) return;
    this.rafId = setTimeout(() => this.loop(), this.frameTime);
  }

  private loop(): void {
    if (!this.running) return;

    const now = performance.now();
    const rawDelta = now - this.lastTime;
    this.lastTime = now;

    // Cap delta to prevent spiral of death after tab switch / resize
    const maxFrame = this.frameTime * 3;
    const delta = Math.min(rawDelta, maxFrame);

    this.accumulator += delta;

    let updates = 0;
    while (this.accumulator >= this.frameTime && updates < 10) {
      this.updateCallback(this.frameTime);
      this.accumulator -= this.frameTime;
      updates++;
    }

    this.renderCallback();
    this.scheduleFrame();
  }
}
