import { Sun, Moon } from 'lucide-react';
import { useStore } from '../../stores/appStore';

export function Header() {
  const { theme, setTheme, user } = useStore();

  return (
    <header className="header">
      <div className="header-left">
        <span className="logo">Visual Workbench</span>
      </div>
      <div className="header-right">
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user.picture && (
              <img
                src={user.picture}
                alt=""
                style={{ width: 28, height: 28, borderRadius: '50%' }}
              />
            )}
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user.name}</span>
          </div>
        )}
        <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
}