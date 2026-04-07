import { Link } from 'react-router-dom';
import Nav from '../components/LandingNav';

const FeaturesPage = () => {
  return (
    <>
      <Nav />

      {/* Page Header */}
      <header className="page-header">
        <div className="container">
          <h1 className="animate-in">CAPABILITIES</h1>
          <p className="animate-in delay-1">Four powerful features. One seamless experience.</p>
        </div>
      </header>

      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker">
          <span className="ticker-item">CHAT WITH AI AGENTS <span className="ticker-sep">●</span></span>
          <span className="ticker-item">MANAGE TASKS EASILY <span className="ticker-sep">●</span></span>
          <span className="ticker-item">SCHEDULE EVENTS <span className="ticker-sep">●</span></span>
          <span className="ticker-item">BUILD KNOWLEDGE <span className="ticker-sep">●</span></span>
          <span className="ticker-item">CHAT WITH AI AGENTS <span className="ticker-sep">●</span></span>
          <span className="ticker-item">MANAGE TASKS EASILY <span className="ticker-sep">●</span></span>
          <span className="ticker-item">SCHEDULE EVENTS <span className="ticker-sep">●</span></span>
          <span className="ticker-item">BUILD KNOWLEDGE <span className="ticker-sep">●</span></span>
        </div>
      </div>

      {/* Features Detail */}
      <section className="content-section">
        <div className="container">
          
          {/* Feature 1: Chat */}
          <div className="content-grid" style={{ marginBottom: 80 }}>
            <div className="content-card animate-in">
              <span className="step-num">01</span>
              <h3>AI CHAT</h3>
              <p>
                Have natural conversations with specialized AI agents. The orchestrator routes your requests to the right specialist — task, calendar, or info agent — for intelligent responses and actions.
              </p>
              <ul style={{ listStyle: 'none', marginTop: 20, fontFamily: 'var(--mono)', fontSize: 12 }}>
                <li style={{ padding: '8px 0', borderBottom: '1px solid var(--c4)' }}>→ Multi-agent collaboration</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid var(--c4)' }}>→ Real-time agent status</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid var(--c4)' }}>→ Context-aware responses</li>
                <li style={{ padding: '8px 0' }}>→ Tool execution feedback</li>
              </ul>
            </div>
            <div style={{ background: 'var(--c2)', border: '4px solid var(--ink)', padding: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--c1)', border: '3px solid var(--ink)', padding: 16, borderRadius: '0 8px 8px 8px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--c5)' }}>YOU</span>
                <p style={{ fontSize: 14, marginTop: 8 }}>Schedule a meeting with John tomorrow at 2pm</p>
              </div>
              <div style={{ background: 'var(--c5)', border: '3px solid var(--ink)', padding: 16, borderRadius: '8px 0 8px 8px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--c1)' }}>CALENDAR AGENT</span>
                <p style={{ fontSize: 14, marginTop: 8, color: 'var(--c1)' }}>Done! I've scheduled "Meeting with John" for tomorrow at 2:00 PM.</p>
              </div>
              <div style={{ background: 'var(--c3)', border: '3px dashed var(--ink)', padding: 16 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink)' }}>THINKING...</span>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <span style={{ width: 10, height: 10, background: 'var(--c5)', border: '2px solid var(--ink)' }}></span>
                  <span style={{ width: 10, height: 10, background: 'var(--c5)', border: '2px solid var(--ink)', animation: 'bounce 0.6s infinite' }}></span>
                  <span style={{ width: 10, height: 10, background: 'var(--c5)', border: '2px solid var(--ink)' }}></span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Tasks */}
          <div className="content-grid" style={{ marginBottom: 80 }}>
            <div style={{ background: 'var(--c1)', border: '4px solid var(--ink)', padding: 40 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: '3px solid var(--ink)' }}>
                <div style={{ padding: 16, borderRight: '2px solid var(--ink)', background: 'var(--c2)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700 }}>TODO</span>
                  <div style={{ marginTop: 12, padding: 10, background: 'var(--paper)', border: '2px solid var(--ink)' }}>
                    <span style={{ fontSize: 12 }}>Review PR #42</span>
                  </div>
                  <div style={{ marginTop: 8, padding: 10, background: 'var(--paper)', border: '2px solid var(--ink)' }}>
                    <span style={{ fontSize: 12 }}>Update docs</span>
                  </div>
                </div>
                <div style={{ padding: 16, borderRight: '2px solid var(--ink)', background: 'var(--c3)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700 }}>WIP</span>
                  <div style={{ marginTop: 12, padding: 10, background: 'var(--paper)', border: '2px solid var(--ink)' }}>
                    <span style={{ fontSize: 12 }}>Fix login bug</span>
                  </div>
                </div>
                <div style={{ padding: 16, background: 'var(--c5)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--c1)' }}>DONE</span>
                  <div style={{ marginTop: 12, padding: 10, background: 'var(--paper)', border: '2px solid var(--ink)', opacity: 0.6 }}>
                    <span style={{ fontSize: 12, textDecoration: 'line-through' }}>Setup CI/CD</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-card animate-in">
              <span className="step-num">02</span>
              <h3>TASK MANAGEMENT</h3>
              <p>
                Kanban-style board with three columns: Todo, Work In Progress, and Done. Create tasks via chat or manually, assign priorities, and track progress visually.
              </p>
              <ul style={{ listStyle: 'none', marginTop: 20, fontFamily: 'var(--mono)', fontSize: 12 }}>
                <li style={{ padding: '8px 0', borderBottom: '1px solid var(--c4)' }}>→ Drag-and-drop columns</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid var(--c4)' }}>→ Priority levels (high/medium/low)</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid var(--c4)' }}>→ Due date tracking</li>
                <li style={{ padding: '8px 0' }}>→ Create via natural language</li>
              </ul>
            </div>
          </div>

          {/* Feature 3: Calendar */}
          <div className="content-grid" style={{ marginBottom: 80 }}>
            <div className="content-card animate-in">
              <span className="step-num">03</span>
              <h3>CALENDAR</h3>
              <p>
                Interactive monthly calendar view. See events at a glance, click any day to view details, and create events through simple chat commands.
              </p>
              <ul style={{ listStyle: 'none', marginTop: 20, fontFamily: 'var(--mono)', fontSize: 12 }}>
                <li style={{ padding: '8px 0', borderBottom: '1px solid var(--c4)' }}>→ Monthly grid view</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid var(--c4)' }}>→ Today highlighting</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid var(--c4)' }}>→ Event indicators</li>
                <li style={{ padding: '8px 0' }}>→ Natural language scheduling</li>
              </ul>
            </div>
            <div style={{ background: 'var(--c4)', border: '4px solid var(--ink)', padding: 24 }}>
              <div style={{ background: 'var(--c5)', padding: 12, border: '2px solid var(--ink)', display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontFamily: 'var(--display)', fontSize: 24, color: 'var(--c1)' }}>APRIL 2026</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--c2)' }}>◀ ▶</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, fontFamily: 'var(--mono)', fontSize: 10, textAlign: 'center', marginBottom: 8 }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <span key={i} style={{ color: 'var(--c4)' }}>{d}</span>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, fontFamily: 'var(--mono)', fontSize: 12, textAlign: 'center' }}>
                {[
                  { n: 30, f: true }, { n: 31, f: true }, { n: 1, h: true }, { n: 2 }, { n: 3 }, { n: 4 }, { n: 5, e: true },
                  { n: 6 }, { n: 7 }, { n: 8 }, { n: 9 }, { n: 10 }, { n: 11 }, { n: 12 }
                ].map((day, i) => (
                  <span key={i} style={{
                    color: day.f ? 'var(--c5)' : (day.h ? 'var(--c1)' : 'var(--ink)'),
                    border: day.h ? '2px solid var(--ink)' : 'none',
                    background: day.h ? 'var(--c5)' : 'transparent',
                    fontWeight: day.h ? 700 : 400,
                    position: 'relative',
                    padding: 4
                  }}>
                    {day.n}
                    {day.e && <span style={{
                      position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                      width: 6, height: 6, background: 'var(--c3)', border: '1px solid var(--ink)', borderRadius: '50%'
                    }}></span>}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 20, padding: 12, background: 'var(--c2)', border: '2px solid var(--ink)' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--c5)' }}>EVENTS FOR APRIL 5</span>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ width: 4, height: '100%', minHeight: 30, background: 'var(--c3)', border: '1px solid var(--ink)' }}></span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600 }}>Team Standup</p>
                    <p style={{ fontSize: 10, color: 'var(--c5)' }}>10:00 AM • Zoom</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4: Notes */}
          <div className="content-grid">
            <div style={{ background: 'var(--c3)', border: '4px solid var(--ink)', padding: 40, display: 'flex', gap: 16 }}>
              <div style={{ width: 180, border: '3px solid var(--ink)', background: 'var(--c1)' }}>
                <div style={{ padding: 12, borderBottom: '2px solid var(--ink)', background: 'var(--c4)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--c1)' }}>NOTES</span>
                </div>
                <div style={{ padding: 12, borderBottom: '1px solid var(--c4)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Meeting Notes</span>
                  <p style={{ fontSize: 10, color: 'var(--c5)', marginTop: 4 }}>Discussed Q2 goals...</p>
                </div>
                <div style={{ padding: 12, borderBottom: '1px solid var(--c4)', background: 'var(--c5)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c1)' }}>Project Ideas</span>
                  <p style={{ fontSize: 10, color: 'var(--c2)', marginTop: 4 }}>New feature concepts...</p>
                </div>
                <div style={{ padding: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Code Snippets</span>
                  <p style={{ fontSize: 10, color: 'var(--c5)', marginTop: 4 }}>Useful scripts...</p>
                </div>
              </div>
              <div style={{ flex: 1, border: '3px solid var(--ink)', background: 'var(--paper)', padding: 20 }}>
                <input type="text" defaultValue="Project Ideas" style={{
                  width: '100%', border: 'none', borderBottom: '3px solid var(--ink)',
                  fontFamily: 'var(--display)', fontSize: 24, background: 'transparent',
                  padding: '8px 0', marginBottom: 16, outline: 'none'
                }} />
                <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--c5)' }}>
                  1. AI-powered task automation<br/>
                  2. Calendar integrations with external tools<br/>
                  3. Knowledge graph for notes<br/>
                  4. Voice command support<br/>
                  5. Mobile app with offline sync
                </p>
              </div>
            </div>
            <div className="content-card animate-in">
              <span className="step-num">04</span>
              <h3>KNOWLEDGE BASE</h3>
              <p>
                Note-taking system for building your personal knowledge base. Create, organize, and search notes instantly. Capture ideas, meeting notes, and code snippets.
              </p>
              <ul style={{ listStyle: 'none', marginTop: 20, fontFamily: 'var(--mono)', fontSize: 12 }}>
                <li style={{ padding: '8px 0', borderBottom: '1px solid var(--c4)' }}>→ Rich text editor</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid var(--c4)' }}>→ Note list navigation</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid var(--c4)' }}>→ Auto-save functionality</li>
                <li style={{ padding: '8px 0' }}>→ Quick search and access</li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="agent-flow-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title" style={{ color: 'var(--ink)' }}>BUILT WITH MODERN TECH</h2>
            <p className="section-subtitle" style={{ color: 'var(--c5)' }}>Powerful agents, reliable infrastructure</p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', marginTop: 40 }}>
            {[
              { name: 'FASTAPI', sub: 'Backend Framework', bg: 'var(--c1)' },
              { name: 'REACT', sub: 'Frontend Framework', bg: 'var(--c2)' },
              { name: 'SUPABASE', sub: 'Database & Auth', bg: 'var(--c3)' },
              { name: 'VITE', sub: 'Build Tool', bg: 'var(--c4)' },
              { name: 'PYTHON', sub: 'Agent Logic', bg: 'var(--c5)', light: true }
            ].map(tech => (
              <div key={tech.name} style={{
                background: tech.bg, border: '3px solid var(--ink)', padding: '20px 32px',
                color: tech.light ? 'var(--c1)' : 'var(--ink)'
              }}>
                <span style={{ fontFamily: 'var(--display)', fontSize: 24 }}>{tech.name}</span>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: tech.light ? 'var(--c2)' : 'var(--c5)', marginTop: 4 }}>{tech.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="content-section" style={{ background: 'var(--c1)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>TRY IT NOW</h2>
            <p style={{ fontSize: 16, color: 'var(--c5)', marginBottom: 32 }}>
              Get started for free. No credit card required.
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
    </>
  );
};

export default FeaturesPage;