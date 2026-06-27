import { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useStore } from './stores/appStore';
import { Header } from './components/Layout';
import { ChatPanel } from './components/Chat';
import { ViewerPanel } from './components/Viewer';
import { ScreenCarousel } from './components/Carousel';
import './styles/global.css';

function App() {
  const { theme, setTheme, addScreen } = useStore();

  useEffect(() => {
    const screens = useStore.getState().screens;
    if (screens.length === 0) {
      addScreen('Slide 1');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app" data-theme={theme}>
      <Header />
      <div className="main-layout">
        <ChatPanel />
        <ViewerPanel />
      </div>
      <ScreenCarousel />
      <button className="theme-fab" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </div>
  );
}

export default App;
