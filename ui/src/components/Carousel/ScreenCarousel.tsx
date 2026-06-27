import { useStore } from '../../stores/appStore';
import { Plus, Trash2 } from 'lucide-react';

export function ScreenCarousel() {
  const { screens, activeScreenId, setActiveScreen, addScreen, removeScreen, theme } = useStore();

  return (
    <nav className="sidebar" data-theme={theme}>
      <div className="sidebar-header">
        <span className="sidebar-title">Screens</span>
        <span className="sidebar-count">{screens.length}</span>
      </div>

      <div className="sidebar-list">
        {screens.length === 0 && (
          <div className="sidebar-empty">No screens yet</div>
        )}
        {screens.map(screen => (
          <div
            key={screen.id}
            className={`sidebar-item ${screen.id === activeScreenId ? 'active' : ''}`}
            onClick={() => setActiveScreen(screen.id)}
          >
            <div className="sidebar-thumb">
              {screen.html ? (
                <iframe srcDoc={screen.html} title={screen.name} sandbox="allow-scripts" />
              ) : (
                screen.name.charAt(0)
              )}
            </div>
            <div className="sidebar-item-name">{screen.name}</div>
            <button
              className="sidebar-remove"
              onClick={e => { e.stopPropagation(); removeScreen(screen.id); }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="btn btn-primary sidebar-add" onClick={() => addScreen()}>
          <Plus size={14} />
          New Screen
        </button>
      </div>
    </nav>
  );
}
