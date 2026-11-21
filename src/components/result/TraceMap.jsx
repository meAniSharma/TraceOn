import { label } from '../../lib/format.js';

/** SVG star-map of every identity linked to the checked one. */
export default function TraceMap({ k, a, onPick }) {
  const ids = [...a.cl].filter((i) => i !== k);
  if (!ids.length) return null;

  const pts = ids.map((id, i) => {
    const t = (i / ids.length) * 6.283 - 1.57;
    return { id, x: 240 + Math.cos(t) * 130, y: 110 + Math.sin(t) * 76, bad: a.reps.some((r) => r.id === id) };
  });

  return (
    <div className="graphbox big">
      <b style={{ fontSize: 13 }}>Trace map</b>
      <svg viewBox="0 0 480 220" className="graph" role="img" aria-label="Linked identities map">
        {pts.map((p, i) => (
          <line key={'l' + p.id} x1="240" y1="110" x2={p.x} y2={p.y} className={`ln${p.bad ? ' bad' : ''}`} style={{ '--i': i }} />
        ))}
        {pts.map((p, i) => {
          const right = p.x >= 240;
          return (
            <g key={'n' + p.id} className={`nd${p.bad ? ' bad' : ''}`} style={{ '--i': i }} onClick={() => onPick(p.id)}>
              <circle cx={p.x} cy={p.y} r="7" />
              <text x={p.x + (right ? 11 : -11)} y={p.y + 4} textAnchor={right ? 'start' : 'end'}>
                {label(p.id).slice(0, 16)}
              </text>
            </g>
          );
        })}
        <circle cx="240" cy="110" r="11" className="core" />
        <circle cx="240" cy="110" r="11" className="pulse" />
      </svg>
    </div>
  );
}
