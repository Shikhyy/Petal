import { useState } from 'react';
import { sendMessage } from '../utils/api';
import { useStore } from '../store';

const quickActions = [
  'Summarize my tasks',
  'Schedule meeting',
  'Find notes about...',
  'What can you do?',
];

const agentFlow = [
  { label: 'orch', text: 'Orchestrator', type: 'orch' },
  { label: 'arrow', text: '→', type: 'arrow' },
  { label: 'task', text: 'Task', type: 'task' },
  { label: 'arrow', text: '→', type: 'arrow' },
  { label: 'cal', text: 'Calendar', type: 'cal' },
  { label: 'arrow', text: '→', type: 'arrow' },
  { label: 'info', text: 'Info', type: 'info' },
];

export function ChatPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messages = useStore((s) => s.messages);
  const addMessage = useStore((s) => s.addMessage);
  const sessionId = useStore((s) => s.sessionId);
  const setSessionId = useStore((s) => s.setSessionId);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    addMessage({
      role: 'user',
      content: userMsg,
      timestamp: new Date(),
    });

    try {
      const response = await sendMessage(userMsg, sessionId || undefined);
      if (!sessionId) setSessionId(response.session_id);

      addMessage({
        role: 'assistant',
        content: response.reply,
        agents_invoked: response.agents_invoked,
        timestamp: new Date(),
      });
    } catch (err) {
      addMessage({
        role: 'assistant',
        content: 'Error: Failed to get response from the orchestrator.',
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="chat-header">
        <div className="ch-top">
          <h1 className="ch-title">Agent Console</h1>
          <span className="ch-desc">Multi-agent collaboration hub</span>
        </div>
        <div className="agent-flow">
          {agentFlow.map((item, i) => (
            item.type === 'arrow' ? (
              <span key={i} className="flow-arrow">{item.text}</span>
            ) : (
              <span key={i} className={`flow-chip ${item.type}`}>{item.text}</span>
            )
          ))}
        </div>
      </div>
      <div className="messages">
        {messages.length === 0 ? (
          <div className="msg">
            <div className="ava ai">AI</div>
            <div className="bubble ai">
              <div className="agent-label">Orchestrator</div>
              Welcome to PETAL. I'm your multi-agent assistant. What would you like to accomplish today?
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.role}`}>
              <div className={`ava ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                {msg.role === 'assistant' ? 'AI' : 'U'}
              </div>
              <div className={`bubble ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                {msg.role === 'assistant' && (
                  <div className="agent-label">Orchestrator</div>
                )}
                {msg.content}
                {msg.agents_invoked && msg.agents_invoked.length > 0 && (
                  <div className="tool-chip res">
                    Agents: {msg.agents_invoked.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="msg">
            <div className="ava ai">AI</div>
            <div className="bubble ai thinking-bubble">
              <div className="think-dots">
                <div className="td"></div>
                <div className="td"></div>
                <div className="td"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="input-area">
        <div className="quick-row">
          {quickActions.map((action, i) => (
            <button 
              key={i} 
              className="qchip"
              onClick={() => setInput(action)}
            >
              {action}
            </button>
          ))}
        </div>
        <div className="inp-row">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            disabled={loading}
          />
          <button 
            className="send-btn" 
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            {loading ? '...' : 'SEND →'}
          </button>
        </div>
      </div>
    </>
  );
}
