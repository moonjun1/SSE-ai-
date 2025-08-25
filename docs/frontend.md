# 💻 프론트엔드 구현 상세

## ⚛️ React + TypeScript 기반 프론트엔드

### 핵심 구현 철학
- **타입 안전성**: TypeScript로 런타임 에러 방지
- **컴포넌트 재사용**: 모듈화된 UI 컴포넌트
- **반응형 디자인**: TailwindCSS로 모든 디바이스 지원
- **상태 관리**: 커스텀 훅으로 로직 분리

## 📁 파일 구조 및 역할

```
frontend/src/
├── components/              # UI 컴포넌트
│   ├── ChatContainer.tsx   # 메인 채팅 컨테이너
│   ├── MessageList.tsx     # 메시지 목록 렌더링
│   ├── MessageInput.tsx    # 사용자 입력 폼
│   └── Message.tsx         # 개별 메시지 컴포넌트
├── hooks/
│   └── useChatStream.ts    # SSE 스트리밍 로직
├── types/
│   └── chat.ts             # TypeScript 타입 정의
├── App.tsx                 # 루트 컴포넌트
├── main.tsx               # 애플리케이션 엔트리포인트
└── index.css              # TailwindCSS 스타일
```

## 🎯 주요 구현 내용

### 1. 타입 정의 (`types/chat.ts`)

```typescript
export interface ChatMessage {
  id: string;                    // 고유 식별자
  role: 'user' | 'assistant';   // 메시지 타입
  content: string;               // 메시지 내용
  timestamp: Date;               // 생성 시간
}

export interface ChatState {
  messages: ChatMessage[];       // 메시지 목록
  isLoading: boolean;           // 로딩 상태
  error: string | null;         // 에러 메시지
}
```

**핵심 포인트:**
- 명확한 타입 정의로 개발자 경험 향상
- 유니온 타입으로 메시지 역할 제한
- 에러 상태 관리로 사용자 피드백 제공

### 2. 채팅 스트리밍 훅 (`hooks/useChatStream.ts`)

