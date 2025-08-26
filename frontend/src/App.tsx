import React, { useState } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { StoryAdventure } from './components/StoryAdventure';
import { MysteryDetective } from './components/MysteryDetective';
import { GameSelector } from './components/GameSelector';
import { MiniGames } from './components/MiniGames';

type AppMode = 'games' | 'chat' | 'story' | 'mystery' | 'minigames';

function App() {
  const [mode, setMode] = useState<AppMode>('games');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // 다크모드 토글
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.body.className = newDarkMode ? 'dark bg-gray-900' : 'bg-gray-50';
  };

  // 초기 다크모드 설정
  React.useEffect(() => {
    document.body.className = darkMode ? 'dark bg-gray-900' : 'bg-gray-50';
  }, [darkMode]);

  const renderContent = () => {
    switch (mode) {
      case 'chat':
        return <ChatContainer />;
      case 'story':
        return (
          <StoryAdventure 
            darkMode={darkMode} 
            onBack={() => setMode('games')} 
          />
        );
      case 'mystery':
        return (
          <MysteryDetective 
            darkMode={darkMode} 
            onBack={() => setMode('games')} 
          />
        );
      case 'minigames':
        return (
          <MiniGames 
            darkMode={darkMode} 
            onBack={() => setMode('games')} 
          />
        );
      default:
        return (
          <GameSelector 
            darkMode={darkMode} 
            onSelectMode={setMode}
            onToggleDarkMode={toggleDarkMode}
          />
        );
    }
  };

  return (
    <div className="App">
      {renderContent()}
    </div>
  );
}

export default App;