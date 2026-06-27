import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../stores/appStore';
import { Plus, Trash2 } from 'lucide-react';

export function ScreenCarousel() {
  const { screens, activeScreenId, setActiveScreen, addScreen, removeScreen, renameScreen } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      renameScreen(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-list">
        {screens.length === 0 && (
          <span className="bottom-nav-empty">No screens</span>
        )}
        {screens.map(screen => (
          <div
            key={screen.id}
            className={`bottom-nav-item ${screen.id === activeScreenId ? 'active' : ''}`}
            onClick={() => { setActiveScreen(screen.id); }}
          >
            {editingId === screen.id ? (
              <input
                ref={inputRef}
                className="bottom-nav-edit"
                value={editValue}
                maxLength={15}
                onChange={e => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingId(null); }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span
                className="bottom-nav-name"
                onDoubleClick={() => startRename(screen.id, screen.name)}
              >
                {screen.name}
              </span>
            )}
            <button
              className="bottom-nav-remove"
              onClick={e => { e.stopPropagation(); removeScreen(screen.id); }}
            >
              <Trash2 size={10} />
            </button>
          </div>
        ))}
      </div>
      {screens.length < 5 && (
        <button className="bottom-nav-add" onClick={() => addScreen()}>
          <Plus size={16} />
        </button>
      )}
    </nav>
  );
}
