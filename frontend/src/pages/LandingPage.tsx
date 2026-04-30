import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/LandingNav';
import { AppIcon } from '../components/AppIcon';
import { WinnerStamp } from '../components/WinnerStamp';

const LandingPage = () => {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set(['hero']));

  useEffect(() => {
    const handleScroll = () => {};
    window.addEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const isVisible = (id: string) => visibleSections.has(id);

  const testimonials = [
    { name: 'Sarah Chen', role: 'Product Manager', text: 'Petal replaced 4 different tools for me. The multi-agent system actually understands context.', avatar: 'SC' },
    { name: 'Marcus Rivera', role: 'Software Engineer', text: 'The task agent is incredibly smart. I just talk naturally and everything gets organized.', avatar: 'MR' },
    { name: 'Aiko Tanaka', role: 'Designer', text: 'Finally, a productivity tool that doesn\'t feel like work. The brutalist design is gorgeous.', avatar: 'AT' },
  ];

  const pricingPlans = [
    {
      name: 'FREE',
      price: '$0',
      period: 'forever',
      features: ['Unlimited tasks', 'Unlimited notes', '3 AI agents', 'Basic calendar', 'Community support'],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'PRO',
      price: '$12',
      period: '/month',
      features: ['Everything in Free', 'All AI agents', 'Priority processing', 'Advanced analytics', 'Custom integrations', 'Priority support'],
      cta: 'Start Pro Trial',
      highlighted: true,
    },
    {
      name: 'TEAM',
      price: '$29',
      period: '/user/month',
      features: ['Everything in Pro', 'Team collaboration', 'Shared knowledge base', 'Admin dashboard', 'SSO & SAML', 'Dedicated support'],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <>
      <Nav />
      
      {/* Hero Section */}
      <section className="hero" style={{ minHeight: '100vh' }}>
        <div className="hero-content">
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', color: 'var(--c5)', marginBottom: '16px', textTransform: 'uppercase' }}>
            Multi-Agent Productivity System
          </div>
          <h1 className="hero-title animate-in" style={{ fontSize: '120px' }}>
            PETAL
          </h1>
          <p className="hero-tagline animate-in delay-1" style={{ fontSize: '16px', maxWidth: '500px', lineHeight: '1.8' }}>
            Stop juggling apps. One conversation handles your tasks, calendar, and knowledge — powered by AI agents that actually work together.
          </p>
          <div className="hero-cta animate-in delay-2">
            <Link to="/signup" className="btn btn-primary btn-large">Start Free</Link>
            <Link to="/how-it-works" className="btn btn-secondary btn-large">See How It Works</Link>
          </div>
          <div className="animate-in delay-3" style={{ marginTop: '28px' }}>
            <WinnerStamp />
          </div>
          <div style={{ marginTop: '40px', display: 'flex', gap: '24px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--c5)' }}>
            <span>✓ No credit card</span>
            <span>✓ Free forever tier</span>
            <span>✓ Setup in 30s</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-shapes">
            <div className="hs-circle hs-1"></div>
            <div className="hs-circle hs-2"></div>
            <div className="hs-circle hs-3"></div>
            <div className="hs-circle hs-4"></div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker">
          <span className="ticker-item">AI AGENTS <span className="ticker-sep">●</span></span>
          <span className="ticker-item">MULTI-AGENT SYSTEM <span className="ticker-sep">●</span></span>
          <span className="ticker-item">SMARTER PRODUCTIVITY <span className="ticker-sep">●</span></span>
          <span className="ticker-item">NATURAL LANGUAGE <span className="ticker-sep">●</span></span>
          <span className="ticker-item">AUTOMATED TASKS <span className="ticker-sep">●</span></span>
          <span className="ticker-item">KNOWLEDGE GRAPH <span className="ticker-sep">●</span></span>
          <span className="ticker-item">AI AGENTS <span className="ticker-sep">●</span></span>
          <span className="ticker-item">MULTI-AGENT SYSTEM <span className="ticker-sep">●</span></span>
          <span className="ticker-item">SMARTER PRODUCTIVITY <span className="ticker-sep">●</span></span>
          <span className="ticker-item">NATURAL LANGUAGE <span className="ticker-sep">●</span></span>
          <span className="ticker-item">AUTOMATED TASKS <span className="ticker-sep">●</span></span>
          <span className="ticker-item">KNOWLEDGE GRAPH <span className="ticker-sep">●</span></span>
        </div>
      </div>

      {/* Features Section */}
      <section className="features-section" id="features" data-animate>
        <div className="container">
          <div className="section-header">
            <h2 className={`section-title ${isVisible('features') ? 'animate-in' : ''}`}>EVERYTHING YOU NEED</h2>
            <p className={`section-subtitle ${isVisible('features') ? 'animate-in delay-1' : ''}`}>One platform — infinite possibilities</p>
          </div>
          
          <div className="features-grid">
            <div className={`feature-card ${isVisible('features') ? 'animate-in delay-1' : ''}`}>
              <div className="feature-icon"><AppIcon name="chat" size={26} /></div>
              <h3>CHAT</h3>
              <p>Natural conversation with AI agents specialized in tasks, calendar, and knowledge.</p>
            </div>
            
            <div className={`feature-card ${isVisible('features') ? 'animate-in delay-2' : ''}`}>
              <div className="feature-icon"><AppIcon name="task" size={26} /></div>
              <h3>TASKS</h3>
              <p>Kanban-style task management. Create, organize, and track your work effortlessly.</p>
            </div>
            
            <div className={`feature-card ${isVisible('features') ? 'animate-in delay-3' : ''}`}>
              <div className="feature-icon"><AppIcon name="calendar" size={26} /></div>
              <h3>CALENDAR</h3>
              <p>Schedule events and manage your time with intelligent calendar integration.</p>
            </div>
            
            <div className={`feature-card ${isVisible('features') ? 'animate-in delay-4' : ''}`}>
              <div className="feature-icon"><AppIcon name="note" size={26} /></div>
              <h3>NOTES</h3>
              <p>Build your personal knowledge base. Capture and organize information instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Agent Flow Preview */}
      <section className="agent-flow-section" id="agents" data-animate>
        <div className="container">
          <div className="section-header">
            <h2 className={`section-title ${isVisible('agents') ? 'animate-in' : ''}`} style={{ color: 'var(--ink)' }}>POWERED BY AI AGENTS</h2>
            <p className={`section-subtitle ${isVisible('agents') ? 'animate-in delay-1' : ''}`} style={{ color: 'var(--c5)' }}>Intelligent orchestration for every request</p>
          </div>
          
          <div className={`flow-diagram ${isVisible('agents') ? 'animate-in delay-2' : ''}`}>
            <div className="flow-box orch">ORCHESTRATOR</div>
            <span className="flow-arrow">→</span>
            <div className="flow-box task">TASK AGENT</div>
            <span className="flow-arrow">→</span>
            <div className="flow-box cal">CALENDAR AGENT</div>
            <span className="flow-arrow">→</span>
            <div className="flow-box info">INFO AGENT</div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="content-section" id="testimonials" data-animate style={{ background: 'var(--paper)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className={`section-title ${isVisible('testimonials') ? 'animate-in' : ''}`}>LOVED BY USERS</h2>
            <p className={`section-subtitle ${isVisible('testimonials') ? 'animate-in delay-1' : ''}`}>What people are saying</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {testimonials.map((t, i) => (
              <div key={i} className={`content-card ${isVisible('testimonials') ? `animate-in delay-${i + 1}` : ''}`} style={{ padding: '32px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                  {[...Array(5)].map((_, j) => (
                    <span key={j} style={{ color: 'var(--c3)', fontSize: '16px' }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.8', marginBottom: '20px', color: 'var(--ink)' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--c5)',
                    border: '2px solid var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--mono)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--c1)',
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="content-section" id="pricing" data-animate style={{ background: 'var(--c2)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className={`section-title ${isVisible('pricing') ? 'animate-in' : ''}`}>SIMPLE PRICING</h2>
            <p className={`section-subtitle ${isVisible('pricing') ? 'animate-in delay-1' : ''}`}>Start free, upgrade when ready</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'start' }}>
            {pricingPlans.map((plan, i) => (
              <div key={i} style={{
                border: plan.highlighted ? '4px solid var(--ink)' : '3px solid var(--ink)',
                background: plan.highlighted ? 'var(--c1)' : 'var(--paper)',
                padding: '32px',
                position: 'relative',
                transform: plan.highlighted ? 'translateY(-8px)' : 'none',
                boxShadow: plan.highlighted ? '8px 8px 0 var(--ink)' : 'none',
              }}>
                {plan.highlighted && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--c5)',
                    color: 'var(--c1)',
                    fontFamily: 'var(--mono)',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '4px 16px',
                    border: '2px solid var(--ink)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}>Most Popular</div>
                )}
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--c5)', marginBottom: '8px' }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                  <span style={{ fontFamily: 'var(--display)', fontSize: '56px', lineHeight: '1' }}>{plan.price}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--c5)' }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: 'none', marginBottom: '24px' }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{
                      padding: '8px 0',
                      borderBottom: j < plan.features.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{ color: 'var(--c3)' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', display: 'block', textAlign: 'center' }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="content-section" id="cta" data-animate style={{ background: 'var(--ink)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
            <h2 className={`section-title ${isVisible('cta') ? 'animate-in' : ''}`} style={{ color: 'var(--c1)', marginBottom: '16px' }}>
              READY TO START?
            </h2>
            <p className={`${isVisible('cta') ? 'animate-in delay-1' : ''}`} style={{ fontSize: '16px', color: 'var(--c4)', marginBottom: '32px', lineHeight: '1.8' }}>
              Join thousands of users who have transformed their productivity with Petal. Start free today.
            </p>
            <div className={`${isVisible('cta') ? 'animate-in delay-2' : ''}`}>
              <Link to="/signup" className="btn btn-primary btn-large" style={{ background: 'var(--c1)', color: 'var(--ink)' }}>Create Free Account</Link>
            </div>
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

export default LandingPage;