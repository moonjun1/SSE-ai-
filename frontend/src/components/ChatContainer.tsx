import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChatStream } from '../hooks/useChatStream';
import { Trash2, MessageSquare, Moon, Sun, Settings, Download } from 'lucide-react';
import { AI_MODELS, AIModel } from '../types/chat';

export const ChatContainer: React.FC = () => {
  const { 
    messages, 
    isLoading, 
    error, 
    darkMode, 
    selectedModel,
    sendMessage, 
    clearMessages, 
    toggleDarkMode,
    selectModel 
  } = useChatStream();

  const exportChat = () => {
    const chatData = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString()
    }));
    
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col h-screen max-w-4xl mx-auto transition-colors ${
      darkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Header */}
      <div className={`border-b p-4 flex items-center justify-between ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-blue-500" />
          <h1 className={`text-xl font-semibold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            AI 채팅 서비스
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* AI 모델 선택 */}
          <select
            value={selectedModel}
            onChange={(e) => selectModel(e.target.value)}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg border text-sm ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-900'
            } disabled:opacity-50`}
          >
            {Object.entries(AI_MODELS).map(([key, model]) => (
              <option key={key} value={key}>
                {model.status} {model.name} ({model.provider})
              </option>
            ))}
          </select>

          {/* 대화 내보내기 */}
          {messages.length > 0 && (
            <button
              onClick={exportChat}
              disabled={isLoading}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              } disabled:opacity-50`}
              title="대화 내보내기"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* 다크 모드 토글 */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title={darkMode ? '라이트 모드' : '다크 모드'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* 대화 지우기 */}
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              disabled={isLoading}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                darkMode 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              } disabled:opacity-50`}
              title="대화 지우기"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">지우기</span>
            </button>
          )}
        </div>
      </div>

      {/* 현재 모델 표시 */}
      <div className={`px-4 py-2 text-xs ${
        darkMode ? 'text-gray-400 bg-gray-800/50' : 'text-gray-600 bg-gray-50'
      }`}>
        현재 모델: {AI_MODELS[selectedModel as AIModel]?.status} {AI_MODELS[selectedModel as AIModel]?.name} ({AI_MODELS[selectedModel as AIModel]?.provider})
      </div>

      {/* Error Message */}
      {error && (
        <div className={`border-l-4 p-4 m-4 ${
          darkMode 
            ? 'bg-red-900/20 border-red-400 text-red-300' 
            : 'bg-red-50 border-red-400 text-red-700'
        }`}>
          <div>오류: {error}</div>
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} darkMode={darkMode} />

      {/* Input */}
      <MessageInput onSendMessage={sendMessage} disabled={isLoading} darkMode={darkMode} />
    </div>
  );
};