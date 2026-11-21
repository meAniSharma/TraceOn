import { useEffect, useState } from 'react';
import { toKey } from '../../lib/format.js';
import Reveal from '../common/Reveal.jsx';

const EMPTY = { ig: '', upi: '', ph: '', note: '', proof: false };
const FIELD_NAMES = { ig: 'Instagram handle', upi: 'UPI ID', ph: 'phone number' };

/** `prefill` = { type, value, n } lets "Report this seller" fill one field. */
export default function ReportSection({ prefill, onSubmit, showToast }) {
  const [form, setForm] = useState(EMPTY);
  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  useEffect(() => {
    if (prefill) setForm((f) => ({ ...f, [prefill.type]: prefill.value }));
  }, [prefill]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const ids = [];
    for (const t of ['ig', 'upi', 'ph']) {
      const v = form[t].trim();
      if (!v) continue;
      const k = toKey(t, v);
      if (!k) { showToast('Check the ' + FIELD_NAMES[t]); return; }
      ids.push(k);
    }
    if (!ids.length) { showToast('Add at least one seller detail'); return; }
    onSubmit(ids, { proof: form.proof, note: form.note.trim().slice(0, 200) });
    setForm(EMPTY);
  };

  return (
    <section className="sec" id="report">
      <div className="fgrid">
        <Reveal i={0}>
          <h2>Help the next buyer.</h2>
          <p className="sub">
            Add whatever you know about the seller. Reports with proof carry more weight, and every report links the IDs together.
          </p>
        </Reveal>
        <Reveal as="form" i={1} id="rf" onSubmit={handleSubmit}>
          <label>Instagram handle
            <input name="ig" placeholder="@trendy_store123" value={form.ig} onChange={set('ig')} />
          </label>
          <label>UPI ID
            <input name="upi" placeholder="name@bank" value={form.upi} onChange={set('upi')} />
          </label>
          <label>Phone number
            <input name="ph" placeholder="98765 43210" value={form.ph} onChange={set('ph')} />
          </label>
          <label>What happened?
            <textarea name="note" rows="3" placeholder="Paid ₹1,500 in advance, then they blocked me." value={form.note} onChange={set('note')} />
          </label>
          <label className="chk">
            <input type="checkbox" name="proof" checked={form.proof} onChange={set('proof')} /> I have proof (screenshot or payment receipt)
          </label>
          <button className="btn" type="submit">Submit report</button>
        </Reveal>
      </div>
    </section>
  );
}
