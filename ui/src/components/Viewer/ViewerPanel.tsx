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

        <div className="viewer-body">
          {activeScreen?.html ? (
            <iframe
              srcDoc={activeScreen.html}
              title="Screen Preview"
              sandbox="allow-scripts"
              className="viewer-iframe"
            />
          ) : (
            <div className="viewer-empty">
              <div className="viewer-empty-icon">
                <Maximize2 size={32} strokeWidth={1.5} />
              </div>
              <p className="viewer-empty-title">Visual Thinking, Instant Slides</p>
              <p className="viewer-empty-sub">Describe a concept and get a polished visual — no wrestling, just results</p>
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
                className="viewer-iframe"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
