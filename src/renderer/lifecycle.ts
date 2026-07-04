/**
 * Terminal lifecycle management.
 *
 * Handles:
 * - Hiding/restoring the cursor during animation
 * - Alternate screen buffer to avoid polluting scrollback
 * - SIGINT/SIGTERM cleanup
 * - stdout resize detection and reflow
 *
 * Uses process event hooks to guarantee terminal state is always
 * restored even on crash or signal.
 */

const ALT_SCREEN_ENTER = "\x1b[?1049h";
const ALT_SCREEN_EXIT = "\x1b[?1049l";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
const CLEAR_SCREEN = "\x1b[2J\x1b[H";

let cleanupRegistered = false;
let cleanupStack: Array<() => void> = [];
let altScreenActive = false;
let cursorHidden = false;

function registerLifecycle(): void {
  if (cleanupRegistered) return;
  cleanupRegistered = true;

  const cleanup = (): void => {
    restoreAll();
  };

  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(143);
  });
  process.on("uncaughtException", (err) => {
    cleanup();
    console.error(err);
    process.exit(1);
  });
  process.on("unhandledRejection", (reason) => {
    cleanup();
    console.error(reason);
    process.exit(1);
  });
}

function restoreAll(): void {
  if (altScreenActive) {
    process.stdout.write(ALT_SCREEN_EXIT);
    altScreenActive = false;
  }
  if (cursorHidden) {
    process.stdout.write(SHOW_CURSOR);
    cursorHidden = false;
  }
  for (const fn of cleanupStack.reverse()) {
    try {
      fn();
    } catch {
      // Ignore cleanup errors
    }
  }
  cleanupStack = [];
}

/**
 * Enter alternate screen buffer mode. The animation won't pollute
 * the user's scrollback, and the original screen is restored on exit.
 */
export function enterAltScreen(): void {
  registerLifecycle();
  if (!altScreenActive) {
    process.stdout.write(ALT_SCREEN_ENTER);
    process.stdout.write(CLEAR_SCREEN);
    altScreenActive = true;
  }
}

/** Exit alternate screen buffer and return to the main buffer. */
export function exitAltScreen(): void {
  if (altScreenActive) {
    process.stdout.write(ALT_SCREEN_EXIT);
    altScreenActive = false;
  }
}

/** Hide the terminal cursor. Always restored at process exit. */
export function hideCursor(): void {
  registerLifecycle();
  if (!cursorHidden) {
    process.stdout.write(HIDE_CURSOR);
    cursorHidden = true;
  }
}

/** Show the terminal cursor. */
export function showCursor(): void {
  if (cursorHidden) {
    process.stdout.write(SHOW_CURSOR);
    cursorHidden = false;
  }
}

/**
 * Register a custom cleanup function to be called on exit.
 * Useful for custom state restoration.
 */
export function onCleanup(fn: () => void): void {
  registerLifecycle();
  cleanupStack.push(fn);
}

/**
 * Subscribe to terminal resize events. Returns an unsubscribe function.
 */
export function onResize(
  callback: (cols: number, rows: number) => void
): () => void {
  const handler = (): void => {
    const cols = process.stdout.columns ?? 80;
    const rows = process.stdout.rows ?? 24;
    callback(cols, rows);
  };

  process.stdout.on("resize", handler);
  return () => process.stdout.off("resize", handler);
}

/** Get current terminal dimensions. */
export function getTermSize(): { cols: number; rows: number } {
  return {
    cols: process.stdout.columns ?? 80,
    rows: process.stdout.rows ?? 24,
  };
}

/** Clear the screen and move cursor to home. */
export function clearScreen(): void {
  process.stdout.write(CLEAR_SCREEN);
}
