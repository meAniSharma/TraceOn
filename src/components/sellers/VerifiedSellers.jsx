import { label, plain } from '../../lib/format.js';
import Reveal from '../common/Reveal.jsx';

export default function VerifiedSellers({ db, onPick }) {
  const verified = db.accounts.filter((a) => a.verified);

  return (
    <section className="sec" id="sellers">
      <Reveal as="h2" i={0}>Verified sellers</Reveal>
      <Reveal as="p" className="sub" i={1}>
        These sellers confirmed their payment ID. It’s a trust signal, not a guarantee.
      </Reveal>
      <Reveal className="vp" i={2} id="vlist" style={{ marginTop: 0 }}>
        {verified.length ? (
          verified.map((a) => (
            <button key={a.ids[0]} onClick={() => onPick(plain(a.ids[0]))}>
              {a.name || label(a.ids[0])}
            </button>
          ))
        ) : (
          <p className="sub">No verified sellers yet.</p>
        )}
      </Reveal>
    </section>
  );
}
