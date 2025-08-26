import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { ArrowLeft, Search, Timer, Zap, Clock, Trophy, AlertTriangle, Send } from 'lucide-react';

interface TimeAttackMysteryProps {
  onBack: () => void;
  darkMode: boolean;
}

interface CaseData {
  session_id: string;
  case_title: string;
  case_description: string;
  location: string;
  victim: string;
  suspects: Array<{
    name: string;
    description: string;
    alibi: string;
  }>;
  max_questions: number;
  difficulty: string;
}

interface QuestionResponse {
  answer: string;
  question_count: number;
  max_questions: number;
  new_clue?: any;
  total_clues_found: number;
}

const TimeAttackMystery: React.FC<TimeAttackMysteryProps> = ({ onBack, darkMode }) => {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'solved' | 'failed'>('setup');
  const [selectedDifficulty, setSelectedDifficulty] = useState('normal');
  const [selectedModel, setSelectedModel] = useState('openai-gpt3.5');
  const [selectedTimeLimit, setSelectedTimeLimit] = useState(300); // 5분 기본값
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [conversation, setConversation] = useState<Array<{question: string, answer: string}>>([]);
  const [accusedSuspect, setAccusedSuspect] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [gameResult, setGameResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(0);
  const [isStreamingAnswer, setIsStreamingAnswer] = useState(false);

  const difficulties = [
    { id: 'easy', name: '초급', desc: '3명의 용의자, 단순한 사건', timeBonus: 0 },
    { id: 'normal', name: '중급', desc: '4명의 용의자, 적당한 복잡성', timeBonus: -60 },
    { id: 'hard', name: '고급', desc: '5명의 용의자, 복잡한 사건', timeBonus: -120 }
  ];

  const models = [
    { id: 'openai-gpt3.5', name: 'GPT-3.5 Turbo' },
    { id: 'openai-gpt4', name: 'GPT-4' },
    { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' }
  ];

  const timeLimits = [
    { seconds: 180, label: '3분 - 초고속', color: 'red' },
    { seconds: 300, label: '5분 - 고속', color: 'orange' },
    { seconds: 480, label: '8분 - 보통', color: 'yellow' },
    { seconds: 600, label: '10분 - 여유', color: 'green' }
  ];

  // 타이머 관리
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('failed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState, timeLeft]);

  const startNewCase = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/games/mystery/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty: selectedDifficulty,
          model: selectedModel
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCaseData(data);
        setGameState('playing');
        const adjustedTime = selectedTimeLimit + (difficulties.find(d => d.id === selectedDifficulty)?.timeBonus || 0);
        setTimeLeft(adjustedTime);
        setGameStartTime(Date.now());
        setConversation([]);
      } else {
        console.error('Failed to start case');
      }
    } catch (error) {
      console.error('Error starting case:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!currentQuestion.trim() || !caseData || isStreamingAnswer) return;
    
    setIsStreamingAnswer(true);
    const question = currentQuestion;
    setCurrentQuestion('');
    
    // 질문을 먼저 대화에 추가
    const newConversation = [...conversation, { question, answer: '' }];
    setConversation(newConversation);
    
    try {
      const response = await fetch('/api/games/mystery/question/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: caseData.session_id,
          question: question
        })
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        let accumulatedAnswer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  accumulatedAnswer += data.content;
                  
                  flushSync(() => {
                    setConversation(prev => {
                      const updated = [...prev];
                      if (updated.length > 0) {
                        updated[updated.length - 1] = {
                          ...updated[updated.length - 1],
                          answer: accumulatedAnswer
                        };
                      }
                      return updated;
                    });
                  });
                } else if (data.question_count !== undefined) {
                  // 질문 완료 처리
                  if (data.question_count >= data.max_questions) {
                    // 질문 한계에 도달하면 추리 단계로 이동
                    setTimeout(() => {
                      setGameState('solved');
                    }, 1000);
                  }
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error asking question:', error);
    } finally {
      setIsStreamingAnswer(false);
    }
  };

  const submitAccusation = async () => {
    if (!accusedSuspect || !reasoning.trim() || !caseData) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/games/mystery/accuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: caseData.session_id,
          accused_suspect: accusedSuspect,
          reasoning: reasoning
        })
      });

      if (response.ok) {
        const result = await response.json();
        const timeTaken = Math.floor((Date.now() - gameStartTime) / 1000);
        const timeBonus = Math.max(0, timeLeft * 10);
        
        setGameResult({
          ...result,
          time_taken: timeTaken,
          time_left: timeLeft,
          time_bonus: timeBonus,
          total_score: (result.correct ? 1000 : 0) + timeBonus + (result.clue_bonus || 0)
        });
        setGameState(result.correct ? 'solved' : 'failed');
      }
    } catch (error) {
      console.error('Error submitting accusation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft > 60) return darkMode ? 'text-green-400' : 'text-green-600';
    if (timeLeft > 30) return darkMode ? 'text-yellow-400' : 'text-yellow-600';
    return 'text-red-500';
  };

  if (gameState === 'setup') {
    return (
      <div className={`flex flex-col h-screen max-w-4xl mx-auto transition-colors ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
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
            <Timer className="w-6 h-6 text-red-500" />
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              타임어택 추리게임
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className={`p-6 rounded-xl ${
              darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-red-50 to-orange-50'
            }`}>
              <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ⏰ 시간과의 싸움!
              </h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                제한 시간 내에 미스터리 사건을 해결하세요. 빠르게 해결할수록 더 높은 점수를 획득합니다!
              </p>
            </div>

            {/* Time Limit Selection */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                시간 제한 선택
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {timeLimits.map((timeLimit) => (
                  <button
                    key={timeLimit.seconds}
                    onClick={() => setSelectedTimeLimit(timeLimit.seconds)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      selectedTimeLimit === timeLimit.seconds
                        ? timeLimit.color === 'red'
                          ? darkMode ? 'bg-red-600 text-white' : 'bg-red-100 text-red-900 ring-2 ring-red-500'
                        : timeLimit.color === 'orange'
                          ? darkMode ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-900 ring-2 ring-orange-500'
                        : timeLimit.color === 'yellow'
                          ? darkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-900 ring-2 ring-yellow-500'
                        : darkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-900 ring-2 ring-green-500'
                        : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span className="font-semibold">{timeLimit.label}</span>
                    </div>
                    <div className={`text-sm mt-1 ${
                      selectedTimeLimit === timeLimit.seconds
                        ? timeLimit.color === 'red' ? darkMode ? 'text-red-200' : 'text-red-700'
                        : timeLimit.color === 'orange' ? darkMode ? 'text-orange-200' : 'text-orange-700'
                        : timeLimit.color === 'yellow' ? darkMode ? 'text-yellow-200' : 'text-yellow-700'
                        : darkMode ? 'text-green-200' : 'text-green-700'
                        : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {timeLimit.color === 'red' && '⚡ 최고 난이도'}
                      {timeLimit.color === 'orange' && '🔥 고난이도'}
                      {timeLimit.color === 'yellow' && '⚖️ 균형잡힌'}
                      {timeLimit.color === 'green' && '🛡️ 안전한'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                사건 난이도
              </h3>
              <div className="space-y-2">
                {difficulties.map((difficulty) => (
                  <button
                    key={difficulty.id}
                    onClick={() => setSelectedDifficulty(difficulty.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedDifficulty === difficulty.id
                        ? darkMode
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-100 text-purple-900 ring-2 ring-purple-500'
                        : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{difficulty.name}</div>
                        <div className={`text-sm ${
                          selectedDifficulty === difficulty.id
                            ? darkMode ? 'text-purple-200' : 'text-purple-700'
                            : darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {difficulty.desc}
                        </div>
                      </div>
                      {difficulty.timeBonus !== 0 && (
                        <div className={`text-sm font-mono ${
                          difficulty.timeBonus > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {difficulty.timeBonus > 0 ? '+' : ''}{difficulty.timeBonus}초
                        </div>
                      )}
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
              onClick={startNewCase}
              disabled={isLoading}
              className={`w-full p-4 rounded-xl font-semibold transition-all ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : darkMode
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700'
                  : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600'
              }`}
            >
              {isLoading ? '사건 생성 중...' : (
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  타임어택 시작!
                </div>
              )}
            </button>

            {/* Game Rules */}
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
              <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                🎯 게임 규칙
              </h4>
              <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>• 제한 시간 내에 사건을 해결해야 합니다</li>
                <li>• 빠르게 해결할수록 시간 보너스가 더 높습니다</li>
                <li>• 난이도가 높을수록 시간이 줄어들지만 기본 점수가 높습니다</li>
                <li>• 시간이 부족하면 게임이 실패로 종료됩니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div className={`flex flex-col h-screen max-w-4xl mx-auto transition-colors ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className={`border-b p-4 flex items-center justify-between ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <Timer className="w-6 h-6 text-red-500" />
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {caseData?.case_title}
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {caseData?.location} • 질문 {conversation.length}/{caseData?.max_questions}
              </p>
            </div>
          </div>
          
          <div className={`flex items-center gap-4`}>
            <div className={`text-2xl font-bold font-mono ${getTimeColor()}`}>
              {formatTime(timeLeft)}
            </div>
            <div className={`w-4 h-4 rounded-full animate-pulse ${
              timeLeft > 60 ? 'bg-green-500' : timeLeft > 30 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Case Info */}
            <div className={`p-6 rounded-xl ${
              darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'
            }`}>
              <h2 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                📋 사건 정보
              </h2>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {caseData?.case_description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    피해자: 
                  </span>
                  <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {caseData?.victim}
                  </span>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    위치: 
                  </span>
                  <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {caseData?.location}
                  </span>
                </div>
              </div>

              <h3 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                용의자 목록:
              </h3>
              <div className="space-y-2">
                {caseData?.suspects.map((suspect, index) => (
                  <div key={index} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {suspect.name}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {suspect.description}
                    </div>
                    <div className={`text-sm italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      알리바이: {suspect.alibi}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversation */}
            {conversation.length > 0 && (
              <div className={`p-6 rounded-xl ${
                darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'
              }`}>
                <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  🔍 수사 기록
                </h2>
                <div className="space-y-4 max-h-96 overflow-auto">
                  {conversation.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Search className="w-4 h-4 text-blue-500" />
                          <span className={`font-semibold text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                            질문 #{index + 1}
                          </span>
                        </div>
                        <p className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{item.question}</p>
                      </div>
                      {item.answer && (
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <span className={`font-semibold text-sm ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                              답변
                            </span>
                          </div>
                          <p className={`whitespace-pre-line ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Question Input */}
            {conversation.length < (caseData?.max_questions || 0) && (
              <div className={`p-6 rounded-xl ${
                darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'
              }`}>
                <h3 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  💬 질문하기
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    placeholder="수사를 위한 질문을 입력하세요..."
                    disabled={isStreamingAnswer}
                    className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
                      darkMode
                        ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                        : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                    } border focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isStreamingAnswer ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && currentQuestion.trim() && !isStreamingAnswer) {
                        askQuestion();
                      }
                    }}
                  />
                  <button
                    onClick={askQuestion}
                    disabled={!currentQuestion.trim() || isStreamingAnswer}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      !currentQuestion.trim() || isStreamingAnswer
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : darkMode
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    {isStreamingAnswer ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        답변 중...
                      </div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  남은 질문: {(caseData?.max_questions || 0) - conversation.length}개
                </div>
              </div>
            )}

            {/* Accusation Section */}
            {conversation.length >= (caseData?.max_questions || 0) && (
              <div className={`p-6 rounded-xl ${
                darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-sm'
              }`}>
                <h3 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  ⚖️ 최종 추리
                </h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  모든 질문을 완료했습니다. 이제 범인을 지목하고 추리를 제시하세요.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      범인 지목
                    </label>
                    <select
                      value={accusedSuspect}
                      onChange={(e) => setAccusedSuspect(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg ${
                        darkMode
                          ? 'bg-gray-700 text-white border-gray-600'
                          : 'bg-white text-gray-900 border-gray-300'
                      } border focus:ring-2 focus:ring-red-500`}
                    >
                      <option value="">범인을 선택하세요</option>
                      {caseData?.suspects.map((suspect) => (
                        <option key={suspect.name} value={suspect.name}>
                          {suspect.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      추리 근거
                    </label>
                    <textarea
                      value={reasoning}
                      onChange={(e) => setReasoning(e.target.value)}
                      placeholder="범인을 지목하는 이유와 증거를 설명해주세요..."
                      className={`w-full px-4 py-3 rounded-lg h-32 ${
                        darkMode
                          ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                          : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                      } border focus:ring-2 focus:ring-red-500 resize-none`}
                    />
                  </div>
                  
                  <button
                    onClick={submitAccusation}
                    disabled={!accusedSuspect || !reasoning.trim() || isLoading}
                    className={`w-full p-4 rounded-xl font-semibold transition-all ${
                      !accusedSuspect || !reasoning.trim() || isLoading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : darkMode
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    {isLoading ? '결과 처리 중...' : '최종 추리 제출'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Game Result Screen (solved or failed)
  return (
    <div className={`flex flex-col h-screen max-w-4xl mx-auto transition-colors ${
      darkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className={`border-b p-4 flex items-center justify-between ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <Timer className="w-6 h-6 text-red-500" />
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            게임 결과
          </h1>
        </div>
        <button
          onClick={() => setGameState('setup')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            darkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          다시 도전하기
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className={`p-8 rounded-xl text-center ${
            gameState === 'solved'
              ? darkMode ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'
              : darkMode ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="text-6xl mb-4">
              {gameState === 'solved' ? '🎉' : '⏰'}
            </div>
            
            <h2 className={`text-3xl font-bold mb-4 ${
              gameState === 'solved'
                ? darkMode ? 'text-green-400' : 'text-green-600'
                : darkMode ? 'text-red-400' : 'text-red-600'
            }`}>
              {gameState === 'solved' ? '사건 해결!' : '시간 종료!'}
            </h2>

            {gameState === 'failed' ? (
              <div className={`space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p className="text-lg">제한 시간이 종료되었습니다.</p>
                <p>다시 도전하여 더 빠르게 해결해보세요!</p>
              </div>
            ) : gameResult ? (
              <div className="space-y-6">
                <div className={`p-6 rounded-xl ${
                  gameResult.correct 
                    ? darkMode ? 'bg-green-900/30' : 'bg-green-100'
                    : darkMode ? 'bg-red-900/30' : 'bg-red-100'
                }`}>
                  <h3 className={`text-xl font-bold mb-2 ${
                    gameResult.correct
                      ? darkMode ? 'text-green-400' : 'text-green-700'
                      : darkMode ? 'text-red-400' : 'text-red-700'
                  }`}>
                    {gameResult.correct ? '✅ 정답!' : '❌ 오답'}
                  </h3>
                  
                  <p className={`mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong>실제 범인:</strong> {gameResult.actual_culprit}
                  </p>
                  
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <p className="whitespace-pre-line">{gameResult.explanation}</p>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    📊 점수 세부사항
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>기본 점수:</span>
                      <span className={`font-bold ${gameResult.correct ? 'text-green-500' : 'text-red-500'}`}>
                        {gameResult.correct ? '1000' : '0'}점
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>시간 보너스:</span>
                      <span className="font-bold text-blue-500">
                        +{gameResult.time_bonus || 0}점
                      </span>
                    </div>
                    
                    {gameResult.clue_bonus > 0 && (
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>단서 보너스:</span>
                        <span className="font-bold text-purple-500">
                          +{gameResult.clue_bonus}점
                        </span>
                      </div>
                    )}
                    
                    <hr className={`border-t ${darkMode ? 'border-gray-600' : 'border-gray-300'}`} />
                    
                    <div className="flex justify-between text-lg">
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        총점:
                      </span>
                      <span className="font-bold text-yellow-500">
                        {gameResult.total_score}점
                      </span>
                    </div>
                  </div>
                </div>

                {/* Time Stats */}
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatTime(gameResult.time_taken)}
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        소요 시간
                      </div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatTime(gameResult.time_left)}
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        남은 시간
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export { TimeAttackMystery };