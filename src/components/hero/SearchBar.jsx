import { useState } from 'react';

const TABS = [
  { id: 'upi', label: 'UPI ID', placeholder: 'e.g. rahul123@okaxis' },
  { id: 'ig', label: 'Instagram', placeholder: 'e.g. @trendy_store123' },
  { id: 'ph', label: 'Phone', placeholder: 'e.g. 98765 43210' },
];

export default function SearchBar({ value, onChange, onSubmit, disabled, inputRef }) {
  const [tab, setTab] = useState('upi');
  const placeholder = TABS.find((t) => t.id === tab).placeholder;

  return (
    <div className="cmd">
      <div className="seg" role="tablist" id="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className="tab"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => { setTab(t.id); inputRef.current?.focus(); }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <input
        id="q"
        ref={inputRef}
        aria-label="Seller identity"
        placeholder={placeholder}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(value); }}
      />
      <button className="btn" id="go" disabled={disabled} onClick={() => onSubmit(value)}>Check now</button>
    </div>
  );
}
