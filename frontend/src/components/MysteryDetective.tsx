import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowLeft, Search, Users, HelpCircle } from 'lucide-react';

interface MysteryDetectiveProps {
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

const MysteryDetective: React.FC<MysteryDetectiveProps> = ({ onBack, darkMode }) => {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'solved'>('setup');
  const [selectedDifficulty, setSelectedDifficulty] = useState('normal');
  const [selectedModel, setSelectedModel] = useState('openai-gpt3.5');
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [conversation, setConversation] = useState<Array<{question: string, answer: string}>>([]);
  const [accusedSuspect, setAccusedSuspect] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [gameResult, setGameResult] = useState<any>(null);

  const difficulties = [
    { id: 'easy', name: '초급', desc: '3명의 용의자, 단순한 사건' },
    { id: 'normal', name: '중급', desc: '4명의 용의자, 적당한 복잡성' },
    { id: 'hard', name: '고급', desc: '5명의 용의자, 복잡한 사건' }
  ];

  const models = [
    { id: 'openai-gpt3.5', name: 'GPT-3.5 Turbo' },
    { id: 'openai-gpt4', name: 'GPT-4' },
    { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' }
  ];

  const createNewMystery = async () => {
    setIsLoading(true);
    const sessionId = Date.now().toString();
    
    try {
      const response = await fetch('/api/games/mystery/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          difficulty: selectedDifficulty,
          model: selectedModel
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCaseData(data);
        setGameState('playing');
      } else {
        console.error('Failed to create mystery');
      }
    } catch (error) {
      console.error('Error creating mystery:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!currentQuestion.trim() || !caseData) return;
    
    setIsLoading(true);
    const questionToAsk = currentQuestion;
    setCurrentQuestion('');
    
    // 질문을 대화목록에 즉시 추가하고 답변 자리를 만듦
    const questionIndex = conversation.length;
    setConversation(prev => [...prev, {
      question: questionToAsk,
      answer: ''
    }]);
    
    try {
      const response = await fetch('/api/games/mystery/question/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: caseData.session_id,
          question: questionToAsk
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
                    flushSync(() => {
                      setConversation(prev => {
                        const newConv = [...prev];
                        newConv[questionIndex] = {
                          ...newConv[questionIndex],
                          answer: newConv[questionIndex].answer + data.chunk
                        };
                        return newConv;
                      });
                    });
                    await new Promise(resolve => setTimeout(resolve, 20));
                  }
                } catch (e) {
                  // JSON 파싱 에러 무시
                }
              }
            }
          }
        }
      } else {
        console.error('Failed to ask question');
      }
    } catch (error) {
      console.error('Error asking question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const makeAccusation = async () => {
    if (!accusedSuspect.trim() || !reasoning.trim() || !caseData) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/games/mystery/accuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: caseData.session_id,
          accused_name: accusedSuspect,
          reasoning: reasoning
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGameResult(data);
        setGameState('solved');
      } else {
        console.error('Failed to make accusation');
      }
    } catch (error) {
      console.error('Error making accusation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const restartGame = () => {
    setGameState('setup');
    setCaseData(null);
    setConversation([]);
    setCurrentQuestion('');
    setAccusedSuspect('');
    setReasoning('');
    setGameResult(null);
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
            <Search className="w-6 h-6 text-blue-500" />
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              AI 추리 게임
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Game Description */}
            <div className={`p-6 rounded-xl ${
              darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-blue-50 to-indigo-50'
            }`}>
              <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                탐정이 되어 사건을 해결하세요!
              </h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                AI가 생성한 미스터리 사건을 질문을 통해 조사하고, 단서를 수집하여 범인을 찾아보세요.
              </p>
            </div>

            {/* Difficulty Selection */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                난이도 선택
              </h3>
              <div className="space-y-3">
                {difficulties.map((difficulty) => (
                  <button
                    key={difficulty.id}
                    onClick={() => setSelectedDifficulty(difficulty.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      selectedDifficulty === difficulty.id
                        ? darkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 text-blue-900 ring-2 ring-blue-500'
                        : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold">{difficulty.name}</div>
                    <div className={`text-sm ${
                      selectedDifficulty === difficulty.id
                        ? darkMode ? 'text-blue-200' : 'text-blue-700'
                        : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {difficulty.desc}
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
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-100 text-indigo-900 ring-2 ring-indigo-500'
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
              onClick={createNewMystery}
              disabled={isLoading}
              className={`w-full p-4 rounded-xl font-semibold transition-all ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : darkMode
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'
              }`}
            >
              {isLoading ? '사건 생성 중...' : '수사 시작!'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'solved') {
    return (
      <div className={`flex flex-col h-screen max-w-4xl mx-auto transition-colors ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className={`border-b p-4 flex items-center justify-between ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6 text-blue-500" />
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              수사 결과
            </h1>
          </div>
          <button
            onClick={restartGame}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            다시 하기
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className={`p-6 rounded-xl ${
              gameResult?.correct
                ? 'bg-green-100 border border-green-200'
                : 'bg-red-100 border border-red-200'
            }`}>
              <h2 className={`text-2xl font-bold mb-4 ${
                gameResult?.correct ? 'text-green-900' : 'text-red-900'
              }`}>
                {gameResult?.correct ? '축하합니다!' : '아쉽네요...'}
              </h2>
              <p className={`text-lg mb-4 ${
                gameResult?.correct ? 'text-green-800' : 'text-red-800'
              }`}>
                {gameResult?.message}
              </p>
              
              {gameResult?.solution && (
                <div className={`p-4 rounded-lg ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    정답 해설:
                  </h3>
                  <div className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <p><strong>범인:</strong> {gameResult.solution.culprit}</p>
                    <p><strong>수법:</strong> {gameResult.solution.method}</p>
                    <p><strong>추리:</strong> {gameResult.solution.reasoning}</p>
                  </div>
                </div>
              )}
            </div>
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
            onClick={restartGame}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Search className="w-6 h-6 text-blue-500" />
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {caseData?.case_title}
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {caseData?.difficulty} • 질문: {conversation.length}/{caseData?.max_questions}
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

      <div className="flex-1 flex gap-6 p-6">
        {/* Case Info Panel */}
        <div className="w-1/3 space-y-4">
          <div className={`p-4 rounded-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              사건 정보
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong className={darkMode ? 'text-gray-300' : 'text-gray-700'}>장소:</strong>
                <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {caseData?.location}
                </span>
              </div>
              <div>
                <strong className={darkMode ? 'text-gray-300' : 'text-gray-700'}>피해자:</strong>
                <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {caseData?.victim}
                </span>
              </div>
            </div>
            <p className={`mt-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {caseData?.case_description}
            </p>
          </div>

          <div className={`p-4 rounded-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Users className="w-5 h-5" />
              용의자들
            </h3>
            <div className="space-y-3">
              {caseData?.suspects.map((suspect, index) => (
                <div key={index} className={`p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {suspect.name}
                  </div>
                  <div className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {suspect.description}
                  </div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <strong>알리바이:</strong> {suspect.alibi}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Investigation Panel */}
        <div className="flex-1 flex flex-col">
          <div className={`flex-1 p-4 rounded-xl mb-4 overflow-auto ${
            darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <HelpCircle className="w-5 h-5" />
              질문과 답변
            </h3>
            <div className="space-y-4">
              {conversation.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className={`p-3 rounded-lg ${
                    darkMode ? 'bg-blue-900 bg-opacity-50' : 'bg-blue-50'
                  }`}>
                    <strong className={`${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>Q:</strong>
                    <span className={`ml-2 ${darkMode ? 'text-blue-100' : 'text-blue-900'}`}>
                      {item.question}
                    </span>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <strong className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>A:</strong>
                    <span className={`ml-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {item.answer}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question Input */}
          <div className={`p-4 rounded-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                placeholder="질문을 입력하세요..."
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                    : 'bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-500'
                } border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && currentQuestion.trim()) {
                    askQuestion();
                  }
                }}
              />
              <button
                onClick={askQuestion}
                disabled={!currentQuestion.trim() || isLoading}
                className={`px-4 py-2 rounded-lg transition-all ${
                  !currentQuestion.trim() || isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : darkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                질문
              </button>
            </div>

            {/* Accusation Panel */}
            <div className="border-t pt-4">
              <h4 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                범인 지목
              </h4>
              <div className="space-y-3">
                <select
                  value={accusedSuspect}
                  onChange={(e) => setAccusedSuspect(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-gray-50 text-gray-900 border-gray-300'
                  } border focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                >
                  <option value="">용의자를 선택하세요</option>
                  {caseData?.suspects.map((suspect) => (
                    <option key={suspect.name} value={suspect.name}>
                      {suspect.name}
                    </option>
                  ))}
                </select>
                <textarea
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  placeholder="추리 근거를 입력하세요..."
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                      : 'bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-500'
                  } border focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                />
                <button
                  onClick={makeAccusation}
                  disabled={!accusedSuspect || !reasoning.trim() || isLoading}
                  className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${
                    !accusedSuspect || !reasoning.trim() || isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {isLoading ? '검토 중...' : '범인 지목하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { MysteryDetective };