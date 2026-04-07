import { useState } from 'react';
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
        await login(email, password);
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
    <div className="login-page">
      <div className="login-card card">
        <h1>PETAL</h1>
        <p>Personalized Execution & Task Agent Layer</p>

        <div style={{ display: 'flex', gap: '0', marginBottom: '24px' }}>
          <button
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              background: mode === 'login' ? 'var(--text)' : 'var(--white)',
              color: mode === 'login' ? 'var(--white)' : 'var(--text)',
            }}
          >
            LOGIN
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              background: mode === 'signup' ? 'var(--text)' : 'var(--white)',
              color: mode === 'signup' ? 'var(--white)' : 'var(--text)',
            }}
          >
            SIGN UP
          </button>
        </div>

        {error && (
          <div style={{ padding: '8px 12px', border: '3px solid var(--priority-high)', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '8px 12px', border: '3px solid var(--priority-low)', marginBottom: '16px', fontSize: '13px' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', marginBottom: '12px' }}>
            {loading ? 'WAIT...' : mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '16px 0', opacity: 0.5, fontSize: '12px' }}>— OR —</div>

        <button onClick={loginWithGoogle} style={{ width: '100%', padding: '12px', marginBottom: '12px' }}>
          SIGN IN WITH GOOGLE
        </button>

        <button onClick={async () => { await devLogin(); navigate('/app'); }} style={{ width: '100%', padding: '12px', opacity: 0.5 }}>
          DEV MODE (NO AUTH)
        </button>
      </div>
    </div>
  );
}
