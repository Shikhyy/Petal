import { useState } from 'react';
import { getApiErrorMessage, sendMessage } from '../utils/api';
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
  const [sendError, setSendError] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const messages = useStore((s) => s.messages);
  const addMessage = useStore((s) => s.addMessage);
  const sessionId = useStore((s) => s.sessionId);
  const setSessionId = useStore((s) => s.setSessionId);
  const clearMessages = useStore((s) => s.clearMessages);
  const markAgentsActive = useStore((s) => s.markAgentsActive);

  const toFriendlyChatError = (err: unknown) => {
    const raw = getApiErrorMessage(err, 'Failed to get response from the orchestrator.');
    if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('Quota exceeded')) {
      return 'AI capacity is temporarily exhausted. Your request was received, but model quota is currently limited. Please retry in a moment.';
    }
    if (raw.startsWith('429')) {
      return 'Too many requests right now. Please wait a few seconds and try again.';
    }
    return raw;
  };

  const handleSend = async (value?: string) => {
    if (loading) return;

    const userMsg = (value ?? input).trim();
    if (!userMsg) return;

    setInput('');
    setLoading(true);
    setSendError('');
    setLastUserMessage(userMsg);

    addMessage({
      role: 'user',
      content: userMsg,
      timestamp: new Date(),
    });

    try {
      const response = await sendMessage(userMsg, sessionId || undefined);
      if (!sessionId) setSessionId(response.session_id);
      markAgentsActive(response.agents_invoked || []);

      addMessage({
        role: 'assistant',
        content: response.reply,
        agents_invoked: response.agents_invoked,
        tool_calls: response.tool_calls,
        latency_ms: response.latency_ms,
        timestamp: new Date(),
      });
    } catch (err) {
      const friendly = toFriendlyChatError(err);
      setSendError(friendly);
      addMessage({
        role: 'assistant',
        content: `Error: ${friendly}`,
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetConversation = () => {
    clearMessages();
    setSessionId(crypto.randomUUID());
    setSendError('');
  };

  return (
    <>
      <div className="chat-header">
        <div className="ch-top">
          <h1 className="ch-title">Agent Console</h1>
          <span className="ch-desc">Multi-agent collaboration hub</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button type="button" className="qchip" onClick={handleResetConversation}>New Session</button>
            {sendError && (
              <button type="button" className="qchip" onClick={() => void handleSend(lastUserMessage)}>Retry Last</button>
            )}
          </div>
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
        {sendError && (
          <div style={{ margin: '10px 0', padding: '10px 12px', border: '2px solid var(--ink)', background: 'rgba(239,68,68,0.12)', color: '#991b1b', fontFamily: 'var(--mono)', fontSize: '11px' }}>
            {sendError}
          </div>
        )}
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
                {msg.role === 'assistant' && (msg.latency_ms || (msg.tool_calls && msg.tool_calls.length > 0)) && (
                  <div style={{ marginTop: '8px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--c5)' }}>
                    {typeof msg.latency_ms === 'number' ? `Latency: ${msg.latency_ms}ms` : ''}
                    {msg.tool_calls && msg.tool_calls.length > 0 ? ` • Tools: ${msg.tool_calls.map((t) => t.tool).join(', ')}` : ''}
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
              onClick={() => void handleSend(action)}
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
            onClick={() => void handleSend()}
            disabled={loading || !input.trim()}
          >
            {loading ? '...' : 'SEND →'}
          </button>
        </div>
      </div>
    </>
  );
}
