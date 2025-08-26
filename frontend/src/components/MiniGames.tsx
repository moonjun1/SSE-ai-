import React, { useState, useEffect } from 'react';
import { ArrowLeft, Brain, Clock, Trophy, Shuffle } from 'lucide-react';

interface MiniGamesProps {
  onBack: () => void;
  darkMode: boolean;
}

type GameType = 'word-puzzle' | 'math-quiz' | 'memory-game' | 'riddle';

interface WordPuzzleState {
  word: string;
  scrambled: string;
  userInput: string;
  isCorrect: boolean | null;
}

interface MathQuizState {
  question: string;
  answer: number;
  userAnswer: string;
  isCorrect: boolean | null;
}

interface MemoryGameState {
  sequence: number[];
  userSequence: number[];
  currentStep: number;
  showSequence: boolean;
  gameOver: boolean;
  level: number;
}

export const MiniGames: React.FC<MiniGamesProps> = ({ onBack, darkMode }) => {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameActive, setIsGameActive] = useState(false);

  // Word Puzzle State
  const [wordPuzzle, setWordPuzzle] = useState<WordPuzzleState>({
    word: '',
    scrambled: '',
    userInput: '',
    isCorrect: null
  });

  // Math Quiz State
  const [mathQuiz, setMathQuiz] = useState<MathQuizState>({
    question: '',
    answer: 0,
    userAnswer: '',
    isCorrect: null
  });

  // Memory Game State
  const [memoryGame, setMemoryGame] = useState<MemoryGameState>({
    sequence: [],
    userSequence: [],
    currentStep: 0,
    showSequence: false,
    gameOver: false,
    level: 1
  });

  const games = [
    {
      id: 'word-puzzle' as GameType,
      name: '단어 퍼즐',
      desc: '뒤섞인 단어를 맞춰보세요',
      icon: Brain,
      color: 'purple'
    },
    {
      id: 'math-quiz' as GameType,
      name: '수학 퀴즈',
      desc: '빠른 계산 실력을 테스트해보세요',
      icon: Clock,
      color: 'blue'
    },
    {
      id: 'memory-game' as GameType,
      name: '기억력 게임',
      desc: '패턴을 기억하고 따라하세요',
      icon: Trophy,
      color: 'green'
    }
  ];

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsGameActive(false);
    }
    return () => clearInterval(interval);
  }, [isGameActive, timeLeft]);

  // Word Puzzle Functions
  const generateWordPuzzle = () => {
    const words = ['프로그래밍', '컴퓨터', '개발자', '인공지능', '데이터베이스', '알고리즘', '웹사이트', '소프트웨어'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const scrambled = randomWord.split('').sort(() => Math.random() - 0.5).join('');
    
    setWordPuzzle({
      word: randomWord,
      scrambled: scrambled,
      userInput: '',
      isCorrect: null
    });
  };

  const checkWordPuzzle = () => {
    const isCorrect = wordPuzzle.userInput === wordPuzzle.word;
    setWordPuzzle(prev => ({ ...prev, isCorrect }));
    
    if (isCorrect) {
      setScore(prev => prev + 10);
      setTimeout(() => {
        generateWordPuzzle();
      }, 1500);
    }
  };

  // Math Quiz Functions
  const generateMathQuiz = () => {
    const operations = ['+', '-', '*'];
    const op = operations[Math.floor(Math.random() * operations.length)];
    
    let a, b, answer;
    switch (op) {
      case '+':
        a = Math.floor(Math.random() * 50) + 1;
        b = Math.floor(Math.random() * 50) + 1;
        answer = a + b;
        break;
      case '-':
        a = Math.floor(Math.random() * 50) + 25;
        b = Math.floor(Math.random() * 25) + 1;
        answer = a - b;
        break;
      case '*':
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
        answer = a * b;
        break;
      default:
        a = b = answer = 0;
    }

    setMathQuiz({
      question: `${a} ${op} ${b} = ?`,
      answer: answer,
      userAnswer: '',
      isCorrect: null
    });
  };

  const checkMathQuiz = () => {
    const isCorrect = parseInt(mathQuiz.userAnswer) === mathQuiz.answer;
    setMathQuiz(prev => ({ ...prev, isCorrect }));
    
    if (isCorrect) {
      setScore(prev => prev + 5);
      setTimeout(() => {
        generateMathQuiz();
      }, 1000);
    }
  };

  // Memory Game Functions
  const startMemoryGame = () => {
    const newSequence = Array.from({ length: memoryGame.level + 2 }, () => 
      Math.floor(Math.random() * 4)
    );
    
    setMemoryGame(prev => ({
      ...prev,
      sequence: newSequence,
      userSequence: [],
      currentStep: 0,
      showSequence: true,
      gameOver: false
    }));

    // Show sequence for a few seconds
    setTimeout(() => {
      setMemoryGame(prev => ({ ...prev, showSequence: false }));
    }, (newSequence.length + 1) * 1000);
  };

  const handleMemoryClick = (index: number) => {
    if (memoryGame.showSequence || memoryGame.gameOver) return;

    const newUserSequence = [...memoryGame.userSequence, index];
    const currentStep = newUserSequence.length - 1;
    
    if (newUserSequence[currentStep] !== memoryGame.sequence[currentStep]) {
      // Wrong - Game Over
      setMemoryGame(prev => ({ ...prev, gameOver: true, userSequence: newUserSequence }));
      return;
    }

    setMemoryGame(prev => ({ ...prev, userSequence: newUserSequence }));

    if (newUserSequence.length === memoryGame.sequence.length) {
      // Level Complete
      setScore(prev => prev + memoryGame.level * 5);
      setTimeout(() => {
        setMemoryGame(prev => ({ 
          ...prev, 
          level: prev.level + 1,
          userSequence: [],
          currentStep: 0
        }));
        startMemoryGame();
      }, 1000);
    }
  };

  const startGame = (gameType: GameType) => {
    setSelectedGame(gameType);
    setScore(0);
    setTimeLeft(60);
    setIsGameActive(true);

    switch (gameType) {
      case 'word-puzzle':
        generateWordPuzzle();
        break;
      case 'math-quiz':
        generateMathQuiz();
        break;
      case 'memory-game':
        startMemoryGame();
        break;
    }
  };

  const resetGame = () => {
    setSelectedGame(null);
    setIsGameActive(false);
    setScore(0);
    setTimeLeft(60);
  };

  if (selectedGame) {
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
              onClick={resetGame}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              {selectedGame === 'word-puzzle' && <Brain className="w-6 h-6 text-purple-500" />}
              {selectedGame === 'math-quiz' && <Clock className="w-6 h-6 text-blue-500" />}
              {selectedGame === 'memory-game' && <Trophy className="w-6 h-6 text-green-500" />}
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {games.find(g => g.id === selectedGame)?.name}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              점수: <span className="text-green-500 font-bold">{score}</span>
            </div>
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              시간: <span className={timeLeft <= 10 ? 'text-red-500' : 'text-blue-500'}>{timeLeft}s</span>
            </div>
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            {selectedGame === 'word-puzzle' && (
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-purple-50'}`}>
                <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  뒤섞인 글자를 올바른 단어로 만드세요!
                </h2>
                
                <div className="text-center mb-6">
                  <div className={`text-3xl font-mono mb-4 p-4 rounded-lg ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                  }`}>
                    {wordPuzzle.scrambled}
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <input
                      type="text"
                      value={wordPuzzle.userInput}
                      onChange={(e) => setWordPuzzle(prev => ({ ...prev, userInput: e.target.value, isCorrect: null }))}
                      onKeyPress={(e) => e.key === 'Enter' && checkWordPuzzle()}
                      className={`px-4 py-2 rounded-lg text-center text-xl ${
                        darkMode 
                          ? 'bg-gray-700 text-white border-gray-600' 
                          : 'bg-white text-gray-900 border-gray-300'
                      } border-2 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      placeholder="답을 입력하세요"
                      disabled={!isGameActive}
                    />
                    <button
                      onClick={checkWordPuzzle}
                      disabled={!isGameActive || !wordPuzzle.userInput.trim()}
                      className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      확인
                    </button>
                  </div>
                  
                  {wordPuzzle.isCorrect === true && (
                    <div className="mt-4 text-green-500 font-bold text-lg">정답! 🎉</div>
                  )}
                  {wordPuzzle.isCorrect === false && (
                    <div className="mt-4 text-red-500 font-bold text-lg">틀렸습니다. 다시 시도해보세요!</div>
                  )}
                </div>
              </div>
            )}

            {selectedGame === 'math-quiz' && (
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
                <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  빠른 계산!
                </h2>
                
                <div className="text-center">
                  <div className={`text-4xl font-mono mb-6 p-6 rounded-lg ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                  }`}>
                    {mathQuiz.question}
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <input
                      type="number"
                      value={mathQuiz.userAnswer}
                      onChange={(e) => setMathQuiz(prev => ({ ...prev, userAnswer: e.target.value, isCorrect: null }))}
                      onKeyPress={(e) => e.key === 'Enter' && checkMathQuiz()}
                      className={`px-4 py-2 rounded-lg text-center text-xl ${
                        darkMode 
                          ? 'bg-gray-700 text-white border-gray-600' 
                          : 'bg-white text-gray-900 border-gray-300'
                      } border-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="답"
                      disabled={!isGameActive}
                    />
                    <button
                      onClick={checkMathQuiz}
                      disabled={!isGameActive || !mathQuiz.userAnswer}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      확인
                    </button>
                  </div>
                  
                  {mathQuiz.isCorrect === true && (
                    <div className="mt-4 text-green-500 font-bold text-lg">정답! 🎉</div>
                  )}
                  {mathQuiz.isCorrect === false && (
                    <div className="mt-4 text-red-500 font-bold text-lg">틀렸습니다!</div>
                  )}
                </div>
              </div>
            )}

            {selectedGame === 'memory-game' && (
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-green-50'}`}>
                <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  기억력 게임 - 레벨 {memoryGame.level}
                </h2>
                
                <div className="text-center mb-6">
                  {memoryGame.showSequence ? (
                    <div className="text-lg text-blue-500 font-semibold">패턴을 기억하세요...</div>
                  ) : memoryGame.gameOver ? (
                    <div className="space-y-4">
                      <div className="text-lg text-red-500 font-semibold">게임 오버!</div>
                      <button
                        onClick={() => startMemoryGame()}
                        className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        다시 시작
                      </button>
                    </div>
                  ) : (
                    <div className="text-lg text-green-500 font-semibold">패턴을 클릭하세요!</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                  {[0, 1, 2, 3].map((index) => (
                    <button
                      key={index}
                      onClick={() => handleMemoryClick(index)}
                      className={`w-24 h-24 rounded-lg font-bold text-white transition-all transform ${
                        memoryGame.showSequence && memoryGame.sequence[memoryGame.userSequence.length] === index
                          ? 'bg-yellow-400 scale-110'
                          : index === 0 ? 'bg-red-500 hover:bg-red-600'
                          : index === 1 ? 'bg-blue-500 hover:bg-blue-600'
                          : index === 2 ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-purple-500 hover:bg-purple-600'
                      } ${!isGameActive || memoryGame.showSequence || memoryGame.gameOver ? 'cursor-not-allowed opacity-70' : 'hover:scale-105'}`}
                      disabled={!isGameActive || memoryGame.showSequence || memoryGame.gameOver}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen max-w-6xl mx-auto transition-colors ${
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
          <Shuffle className="w-6 h-6 text-indigo-500" />
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            미니게임
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="text-center mb-8">
          <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            두뇌 훈련 미니게임
          </h2>
          <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            다양한 미니게임으로 두뇌를 단련해보세요!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {games.map((game) => {
            const Icon = game.icon;
            return (
              <button
                key={game.id}
                onClick={() => startGame(game.id)}
                className={`p-6 rounded-xl border-2 transition-all duration-300 text-left group ${
                  game.color === 'purple' 
                    ? darkMode ? 'bg-purple-900/20 border-purple-500 hover:bg-purple-900/30' : 'bg-purple-50 border-purple-500 hover:bg-purple-100'
                    : game.color === 'blue'
                    ? darkMode ? 'bg-blue-900/20 border-blue-500 hover:bg-blue-900/30' : 'bg-blue-50 border-blue-500 hover:bg-blue-100'
                    : darkMode ? 'bg-green-900/20 border-green-500 hover:bg-green-900/30' : 'bg-green-50 border-green-500 hover:bg-green-100'
                } hover:scale-105 hover:shadow-xl`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${
                    game.color === 'purple' ? 'bg-purple-100' : 
                    game.color === 'blue' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <Icon className={`w-8 h-8 ${
                      game.color === 'purple' ? 'text-purple-600' :
                      game.color === 'blue' ? 'text-blue-600' : 'text-green-600'
                    }`} />
                  </div>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {game.name}
                  </h3>
                </div>

                <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {game.desc}
                </p>

                <div className={`mt-4 text-sm font-semibold transition-colors ${
                  game.color === 'purple' ? 'text-purple-600' :
                  game.color === 'blue' ? 'text-blue-600' : 'text-green-600'
                } opacity-0 group-hover:opacity-100`}>
                  게임 시작하기 →
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};