```typescript
import { useState, useCallback, useRef } from 'react';
import { ChatMessage, ChatState } from '../types/chat';

export const useChatStream = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const currentMessageRef = useRef<string>('');

  const sendMessage = useCallback(async (message: string) => {
    if (chatState.isLoading) return;

    // 사용자 메시지 추가
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

    // AI 응답용 빈 메시지 생성
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
      // EventSource를 통한 SSE 연결
      const formData = new URLSearchParams();
      formData.append('message', message);
      formData.append('history', JSON.stringify(
        chatState.messages.map(msg => ({ 
          role: msg.role, 
          content: msg.content 
        }))
      ));

      const eventSource = new EventSource(
        `http://localhost:8000/api/chat/stream?${formData.toString()}`
      );
      eventSourceRef.current = eventSource;

      // 메시지 수신 처리
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.chunk) {
            // 실시간으로 메시지 내용 업데이트
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
            // 스트리밍 완료
            setChatState(prev => ({ ...prev, isLoading: false }));
            eventSource.close();
          }
        } catch (e) {
          console.error('Error parsing SSE data:', e);
        }
      };

      // 에러 처리
      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        setChatState(prev => ({
          ...prev,
          error: 'Connection failed',
          isLoading: false,
        }));
        eventSource.close();
      };

    } catch (error) {
      setChatState(prev => ({
        ...prev,
        error: 'Failed to send message',
        isLoading: false,
        messages: prev.messages.slice(0, -1),
      }));
    }
  }, [chatState.messages, chatState.isLoading]);

  const clearMessages = useCallback(() => {
    setChatState({
      messages: [],
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    messages: chatState.messages,
    isLoading: chatState.isLoading,
    error: chatState.error,
    sendMessage,
    clearMessages,
  };
};
```

**핵심 포인트:**
- `useCallback`으로 함수 메모이제이션
- `useRef`로 EventSource와 현재 메시지 참조 관리
- 실시간 상태 업데이트로 타이핑 효과 구현
- 에러 처리 및 정리 로직 포함

### 3. 메시지 컴포넌트 (`components/Message.tsx`)

```typescript
import React from 'react';
import { ChatMessage } from '../types/chat';
import { User, Bot } from 'lucide-react';

interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export const Message: React.FC<MessageProps> = ({ 
  message, 
  isStreaming = false 
}) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 p-4 ${
      isUser ? 'bg-blue-50' : 'bg-gray-50'
    }`}>
      {/* 아바타 */}
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
        {/* 발신자 표시 */}
        <div className="font-medium text-sm mb-1">
          {isUser ? 'You' : 'AI Assistant'}
        </div>
        
        {/* 메시지 내용 */}
        <div className="text-gray-800 whitespace-pre-wrap">
          {message.content}
          {isStreaming && <span className="animate-pulse">|</span>}
        </div>
      </div>
    </div>
  );
};
```

**핵심 포인트:**
- Props 타입 정의로 타입 안전성 확보
- 조건부 스타일링으로 사용자/AI 구분
- 스트리밍 중 커서 애니메이션
- 아이콘으로 직관적인 UI

### 4. 메시지 입력 (`components/MessageInput.tsx`)

```typescript
import React, { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  disabled = false 
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

  return (
    <div className="border-t bg-white p-4">
      <div className="flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={disabled}
          rows={3}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !message.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </div>
    </div>
  );
};
```

**핵심 포인트:**
- Enter 키로 전송 (Shift+Enter로 줄바꿈)
- 전송 중 입력 비활성화
- 버튼 상태에 따른 스타일 변경
- 텍스트 영역 크기 고정

### 5. 메시지 목록 (`components/MessageList.tsx`)

```typescript
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat';
import { Message } from './Message';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Welcome to AI Chat</div>
          <div>Start a conversation by typing a message below</div>
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
          isStreaming={
            isLoading && 
            index === messages.length - 1 && 
            message.role === 'assistant'
          }
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
```

**핵심 포인트:**
- 자동 스크롤로 새 메시지 표시
- 빈 상태 UI로 사용자 가이드
- 마지막 메시지 스트리밍 상태 표시
- 효율적인 메시지 렌더링

### 6. 메인 컨테이너 (`components/ChatContainer.tsx`)

```typescript
import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChatStream } from '../hooks/useChatStream';
import { Trash2, MessageSquare } from 'lucide-react';

export const ChatContainer: React.FC = () => {
  const { messages, isLoading, error, sendMessage, clearMessages } = useChatStream();

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white">
      {/* 헤더 */}
      <div className="border-b bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-semibold">AI Chat Service</h1>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* 메시지 영역 */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* 입력 영역 */}
      <MessageInput onSendMessage={sendMessage} disabled={isLoading} />
    </div>
  );
};
```

**핵심 포인트:**
- 모든 하위 컴포넌트 조합
- 에러 상태 UI 표시
- 헤더와 정리 기능
- 반응형 레이아웃

## 🎨 스타일링 (TailwindCSS)

### 주요 스타일 클래스
```css
/* 레이아웃 */
flex flex-col h-screen         /* 전체 화면 세로 레이아웃 */
max-w-4xl mx-auto             /* 최대 너비와 중앙 정렬 */

/* 컴포넌트 스타일 */
bg-blue-50                    /* 사용자 메시지 배경 */
bg-gray-50                    /* AI 메시지 배경 */
border border-gray-300        /* 입력 필드 테두리 */
rounded-lg                    /* 둥근 모서리 */

/* 상호작용 */
hover:bg-blue-600            /* 호버 효과 */
disabled:bg-gray-300         /* 비활성화 상태 */
focus:ring-2 focus:ring-blue-500  /* 포커스 링 */

/* 애니메이션 */
animate-pulse                /* 타이핑 커서 애니메이션 */
transition-colors           /* 부드러운 색상 전환 */
```

## 🔄 상태 관리 패턴

### 1. 로컬 상태
```typescript
const [message, setMessage] = useState('');  // 입력 필드
```

### 2. 커스텀 훅 상태
```typescript
const { messages, isLoading, error } = useChatStream();  // 채팅 상태
```

### 3. Ref 상태
```typescript
const eventSourceRef = useRef<EventSource | null>(null);  // SSE 연결
const currentMessageRef = useRef<string>('');             // 현재 메시지
```

## 📱 반응형 디자인

```typescript
// 모바일 최적화
className="max-w-4xl mx-auto"     // 데스크톱 최대 너비
className="p-4"                   // 패딩
className="gap-3"                 // 간격 조정
```

## 🚀 성능 최적화

### 1. 메모이제이션
```typescript
const sendMessage = useCallback(async (message: string) => {
  // 함수 재생성 방지
}, [chatState.messages, chatState.isLoading]);
```

### 2. 조건부 렌더링
```typescript
{messages.length === 0 && <EmptyState />}
{error && <ErrorMessage />}
```

### 3. 효율적인 상태 업데이트
```typescript
setChatState(prev => ({
  ...prev,
  messages: prev.messages.map(msg =>
    msg.id === targetId ? { ...msg, content: newContent } : msg
  )
}));
```