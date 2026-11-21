import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { firstName, isEmail } from '../../lib/auth.js';
import Field from './Field.jsx';
import PasswordField from './PasswordField.jsx';

export default function LoginForm() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [v, setV] = useState({ email: '', password: '' });
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
    if (!isEmail(v.email)) next.email = 'Enter a valid email address.';
    if (!v.password) next.password = 'Enter your password.';
    setErrs(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setBusy(true);
    const r = await login(v);
    setBusy(false);
    if (!r.ok) { setFormError(r.error); return; }
    showToast(`Welcome back, ${firstName(r.user.name)}.`); // AuthPage redirects home once the user is set
  };

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      {formError && <div className="form-error" role="alert">{formError}</div>}

      <Field id="email" label="Email" error={errs.email}>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com"
          value={v.email} onChange={change('email')} aria-invalid={!!errs.email} aria-describedby="email-msg" />
      </Field>

      <Field id="password" label="Password" error={errs.password}>
        <PasswordField id="password" value={v.password} onChange={change('password')} error={errs.password}
          autoComplete="current-password" placeholder="Your password" />
      </Field>

      <button className="btn" type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
    </form>
  );
}
