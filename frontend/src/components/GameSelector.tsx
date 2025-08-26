import React from 'react';
import { MessageSquare, BookOpen, Search, Moon, Sun, Gamepad2, Puzzle, Users, Timer } from 'lucide-react';

interface GameSelectorProps {
  darkMode: boolean;
  onSelectMode: (mode: 'games' | 'chat' | 'story' | 'mystery' | 'minigames' | 'cooperative' | 'timeattack') => void;
  onToggleDarkMode: () => void;
}

export const GameSelector: React.FC<GameSelectorProps> = ({ 
  darkMode, 
  onSelectMode, 
  onToggleDarkMode 
}) => {
  const games = [
    {
      id: 'chat',
      title: 'AI 채팅',
      description: '멀티 AI 모델과의 실시간 채팅',
      icon: MessageSquare,
      color: 'blue',
      features: ['4개 AI 모델 지원', '실시간 스트리밍', '다크모드', '메시지 복사']
    },
    {
      id: 'story',
      title: '스토리 어드벤처',
      description: 'AI가 생성하는 무한한 인터랙티브 스토리',
      icon: BookOpen,
      color: 'purple',
      features: ['6가지 장르', '선택지 기반 진행', '커스텀 액션', '무한 분기']
    },
    {
      id: 'mystery',
      title: '추리 게임',
      description: 'AI가 만든 미스터리 사건을 해결하는 추리 게임',
      icon: Search,
      color: 'green',
      features: ['3단계 난이도', '질문 기반 수사', '논리적 추리', '매번 다른 사건']
    },
    {
      id: 'minigames',
      title: '미니 게임',
      description: '간단하고 재미있는 퍼즐과 퀴즈 게임 모음',
      icon: Puzzle,
      color: 'orange',
      features: ['단어 퍼즐', '수학 퀴즈', '기억력 게임', '점수 기록']
    },
    {
      id: 'cooperative',
      title: '협력 스토리',
      description: 'AI와 함께 만들어가는 실시간 협력 스토리',
      icon: Users,
      color: 'indigo',
      features: ['AI 협력', 'WebSocket 실시간', '방 생성/참가', '장르 선택']
    },
    {
      id: 'timeattack',
      title: '타임어택 추리',
      description: '시간 제한 내에 미스터리를 해결하는 스릴 넘치는 게임',
      icon: Timer,
      color: 'red',
      features: ['시간 제한', '점수 시스템', '난이도 선택', '시간 보너스']
    }
  ];

  const getColorClasses = (color: string, isHover: boolean = false) => {
    const baseClasses = {
      blue: {
        bg: darkMode ? 'bg-blue-900/20' : 'bg-blue-50',
        border: 'border-blue-500',
        text: darkMode ? 'text-blue-300' : 'text-blue-600',
        hover: darkMode ? 'hover:bg-blue-900/30' : 'hover:bg-blue-100'
      },
      purple: {
        bg: darkMode ? 'bg-purple-900/20' : 'bg-purple-50',
        border: 'border-purple-500',
        text: darkMode ? 'text-purple-300' : 'text-purple-600',
        hover: darkMode ? 'hover:bg-purple-900/30' : 'hover:bg-purple-100'
      },
      green: {
        bg: darkMode ? 'bg-green-900/20' : 'bg-green-50',
        border: 'border-green-500',
        text: darkMode ? 'text-green-300' : 'text-green-600',
        hover: darkMode ? 'hover:bg-green-900/30' : 'hover:bg-green-100'
      },
      orange: {
        bg: darkMode ? 'bg-orange-900/20' : 'bg-orange-50',
        border: 'border-orange-500',
        text: darkMode ? 'text-orange-300' : 'text-orange-600',
        hover: darkMode ? 'hover:bg-orange-900/30' : 'hover:bg-orange-100'
      },
      indigo: {
        bg: darkMode ? 'bg-indigo-900/20' : 'bg-indigo-50',
        border: 'border-indigo-500',
        text: darkMode ? 'text-indigo-300' : 'text-indigo-600',
        hover: darkMode ? 'hover:bg-indigo-900/30' : 'hover:bg-indigo-100'
      },
      red: {
        bg: darkMode ? 'bg-red-900/20' : 'bg-red-50',
        border: 'border-red-500',
        text: darkMode ? 'text-red-300' : 'text-red-600',
        hover: darkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-100'
      }
    };
    return baseClasses[color as keyof typeof baseClasses];
  };

  return (
    <div className={`min-h-screen transition-colors ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`border-b p-4 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-indigo-500" />
            <h1 className={`text-2xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              AI 게임 센터
            </h1>
          </div>
          
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title={darkMode ? '라이트 모드' : '다크 모드'}
          >
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className={`text-4xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            AI와 함께하는 즐거운 경험
          </h2>
          <p className={`text-xl ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            다양한 AI 서비스를 체험해보세요
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game) => {
            const colorClasses = getColorClasses(game.color);
            const Icon = game.icon;
            
            return (
              <button
                key={game.id}
                onClick={() => onSelectMode(game.id as any)}
                className={`p-6 rounded-xl border-2 transition-all duration-300 text-left group ${
                  colorClasses.bg
                } ${colorClasses.border} ${colorClasses.hover} hover:scale-105 hover:shadow-xl`}
              >
                {/* Icon and Title */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
                    <Icon className={`w-8 h-8 ${colorClasses.text}`} />
                  </div>
                  <h3 className={`text-xl font-bold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {game.title}
                  </h3>
                </div>

                {/* Description */}
                <p className={`text-sm mb-4 leading-relaxed ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {game.description}
                </p>

                {/* Features */}
                <div className="space-y-2">
                  <h4 className={`font-semibold text-sm ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    주요 기능:
                  </h4>
                  <ul className="space-y-1">
                    {game.features.map((feature, index) => (
                      <li key={index} className={`text-xs flex items-center gap-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          colorClasses.text.includes('blue') ? 'bg-blue-500' :
                          colorClasses.text.includes('purple') ? 'bg-purple-500' :
                          colorClasses.text.includes('green') ? 'bg-green-500' :
                          colorClasses.text.includes('orange') ? 'bg-orange-500' :
                          colorClasses.text.includes('indigo') ? 'bg-indigo-500' :
                          colorClasses.text.includes('red') ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Hover Effect */}
                <div className={`mt-4 text-sm font-semibold transition-colors ${
                  colorClasses.text
                } opacity-0 group-hover:opacity-100`}>
                  클릭하여 시작하기 →
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className={`mt-16 text-center p-8 rounded-xl ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h3 className={`text-lg font-semibold mb-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            🚀 AI 서비스 특징
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className={`font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                실시간 응답
              </h4>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                모든 AI 상호작용이 실시간으로 이루어집니다
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🎯</div>
              <h4 className={`font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                멀티 AI 모델
              </h4>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                OpenAI, Claude, DeepSeek 등 다양한 AI 활용
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🎮</div>
              <h4 className={`font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                무한한 가능성
              </h4>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                AI가 생성하는 매번 다른 경험을 즐기세요
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};