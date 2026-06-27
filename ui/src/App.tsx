import { useEffect } from 'react';
import { useStore } from './stores/appStore';
import { Header } from './components/Layout';
import { ChatPanel } from './components/Chat';
import { ViewerPanel } from './components/Viewer';
import { ScreenCarousel } from './components/Carousel';
import './styles/global.css';

function App() {
  const { theme, addScreen } = useStore();

  useEffect(() => {
    // Auto-create first screen if none exist
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
        <ScreenCarousel />
        <ChatPanel />
        <ViewerPanel />
      </div>
    </div>
  );
}

export default App;