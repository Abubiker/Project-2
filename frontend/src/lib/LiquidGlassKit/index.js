const DEFAULT_TRAIL_COUNT = 10;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const createTrailState = (count = DEFAULT_TRAIL_COUNT) => ({
  points: Array.from({ length: count }, (_, index) => ({
    id: index,
    x: 0,
    y: 0,
    opacity: clamp(0.9 - index * 0.08, 0.12, 0.9),
    scale: clamp(1 - index * 0.055, 0.45, 1),
  })),
});

export const isTrailSupported = () => {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (!window.matchMedia("(pointer: fine)").matches) return false;
  return true;
};

export const updateTrail = (state, target, easing = 0.24) => {
  if (!state?.points?.length) return;
  let nextX = target.x;
  let nextY = target.y;

  state.points.forEach((point, index) => {
    const localEasing = clamp(easing - index * 0.012, 0.08, 0.24);
    point.x += (nextX - point.x) * localEasing;
    point.y += (nextY - point.y) * localEasing;
    nextX = point.x;
    nextY = point.y;
  });
};

export const liquidGlassTokens = {
  navPanel: "liquid-glass-surface liquid-glass-nav-panel",
  cardPanel: "liquid-glass-surface liquid-glass-card",
  primaryButton: "liquid-glass-button liquid-glass-button--primary",
};
