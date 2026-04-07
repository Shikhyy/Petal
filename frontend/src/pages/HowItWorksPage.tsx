import { Link } from 'react-router-dom';
import Nav from '../components/LandingNav';

const HowItWorksPage = () => {
  return (
    <>
      <Nav />

      {/* Page Header */}
      <header className="page-header">
        <div className="container">
          <h1 className="animate-in">HOW IT WORKS</h1>
          <p className="animate-in delay-1">Three simple steps to smarter productivity</p>
        </div>
      </header>

      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker">
          <span className="ticker-item">ASK NATURALLY <span className="ticker-sep">●</span></span>
          <span className="ticker-item">AGENTS COLLABORATE <span className="ticker-sep">●</span></span>
          <span className="ticker-item">GET RESULTS <span className="ticker-sep">●</span></span>
          <span className="ticker-item">SIMPLE AS THAT <span className="ticker-sep">●</span></span>
          <span className="ticker-item">ASK NATURALLY <span className="ticker-sep">●</span></span>
          <span className="ticker-item">AGENTS COLLABORATE <span className="ticker-sep">●</span></span>
          <span className="ticker-item">GET RESULTS <span className="ticker-sep">●</span></span>
          <span className="ticker-item">SIMPLE AS THAT <span className="ticker-sep">●</span></span>
        </div>
      </div>

      {/* Three Steps */}
      <section className="content-section">
        <div className="container">
          <ul className="process-list">
            <li className="animate-in">
              <span className="pl-num">01</span>
              <div className="pl-content">
                <h4>ASK ANYTHING</h4>
                <p>Type naturally — "Schedule a meeting", "Create a task", "Take a note". No commands to remember, no menus to navigate. Just talk to Petal like you would to a colleague.</p>
              </div>
            </li>
            
            <li className="animate-in delay-1">
              <span className="pl-num">02</span>
              <div className="pl-content">
                <h4>AGENTS COLLABORATE</h4>
                <p>Behind the scenes, the Orchestrator routes your request to the right specialist agent. Task Agent handles to-dos, Calendar Agent manages events, Info Agent saves knowledge. They work together seamlessly.</p>
              </div>
            </li>
            
            <li className="animate-in delay-2">
              <span className="pl-num">03</span>
              <div className="pl-content">
                <h4>GET RESULTS</h4>
                <p>Watch as your request comes to life — tasks appear on your board, events show on your calendar, notes are saved to your knowledge base. Real-time feedback keeps you informed.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Agent Flow Diagram */}
      <section className="agent-flow-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title" style={{ color: 'var(--ink)' }}>AGENT FLOW</h2>
            <p className="section-subtitle" style={{ color: 'var(--c5)' }}>How your request travels through the system</p>
          </div>
          
          <div className="flow-diagram">
            <div className="flow-box" style={{ background: 'var(--paper)' }}>YOUR MESSAGE</div>
            <span className="flow-arrow">→</span>
            <div className="flow-box orch">ORCHESTRATOR</div>
            <span className="flow-arrow">→</span>
            <div className="flow-box task">TASK</div>
            <span className="flow-arrow">→</span>
            <div className="flow-box cal">CAL</div>
            <span className="flow-arrow">→</span>
            <div className="flow-box info">INFO</div>
            <span className="flow-arrow">→</span>
            <div className="flow-box" style={{ background: 'var(--c1)' }}>RESULT</div>
          </div>
        </div>
      </section>

      {/* Quick Commands */}
      <section className="content-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">TRY THESE COMMANDS</h2>
            <p className="section-subtitle">Just type naturally — Petal understands</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, maxWidth: 800, margin: '0 auto' }}>
            <div className="content-card animate-in">
              <h3 style={{ color: 'var(--c5)' }}>TASKS</h3>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 13, marginTop: 16 }}>
                "Create a task to review the PR"<br/>
                "Add high priority task: call mom"<br/>
                "Show my todo list"
              </p>
            </div>
            
            <div className="content-card animate-in delay-1">
              <h3 style={{ color: 'var(--c3)' }}>CALENDAR</h3>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 13, marginTop: 16 }}>
                "Schedule meeting tomorrow at 3pm"<br/>
                "Block out Friday for focus time"<br/>
                "What's on my calendar today"
              </p>
            </div>
            
            <div className="content-card animate-in delay-2">
              <h3 style={{ color: 'var(--c4)' }}>NOTES</h3>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 13, marginTop: 16 }}>
                "Save note: meeting ideas for Q2"<br/>
                "Create note called Project Plans"<br/>
                "Show my notes"
              </p>
            </div>
            
            <div className="content-card animate-in delay-3">
              <h3 style={{ color: 'var(--ink)' }}>COMBINED</h3>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 13, marginTop: 16 }}>
                "Schedule standup and add to tasks"<br/>
                "Create task for tomorrow and set reminder"<br/>
                "Note meeting and add follow-up task"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MCP Integration */}
      <section className="content-section" style={{ background: 'var(--c2)' }}>
        <div className="container">
          <div className="content-grid">
            <div>
              <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 16 }}>WORKS WITH YOUR TOOLS</h2>
              <p style={{ fontSize: 16, color: 'var(--c5)', marginBottom: 24 }}>
                Petal integrates with your existing workflow through MCP (Model Context Protocol). Connect to databases, calendars, and more.
              </p>
              <ul style={{ listStyle: 'none', fontFamily: 'var(--mono)', fontSize: 13 }}>
                {[
                  'Supabase Database',
                  'External APIs',
                  'Custom Tools',
                  'Extendable Architecture'
                ].map((item, i) => (
                  <li key={i} style={{ padding: '12px 0', borderBottom: '2px solid var(--ink)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 12, height: 12, background: 'var(--c5)', border: '2px solid var(--ink)' }}></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ background: 'var(--ink)', border: '4px solid var(--ink)', padding: 32 }}>
              <div style={{ background: 'var(--c5)', border: '3px solid var(--c1)', padding: 16, marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--c1)' }}>MCP STATUS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { name: 'Supabase', status: 'Connected', live: true },
                  { name: 'API Gateway', status: 'Active', live: true },
                  { name: 'Custom Tools', status: 'Coming Soon', live: false }
                ].map(item => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                    <span style={{
                      width: 10, height: 10,
                      background: item.live ? '#4ade80' : 'var(--c4)',
                      border: `2px solid ${item.live ? '#166534' : 'var(--c2)'}`,
                      borderRadius: '50%',
                      animation: item.live ? 'pulse-green 2s infinite' : 'none'
                    }}></span>
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 12,
                      color: item.live ? 'var(--c2)' : 'var(--c4)'
                    }}>
                      {item.name} — {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="content-section" style={{ background: 'var(--c1)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>START NOW</h2>
            <p style={{ fontSize: 16, color: 'var(--c5)', marginBottom: 32 }}>
              Experience the future of productivity. Free to start.
            </p>
            <Link to="/signup" className="btn btn-primary btn-large">Create Free Account</Link>
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

      <style>{`
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
          50% { box-shadow: 0 0 0 4px rgba(74, 222, 128, 0); }
        }
      `}</style>
    </>
  );
};

export default HowItWorksPage;