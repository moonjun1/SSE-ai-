import React, { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  darkMode?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  disabled = false, 
  darkMode = false 
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const maxLength = 1000;
  const remainingChars = maxLength - message.length;

  return (
    <div className={`border-t p-4 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex gap-2">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            disabled={disabled}
            rows={3}
            maxLength={maxLength}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
          <div className={`flex justify-between items-center mt-1 text-xs ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <div>Enter로 전송, Shift+Enter로 줄바꿈</div>
            <div className={remainingChars < 50 ? 'text-red-500' : ''}>
              {message.length}/{maxLength}
            </div>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={disabled || !message.trim()}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            disabled || !message.trim()
              ? (darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500')
              : 'bg-blue-500 text-white hover:bg-blue-600'
          } disabled:cursor-not-allowed`}
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">전송</span>
        </button>
      </div>
    </div>
  );
};