const POINTS = [
  ['Every score shows its reasons', 'No black box. You can see exactly which rule added which point.'],
  ['We follow the payment ID', 'Pages and handles change. The UPI ID or number behind them usually doesn’t.'],
  ['Honest sellers can prove it', 'Verified sellers confirm their payment ID so buyers can trust them.'],
];

export default function AuthAside({ mode }) {
  return (
    <aside className="auth-aside">
      <p className="auth-kicker">{mode === 'login' ? 'Welcome back' : 'Join TraceOn'}</p>
      <h2>Check before you pay. Help others do the same.</h2>
      <ul>
        {POINTS.map(([title, text]) => (
          <li key={title}>
            <span className="tick" aria-hidden="true">✓</span>
            <div><b>{title}</b><p>{text}</p></div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
