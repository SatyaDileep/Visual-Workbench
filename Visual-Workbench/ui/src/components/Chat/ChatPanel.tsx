import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../../stores/appStore';
import { Send, Loader, ChevronDown, ChevronRight, Trash2, Square } from 'lucide-react';

const OPENCODE_URL = import.meta.env.VITE_OPENCODE_URL || 'http://127.0.0.1:4096';
const POLL_TIMEOUT = 120_000;

const auth = (() => {
  const user = import.meta.env.VITE_OPENCODE_USER || '';
  const pass = import.meta.env.VITE_OPENCODE_PASS || '';
  return pass ? `Basic ${btoa(`${user}:${pass}`)}` : '';
})();

function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = auth;
  return fetch(`${OPENCODE_URL}${path}`, { ...options, headers });
}

interface OpenCodePart {
  type: string;
  text?: string;
  id: string;
}

interface OpenCodeMessage {
  info: { role: string; id: string };
  parts: OpenCodePart[];
}

function extractHtml(text: string): string | null {
  const match = text.match(/```html\s*([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

function extractSummary(text: string): string {
  const idx = text.indexOf('```html');
  return idx > 0 ? text.slice(0, idx).trim() : text;
}

function cleanResponse(text: string): string {
  if (/cannot\s+read|does\s+not\s+support\s+image|tool\s+call/i.test(text)) {
    return 'I encountered an issue with a file or tool. Try describing what you want to build without attaching images.';
  }
  return text;
}

function hasToolError(text: string): boolean {
  return /cannot\s+read/i.test(text);
}

export function ChatPanel() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const sessionIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const abortRef = useRef<AbortController | null>(null);

  const { activeScreenId, messages, addMessage, updateMessage, updateScreen, clearMessages, theme } = useStore();
  const screenMessages = messages[activeScreenId || ''] || [];

  const initSession = useCallback(async () => {
    try {
      const res = await apiFetch('/session', { method: 'POST', body: JSON.stringify({}) });
      const data = await res.json();
      if (data.id && mountedRef.current) {
        sessionIdRef.current = data.id;
        setServerStatus('connected');
      }
    } catch {
      if (mountedRef.current) setServerStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    initSession();
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch('/session');
        if (!mountedRef.current) return;
        if (res.ok) {
          setServerStatus('connected');
          const sessions: unknown = await res.json();
          const sid = sessionIdRef.current;
          if (sid && Array.isArray(sessions) && !sessions.some((s: { id: string }) => s.id === sid)) {
            initSession();
          }
        } else {
          setServerStatus('disconnected');
        }
      } catch {
        if (mountedRef.current) setServerStatus('disconnected');
      }
    }, 5000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [initSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [screenMessages]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) interval = setInterval(() => setElapsed(e => e + 1), 1000);
    else setElapsed(0);
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    setInput('');
  }, [activeScreenId]);

  const pollForResponse = useCallback(async (sid: string, msgId: string, scId: string) => {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        clearInterval(pollRef.current);
        reject(new Error('timeout'));
      }, POLL_TIMEOUT);

      pollRef.current = setInterval(async () => {
        try {
          const res = await apiFetch(`/session/${sid}/message`);
          if (!mountedRef.current) return;
          const msgs: OpenCodeMessage[] = await res.json();
          const lastAssistant = [...msgs].reverse().find(m => m.info.role === 'assistant');
          if (!lastAssistant) return;

          const textParts = lastAssistant.parts.filter(p => p.type === 'text');
          const reasoningParts = lastAssistant.parts.filter(p => p.type === 'reasoning');
          const text = textParts.map(p => p.text).filter(Boolean).join('\n');
          const thinking = reasoningParts.map(p => p.text).filter(Boolean).join('\n');

          if (text) {
            const clean = cleanResponse(text);
            const html = hasToolError(text) ? null : extractHtml(text);
            const summary = hasToolError(text) ? clean : extractSummary(text);
            updateMessage(scId, msgId, { content: summary || 'Slide generated', thinking });
            if (html && scId === useStore.getState().activeScreenId) {
              updateScreen(scId, { html });
            }
            clearTimeout(timeout);
            resolve();
            return;
          }

          const stepFinish = lastAssistant.parts.some(p => p.type === 'step-finish');
          if (stepFinish) {
            const clean = cleanResponse(text);
            const html = hasToolError(text) ? null : extractHtml(text);
            const summary = hasToolError(text) ? clean : extractSummary(text);
            updateMessage(scId, msgId, { content: summary || 'Slide generated', thinking });
            if (html && scId === useStore.getState().activeScreenId) {
              updateScreen(scId, { html });
            }
            clearTimeout(timeout);
            resolve();
            return;
          }
        } catch {
          /* retry */
        }
      }, 1000);
    });
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const ensureSession = useCallback(async (): Promise<string> => {
    try {
      const res = await apiFetch('/session', { method: 'POST', body: JSON.stringify({}) });
      const data = await res.json();
      if (data.id) {
        sessionIdRef.current = data.id;
        setServerStatus('connected');
        return data.id;
      }
    } catch {
      /* fall through */
    }
    const existing = sessionIdRef.current;
    if (existing) return existing;
    throw new Error('no session');
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !activeScreenId || isLoading) return;

    const userContent = input.trim();

    addMessage(activeScreenId, { content: userContent, role: 'user' });
    addMessage(activeScreenId, { content: '', role: 'assistant' });

    const msgs = useStore.getState().messages[activeScreenId] || [];
    const assistantMsgId = msgs[msgs.length - 1]?.id || null;

    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let sid = await ensureSession();
      let res = await apiFetch(`/session/${sid}/prompt_async`, {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({
          model: 'opencode/mimo-v2.5-free',
          system: 'You are an HTML slide designer. Generate a complete HTML page with embedded CSS. First give a brief description, then the HTML in a ```html code block.',
          parts: [{ type: 'text', text: userContent }]
        })
      });

      if (!res.ok && assistantMsgId) {
        sid = await ensureSession();
        res = await apiFetch(`/session/${sid}/prompt_async`, {
          method: 'POST',
          signal: controller.signal,
          body: JSON.stringify({
            model: { providerID: 'opencode', modelID: 'deepseek-v4-flash-free' },
            system: 'You are an HTML slide designer. Generate a complete HTML page with embedded CSS. First give a brief description, then the HTML in a ```html code block.',
            parts: [{ type: 'text', text: userContent }]
          })
        });
      }

      if (res.ok && assistantMsgId) {
        await pollForResponse(sid, assistantMsgId, activeScreenId);
      } else if (assistantMsgId) {
        let errMsg = `Error ${res.status}`;
        try { const err = await res.json(); errMsg += `: ${err?.error || err?.message || JSON.stringify(err)}`; } catch { errMsg += ': request failed'; }
        updateMessage(activeScreenId, assistantMsgId, { content: errMsg });
      }
    } catch (err) {
      if (assistantMsgId) {
        updateMessage(activeScreenId, assistantMsgId, {
          content: err instanceof Error && err.message === 'timeout'
            ? 'Error: request timed out. Try again.'
            : 'Error connecting to opencode. Check the server is running.'
        });
      }
    } finally {
      abortRef.current = null;
      clearInterval(pollRef.current);
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    clearInterval(pollRef.current);
    setIsLoading(false);
  };

  return (
    <div className="pane chat-pane" data-theme={theme}>
      <div className="pane-header">
        <span className="pane-title">
          AI Assistant
          {serverStatus === 'connected' && <span style={{ color: '#22c55e', marginLeft: '8px' }}>●</span>}
          {serverStatus === 'disconnected' && <span style={{ color: '#ef4444', marginLeft: '8px' }}>● Disconnected</span>}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isLoading && <span className="timer">{formatTime(elapsed)}</span>}
          {activeScreenId && screenMessages.length > 0 && (
            <button className="btn btn-ghost btn-icon" onClick={() => clearMessages(activeScreenId)} title="Clear chat">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="messages-container">
        {screenMessages.length === 0 && (
          <div className="message-assistant message">
            <div className="message-content">
              {serverStatus === 'disconnected'
                ? 'opencode server not connected. Run: opencode serve --cors http://localhost:5173'
                : 'Welcome! Describe the screen you want to create.'
              }
            </div>
          </div>
        )}
        {screenMessages.map(msg => (
          <div key={msg.id} className={`message message-${msg.role}`}>
            {msg.role === 'user' ? (
              <div className="message-content">{msg.content}</div>
            ) : (
              <div className="message-content">
                {msg.thinking && (
                  <div className="reasoning-block">
                    <button
                      className="reasoning-toggle"
                      onClick={() => setExpandedReasoning(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                    >
                      {expandedReasoning[msg.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span>AI Thinking</span>
                    </button>
                    {expandedReasoning[msg.id] && (
                      <div className="reasoning-text">{msg.thinking}</div>
                    )}
                  </div>
                )}
                <div className="response-text">{msg.content || 'Generating...'}</div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="message message-assistant message">
            <div className="message-content" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Generating...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={serverStatus === 'disconnected' ? 'Start opencode serve first...' : 'Describe the screen you want...'}
            rows={1}
          />
          {isLoading ? (
            <button className="send-button stop-button" onClick={handleStop} title="Stop generating">
              <Square size={16} />
            </button>
          ) : (
            <button className="send-button" onClick={handleSend} disabled={!input.trim() || serverStatus === 'disconnected'}>
              <Send size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
