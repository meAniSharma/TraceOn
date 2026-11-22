import { useState } from 'react';
import { label, plain } from '../../lib/format.js';
import Reveal from '../common/Reveal.jsx';

const EMPTY_SELLER = { name: '', ig: '', upi: '', ph: '' };

export default function VerifiedSellers({ db, onPick, onVerifySeller }) {
  const verified = db.accounts.filter((a) => a.verified);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_SELLER);
  const [busy, setBusy] = useState(false);

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ig.trim() && !form.upi.trim() && !form.ph.trim()) {
      alert('Please provide at least one handle, UPI ID, or phone number.');
      return;
    }
    setBusy(true);
    await onVerifySeller(form);
    setBusy(false);
    setForm(EMPTY_SELLER);
    setOpen(false);
  };

  return (
    <section className="sec" id="sellers">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Reveal as="h2" i={0}>Verified sellers</Reveal>
          <Reveal as="p" className="sub" i={1} style={{ margin: '4px 0 0' }}>
            Confirmed payment identities with safe ratings in green (71–100).
          </Reveal>
        </div>
        <button
          type="button"
          className="btn ghost"
          onClick={() => setOpen((o) => !o)}
          style={{ fontSize: 13, padding: '8px 18px' }}
        >
          {open ? '✕ Close' : '+ Verify a Seller'}
        </button>
      </div>

      {open && (
        <form className="verify-seller-form" onSubmit={handleSubmit}>
          <div className="vs-grid">
            <label>
              Store or Business Name
              <input
                placeholder="e.g. Urban Style Store"
                value={form.name}
                onChange={set('name')}
                required
              />
            </label>
            <label>
              Instagram Handle
              <input
                placeholder="@urban_style"
                value={form.ig}
                onChange={set('ig')}
              />
            </label>
            <label>
              Verified UPI ID
              <input
                placeholder="urbanstyle@oksbi"
                value={form.upi}
                onChange={set('upi')}
              />
            </label>
            <label>
              Contact Phone
              <input
                placeholder="98765 43210"
                value={form.ph}
                onChange={set('ph')}
              />
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <button className="btn" type="submit" disabled={busy} style={{ background: 'var(--grn)' }}>
              {busy ? 'Saving...' : '✓ Save & Grant Green Rating (71–100)'}
            </button>
            <small style={{ color: 'var(--mut)' }}>
              Saves to SQLite database and grants a verified trust score in the green safe zone.
            </small>
          </div>
        </form>
      )}

      <Reveal className="vp" i={2} id="vlist" style={{ marginTop: 20 }}>
        {verified.length ? (
          verified.map((a) => (
            <button key={a.ids[0]} className="v-seller-btn" onClick={() => onPick(plain(a.ids[0]))}>
              <span className="v-seller-name">{a.name || label(a.ids[0])}</span>
              <span className="v-seller-score">95 · Green</span>
            </button>
          ))
        ) : (
          <p className="sub">No verified sellers yet.</p>
        )}
      </Reveal>
    </section>
  );
}
