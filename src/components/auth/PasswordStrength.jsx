import { passwordStrength, STRENGTH_LABEL } from '../../lib/auth.js';

export default function PasswordStrength({ value }) {
  const s = passwordStrength(value);
  if (!s) return null;
  return (
    <div className="meter" data-s={s} aria-live="polite">
      <div className="bars" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => <i key={n} className={n <= s ? 'on' : ''} />)}
      </div>
      <span>{STRENGTH_LABEL[s]}</span>
    </div>
  );
}
