import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat';
import { Message } from './Message';
import { Bot } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  darkMode?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, darkMode = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center ${
        darkMode ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <div className="text-center">
          <div className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            AI 채팅에 오신 것을 환영합니다
          </div>
          <div>아래에 메시지를 입력하여 대화를 시작하세요</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map((message, index) => (
        <Message
          key={message.id}
          message={message}
          darkMode={darkMode}
          isStreaming={
            isLoading && 
            index === messages.length - 1 && 
            message.role === 'assistant'
          }
        />
      ))}
      
      {/* 타이핑 인디케이터 */}
      {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
        <div className={`flex gap-3 p-4 ${
          darkMode ? 'bg-gray-800/50' : 'bg-gray-50'
        }`}>
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-500">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className={`font-medium text-sm mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
              AI 어시스턴트
            </div>
            <div className={`flex items-center space-x-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm ml-2">입력 중...</span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};