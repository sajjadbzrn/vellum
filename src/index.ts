// ---------------------------------------------------------------------------
// vellum — Professional terminal animation engine
// ---------------------------------------------------------------------------

// Renderer (low-level)
export {
  type Cell,
  type CellStyle,
  type ColorDepth,
  type CellDiff,
  GridBuffer,
  Renderer,
  emptyCell,
  cell,
  computeDiffs,
  generateAnsi,
  sgrCode,
} from "./renderer/index.js";

// Easing
export {
  type EasingFn,
  type EasingName,
  easing,
  getEasing,
} from "./easing/index.js";

// Color
export {
  type Rgb,
  type Hsl,
  type ColorName,
  colors,
  color,
  lerpColor,
  hexToRgb,
  rgbToHex,
  dimColor,
  detectColorDepth,
} from "./color/index.js";

// Primitives
export { AnimatedValue, type AnimatedValueConfig } from "./primitives/animated-value.js";
export { FrameLoop } from "./primitives/frame-loop.js";

// Scene / composition
export {
  type Drawable,
  type SceneConfig,
  Scene,
  TextEntity,
  BoxEntity,
  createScene,
  text,
  box,
} from "./scene/index.js";

// Effects
export {
  SpinnerEffect,
  ProgressBarEffect,
  TypewriterEffect,
  FadeEffect,
  SlideEffect,
  MatrixEffect,
  FireworkEffect,
} from "./effects/index.js";

// Sub-cell renderers
export {
  halfBlockPos,
  halfBlockSet,
  halfBlockRect,
  brailleRender,
  brailleWaveform,
  pixelToBraille,
} from "./subcell/index.js";

// Lifecycle
export {
  enterAltScreen,
  exitAltScreen,
  hideCursor,
  showCursor,
  onCleanup,
  onResize,
  getTermSize,
  clearScreen,
} from "./renderer/lifecycle.js";
