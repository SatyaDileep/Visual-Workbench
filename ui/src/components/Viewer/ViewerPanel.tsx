import { useState } from 'react';
import { useStore } from '../../stores/appStore';
import { Maximize2, X } from 'lucide-react';

export function ViewerPanel() {
  const { activeScreenId, screens, theme } = useStore();
  const activeScreen = screens.find(s => s.id === activeScreenId);
  const [maximized, setMaximized] = useState(false);

  return (
    <>
      <div className="pane viewer-pane" data-theme={theme}>
        <div className="pane-header">
          <span className="pane-title">Preview</span>
          {activeScreen?.html && (
            <button className="btn btn-ghost btn-icon" onClick={() => setMaximized(true)} title="Maximize">
              <Maximize2 size={16} />
            </button>
          )}
        </div>

        <div className="viewer-container">
          {activeScreen?.html ? (
            <div className="viewer-frame">
              <iframe
                srcDoc={activeScreen.html}
                title="Screen Preview"
                sandbox="allow-scripts"
              />
            </div>
          ) : (
            <div className="viewer-empty">
              <Maximize2 size={48} strokeWidth={1} />
              <p>Your generated screen will appear here</p>
              <p className="viewer-empty-sub">Chat with the AI to create your first screen</p>
            </div>
          )}
        </div>
      </div>

      {maximized && activeScreen?.html && (
        <div className="modal-overlay" onClick={() => setMaximized(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{activeScreen.name}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setMaximized(false)} title="Close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <iframe
                srcDoc={activeScreen.html}
                title="Screen Preview (Maximized)"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
