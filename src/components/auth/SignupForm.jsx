import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { firstName, isEmail } from '../../lib/auth.js';
import Field from './Field.jsx';
import PasswordField from './PasswordField.jsx';
import PasswordStrength from './PasswordStrength.jsx';

export default function SignupForm() {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const [v, setV] = useState({ name: '', email: '', password: '' });
  const [errs, setErrs] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const change = (name) => (e) => {
    setV((s) => ({ ...s, [name]: e.target.value }));
    if (errs[name]) setErrs((s) => ({ ...s, [name]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (v.name.trim().length < 2) next.name = 'Enter your name.';
    if (!isEmail(v.email)) next.email = 'Enter a valid email address.';
    if (v.password.length < 8) next.password = 'Use at least 8 characters.';
    setErrs(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setBusy(true);
    const r = await signup(v);
    setBusy(false);
    if (!r.ok) { setFormError(r.error); return; }
    showToast(`Account created. Welcome, ${firstName(r.user.name)}.`);
  };

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      {formError && <div className="form-error" role="alert">{formError}</div>}

      <Field id="name" label="Full name" error={errs.name}>
        <input id="name" name="name" autoComplete="name" placeholder="Your name"
          value={v.name} onChange={change('name')} aria-invalid={!!errs.name} aria-describedby="name-msg" />
      </Field>

      <Field id="email" label="Email" error={errs.email}>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com"
          value={v.email} onChange={change('email')} aria-invalid={!!errs.email} aria-describedby="email-msg" />
      </Field>

      <Field id="password" label="Password" error={errs.password} hint="At least 8 characters.">
        <PasswordField id="password" value={v.password} onChange={change('password')} error={errs.password}
          autoComplete="new-password" placeholder="Create a password" />
        <PasswordStrength value={v.password} />
      </Field>

      <button className="btn" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
    </form>
  );
}
