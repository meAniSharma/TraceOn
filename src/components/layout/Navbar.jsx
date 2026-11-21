import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { firstName } from '../../lib/auth.js';
import Logo from '../common/Logo.jsx';

export default function Navbar({ onToggleTheme }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  return (
    <nav className="nav">
      <Logo />
      <div className="links">
        <Link to="/#top">Verify</Link>
        <Link to="/#how">How it works</Link>
        <Link to="/#reports">Reports</Link>
        <Link to="/#sellers">Verified sellers</Link>
        <Link to="/#report">Report a scam</Link>
      </div>
      <button className="ic" id="theme" aria-label="Toggle light and dark mode" onClick={onToggleTheme}>◐</button>

      {user ? (
        <>
          <span className="who" title={user.email}>
            <i aria-hidden="true">{firstName(user.name)[0].toUpperCase()}</i>
            <span>{firstName(user.name)}</span>
          </span>
          <button className="btn ghost sm" onClick={() => { logout(); showToast('You’ve been logged out.'); }}>Log out</button>
        </>
      ) : (
        <>
          <Link className="btn ghost sm nav-login" to="/login">Log in</Link>
          <Link className="btn sm" to="/signup">Sign up</Link>
        </>
      )}
    </nav>
  );
}
