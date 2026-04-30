import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/LandingNav';
import { useAuth } from '../hooks/useAuth';

const SignUpPage = () => {
  const navigate = useNavigate();
  const { login, signup, loginWithGoogle, resendVerification, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const oauth = params.get('oauth');
    const errorDescription = params.get('error_description') || params.get('error');
    const verified = params.get('verified');

    if (modeParam === 'login') {
      setMode('login');
    }

    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    const hashParams = new URLSearchParams(hash);
    const hashErrorCode = hashParams.get('error_code') || '';
    const hashErrorDescription = hashParams.get('error_description') || hashParams.get('error') || '';

    if (oauth === 'google') {
      setSuccess('Finishing Google sign-in...');
    }
    if (verified === '1') {
      setSuccess('Email verified. You can sign in now.');
      setMode('login');
    }
    if (errorDescription) {
      setError(decodeURIComponent(errorDescription).replace(/\+/g, ' '));
      setSuccess('');
    }
    if (hashErrorDescription) {
      const decoded = decodeURIComponent(hashErrorDescription).replace(/\+/g, ' ');
      if (hashErrorCode === 'otp_expired') {
        setError('Verification link is invalid or expired. Request a new confirmation email and use the newest link.');
      } else {
        setError(decoded);
      }
      setSuccess('');
    }

    if (modeParam || oauth || errorDescription || hashErrorDescription || verified === '1') {
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      url.searchParams.delete('oauth');
      url.searchParams.delete('error_description');
      url.searchParams.delete('error');
      url.searchParams.delete('verified');
      url.hash = '';
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const result = await login(email, password);
        if (!result?.session) {
          throw new Error('Login completed but no session was returned.');
        }
        navigate('/app');
      } else {
        const result = await signup(email, password);
        if (result?.session) {
          navigate('/app');
          return;
        }
        setSuccess('Account created! Check your email to confirm, then sign in.');
        setMode('login');
      }
    } catch (err: any) {
      const message = err?.message || (mode === 'login' ? 'Failed to sign in.' : 'Failed to create account.');
      if (message.toLowerCase().includes('email is not confirmed') || message.toLowerCase().includes('confirm your email')) {
        setError('Please confirm your email from your inbox, then sign in again.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Nav />

      {/* Page Header */}
      <header className="page-header">
        <div className="container">
          <h1 className="animate-in">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</h1>
          <p className="animate-in delay-1">
            {mode === 'login' ? 'Sign in to your workspace' : 'Create your free account'}
          </p>
        </div>
      </header>

      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker">
          <span className="ticker-item">FREE TO START <span className="ticker-sep">●</span></span>
          <span className="ticker-item">NO CREDIT CARD <span className="ticker-sep">●</span></span>
          <span className="ticker-item">START IN SECONDS <span className="ticker-sep">●</span></span>
          <span className="ticker-item">JOIN TODAY <span className="ticker-sep">●</span></span>
          <span className="ticker-item">FREE TO START <span className="ticker-sep">●</span></span>
          <span className="ticker-item">NO CREDIT CARD <span className="ticker-sep">●</span></span>
          <span className="ticker-item">START IN SECONDS <span className="ticker-sep">●</span></span>
          <span className="ticker-item">JOIN TODAY <span className="ticker-sep">●</span></span>
        </div>
      </div>

      {/* Sign Up Form */}
      <section className="form-section">
        <div className="container">
          <div className="split-section">
            {/* Left: Branding */}
            <div className="split-left">
              <h2>START YOUR<br/>PRODUCTIVITY<br/>REVOLUTION</h2>
              <p>Join thousands of users who have transformed how they work with AI-powered agents.</p>
              
              <div className="trust-items" style={{ marginTop: 32 }}>
                {[
                  { text: 'Free tier forever', live: true },
                  { text: 'No credit card required', live: true },
                  { text: 'Setup in seconds', live: true },
                  { text: 'Cancel anytime', live: true }
                ].map(item => (
                  <div key={item.text} className="trust-item">
                    <span className={`trust-dot ${item.live ? 'green' : ''}`}></span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right: Form */}
            <div className="split-right" style={{ justifyContent: 'center', alignItems: 'center' }}>
              <div className="form-container" style={{ width: '100%', maxWidth: 400 }}>
                <div className="form-header">
                  <h2>{mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</h2>
                </div>
                <div className="form-body">
                  <div className="auth-switch" style={{ marginBottom: 14 }}>
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

                  {error && (
                    <div className="auth-alert error" style={{ marginBottom: 12 }}>
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="auth-alert success" style={{ marginBottom: 12 }}>
                      {success}
                    </div>
                  )}
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        placeholder={mode === 'login' ? 'Your password' : '••••••••'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                    
                    {mode === 'signup' && (
                      <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          minLength={6}
                          required
                        />
                      </div>
                    )}
                    
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                      {loading ? (mode === 'login' ? 'Signing in...' : 'Creating...') : (mode === 'login' ? 'Enter Workspace' : 'Create Account')}
                    </button>
                  </form>

                  <div className="auth-divider" style={{ marginTop: 14 }}>or</div>

                  <button
                    type="button"
                    className="auth-secondary"
                    style={{ width: '100%', marginTop: 12 }}
                    onClick={async () => {
                      try {
                        setError('');
                        setSuccess('Redirecting to Google...');
                        await loginWithGoogle();
                      } catch (err: any) {
                        setSuccess('');
                        setError(err?.message || 'Google sign in failed');
                      }
                    }}
                  >
                    Sign In With Google
                  </button>
                  
                  <div style={{ textAlign: 'center', marginTop: 24, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--c5)' }}>
                    {mode === 'signup' ? 'Already have an account?' : 'Need an account?'}
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === 'signup' ? 'login' : 'signup');
                        setError('');
                        setSuccess('');
                      }}
                      style={{
                        color: 'var(--c3)',
                        fontWeight: 700,
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        marginLeft: 4,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                      }}
                    >
                      {mode === 'signup' ? 'Sign In' : 'Create Account'}
                    </button>
                  </div>

                  {mode === 'login' && (
                    <div style={{
                      marginTop: 14,
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      flexWrap: 'wrap',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                    }}>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!email) {
                            setError('Enter your email first, then request a password reset.');
                            return;
                          }
                          try {
                            setError('');
                            await requestPasswordReset(email);
                            setSuccess('Password reset link sent. Check your email inbox.');
                          } catch (err: any) {
                            setSuccess('');
                            setError(err?.message || 'Failed to send password reset email.');
                          }
                        }}
                        style={{
                          border: 'none',
                          background: 'none',
                          padding: 0,
                          color: 'var(--c3)',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                        }}
                      >
                        Forgot password?
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!email) {
                            setError('Enter your email first, then resend verification.');
                            return;
                          }
                          try {
                            setError('');
                            await resendVerification(email);
                            setSuccess('Verification email resent. Use the latest email link.');
                          } catch (err: any) {
                            setSuccess('');
                            setError(err?.message || 'Failed to resend verification email.');
                          }
                        }}
                        style={{
                          border: 'none',
                          background: 'none',
                          padding: 0,
                          color: 'var(--c3)',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                        }}
                      >
                        Resend verification
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="content-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">WHAT YOU GET</h2>
            <p className="section-subtitle">Everything included in your free account</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { icon: '∞', title: 'Unlimited Tasks', desc: 'Create as many tasks as you need', color: 'var(--c3)' },
              { icon: '∞', title: 'Unlimited Notes', desc: 'Build your knowledge base', color: 'var(--c4)' },
              { icon: '✓', title: 'AI Chat', desc: 'Natural language interface', color: 'var(--c5)' },
              { icon: '4', title: 'AI Agents', desc: 'Orchestrator + 3 specialists', color: 'var(--ink)' }
            ].map((item, i) => (
              <div key={i} className={`content-card animate-in delay-${i + 1}`} style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 48, color: item.color }}>{item.icon}</div>
                <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, marginTop: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 12, color: 'var(--c5)', marginTop: 8 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="content-section" style={{ background: 'var(--c1)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">QUESTIONS?</h2>
            <p className="section-subtitle">We're here to help</p>
          </div>
          
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {[
              { q: 'Is it really free?', a: 'Yes! The free tier includes unlimited tasks, notes, and calendar events. No credit card required.' },
              { q: 'How do I get started?', a: 'Just create an account and start typing. Try "create a task to review my notes" or "schedule a meeting tomorrow at 3pm".' },
              { q: 'Can I integrate with my tools?', a: 'Yes! Petal uses MCP (Model Context Protocol) for extensibility. Contact us for custom integrations.' }
            ].map((faq, i) => (
              <div key={i} className={`content-card animate-in delay-${i + 1}`} style={{ marginBottom: 16 }}>
                <h4 style={{ fontFamily: 'var(--display)', fontSize: 20, marginBottom: 8 }}>{faq.q}</h4>
                <p style={{ fontSize: 13, color: 'var(--c5)' }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <span className="footer-logo">PETAL</span>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/features">Features</Link>
              <Link to="/how-it-works">How It Works</Link>
              <Link to="/signup">Sign Up</Link>
            </div>
            <span className="footer-copy">© 2026 Petal. Built with AI.</span>
          </div>
        </div>
      </footer>
    </>
  );
};

export default SignUpPage;