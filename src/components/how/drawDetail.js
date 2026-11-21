import { label } from '../../lib/format.js';
import { smoothstep as sm } from '../../lib/motion.js';

const TAU = Math.PI * 2;

/**
 * Detail view: a clean relationship map. The payment ID sits in the middle,
 * every linked identity is a soft disc whose size reflects its report count.
 * Reported identities are red with a dashed link.
 * Returns clickable hit-areas [{id,x,y,r}].
 */
export function drawDetail(m, { w, h, t, yaw, px, py, e, hov, nodes, A, INK, MUT, RED }) {
  const hits = [];
  const a = sm(0.3, 0.85, e);
  if (a < 0.01) return hits;

  const cx0 = w / 2, cy0 = h / 2;
  const ay = t * 0.2 + px * 0.5 + yaw, ax = 0.3 + py * 0.35;
  const ca = Math.cos(ay), sa = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
  const S = Math.min(w * 0.3, h * 0.36) * (0.84 + 0.16 * a);
  const pm = (x, y, z) => {
    const X = x * ca + z * sa;
    let Z = -x * sa + z * ca;
    const Y = y * cx - Z * sx;
    Z = y * sx + Z * cx;
    const k = 2.6 / (2.6 + Z);
    return [cx0 + X * S * k, cy0 + Y * S * k, k, Z];
  };

  m.lineCap = 'round';

  // two thin orbit guides for depth
  m.strokeStyle = MUT; m.lineWidth = 1;
  [0.62, 1.1].forEach((rad, i) => {
    m.globalAlpha = a * (0.18 - i * 0.05);
    m.beginPath();
    for (let j = 0; j <= 72; j++) {
      const q = pm(Math.cos((j / 72) * TAU) * rad, 0, Math.sin((j / 72) * TAU) * rad);
      j ? m.lineTo(q[0], q[1]) : m.moveTo(q[0], q[1]);
    }
    m.stroke();
  });

  const n = nodes.length, tot = nodes.reduce((s, x) => s + x.n, 0);
  const N0 = pm(0, 0, 0);
  const items = nodes.map((nd, i) => {
    const y = n > 1 ? (((i + 0.5) / n) * 2 - 1) * 0.55 : 0;
    const rr = Math.sqrt(1 - y * y), ang = i * 2.4 + t * 0.05;
    return { nd, p: pm(Math.cos(ang) * rr * 1.05, y * 1.05, Math.sin(ang) * rr * 1.05) };
  });

  // links
  for (const { nd, p } of items) {
    const col = nd.rep ? RED : A;
    m.strokeStyle = col; m.lineWidth = 1.4;
    m.globalAlpha = a * (nd.rep ? 0.75 : 0.4);
    m.setLineDash(nd.rep ? [5, 5] : []);
    m.lineDashOffset = nd.rep ? -t * 10 : 0;
    m.beginPath(); m.moveTo(N0[0], N0[1]); m.lineTo(p[0], p[1]); m.stroke();
  }
  m.setLineDash([]);

  const disc = (x, y, r, col, alpha) => {
    m.globalAlpha = alpha; m.fillStyle = col;
    m.beginPath(); m.arc(x, y, r, 0, TAU); m.fill();
    const g = m.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,.38)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    m.fillStyle = g;
    m.beginPath(); m.arc(x, y, r, 0, TAU); m.fill();
    m.globalAlpha = alpha * 0.35; m.strokeStyle = col; m.lineWidth = 1;
    m.beginPath(); m.arc(x, y, r + 5, 0, TAU); m.stroke();
  };

  const objs = [{ z: N0[3], nuc: true }, ...items.map((o) => ({ z: o.p[3], o }))].sort((x, y) => y.z - x.z);
  m.textBaseline = 'middle';

  for (const ob of objs) {
    if (ob.nuc) {
      const r = 0.15 * S * N0[2];
      const rp = (t * 0.25) % 1;
      m.globalAlpha = a * (1 - rp) * 0.3; m.strokeStyle = A; m.lineWidth = 1.2;
      m.beginPath(); m.arc(N0[0], N0[1], r + 8 + rp * 26, 0, TAU); m.stroke();
      disc(N0[0], N0[1], r, A, a);
      m.fillStyle = INK; m.textAlign = 'center';
      m.globalAlpha = a * 0.9; m.font = '500 11.5px "JetBrains Mono",monospace';
      m.fillText('payment trail', N0[0], N0[1] + r + 20);
      m.globalAlpha = a * 0.6; m.fillStyle = MUT; m.font = '500 10.5px "JetBrains Mono",monospace';
      m.fillText(n + ' identities · ' + tot + ' reports', N0[0], N0[1] + r + 36);
      continue;
    }

    const { nd, p } = ob.o;
    const hv = hov && hov.id === nd.id;
    const r = (0.07 + 0.025 * Math.min(nd.n, 4)) * S * p[2] * (hv ? 1.1 : 1);
    const col = nd.rep ? RED : A;
    const depth = Math.max(0.55, Math.min(1, 0.45 + (p[2] - 0.75) * 1.1));
    hits.push({ id: nd.id, x: p[0], y: p[1], r: r + 10 });
    disc(p[0], p[1], r, col, a * depth);

    const dx = p[0] - N0[0], dy = p[1] - N0[1], L = Math.hypot(dx, dy) || 1;
    const lx = p[0] + (dx / L) * (r + 16), ly = p[1] + (dy / L) * (r + 16);
    m.textAlign = dx > 0 ? 'left' : 'right';
    m.globalAlpha = a * depth; m.fillStyle = INK; m.font = '500 12px "JetBrains Mono",monospace';
    m.fillText(label(nd.id).slice(0, 20), lx, ly - 7);
    m.globalAlpha = a * depth * 0.7; m.fillStyle = nd.rep ? RED : MUT; m.font = '500 10.5px "JetBrains Mono",monospace';
    m.fillText(nd.n ? nd.n + ' report' + (nd.n > 1 ? 's' : '') : 'linked', lx, ly + 8);
  }

  m.globalAlpha = 1;
  return hits;
}
