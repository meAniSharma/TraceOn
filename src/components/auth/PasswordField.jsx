import { useState } from 'react';

export default function PasswordField({ id, value, onChange, error, autoComplete, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw">
      <input
        id={id}
        name={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={`${id}-msg`}
      />
      <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} aria-pressed={show}>
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
