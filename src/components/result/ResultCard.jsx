import { useEffect, useState } from 'react';
import { VERDICT } from '../../lib/analyze.js';
import { icon, label } from '../../lib/format.js';
import { countUp } from '../../lib/motion.js';
import TraceMap from './TraceMap.jsx';

const COLOR = { red: 'var(--red)', amber: 'var(--amb)', green: 'var(--grn)', grey: 'var(--a)' };
const fmt = (p) => (p > 0 ? '+' + p : p < 0 ? '−' + Math.abs(p) : '·');

export default function ResultCard({ k, a, onReport, onAgain, onPick }) {
  const target = a.known ? a.score : 0;
  const [p, setP] = useState(0);

  useEffect(() => {
    if (!target) { setP(0); return; }
    return countUp(target, setP);
  }, [target]);

  const chips = [...a.cl].filter((i) => i !== k);

  return (
    <div className="res">
      <div className="ring" style={{ '--p': p, '--c': COLOR[a.lv] }}>
        <div>
          <span>
            <strong>{a.known ? Math.round(p) : '–'}</strong>
            <small>/ 100</small>
          </span>
        </div>
      </div>

      <div>
        <span className={`lvl ${a.lv}`}>{VERDICT[a.lv][0]}</span>
        <div className="rid">{icon(k)} {label(k)}</div>

        <ul className="why">
          {a.why.map((w, i) => (
            <li key={i}>
              <span className={`pt ${w.p > 0 ? 'up' : w.p < 0 ? 'dn' : ''}`}>{fmt(w.p)}</span>
              <span>{w.t}</span>
            </li>
          ))}
        </ul>

        {chips.length > 0 && (
          <>
            <b style={{ fontSize: 13 }}>Linked identities</b>
            <div className="chips">
              {chips.map((i) => {
                const rep = a.reps.some((x) => x.id === i);
                return (
                  <button key={i} className={`chip${rep ? ' rep' : ''}`} onClick={() => onPick(i)}>
                    {icon(i)} {label(i)}{rep ? ' · reported' : ''}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <p style={{ margin: '0 0 16px' }}><b>{VERDICT[a.lv][1]}</b></p>
        <button className="btn ghost" onClick={onReport}>Report this seller</button>
        <button className="btn ghost" onClick={onAgain}>Check another</button>
        <p className="note">The score comes from fixed rules over community reports and shared payment IDs. It is not a prediction.</p>
      </div>

      <TraceMap k={k} a={a} onPick={onPick} />
    </div>
  );
}
