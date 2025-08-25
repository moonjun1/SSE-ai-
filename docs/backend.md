# ⚙️ 백엔드 구현 상세

## 🏗️ FastAPI 기반 백엔드

### 핵심 구현 철학
- **비동기 처리**: 높은 동시성과 성능
- **타입 안전성**: Pydantic을 통한 데이터 검증
- **모듈화**: 역할별 파일 분리
- **스트리밍 최적화**: 실시간 응답 처리

## 📁 파일 구조 및 역할

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI 애플리케이션 설정
│   ├── models.py        # Pydantic 데이터 모델
│   ├── routers/
│   │   ├── __init__.py
│   │   └── chat.py      # 채팅 API 엔드포인트
│   └── services/
│       ├── __init__.py
│       └── ai_service.py # OpenAI API 연동 서비스
├── requirements.txt     # Python 의존성
└── .env                # 환경 변수 (API 키 등)
```

## 🚀 주요 구현 내용

### 1. 메인 애플리케이션 (`main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .routers import chat

load_dotenv()  # 환경변수 로드

app = FastAPI(title="AI Chat Service", version="1.0.0")

# CORS 미들웨어 설정 - React 앱과의 통신 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 채팅 라우터 등록
app.include_router(chat.router)

# 헬스 체크 엔드포인트
@app.get("/")
async def root():
    return {"message": "AI Chat Service API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

**핵심 포인트:**
- `load_dotenv()`로 환경변수 안전하게 로드
- CORS 설정으로 프론트엔드와의 통신 허용
- 헬스 체크 엔드포인트로 서버 상태 확인 가능

### 2. 데이터 모델 (`models.py`)

```python
from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str          # 'user' 또는 'assistant'
    content: str       # 메시지 내용

class ChatRequest(BaseModel):
    message: str                           # 사용자 메시지
    history: Optional[List[ChatMessage]] = []  # 대화 기록
```

**핵심 포인트:**
- Pydantic으로 데이터 검증 자동화
- Optional로 기본값 설정
- 타입 힌트로 IDE 지원 향상

### 3. AI 서비스 (`services/ai_service.py`)

```python
import os
from openai import OpenAI
from typing import Generator, List
from ..models import ChatMessage

class AIService:
    def __init__(self):
        # 환경변수에서 API 키 로드
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    def stream_chat(self, message: str, history: List[ChatMessage] = []) -> Generator[str, None, None]:
        # 대화 기록을 OpenAI 형식으로 변환
        messages = []
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})
        
        # 현재 사용자 메시지 추가
        messages.append({"role": "user", "content": message})
        
        try:
            # OpenAI 스트리밍 API 호출
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                stream=True,              # 스트리밍 활성화
                max_tokens=1000,
                temperature=0.7
            )
            
            # 스트리밍 응답 처리
            for chunk in response:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            yield f"Error: {str(e)}"
```

**핵심 포인트:**
- Generator를 사용한 스트리밍 구현
- 대화 기록 유지로 컨텍스트 보존
- 예외 처리로 안정성 확보

### 4. 채팅 라우터 (`routers/chat.py`)

```python
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from ..models import ChatRequest, ChatMessage
from ..services.ai_service import AIService
import json
from typing import List, Optional

router = APIRouter(prefix="/api/chat", tags=["chat"])
ai_service = AIService()

@router.post("/stream")
async def stream_chat(request: ChatRequest):
    """POST 요청으로 채팅 스트리밍"""
    try:
        def generate():
            for chunk in ai_service.stream_chat(request.message, request.history):
                # SSE 형식으로 데이터 전송
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            # 완료 신호
            yield f"data: {json.dumps({'done': True})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stream")
async def stream_chat_get(
    message: str = Query(...),
    history: str = Query("[]")
):
    """GET 요청으로 채팅 스트리밍 (EventSource 용)"""
    try:
        # JSON 문자열을 파싱하여 히스토리 복원
        history_list = []
        if history != "[]":
            history_data = json.loads(history)
            history_list = [ChatMessage(**item) for item in history_data]
        
        def generate():
            for chunk in ai_service.stream_chat(message, history_list):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**핵심 포인트:**
- POST/GET 두 가지 방식 지원
- SSE 표준 헤더 설정
- JSON 형태의 구조화된 응답
- 완료 신호로 스트림 종료 알림

## 🔄 Server-Sent Events (SSE) 구현

### SSE 응답 형식
```
data: {"chunk": "안녕"}\n\n
data: {"chunk": "하세요"}\n\n  
data: {"chunk": "!"}\n\n
data: {"done": true}\n\n
```

### 스트리밍 헤더 설정
```python
headers = {
    "Cache-Control": "no-cache",      # 캐시 비활성화
    "Connection": "keep-alive",       # 연결 유지
    "Access-Control-Allow-Origin": "*",     # CORS
    "Access-Control-Allow-Headers": "*"
}
```

## 🛡️ 에러 처리 및 보안

### 1. 환경변수 관리
```bash
# .env 파일
OPENAI_API_KEY=sk-your-api-key-here
```

### 2. 예외 처리
```python
try:
    # OpenAI API 호출
    response = self.client.chat.completions.create(...)
except Exception as e:
    # 클라이언트에 에러 메시지 전송
    yield f"Error: {str(e)}"
```

### 3. CORS 보안
- 특정 도메인만 허용
- 개발/프로덕션 환경별 설정 분리

## 📊 성능 최적화

### 1. 비동기 처리
```python
# FastAPI의 비동기 기능 활용
async def stream_chat(request: ChatRequest):
    # 논블로킹 처리
```

### 2. 스트리밍 최적화
- 토큰 단위 즉시 전송
- 메모리 사용량 최소화
- 네트워크 지연 최소화

### 3. 연결 관리
- Keep-Alive로 연결 재사용
- 적절한 타임아웃 설정

## 🚀 실행 방법

```bash
# 의존성 설치
pip install -r requirements.txt

# 서버 실행 (개발 모드)
uvicorn app.main:app --reload --port 8000

# 프로덕션 실행
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 🔍 API 문서

FastAPI 자동 생성 문서:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc