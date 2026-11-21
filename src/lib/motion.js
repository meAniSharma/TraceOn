export const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion:reduce)').matches;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Animate a number. Returns a cancel function. */
export function countUp(to, cb, ms = 900, from = 0) {
  if (prefersReducedMotion()) { cb(to); return () => {}; }
  let t0, raf, stop = false;
  const f = (ts) => {
    if (stop) return;
    t0 ??= ts;
    const p = Math.min(1, (ts - t0) / ms);
    cb(from + (to - from) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) raf = requestAnimationFrame(f);
  };
  raf = requestAnimationFrame(f);
  return () => { stop = true; cancelAnimationFrame(raf); };
}

export const smoothstep = (a, b, x) => {
  x = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
