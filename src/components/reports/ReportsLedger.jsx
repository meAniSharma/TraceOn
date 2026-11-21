import { cluster } from '../../lib/analyze.js';
import { ago, icon, label, plain } from '../../lib/format.js';
import Reveal from '../common/Reveal.jsx';

export default function ReportsLedger({ db, onPick }) {
  const rows = [...db.reports].sort((x, y) => y.ts - x.ts).slice(0, 5);

  return (
    <section className="sec" id="reports">
      <Reveal as="h2" i={0}>Fresh from the community</Reveal>
      <Reveal as="p" className="sub" i={1}>Tap any ID to run a check.</Reveal>
      <Reveal className="ledger" i={2} id="recent">
        {rows.map((r, idx) => {
          const l = [...cluster(db, r.id)].filter((i) => i.startsWith('ig:') && i !== r.id).length;
          return (
            <div className="lr" key={r.id + r.ts + idx}>
              <span>{icon(r.id)}</span>
              <span className="id" onClick={() => onPick(plain(r.id))}>{label(r.id)}</span>
              <span><span className={`tag ${r.proof ? 'red' : 'amber'}`}>{r.proof ? 'Reported' : 'Under review'}</span></span>
              <span className="nt">
                {r.note || 'No details given.'}
                {l ? ' · Linked to ' + l + ' other page' + (l > 1 ? 's' : '') : ''}
              </span>
              <span className="tm">{ago(r.ts)}</span>
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}
