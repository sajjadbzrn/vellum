/** All easing functions take a normalized time t (0..1) and return a value (0..1). */
export type EasingFn = (t: number) => number;

/** Named easing presets. */
export type EasingName =
  | "linear"
  | "easeInQuad"
  | "easeOutQuad"
  | "easeInOutQuad"
  | "easeInCubic"
  | "easeOutCubic"
  | "easeInOutCubic"
  | "easeInQuart"
  | "easeOutQuart"
  | "easeInOutQuart"
  | "easeInQuint"
  | "easeOutQuint"
  | "easeInOutQuint"
  | "easeInSine"
  | "easeOutSine"
  | "easeInOutSine"
  | "easeInExpo"
  | "easeOutExpo"
  | "easeInOutExpo"
  | "easeInCirc"
  | "easeOutCirc"
  | "easeInOutCirc"
  | "easeInBack"
  | "easeOutBack"
  | "easeInOutBack"
  | "easeInElastic"
  | "easeOutElastic"
  | "easeInOutElastic"
  | "easeInBounce"
  | "easeOutBounce"
  | "easeInOutBounce";

function pow2(t: number): number {
  return t * t;
}
function pow3(t: number): number {
  return t * t * t;
}
function pow4(t: number): number {
  return t * t * t * t;
}
function pow5(t: number): number {
  return t * t * t * t * t;
}

export const easing: Record<EasingName, EasingFn> = {
  linear: (t) => t,

  easeInQuad: pow2,
  easeOutQuad: (t) => 1 - pow2(1 - t),
  easeInOutQuad: (t) =>
    t < 0.5 ? 2 * pow2(t) : 1 - pow2(-2 * t + 2) / 2,

  easeInCubic: pow3,
  easeOutCubic: (t) => 1 - pow3(1 - t),
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * pow3(t) : 1 - pow3(-2 * t + 2) / 2,

  easeInQuart: pow4,
  easeOutQuart: (t) => 1 - pow4(1 - t),
  easeInOutQuart: (t) =>
    t < 0.5 ? 8 * pow4(t) : 1 - pow4(-2 * t + 2) / 2,

  easeInQuint: pow5,
  easeOutQuint: (t) => 1 - pow5(1 - t),
  easeInOutQuint: (t) =>
    t < 0.5 ? 16 * pow5(t) : 1 - pow5(-2 * t + 2) / 2,

  easeInSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  easeInExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  easeInCirc: (t) => 1 - Math.sqrt(1 - pow2(t)),
  easeOutCirc: (t) => Math.sqrt(1 - pow2(t - 1)),
  easeInOutCirc: (t) =>
    t < 0.5
      ? (1 - Math.sqrt(1 - pow2(2 * t))) / 2
      : (Math.sqrt(1 - pow2(-2 * t + 2)) + 1) / 2,

  easeInBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * pow3(t) - c1 * pow2(t);
  },
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * pow3(t - 1) + c1 * pow2(t - 1);
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (pow2(2 * t) * ((c2 + 1) * 2 * t - c2)) / 2
      : (pow2(2 * t - 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  easeInElastic: (t) => {
    if (t === 0 || t === 1) return t;
    const c4 = (2 * Math.PI) / 3;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: (t) => {
    if (t === 0 || t === 1) return t;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: (t) => {
    if (t === 0 || t === 1) return t;
    const c5 = (2 * Math.PI) / 4.5;
    return t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 +
          1;
  },

  easeInBounce: (t) => 1 - easing.easeOutBounce(1 - t),
  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    else return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  easeInOutBounce: (t) =>
    t < 0.5
      ? (1 - easing.easeOutBounce(1 - 2 * t)) / 2
      : (1 + easing.easeOutBounce(2 * t - 1)) / 2,
};

/** Look up an easing function by name. Falls back to linear. */
export function getEasing(name: EasingName): EasingFn {
  return easing[name];
}
