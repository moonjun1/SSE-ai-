import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowLeft, Wand2, Send } from 'lucide-react';

interface StoryAdventureProps {
  onBack: () => void;
  darkMode: boolean;
}

const StoryAdventure: React.FC<StoryAdventureProps> = ({ onBack, darkMode }) => {
  const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
  const [selectedGenre, setSelectedGenre] = useState('fantasy');
  const [selectedModel, setSelectedModel] = useState('openai-gpt3.5');
  const [currentStory, setCurrentStory] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [customAction, setCustomAction] = useState('');
  const [turn, setTurn] = useState(0);
  const [fullStoryText, setFullStoryText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const genres = [
    { id: 'fantasy', name: '판타지', desc: '마법과 모험이 가득한 세계' },
    { id: 'sci-fi', name: 'SF', desc: '미래와 우주를 탐험하는 이야기' },
    { id: 'mystery', name: '미스터리', desc: '수수께끼와 추리가 중심인 스토리' },
    { id: 'horror', name: '호러', desc: '공포와 스릴이 넘치는 어두운 이야기' },
    { id: 'romance', name: '로맨스', desc: '사랑과 감정이 중심인 이야기' },
    { id: 'adventure', name: '어드벤처', desc: '액션과 모험이 가득한 스토리' }
  ];

  const models = [
    { id: 'openai-gpt3.5', name: 'GPT-3.5 Turbo' },
    { id: 'openai-gpt4', name: 'GPT-4' },
    { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' }
  ];

  // 실시간 chunk 추가 함수
  const addChunkToStory = (chunk: string) => {
    setCurrentStory(prev => {
      const newStory = prev + chunk;
      return newStory;
    });
  };

  const startNewStory = async () => {
    setIsLoading(true);
    setCurrentStory('');
    
    // POST 요청을 먼저 보낸 후 스트리밍 받기
    try {
      const response = await fetch('/api/games/story/start/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: selectedGenre,
          model: selectedModel
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start story stream');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let receivedSessionId = '';
      
      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.trim().startsWith('data: ')) {
                try {
                  const jsonStr = line.trim().slice(6);
                  if (jsonStr) {
                    const data = JSON.parse(jsonStr);
                    console.log('Received streaming data:', data);
                    
                    if (data.chunk) {
                      // 실시간으로 chunk 추가
                      addChunkToStory(data.chunk);
                      // 작은 지연으로 자연스러운 효과
                      await new Promise(resolve => setTimeout(resolve, 50));
                    }
                    if (data.session_id && !receivedSessionId) {
                      receivedSessionId = data.session_id;
                    }
                    if (data.done) {
                      setSessionId(receivedSessionId);
                      setTurn(1);
                      setGameState('playing');
                      break;
                    }
                  }
                } catch (e) {
                  console.log('JSON parse error:', e, 'for line:', line);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch (error) {
      console.error('Error starting story:', error);
      setCurrentStory('스토리 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const makeChoice = async (choice?: number) => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setCurrentStory('');
    
    try {
      const response = await fetch('/api/games/story/continue/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          choice: choice,
          custom_action: choice ? undefined : customAction
        })
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.chunk) {
                    // 실시간으로 chunk 추가
                    addChunkToStory(data.chunk);
                    // 작은 지연으로 자연스러운 효과
                    await new Promise(resolve => setTimeout(resolve, 50));
                  }
                  if (data.done) {
                    setTurn(prev => prev + 1);
                    if (!choice) setCustomAction('');
                  }
                } catch (e) {
                  // JSON 파싱 에러 무시
                }
              }
            }
          }
        }
      } else {
        console.error('Failed to continue story');
      }
    } catch (error) {
      console.error('Error continuing story:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const restartStory = () => {
    setGameState('setup');
    setCurrentStory('');
    setSessionId('');
    setTurn(0);
    setCustomAction('');
  };

  if (gameState === 'setup') {
    return (
      <div className={`flex flex-col h-screen max-w-4xl mx-auto transition-colors ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`border-b p-4 flex items-center justify-between ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Wand2 className="w-6 h-6 text-purple-500" />
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              AI 스토리 어드벤처
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Game Description */}
            <div className={`p-6 rounded-xl ${
              darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-purple-50 to-blue-50'
            }`}>
              <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                나만의 모험 이야기를 시작하세요!
              </h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                AI가 생성하는 인터랙티브 스토리에서 주인공이 되어 선택을 통해 이야기를 이끌어가세요.
              </p>
            </div>

            {/* Genre Selection */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                장르 선택
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => setSelectedGenre(genre.id)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      selectedGenre === genre.id
                        ? darkMode
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-100 text-purple-900 ring-2 ring-purple-500'
                        : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold">{genre.name}</div>
                    <div className={`text-sm ${
                      selectedGenre === genre.id
                        ? darkMode ? 'text-purple-200' : 'text-purple-700'
                        : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {genre.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                AI 모델 선택
              </h3>
              <div className="space-y-2">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedModel === model.id
                        ? darkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 text-blue-900 ring-2 ring-blue-500'
                        : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startNewStory}
              disabled={isLoading}
              className={`w-full p-4 rounded-xl font-semibold transition-all ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : darkMode
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
              }`}
            >
              {isLoading ? '스토리 생성 중...' : '모험 시작!'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen max-w-4xl mx-auto transition-colors ${
      darkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Header */}
      <div className={`border-b p-4 flex items-center justify-between ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={restartStory}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Wand2 className="w-6 h-6 text-purple-500" />
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              AI 스토리 어드벤처
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Turn {turn} • {genres.find(g => g.id === selectedGenre)?.name}
            </p>
          </div>
        </div>
        <button
          onClick={onBack}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            darkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          메인으로
        </button>
      </div>

      {/* Story Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className={`p-6 rounded-xl mb-6 ${
            darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'
          }`}>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <span className={`ml-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  스토리 생성 중...
                </span>
              </div>
            ) : (
              <div className={`prose max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                <div className="whitespace-pre-line">
                  {currentStory}
                </div>
              </div>
            )}
          </div>

          {!isLoading && currentStory && (
            <div className="space-y-4">
              {/* Choice Buttons */}
              <div className="grid grid-cols-1 gap-3">
                {[1, 2, 3].map((choice) => (
                  <button
                    key={choice}
                    onClick={() => makeChoice(choice)}
                    className={`p-4 rounded-lg text-left transition-all ${
                      darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    선택 {choice}
                  </button>
                ))}
              </div>

              {/* Custom Action */}
              <div className={`p-4 rounded-xl ${
                darkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  또는 직접 행동을 입력하세요:
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={customAction}
                    onChange={(e) => setCustomAction(e.target.value)}
                    placeholder="어떤 행동을 취하시겠습니까?"
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      darkMode
                        ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                        : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                    } border focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && customAction.trim()) {
                        makeChoice();
                      }
                    }}
                  />
                  <button
                    onClick={() => makeChoice()}
                    disabled={!customAction.trim()}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      !customAction.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : darkMode
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { StoryAdventure };