import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Screen {
  id: string;
  name: string;
  html: string;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  timestamp: number;
}

interface AppState {
  screens: Screen[];
  activeScreenId: string | null;
  messages: Record<string, Message[]>;
  theme: 'light' | 'dark';
  isAuthenticated: boolean;
  user: { email: string; name: string; picture: string } | null;
  
  addScreen: (name?: string) => Screen;
  removeScreen: (id: string) => void;
  setActiveScreen: (id: string) => void;
  updateScreen: (id: string, updates: Partial<Screen>) => void;
  
  addMessage: (screenId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (screenId: string, messageId: string, updates: Partial<Message>) => void;
  clearMessages: (screenId: string) => void;
  
  setTheme: (theme: 'light' | 'dark') => void;
  setAuth: (isAuth: boolean, user?: { email: string; name: string; picture: string } | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      screens: [],
      activeScreenId: null,
      messages: {},
      theme: 'dark',
      isAuthenticated: false,
      user: null,

      addScreen: (name) => {
        const current = get().screens;
        if (current.length >= 10) return current[current.length - 1];
        const id = crypto.randomUUID();
        const newScreen: Screen = {
          id,
          name: name || `Screen ${get().screens.length + 1}`,
          html: '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        set(state => ({
          screens: [...state.screens, newScreen],
          activeScreenId: id,
          messages: { ...state.messages, [id]: [] }
        }));
        return newScreen;
      },

      removeScreen: (id) => {
        set(state => {
          const newScreens = state.screens.filter(s => s.id !== id);
          const newMessages = { ...state.messages };
          delete newMessages[id];
          return {
            screens: newScreens,
            activeScreenId: state.activeScreenId === id 
              ? (newScreens[0]?.id || null) 
              : state.activeScreenId,
            messages: newMessages
          };
        });
      },

      setActiveScreen: (id) => set({ activeScreenId: id }),

      updateScreen: (id, updates) => {
        set(state => ({
          screens: state.screens.map(s => 
            s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
          )
        }));
      },

      addMessage: (screenId, message) => {
        const newMessage: Message = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now()
        };
        set(state => ({
          messages: {
            ...state.messages,
            [screenId]: [...(state.messages[screenId] || []), newMessage]
          }
        }));
      },

      updateMessage: (screenId, messageId, updates) => {
        set(state => ({
          messages: {
            ...state.messages,
            [screenId]: (state.messages[screenId] || []).map(m =>
              m.id === messageId ? { ...m, ...updates } : m
            )
          }
        }));
      },

      clearMessages: (screenId) => {
        set(state => ({
          messages: { ...state.messages, [screenId]: [] }
        }));
      },

      setTheme: (theme) => set({ theme }),
      setAuth: (isAuth, user) => set({ isAuthenticated: isAuth, user: user || null })
    }),
    {
      name: 'visual-workbench-storage',
      partialize: (state) => ({
        screens: state.screens,
        messages: state.messages,
        theme: state.theme,
        activeScreenId: state.activeScreenId
      })
    }
  )
);