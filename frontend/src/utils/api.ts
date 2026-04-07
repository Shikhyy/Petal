import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('petal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  agents_invoked?: string[];
  timestamp: Date;
}

export interface ToolCall {
  agent: string;
  tool: string;
  result: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  tags: string[];
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface AgentStatus {
  name: string;
  status: 'idle' | 'working' | 'error';
  color: string;
}

type AgentStatusCallback = (agents: AgentStatus[]) => void;
type ChatMessageCallback = (message: { reply: string; agents_invoked: string[]; tool_calls: ToolCall[] }) => void;

class WebSocketClient {
  private agentsWs: WebSocket | null = null;
  private chatWs: WebSocket | null = null;
  private agentsCallbacks: Set<AgentStatusCallback> = new Set();
  private chatCallbacks: Map<string, Set<ChatMessageCallback>> = new Map();

  connectAgents(): void {
    if (this.agentsWs?.readyState === WebSocket.OPEN) return;

    this.agentsWs = new WebSocket(`${WS_URL}/ws/agents`);

    this.agentsWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'agent_status' || data.type === 'agent_update') {
          const agents = data.agents || [data.agent];
          this.agentsCallbacks.forEach(cb => cb(agents));
        }
      } catch (e) {
        console.error('Failed to parse agent status:', e);
      }
    };

    this.agentsWs.onerror = (error) => {
      console.error('Agent WebSocket error:', error);
    };

    this.agentsWs.onclose = () => {
      setTimeout(() => this.connectAgents(), 3000);
    };
  }

  onAgentStatus(callback: AgentStatusCallback): () => void {
    this.agentsCallbacks.add(callback);
    if (!this.agentsWs || this.agentsWs.readyState !== WebSocket.OPEN) {
      this.connectAgents();
    }
    return () => this.agentsCallbacks.delete(callback);
  }

  connectChat(sessionId: string, onMessage: ChatMessageCallback): void {
    this.disconnectChat();
    
    this.chatWs = new WebSocket(`${WS_URL}/ws/chat/${sessionId}`);

    this.chatWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'response') {
          onMessage(data);
        }
      } catch (e) {
        console.error('Failed to parse chat message:', e);
      }
    };

    this.chatWs.onerror = (error) => {
      console.error('Chat WebSocket error:', error);
    };

    if (!this.chatCallbacks.has(sessionId)) {
      this.chatCallbacks.set(sessionId, new Set());
    }
    this.chatCallbacks.get(sessionId)?.add(onMessage);
  }

  sendChatMessage(message: string): void {
    if (this.chatWs?.readyState === WebSocket.OPEN) {
      this.chatWs.send(JSON.stringify({ type: 'message', content: message }));
    }
  }

  disconnectChat(): void {
    this.chatWs?.close();
    this.chatWs = null;
    this.chatCallbacks.clear();
  }

  disconnect(): void {
    this.agentsWs?.close();
    this.chatWs?.close();
    this.agentsCallbacks.clear();
    this.chatCallbacks.clear();
  }
}

export const wsClient = new WebSocketClient();

export const sendMessage = async (message: string, sessionId?: string) => {
  const { data } = await api.post('/chat', { message, session_id: sessionId });
  return data;
};

export const getTasks = () => api.get<Task[]>('/tasks').then(r => r.data);
export const createTask = (task: { title: string; description?: string; priority?: string; tags?: string[]; due_date?: string; status?: string }) =>
  api.post<Task>('/tasks', task).then(r => r.data);
export const updateTask = (id: string, updates: Partial<Task>) =>
  api.patch<Task>(`/tasks/${id}`, updates).then(r => r.data);
export const deleteTask = (id: string) => api.delete(`/tasks/${id}`);

export const getNotes = () => api.get<Note[]>('/notes').then(r => r.data);
export const createNote = (note: { title: string; body?: string; tags?: string[] }) =>
  api.post<Note>('/notes', note).then(r => r.data);
export const updateNote = (id: string, updates: { title?: string; body?: string; tags?: string[]; deleted?: boolean }) =>
  api.patch<Note>(`/notes/${id}`, updates).then(r => r.data);
export const searchNotes = (q: string) =>
  api.get(`/notes/search?q=${encodeURIComponent(q)}`).then(r => r.data);

export const getEvents = (start?: string, end?: string) => {
  const params = new URLSearchParams();
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  return api.get(`/calendar/events?${params}`).then(r => r.data);
};

export const createEvent = (event: { title: string; start_time: string; end_time: string; location?: string; attendees?: string[] }) =>
  api.post('/calendar/events', event).then(r => r.data);

export const getAgentsStatus = () =>
  api.get<{ agents: AgentStatus[] }>('/agents/status').then(r => r.data);

export default api;
