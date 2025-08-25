import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, ChatState } from '../types/chat';
import axios from 'axios';

export const useChatStream = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    darkMode: localStorage.getItem('darkMode') === 'true',
    selectedModel: localStorage.getItem('selectedModel') || 'openai-gpt3.5',
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const currentMessageRef = useRef<string>('');

  // 초기 다크모드 설정
  useEffect(() => {
    document.body.className = chatState.darkMode ? 'dark bg-gray-900' : 'bg-gray-50';
  }, [chatState.darkMode]);

  const sendMessage = useCallback(async (message: string) => {
    if (chatState.isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    currentMessageRef.current = '';

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, assistantMessage],
    }));

    try {
      // First, send the message to get the streaming response
      const formData = new URLSearchParams();
      formData.append('message', message);
      formData.append('history', JSON.stringify(chatState.messages.map(msg => ({ role: msg.role, content: msg.content }))));
      formData.append('model', chatState.selectedModel);

      // Create EventSource for streaming
      const eventSource = new EventSource(`http://localhost:8000/api/chat/stream?${formData.toString()}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.chunk) {
            currentMessageRef.current += data.chunk;
            setChatState(prev => ({
              ...prev,
              messages: prev.messages.map(msg =>
                msg.id === assistantMessage.id
                  ? { ...msg, content: currentMessageRef.current }
                  : msg
              ),
            }));
          } else if (data.done) {
            setChatState(prev => ({ ...prev, isLoading: false }));
            eventSource.close();
          }
        } catch (e) {
          console.error('Error parsing SSE data:', e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        setChatState(prev => ({
          ...prev,
          error: '연결에 실패했습니다',
          isLoading: false,
        }));
        eventSource.close();
      };

    } catch (error) {
      setChatState(prev => ({
        ...prev,
        error: '메시지 전송에 실패했습니다',
        isLoading: false,
        messages: prev.messages.slice(0, -1), // Remove the empty assistant message
      }));
    }
  }, [chatState.messages, chatState.isLoading, chatState.selectedModel]);

  const clearMessages = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      messages: [],
      isLoading: false,
      error: null,
    }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setChatState(prev => {
      const newDarkMode = !prev.darkMode;
      localStorage.setItem('darkMode', newDarkMode.toString());
      
      // body에 다크모드 클래스 적용
      document.body.className = newDarkMode ? 'dark bg-gray-900' : 'bg-gray-50';
      
      return { ...prev, darkMode: newDarkMode };
    });
  }, []);

  const selectModel = useCallback((model: string) => {
    setChatState(prev => {
      localStorage.setItem('selectedModel', model);
      return { ...prev, selectedModel: model };
    });
  }, []);

  return {
    messages: chatState.messages,
    isLoading: chatState.isLoading,
    error: chatState.error,
    darkMode: chatState.darkMode,
    selectedModel: chatState.selectedModel,
    sendMessage,
    clearMessages,
    toggleDarkMode,
    selectModel,
  };
};