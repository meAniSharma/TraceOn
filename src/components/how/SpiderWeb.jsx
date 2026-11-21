import { memo, useEffect, useRef } from 'react';
import { plain } from '../../lib/format.js';
import { prefersReducedMotion, smoothstep } from '../../lib/motion.js';
import { drawWeb } from './drawWeb.js';
import { drawDetail } from './drawDetail.js';

/**
 * Interactive web of linked identities.
 *  - drag to rotate (with a little inertia), tap a node to run a check
 *  - "Explore detail" crossfades to a cleaner relationship map
 *  - Ctrl/⌘ + scroll or pinch also zooms; normal scrolling never gets trapped
 * The canvas loop reads `nodes` / `onPick` through refs, so it never restarts.
 */
function SpiderWeb({ nodes, onPick }) {
  const wwRef = useRef(null), webRef = useRef(null), molRef = useRef(null);
  const btnRef = useRef(null), modeRef = useRef(null), hintRef = useRef(null);
  const nodesRef = useRef(nodes), pickRef = useRef(onPick);
  nodesRef.current = nodes;
  pickRef.current = onPick;

  useEffect(() => {
    const ww = wwRef.current, cv = webRef.current, mv = molRef.current;
    const zb = btnRef.current, zm = modeRef.current, zh = hintRef.current;
    const c = cv.getContext('2d'), m = mv.getContext('2d');
    const R = document.documentElement, reduce = prefersReducedMotion();

    let w = 0, h = 0, dpr = 1, t = 0, px = 0, py = 0, hit = [], hov = null, vis = true;
    let d = 0, tg = 0, yaw = 0, vy = 0, dragging = false, moved = 0, lastX = 0, last = 0, raf = 0;
    let shownDetail = null;
    const setT = (v) => { tg = Math.max(0, Math.min(1, v)); };
    const toggle = () => setT(tg > 0.5 ? 0 : 1);

    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      const r = ww.getBoundingClientRect();
      w = r.width; h = r.height;
      for (const e of [cv, mv]) { e.width = w * dpr; e.height = h * dpr; }
    };
    const ro = new ResizeObserver(size); ro.observe(ww); size();
    const io = new IntersectionObserver((e) => { vis = e[0].isIntersecting; }); io.observe(ww);

    // zoom only on a deliberate gesture, so the page still scrolls normally
    ww.addEventListener('wheel', (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      setT(tg - e.deltaY * 0.01);
    }, { passive: false });
    zb.addEventListener('click', toggle);
    ww.addEventListener('dblclick', (e) => { if (!e.target.closest('.zbtn')) toggle(); });
    const onKey = (e) => { if (e.key === 'Escape' && tg > 0) setT(0); };
    window.addEventListener('keydown', onKey);

    const ptrs = new Map(); let pd = 0;
    const up = (e) => {
      ptrs.delete(e.pointerId); pd = 0;
      if (!ptrs.size) { dragging = false; ww.classList.remove('drag'); }
    };
    ww.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.zbtn')) return;
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 1) { dragging = true; moved = 0; lastX = e.clientX; vy = 0; ww.classList.add('drag'); }
    });
    ww.addEventListener('pointerup', up);
    ww.addEventListener('pointercancel', up);

    const at = (x, y) => hit.find((n) => Math.hypot(n.x - x, n.y - y) < (n.r || 18));
    ww.addEventListener('pointermove', (e) => {
      const r = ww.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      px = x / r.width - 0.5; py = y / r.height - 0.5;
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()], dd = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pd) setT(tg + (dd - pd) / 260);
        pd = dd;
        return;
      }
      if (dragging && ptrs.size === 1) {
        const dx = e.clientX - lastX; lastX = e.clientX;
        moved += Math.abs(dx);
        yaw += dx * 0.008; vy = dx * 0.008;
        return;
      }
      hov = at(x, y) || null;
      ww.style.cursor = hov ? 'pointer' : '';
    });
    ww.addEventListener('pointerleave', () => { px = py = 0; hov = null; ww.style.cursor = ''; });
    ww.addEventListener('click', (e) => {
      if (e.target.closest('.zbtn') || moved > 5) return;
      const r = ww.getBoundingClientRect();
      const n = at(e.clientX - r.left, e.clientY - r.top);
      if (n) pickRef.current(plain(n.id));
    });

    function frame(ts) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;

      // frame-rate independent easing toward the target, then a smootherstep curve
      d = reduce ? tg : d + (tg - d) * (1 - Math.exp(-dt * 6));
      if (Math.abs(tg - d) < 0.0005) d = tg;
      const e = d * d * d * (d * (d * 6 - 15) + 10);

      const detail = tg > 0.5;
      if (detail !== shownDetail) {
        shownDetail = detail;
        zb.textContent = detail ? 'Back to overview' : 'Explore detail';
        zm.textContent = detail ? 'Detail' : 'Overview';
        zh.textContent = detail ? 'Disc size reflects the number of reports' : 'Drag to rotate · tap a node to check it';
      }
      if (!vis || !w) return;

      if (!reduce) t += dt * 0.9;
      if (!dragging) { yaw += vy; vy *= 0.94; if (Math.abs(vy) < 1e-4) vy = 0; }

      cv.style.opacity = String(1 - smoothstep(0.2, 0.65, e));
      mv.style.opacity = String(smoothstep(0.35, 0.8, e));

      const cs = getComputedStyle(R);
      const A = cs.getPropertyValue('--a').trim() || '#8591ff';
      const INK = cs.getPropertyValue('--ink').trim() || '#fff';
      const MUT = cs.getPropertyValue('--mut').trim() || '#999';
      const RED = cs.getPropertyValue('--red').trim() || '#f66';
      const s = { w, h, t, yaw, px, py, e, hov, nodes: nodesRef.current, A, INK, MUT, RED };

      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      m.setTransform(dpr, 0, 0, dpr, 0, 0); m.clearRect(0, 0, w, h);
      const webHit = drawWeb(c, s);
      const detailHit = drawDetail(m, s);
      hit = e > 0.5 ? detailHit : webHit;
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="webwrap" id="ww" ref={wwRef}>
      <canvas id="web" ref={webRef} aria-label="Rotating web of linked identities" />
      <canvas id="mol" ref={molRef} aria-hidden="true" />
      <div className="zlegend" aria-hidden="true">
        <span><i />Linked</span>
        <span><i className="r" />Reported</span>
      </div>
      <button className="zbtn" id="zb" type="button" ref={btnRef}>Explore detail</button>
      <div className="zhud">
        <b ref={modeRef}>Overview</b>
        <span ref={hintRef}>Drag to rotate · tap a node to check it</span>
      </div>
    </div>
  );
}

export default memo(SpiderWeb);
