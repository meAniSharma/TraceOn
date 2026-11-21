import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="auth auth-solo">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <p className="auth-kicker">404</p>
        <h1 className="auth-title">This page doesn’t exist.</h1>
        <p className="auth-sub">The link may be broken, or the page may have moved.</p>
        <Link className="btn" to="/">Back to TraceOn</Link>
      </div>
    </main>
  );
}
