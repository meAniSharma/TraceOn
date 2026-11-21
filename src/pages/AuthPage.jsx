import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthAside from '../components/auth/AuthAside.jsx';
import LoginForm from '../components/auth/LoginForm.jsx';
import SignupForm from '../components/auth/SignupForm.jsx';

const COPY = {
  login: { title: 'Log in', heading: 'Welcome back', sub: 'Log in to your TraceOn account.' },
  signup: { title: 'Sign up', heading: 'Create your account', sub: 'It takes less than a minute.' },
};

export default function AuthPage({ mode }) {
  const { user } = useAuth();
  const isLogin = mode === 'login';
  const copy = COPY[mode];

  useEffect(() => {
    document.title = `${copy.title} – TraceOn`;
    return () => { document.title = 'TraceOn – Check before you pay'; };
  }, [copy.title]);

  if (user) return <Navigate to="/" replace />;

  return (
    <main className="auth">
      <AuthAside mode={mode} />

      <section className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Account">
          <Link to="/login" role="tab" aria-selected={isLogin}>Log in</Link>
          <Link to="/signup" role="tab" aria-selected={!isLogin}>Sign up</Link>
        </div>

        <h1 className="auth-title">{copy.heading}</h1>
        <p className="auth-sub">{copy.sub}</p>

        {isLogin ? <LoginForm /> : <SignupForm />}

        <p className="auth-alt">
          {isLogin
            ? <>New to TraceOn? <Link to="/signup">Create an account</Link></>
            : <>Already have an account? <Link to="/login">Log in</Link></>}
        </p>
        <p className="auth-demo">Demo build: accounts are saved in this browser only.</p>
      </section>
    </main>
  );
}
