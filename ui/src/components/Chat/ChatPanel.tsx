import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../../stores/appStore';
import { Send, Loader, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

const OPENCODE_URL = 'http://127.0.0.1:4096';

const auth = (() => {
  const user = 'opencode';
  const pass = 'd99085e1-36e3-4a3c-9269-5ed296e2274e';
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
  const match = text.match(/```html\n?([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

function extractSummary(text: string): string {
  const idx = text.indexOf('```html');
  return idx > 0 ? text.slice(0, idx).trim() : text;
}

export function ChatPanel() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});

  const { activeScreenId, screens, messages, addMessage, updateMessage, updateScreen, clearMessages, theme } = useStore();
  const screenMessages = messages[activeScreenId || ''] || [];

  const initSession = useCallback(async () => {
    try {
      const res = await apiFetch('/session', { method: 'POST', body: JSON.stringify({}) });
      const data = await res.json();
      if (data.id) {
        setSessionId(data.id);
        setServerStatus('connected');
      }
    } catch {
      setServerStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    initSession();
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch('/session');
        if (res.ok) setServerStatus('connected');
        else setServerStatus('disconnected');
      } catch {
        setServerStatus('disconnected');
      }
    }, 5000);
    return () => clearInterval(interval);
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

  const pollForResponse = useCallback(async (sid: string, msgId: string, scId: string) => {
    return new Promise<void>((resolve) => {
      pollRef.current = setInterval(async () => {
        try {
          const res = await apiFetch(`/session/${sid}/message`);
          const msgs: OpenCodeMessage[] = await res.json();
          const lastAssistant = [...msgs].reverse().find(m => m.info.role === 'assistant');
          if (lastAssistant) {
            const textParts = lastAssistant.parts.filter(p => p.type === 'text');
            const reasoningParts = lastAssistant.parts.filter(p => p.type === 'reasoning');
            const text = textParts.map(p => p.text).filter(Boolean).join('\n');
            const thinking = reasoningParts.map(p => p.text).filter(Boolean).join('\n');
            if (text) {
              const html = extractHtml(text);
              const summary = extractSummary(text);
              updateMessage(scId, msgId, { content: summary || 'Slide generated', thinking });
              if (html && scId === useStore.getState().activeScreenId) {
                updateScreen(scId, { html });
              }
              resolve();
              return;
            }
            const stepFinish = lastAssistant.parts.some(p => p.type === 'step-finish');
            if (stepFinish) {
              const html = extractHtml(text);
              const summary = extractSummary(text);
              updateMessage(scId, msgId, { content: summary || 'Slide generated', thinking });
              if (html && scId === useStore.getState().activeScreenId) {
                updateScreen(scId, { html });
              }
              resolve();
              return;
            }
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

  const handleSend = async () => {
    if (!input.trim() || !activeScreenId || !sessionId) return;

    const userContent = input.trim();

    addMessage(activeScreenId, { content: userContent, role: 'user' });
    addMessage(activeScreenId, { content: '', role: 'assistant' });

    const msgs = useStore.getState().messages[activeScreenId] || [];
    const assistantMsgId = msgs[msgs.length - 1]?.id || null;

    setInput('');
    setIsLoading(true);

    try {
      const res = await apiFetch(`/session/${sessionId}/prompt_async`, {
        method: 'POST',
        body: JSON.stringify({
          model: { providerID: 'opencode', modelID: 'mimo-v2.5-free' },
          system: 'You are an HTML slide designer. CRITICAL: You MUST NOT use any tools. You MUST NOT read any files. You MUST NOT explore or list the project directory. Just generate the HTML. First give a brief 1-2 sentence description of the slide, then provide the complete HTML code in a ```html code block. Ignore any file-reading tools you have access to.',
          tools: [],
          parts: [{ type: 'text', text: userContent }]
        })
      });

      if (res.ok && assistantMsgId) {
        await pollForResponse(sessionId, assistantMsgId, activeScreenId);
      } else {
        if (assistantMsgId) {
          updateMessage(activeScreenId, assistantMsgId, {
            content: 'Error: request failed'
          });
        }
      }
    } catch {
      if (assistantMsgId) {
        updateMessage(activeScreenId, assistantMsgId, {
          content: 'Error connecting to opencode. Check the server is running.'
        });
      }
    } finally {
      clearInterval(pollRef.current);
      setIsLoading(false);
    }
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
                ? '⚠️ opencode server not connected. Run: opencode serve --cors http://localhost:5173'
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
                      onClick={() => setExpandedReasoning(prev => ({ ...prev, [msg.id!]: !prev[msg.id!] }))}
                    >
                      {expandedReasoning[msg.id!] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span>AI Thinking</span>
                    </button>
                    {expandedReasoning[msg.id!] && (
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
          <button className="send-button" onClick={handleSend} disabled={isLoading || !input.trim() || serverStatus === 'disconnected'}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
