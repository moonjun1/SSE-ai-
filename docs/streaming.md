# 🔄 스트리밍 구현 상세

## 🌊 실시간 스트리밍 아키텍처

### 개요
본 프로젝트는 **Server-Sent Events (SSE)** 기술을 사용하여 AI 응답을 실시간으로 스트리밍합니다. 이를 통해 사용자는 AI가 응답을 생성하는 과정을 실시간으로 볼 수 있어 더욱 자연스러운 대화 경험을 제공합니다.

## 🔄 스트리밍 플로우

```
사용자 메시지 입력
        ↓
React Component (useChatStream)
        ↓
EventSource API로 GET 요청
        ↓
FastAPI 엔드포인트 (/api/chat/stream)
        ↓
AI Service (OpenAI API 스트리밍)
        ↓
Generator로 토큰 단위 응답
        ↓
SSE 형식으로 클라이언트에 전송
        ↓
EventSource onmessage 이벤트
        ↓
React 상태 업데이트 (실시간 UI 반영)
```

## 🔧 백엔드 스트리밍 구현

### 1. OpenAI 스트리밍 API 연동

```python
# services/ai_service.py
def stream_chat(self, message: str, history: List[ChatMessage] = []) -> Generator[str, None, None]:
    try:
        # OpenAI 스트리밍 API 호출
        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            stream=True,              # 핵심: 스트리밍 활성화
            max_tokens=1000,
            temperature=0.7
        )
        
        # 토큰 단위로 응답 스트리밍
        for chunk in response:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content  # 즉시 토큰 반환
                
    except Exception as e:
        yield f"Error: {str(e)}"
```

**핵심 포인트:**
- `stream=True`로 OpenAI API 스트리밍 모드 활성화
- `Generator`를 사용하여 토큰 단위 즉시 반환
- 예외 처리로 에러 상황에서도 스트림 유지

### 2. Server-Sent Events 응답 생성

```python
# routers/chat.py
@router.get("/stream")
async def stream_chat_get(message: str = Query(...), history: str = Query("[]")):
    def generate():
        for chunk in ai_service.stream_chat(message, history_list):
            # SSE 표준 형식으로 데이터 전송
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        
        # 스트림 완료 신호
        yield f"data: {json.dumps({'done': True})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",      # 캐시 방지
            "Connection": "keep-alive",       # 연결 유지
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        }
    )
```

**SSE 메시지 형식:**
```
data: {"chunk": "안녕"}\n\n
data: {"chunk": "하세요"}\n\n
data: {"chunk": "!"}\n\n
data: {"done": true}\n\n
```

**핵심 포인트:**
- `text/event-stream` 미디어 타입 사용
- `data: ` 접두사와 `\n\n` 구분자로 SSE 표준 준수
- JSON 형태로 구조화된 데이터 전송
- 완료 신호로 클라이언트에 스트림 종료 알림

## 💻 프론트엔드 스트리밍 수신

### 1. EventSource API 활용

```typescript
// hooks/useChatStream.ts
const sendMessage = useCallback(async (message: string) => {
  // 쿼리 파라미터 구성
  const formData = new URLSearchParams();
  formData.append('message', message);
  formData.append('history', JSON.stringify(chatHistory));

  // EventSource로 SSE 연결
  const eventSource = new EventSource(
    `http://localhost:8000/api/chat/stream?${formData.toString()}`
  );
  
  eventSourceRef.current = eventSource;
}, []);
```

### 2. 실시간 메시지 수신 및 처리

```typescript
// SSE 메시지 수신 처리
eventSource.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    
    if (data.chunk) {
      // 토큰 단위로 메시지 내용 누적
      currentMessageRef.current += data.chunk;
      
      // React 상태 업데이트 (실시간 UI 반영)
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: currentMessageRef.current }
            : msg
        ),
      }));
      
    } else if (data.done) {
      // 스트리밍 완료 처리
      setChatState(prev => ({ ...prev, isLoading: false }));
      eventSource.close();
    }
  } catch (e) {
    console.error('Error parsing SSE data:', e);
  }
};
```

### 3. 에러 처리 및 연결 관리

```typescript
// 연결 에러 처리
eventSource.onerror = (error) => {
  console.error('EventSource failed:', error);
  setChatState(prev => ({
    ...prev,
    error: 'Connection failed',
    isLoading: false,
  }));
  eventSource.close();
};

