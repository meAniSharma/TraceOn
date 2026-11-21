import { label } from '../../lib/format.js';

const TAU = Math.PI * 2;

/**
 * Overview: a calm, slowly turning web. Thin lines, no glow.
 * `e` is the eased zoom progress (0 = overview, 1 = detail).
 * Returns clickable hit-areas [{id,x,y}].
 */
export function drawWeb(c, { w, h, t, yaw, px, py, e, hov, nodes, A, INK, MUT, RED }) {
  const hits = [];
  if (e > 0.8) return hits;

  const ay = Math.sin(t * 0.3) * 0.45 + px * 0.6 + yaw;
  const ax = -0.55 + Math.sin(t * 0.25) * 0.06 + py * 0.3;
  const phi = t * 0.12;
  const sc = Math.min(w * 0.26, h * 0.34) * (1 + e * 0.45);
  const ca = Math.cos(ay), sa = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);

  const pr = (x, y, z) => {
    const X = x * ca + z * sa;
    let Z = -x * sa + z * ca;
    const Y = y * cx - Z * sx;
    Z = y * sx + Z * cx;
    const k = 2.8 / (2.8 + Z);
    return [w / 2 + X * sc * k, h / 2 + Y * sc * k, k, Z];
  };
  const V = (s, z) => Array.from({ length: 5 }, (_, i) => {
    const th = phi + (i * TAU) / 5;
    return [Math.cos(th) * s, Math.sin(th) * s, z];
  });

  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = A; c.fillStyle = A; c.lineWidth = 1;

  // frame
  const top = V(1, 0.4).map((p) => pr(...p));
  const bot = V(1, -0.4).map((p) => pr(...p));
  c.globalAlpha = 0.16;
  [top, bot].forEach((poly) => {
    c.beginPath();
    poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.closePath(); c.stroke();
  });
  c.globalAlpha = 0.1;
  top.forEach((p, i) => { c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(bot[i][0], bot[i][1]); c.stroke(); });

  const ctr = pr(0, 0, 0);

  // silk rings
  [0.3, 0.55, 0.78, 1].forEach((s, ri) => {
    const z = 0.05 * Math.sin(t * 0.8 + ri * 1.7);
    const v = V(s, z);
    c.globalAlpha = 0.14 + 0.04 * ri;
    c.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = v[i], b = v[(i + 1) % 5];
      const mm = pr((a[0] + b[0]) * 0.43, (a[1] + b[1]) * 0.43, z);
      const p = pr(...a), q = pr(...b);
      if (!i) c.moveTo(p[0], p[1]);
      c.quadraticCurveTo(mm[0], mm[1], q[0], q[1]);
    }
    c.stroke();
  });

  // spokes + a slow dot travelling along each
  const o = V(1, 0);
  o.forEach((p, i) => {
    const q = pr(...p);
    c.globalAlpha = 0.24;
    c.beginPath(); c.moveTo(ctr[0], ctr[1]); c.lineTo(q[0], q[1]); c.stroke();
    const f = (t * 0.18 + i * 0.2) % 1;
    c.globalAlpha = 0.55 * Math.sin(f * Math.PI);
    c.beginPath(); c.arc(ctr[0] + (q[0] - ctr[0]) * f, ctr[1] + (q[1] - ctr[1]) * f, 1.8, 0, TAU); c.fill();
  });

  // centre: soft halo + dot + one slow ripple
  for (let i = 3; i >= 1; i--) {
    c.globalAlpha = 0.06;
    c.beginPath(); c.arc(ctr[0], ctr[1], (5 + i * 7) * ctr[2], 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
  c.beginPath(); c.arc(ctr[0], ctr[1], 5 * ctr[2], 0, TAU); c.fill();
  const rp = (t * 0.25) % 1;
  c.globalAlpha = (1 - rp) * 0.35; c.lineWidth = 1.2;
  c.beginPath(); c.arc(ctr[0], ctr[1], (6 + rp * 30) * ctr[2], 0, TAU); c.stroke();

  c.globalAlpha = 0.75; c.fillStyle = MUT;
  c.font = '500 10.5px "JetBrains Mono",monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('payment trail', ctr[0], ctr[1] + 26);

  // identities
  nodes
    .map((n, i) => ({ n, p: pr(...o[i]) }))
    .sort((a, b) => b.p[3] - a.p[3])
    .forEach(({ n, p }) => {
      const hv = hov && hov.id === n.id;
      const r = (5 + (hv ? 1.5 : 0)) * p[2] * 1.3;
      const col = n.rep ? RED : A;
      const depth = Math.max(0.45, Math.min(1, 0.45 + (p[2] - 0.75) * 1.2));
      hits.push({ id: n.id, x: p[0], y: p[1] });

      c.globalAlpha = depth * 0.35; c.strokeStyle = col; c.lineWidth = 1;
      c.beginPath(); c.arc(p[0], p[1], r + 5, 0, TAU); c.stroke();
      c.globalAlpha = depth; c.fillStyle = col;
      c.beginPath(); c.arc(p[0], p[1], r, 0, TAU); c.fill();

      const dx = p[0] - ctr[0], dy = p[1] - ctr[1], dd = Math.hypot(dx, dy) || 1;
      c.globalAlpha = depth * (hv ? 1 : 0.85); c.fillStyle = INK;
      c.font = '500 11px "JetBrains Mono",monospace'; c.textAlign = dx > 0 ? 'left' : 'right';
      c.fillText(label(n.id).slice(0, 18), p[0] + (dx / dd) * (r + 12), p[1] + (dy / dd) * (r + 12));
    });

  c.globalAlpha = 1;
  return hits;
}
