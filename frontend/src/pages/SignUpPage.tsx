import { Link } from 'react-router-dom';
import Nav from '../components/LandingNav';

const SignUpPage = () => {
  return (
    <>
      <Nav />

      {/* Page Header */}
      <header className="page-header">
        <div className="container">
          <h1 className="animate-in">GET STARTED</h1>
          <p className="animate-in delay-1">Create your free account</p>
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
                  <h2>CREATE ACCOUNT</h2>
                </div>
                <div className="form-body">
                  <form>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" placeholder="you@example.com" />
                    </div>
                    
                    <div className="form-group">
                      <label>Password</label>
                      <input type="password" placeholder="••••••••" />
                    </div>
                    
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input type="password" placeholder="••••••••" />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                      Create Account
                    </button>
                  </form>
                  
                  <div style={{ textAlign: 'center', marginTop: 24, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--c5)' }}>
                    Already have an account? 
                    <Link to="/login" style={{ color: 'var(--c3)', fontWeight: 700 }}> Sign In</Link>
                  </div>
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