import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../../lib/motion.js';

/** Infinite 3D identity constellation (page background canvas). */
export default function ConstellationBg() {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    const c = cv.getContext('2d');
    const R = document.documentElement;
    const reduce = prefersReducedMotion();
    const N = matchMedia('(max-width:760px)').matches ? 46 : 96;
    let w, h, dpr, t = 0, mx = 0, my = 0, raf;

    const P = [], E = [];
    for (let i = 0; i < N; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * 6.283, s = Math.sqrt(1 - u * u), r = 0.5 + Math.random() * 0.5;
      P.push([s * Math.cos(a) * r, u * r, s * Math.sin(a) * r]);
    }
    for (let i = 0; i < N; i++)
      for (let j = i + 1; j < N; j++)
        if (Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1], P[i][2] - P[j][2]) < 0.46) E.push([i, j]);

    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      w = innerWidth; h = innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
    };
    const onMove = (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
    addEventListener('resize', size);
    addEventListener('pointermove', onMove);
    size();

    function frame() {
      raf = requestAnimationFrame(frame);
      if (!reduce) t += R.classList.contains('tracing') ? 0.02 : 0.004;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      const col = getComputedStyle(R).getPropertyValue('--a').trim() || '#8591ff';
      c.strokeStyle = col; c.fillStyle = col;
      const ay = t + mx * 0.8, ax = Math.sin(t * 0.8) * 0.3 + my * 0.5;
      const ca = Math.cos(ay), sa = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
      const S = Math.min(w, h * 1.3) * 0.5;
      const Q = P.map((p) => {
        const x = p[0] * ca + p[2] * sa;
        let z = -p[0] * sa + p[2] * ca;
        const y = p[1] * cx - z * sx;
        z = p[1] * sx + z * cx;
        const k = 1 / (1.9 - z * 0.55);
        return [w * 0.5 + x * S * k * 2.1, h * 0.46 + y * S * k * 1.2, z, k];
      });
      c.lineWidth = 1;
      for (const [i, j] of E) {
        const a = Q[i], b = Q[j];
        c.globalAlpha = 0.06 + 0.2 * ((a[2] + b[2]) / 2 + 1) / 2;
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      }
      for (const q of Q) {
        c.globalAlpha = 0.22 + 0.5 * (q[2] + 1) / 2;
        c.beginPath(); c.arc(q[0], q[1], 1 + q[3] * 2, 0, 6.283); c.fill();
      }
      c.globalAlpha = 1;
    }
    frame();

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', size);
      removeEventListener('pointermove', onMove);
    };
  }, []);

  return <canvas id="bg" ref={ref} aria-hidden="true" />;
}
