export function HelpPage() {
  const faqs = [
    { q: 'How do I create a task?', a: 'Type naturally in chat like "Create a task to review the PR" or use the Tasks page directly.' },
    { q: 'How do I schedule an event?', a: 'Say "Schedule a meeting tomorrow at 2pm" or use the Calendar page to add events manually.' },
    { q: 'Can I use Petal offline?', a: 'Currently Petal requires an internet connection to communicate with AI agents.' },
    { q: 'How do the AI agents work?', a: 'The Orchestrator routes your requests to specialized agents: Task Agent, Calendar Agent, and Info Agent.' },
  ];

  return (
    <>
      <div className="chat-header">
        <div className="ch-top">
          <div>
            <h1 className="ch-title">HELP</h1>
            <p className="ch-desc">Frequently asked questions and guides</p>
          </div>
        </div>
      </div>
      <div className="messages" style={{ padding: '24px' }}>
        <div className="page-brutal-header" style={{ marginBottom: '24px', maxWidth: '600px' }}>
          <div className="pbh-accent"></div>
          <div className="pbh-content">
            <h2 className="pbh-title" style={{ fontSize: '24px' }}>Quick Start</h2>
            <p className="pbh-sub">Get started with Petal in minutes</p>
          </div>
        </div>

        <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ border: '4px solid var(--ink)', background: 'var(--c1)', padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: '20px', marginBottom: '12px' }}>1. Chat with Petal</h3>
            <p style={{ fontSize: '13px', color: 'var(--c5)' }}>
              The main chat interface is your gateway to everything. Just type naturally — "Create a task", "Schedule meeting", "Save note".
            </p>
          </div>

          <div style={{ border: '4px solid var(--ink)', background: 'var(--c2)', padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: '20px', marginBottom: '12px' }}>2. Manage Tasks</h3>
            <p style={{ fontSize: '13px', color: 'var(--c5)' }}>
              Use the Kanban board to track progress. Tasks have priorities, due dates, and can be moved between Todo, WIP, and Done.
            </p>
          </div>

          <div style={{ border: '4px solid var(--ink)', background: 'var(--c3)', padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: '20px', marginBottom: '12px' }}>3. Calendar</h3>
            <p style={{ fontSize: '13px', color: 'var(--ink)' }}>
              View and manage events. Create events through chat or manually using the calendar interface.
            </p>
          </div>

          <div style={{ border: '4px solid var(--ink)', background: 'var(--c4)', padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: '20px', marginBottom: '12px', color: 'var(--c1)' }}>4. Knowledge Base</h3>
            <p style={{ fontSize: '13px', color: 'var(--c2)' }}>
              Build your personal wiki. Create notes, organize ideas, and search through your knowledge instantly.
            </p>
          </div>
        </div>

        <div className="page-brutal-header" style={{ marginTop: '40px', marginBottom: '24px', maxWidth: '600px' }}>
          <div className="pbh-accent"></div>
          <div className="pbh-content">
            <h2 className="pbh-title" style={{ fontSize: '24px' }}>FAQs</h2>
            <p className="pbh-sub">Common questions answered</p>
          </div>
        </div>

        <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ border: '3px solid var(--ink)', background: 'var(--paper)', padding: '16px' }}>
              <h4 style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>{faq.q}</h4>
              <p style={{ fontSize: '13px', color: 'var(--c5)' }}>{faq.a}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '40px', maxWidth: '600px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--c5)' }}>
            Still have questions? <a href="#" style={{ color: 'var(--c3)', fontWeight: 700 }}>Contact support</a>
          </p>
        </div>
      </div>
    </>
  );
}

export default HelpPage;