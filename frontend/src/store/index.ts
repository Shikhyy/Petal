import { create } from 'zustand';
import { ChatMessage } from '../utils/api';

interface AppState {
  sessionId: string | null;
  setSessionId: (id: string) => void;
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
  tickerItems: string[];
  addTickerItem: (item: string) => void;
}

export const useStore = create<AppState>((set) => ({
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),
  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
  tickerItems: [],
  addTickerItem: (item) => set((state) => ({
    tickerItems: [...state.tickerItems.slice(-20), item],
  })),
}));
