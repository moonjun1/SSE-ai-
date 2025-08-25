import React, { useState } from 'react';
import { ChatMessage } from '../types/chat';
import { User, Bot, Copy, Check } from 'lucide-react';

interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  darkMode?: boolean;
}

export const Message: React.FC<MessageProps> = ({ message, isStreaming = false, darkMode = false }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex gap-3 p-4 group relative ${
      darkMode 
        ? (isUser ? 'bg-blue-900/20' : 'bg-gray-800/50')
        : (isUser ? 'bg-blue-50' : 'bg-gray-50')
    }`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-500' : 'bg-gray-500'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      <div className="flex-1">
        <div className={`flex items-center justify-between mb-1`}>
          <div className={`font-medium text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            {isUser ? '나' : 'AI 어시스턴트'}
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
        <div className={`whitespace-pre-wrap relative ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          {message.content}
          {isStreaming && (
            <span className={`animate-pulse ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>|</span>
          )}
          
          {/* 복사 버튼 */}
          {!isStreaming && message.content && (
            <button
              onClick={handleCopy}
              className={`absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
              }`}
              title="복사하기"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};