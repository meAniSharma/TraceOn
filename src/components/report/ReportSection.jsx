import { useEffect, useRef, useState } from 'react';
import { toKey } from '../../lib/format.js';
import Reveal from '../common/Reveal.jsx';

const BASE = import.meta.env.VITE_API_URL ?? '';
const EMPTY = { ig: '', upi: '', ph: '', note: '', proof: false };
const FIELD_NAMES = { ig: 'Instagram handle', upi: 'UPI ID', ph: 'phone number' };

/** Chip list of OCR-extracted values with an "auto-fill" action */
function ExtractedChip({ label, value, onFill }) {
  return (
    <button type="button" className="ocr-chip" onClick={() => onFill(value)} title={`Click to fill "${value}"`}>
      <span className="ocr-chip-label">{label}</span>
      <span className="ocr-chip-val">{value}</span>
      <span className="ocr-chip-hint">↑ fill</span>
    </button>
  );
}

/** `prefill` = { type, value, n } lets "Report this seller" fill one field. */
export default function ReportSection({ prefill, onSubmit, showToast }) {
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);       // File object
  const [imagePreview, setImagePreview] = useState(null); // object URL
  const [ocrState, setOcrState] = useState('idle');       // idle | uploading | done | error
  const [extracted, setExtracted] = useState(null);       // OCR result
  const [proofImageUrl, setProofImageUrl] = useState(null); // server-side path
  const fileInputRef = useRef(null);

  const set = (name) => (e) =>
    setForm((f) => ({ ...f, [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  useEffect(() => {
    if (prefill) setForm((f) => ({ ...f, [prefill.type]: prefill.value }));
  }, [prefill]);

  // ── Image selection → preview → OCR ───────────────────────────────────────
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5 MB'); return; }

    // Show preview immediately
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setExtracted(null);
    setProofImageUrl(null);
    setOcrState('uploading');

    // Send to /api/ocr
    try {
      const fd = new FormData();
      fd.append('proof', file);
      const res = await fetch(BASE + '/api/ocr', { method: 'POST', body: fd });
      const data = await res.json();

      if (data.ok) {
        setProofImageUrl(data.imageUrl);
        setExtracted(data.extracted);
        setOcrState('done');
        // Auto-tick the proof checkbox since user attached an image
        setForm((f) => ({ ...f, proof: true }));
      } else {
        setOcrState('error');
        showToast(data.error || 'Upload failed');
      }
    } catch {
      setOcrState('error');
      showToast('Could not reach the server for OCR. Try again.');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setExtracted(null);
    setProofImageUrl(null);
    setOcrState('idle');
    setForm((f) => ({ ...f, proof: false }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Auto-fill a field from an OCR chip
  const fillField = (type, value) => {
    setForm((f) => ({ ...f, [type]: value }));
    showToast(`${FIELD_NAMES[type] || type} filled from proof`);
  };

  // ── Form submit ────────────────────────────────────────────────────────────
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

    onSubmit(ids, {
      proof: form.proof,
      note: form.note.trim().slice(0, 200),
      proofImage: proofImageUrl || null,
      extractedData: extracted || null,
    });

    // Reset
    setForm(EMPTY);
    removeImage();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const hasExtracted = extracted && (
    extracted.upiIds?.length || extracted.phones?.length ||
    extracted.amounts?.length || extracted.igHandles?.length
  );

  return (
    <section className="sec" id="report">
      <div className="fgrid">
        <Reveal i={0}>
          <h2>Help the next buyer.</h2>
          <p className="sub">
            Add whatever you know about the seller. Reports with proof carry more weight, and every
            report links the IDs together.
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
            <textarea name="note" rows="3"
              placeholder="Paid ₹1,500 in advance, then they blocked me."
              value={form.note} onChange={set('note')} />
          </label>

          {/* ── Proof image upload ───────────────────────────────────── */}
          <div className="proof-upload-wrap">
            <span className="proof-upload-label">Proof image (screenshot / receipt)</span>

            {!imageFile ? (
              <label className="proof-dropzone" htmlFor="proof-file-input">
                <span className="proof-dropzone-icon">📎</span>
                <span>Drag &amp; drop or <u>browse</u></span>
                <span className="proof-dropzone-hint">JPG, PNG, WEBP · max 5 MB</span>
                <input
                  id="proof-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
              </label>
            ) : (
              <div className="proof-preview-wrap">
                <div className="proof-preview-img-wrap">
                  <img src={imagePreview} alt="Proof preview" className="proof-preview-img" />
                  <button type="button" className="proof-remove-btn" onClick={removeImage} title="Remove image">✕</button>
                </div>

                {/* OCR status */}
                {ocrState === 'uploading' && (
                  <div className="ocr-status uploading">
                    <span className="ocr-spinner" /> Scanning image for payment details…
                  </div>
                )}
                {ocrState === 'error' && (
                  <div className="ocr-status error">⚠ OCR failed — image saved, but no data was extracted.</div>
                )}
                {ocrState === 'done' && !hasExtracted && (
                  <div className="ocr-status empty">✓ Image uploaded. No UPI/phone/amount found automatically.</div>
                )}

                {/* Extracted entities */}
                {ocrState === 'done' && hasExtracted && (
                  <div className="ocr-results">
                    <p className="ocr-results-title">📋 Extracted from proof — click to auto-fill</p>

                    {extracted.amounts?.length > 0 && (
                      <div className="ocr-group">
                        <span className="ocr-group-label">Amounts</span>
                        {extracted.amounts.map((a) => (
                          <span key={a} className="ocr-chip amount-chip">{a}</span>
                        ))}
                      </div>
                    )}

                    {extracted.upiIds?.length > 0 && (
                      <div className="ocr-group">
                        <span className="ocr-group-label">UPI IDs</span>
                        {extracted.upiIds.map((u) => (
                          <ExtractedChip key={u} label="💳" value={u}
                            onFill={(v) => fillField('upi', v)} />
                        ))}
                      </div>
                    )}

                    {extracted.phones?.length > 0 && (
                      <div className="ocr-group">
                        <span className="ocr-group-label">Phone numbers</span>
                        {extracted.phones.map((p) => (
                          <ExtractedChip key={p} label="📞" value={p}
                            onFill={(v) => fillField('ph', v)} />
                        ))}
                      </div>
                    )}

                    {extracted.igHandles?.length > 0 && (
                      <div className="ocr-group">
                        <span className="ocr-group-label">Handles</span>
                        {extracted.igHandles.map((h) => (
                          <ExtractedChip key={h} label="📸" value={h.replace(/^@/, '')}
                            onFill={(v) => fillField('ig', v)} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <label className="chk">
            <input type="checkbox" name="proof" checked={form.proof} onChange={set('proof')} />
            I have proof (screenshot or payment receipt)
          </label>

          <button className="btn" type="submit" disabled={ocrState === 'uploading'}>
            {ocrState === 'uploading' ? 'Scanning image…' : 'Submit report'}
          </button>
        </Reveal>
      </div>
    </section>
  );
}
