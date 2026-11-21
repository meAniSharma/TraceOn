import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Logo from '../common/Logo.jsx';

const TIPS = [
  'Be wary of new sellers who ask for full payment in advance.',
  'Prefer cash on delivery, or a video call before you pay.',
  'Screenshot chats, listings and receipts. They count as proof.',
];

export default function Footer() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  return (
    <footer className="foot">
      <div className="foot-in">
        <div className="foot-brand">
          <Logo />
          <p>Check a seller’s payment trail before you pay, and help the next buyer do the same.</p>
        </div>

        <nav className="foot-col" aria-label="Product">
          <h4>Product</h4>
          <Link to="/#top">Check a seller</Link>
          <Link to="/#how">How it works</Link>
          <Link to="/#reports">Recent reports</Link>
          <Link to="/#sellers">Verified sellers</Link>
        </nav>

        <nav className="foot-col" aria-label="Account">
          <h4>Account</h4>
          <Link to="/#report">Report a scam</Link>
          {user ? (
            <button type="button" className="linkbtn" onClick={() => { logout(); showToast('You’ve been logged out.'); }}>Log out</button>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/signup">Create an account</Link>
            </>
          )}
        </nav>

        <div className="foot-col">
          <h4>Stay safe</h4>
          <ul className="tips">
            {TIPS.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      </div>

      <div className="foot-bar">
        <span>© {new Date().getFullYear()} TraceOn</span>
        <span className="foot-note">TraceOn flags patterns from community reports. It can’t catch every scam, so pay carefully.</span>
        <Link to="/#top">Back to top ↑</Link>
      </div>
    </footer>
  );
}