// 컴포넌트 언마운트 시 정리
useEffect(() => {
  return () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
  };
}, []);
```

## 🎨 UI 스트리밍 효과

### 1. 타이핑 애니메이션

```typescript
// components/Message.tsx
<div className="text-gray-800 whitespace-pre-wrap">
  {message.content}
  {isStreaming && <span className="animate-pulse">|</span>}
</div>
```

### 2. 실시간 스크롤

```typescript
// components/MessageList.tsx
const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};

useEffect(() => {
  scrollToBottom();  // 새 메시지 수신 시 자동 스크롤
}, [messages]);
```

### 3. 로딩 상태 관리

```typescript
// 스트리밍 중인 메시지 식별
const isStreaming = isLoading && 
                   index === messages.length - 1 && 
                   message.role === 'assistant';
```

## ⚡ 성능 최적화

### 1. 백엔드 최적화

```python
# 비동기 Generator 사용 고려 (고급)
async def stream_chat_async(self, message: str):
    async for chunk in response:
        yield chunk.choices[0].delta.content
```

### 2. 프론트엔드 최적화

```typescript
// 메시지 업데이트 최적화
const updateMessage = useCallback((messageId: string, content: string) => {
  setChatState(prev => ({
    ...prev,
    messages: prev.messages.map(msg =>
      msg.id === messageId ? { ...msg, content } : msg
    )
  }));
}, []);

// 디바운싱으로 업데이트 빈도 제한 (선택적)
const debouncedUpdate = useMemo(
  () => debounce(updateMessage, 50),
  [updateMessage]
);
```

## 🛡️ 에러 처리 전략

### 1. 네트워크 연결 끊김

```typescript
// 자동 재연결 로직
const reconnect = () => {
  setTimeout(() => {
    if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
      // 재연결 시도
      sendMessage(lastMessage);
    }
  }, 3000);
};
```

### 2. 부분 응답 보존

```typescript
// 연결 끊김 시 부분 메시지 유지
eventSource.onerror = (error) => {
  // 현재까지 받은 내용 보존
  setChatState(prev => ({
    ...prev,
    messages: prev.messages.map(msg =>
      msg.id === currentMessageId
        ? { ...msg, content: currentMessageRef.current + ' [연결 끊김]' }
        : msg
    )
  }));
};
```

### 3. API 에러 핸들링

```python
# AI Service에서 에러를 스트림으로 전송
try:
    response = self.client.chat.completions.create(...)
    for chunk in response:
        yield chunk.choices[0].delta.content
except openai.APIError as e:
    yield f"API Error: {str(e)}"
except Exception as e:
    yield f"Unexpected Error: {str(e)}"
```

## 🔍 디버깅 팁

### 1. 브라우저 개발자 도구

```javascript
// 네트워크 탭에서 SSE 연결 확인
// EventStream 타입으로 표시됨
// 실시간 메시지 수신 확인 가능
```

### 2. 서버 로깅

```python
# 스트리밍 디버깅을 위한 로깅
import logging

def stream_chat(self, message: str, history: List[ChatMessage] = []):
    logging.info(f"Starting stream for message: {message[:50]}...")
    for chunk in ai_response:
        logging.debug(f"Streaming chunk: {chunk}")
        yield chunk
```

### 3. 클라이언트 로깅

```typescript
// SSE 이벤트 로깅
eventSource.onmessage = (event) => {
  console.log('SSE Message received:', event.data);
  // ... 처리 로직
};
```

## 📊 성능 모니터링

### 메트릭 수집
- **응답 시작 시간**: 첫 토큰까지의 지연시간
- **스트리밍 속도**: 초당 토큰 수
- **연결 안정성**: 재연결 횟수
- **에러율**: 실패한 요청 비율

```typescript
// 성능 측정 예시
const startTime = Date.now();
eventSource.onmessage = (event) => {
  if (!firstTokenTime) {
    firstTokenTime = Date.now();
    console.log(`First token received in: ${firstTokenTime - startTime}ms`);
  }
};
```