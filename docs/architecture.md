# 🏗️ 시스템 아키텍처

## 📐 전체 시스템 구조

```
┌─────────────────┐    HTTP/SSE     ┌─────────────────┐    HTTP API    ┌─────────────┐
│                 │ ──────────────► │                 │ ─────────────► │             │
│  React Client   │                 │  FastAPI Server │                │  OpenAI API │
│  (Frontend)     │ ◄────────────── │   (Backend)     │ ◄───────────── │             │
│                 │   SSE Stream    │                 │   AI Response  │             │
└─────────────────┘                 └─────────────────┘                └─────────────┘
       │                                      │
       │                                      │
       ▼                                      ▼
┌─────────────────┐                 ┌─────────────────┐
│   EventSource   │                 │  Stream Handler │
│   API Client    │                 │   (Generator)   │
└─────────────────┘                 └─────────────────┘
```

## 🔄 데이터 플로우

### 1. 메시지 전송 플로우
```
사용자 입력 → React Component → useChatStream Hook → EventSource → FastAPI Endpoint
```

### 2. 스트리밍 응답 플로우
```
OpenAI API → AI Service → Stream Generator → SSE Response → EventSource → React Update
```

## 🏛️ 백엔드 아키텍처

### FastAPI 애플리케이션 구조
```python
# 계층별 역할 분리
┌─────────────────────┐
│    Presentation     │  ← API 라우터 (chat.py)
├─────────────────────┤
│     Business        │  ← AI 서비스 (ai_service.py)
├─────────────────────┤
│     Data Model      │  ← Pydantic 모델 (models.py)
├─────────────────────┤
│    Infrastructure   │  ← FastAPI 설정 (main.py)
└─────────────────────┘
```

### 주요 컴포넌트

#### 1. Main Application (`main.py`)
```python
# CORS 설정
app.add_middleware(CORSMiddleware, ...)

# 라우터 등록
app.include_router(chat.router)
```

#### 2. Chat Router (`routers/chat.py`)
```python
# POST: JSON 요청 처리
@router.post("/stream")

# GET: Query 파라미터 처리 (EventSource용)
@router.get("/stream")
```

#### 3. AI Service (`services/ai_service.py`)
```python
# OpenAI 스트리밍 처리
def stream_chat(message, history) -> Generator[str, None, None]:
    # 실시간 토큰 스트리밍
```

## 💻 프론트엔드 아키텍처

### React 컴포넌트 구조
```
ChatContainer (메인 컨테이너)
├── MessageList (메시지 목록)
│   └── Message (개별 메시지)
└── MessageInput (입력 폼)
```

### 상태 관리
```typescript
// useChatStream 훅에서 중앙 관리
interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}
```

### 데이터 흐름
```
컴포넌트 → 커스텀 훅 → EventSource API → 상태 업데이트 → 리렌더링
```

## 🔄 SSE (Server-Sent Events) 구현

### 백엔드 SSE 응답
```python
# StreamingResponse로 실시간 데이터 전송
def generate():
    for chunk in ai_service.stream_chat(message, history):
        yield f"data: {json.dumps({'chunk': chunk})}\n\n"
    yield f"data: {json.dumps({'done': True})}\n\n"

return StreamingResponse(generate(), media_type="text/event-stream")
```

### 프론트엔드 EventSource 처리
```typescript
const eventSource = new EventSource(url);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.chunk) {
    // 실시간 메시지 업데이트
  }
};
```

## 🔒 보안 고려사항

### CORS 설정
```python
allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"]
```

### 환경 변수 관리
```python
# .env 파일로 API 키 보호
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
```

## ⚡ 성능 최적화

### 백엔드 최적화
- **비동기 처리**: FastAPI의 async/await 활용
- **스트리밍**: 큰 응답을 청크 단위로 전송
- **연결 관리**: SSE 연결의 효율적 관리

### 프론트엔드 최적화
- **메모이제이션**: React.memo로 불필요한 리렌더링 방지
- **상태 최적화**: 상태 업데이트 최소화
- **자동 스크롤**: 새 메시지 시 부드러운 스크롤

## 🔍 모니터링 및 로깅

### 에러 처리
```python
# 백엔드 예외 처리
try:
    # OpenAI API 호출
except Exception as e:
    yield f"Error: {str(e)}"
```

```typescript
// 프론트엔드 에러 처리
eventSource.onerror = (error) => {
  console.error('EventSource failed:', error);
  setChatState(prev => ({
    ...prev,
    error: 'Connection failed'
  }));
};
```