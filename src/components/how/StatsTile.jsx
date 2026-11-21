import { useEffect, useRef, useState } from 'react';
import Reveal from '../common/Reveal.jsx';
import { countUp } from '../../lib/motion.js';

const LABELS = ['Scam reports logged', 'Identities traced', 'Pages linked by payment ID', 'Verified sellers'];

function Stat({ value, text, active }) {
  const [n, setN] = useState(0);
  const shown = useRef(0);

  useEffect(() => {
    if (!active) { shown.current = 0; setN(0); return; }
    return countUp(value, (v) => { shown.current = v; setN(Math.round(v)); }, 900, shown.current);
  }, [active, value]);

  return (
    <div className="stat">
      <b className="cnt">{n}</b>
      <span>{text}</span>
    </div>
  );
}

export default function StatsTile({ stats }) {
  return (
    <Reveal className="tile t4" i={2}>
      {(seen) => LABELS.map((text, i) => <Stat key={text} text={text} value={stats[i]} active={seen} />)}
    </Reveal>
  );
}
