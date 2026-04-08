import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login, signup, loginWithGoogle, devLogin } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(email, password);
        if (!result?.session) {
          throw new Error('Login completed but no session was returned.');
        }
        navigate('/app');
      } else {
        await signup(email, password);
        setSuccess('Account created! Check your email to confirm.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="auth-brand">
          <span className="auth-brand-word">PETAL</span>
          <span className="auth-brand-sub">multi-agent workspace</span>
        </div>
        <h1>RUN YOUR DAY WITH AGENTS</h1>
        <p>
          Tasks, calendar, and notes in one place. Same system, same theme, same workspace.
        </p>
        <Link to="/" className="auth-home-link">Back to landing</Link>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
          <p>Use your account to open the workspace.</p>

          <div className="auth-switch">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
            >
              Sign Up
            </button>
          </div>

          {error && <div className="auth-alert error">{error}</div>}
          {success && <div className="auth-alert success">{success}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? 'Wait...' : mode === 'login' ? 'Enter Workspace' : 'Create Account'}
            </button>
          </form>

          <div className="auth-divider">or</div>

          <button type="button" onClick={loginWithGoogle} className="auth-secondary">
            Sign In With Google
          </button>

          <button type="button" onClick={async () => { await devLogin(); navigate('/app'); }} className="auth-dev">
            Dev Mode
          </button>
        </div>
      </section>
    </div>
  );
}
