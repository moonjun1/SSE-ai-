# AI Chat Service MVP

React + FastAPI 기반의 실시간 AI 채팅 서비스 MVP입니다.

## 🚀 빠른 실행

### 1단계: 백엔드 실행
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2단계: 프론트엔드 실행 (새 터미널)
```bash
cd frontend
npm install
npm run dev
```

### 3단계: 접속
- 프론트엔드: http://localhost:5173
- 백엔드 API 문서: http://localhost:8000/docs

## 📚 상세 문서

- [📖 프로젝트 개요](docs/overview.md)
- [🏗️ 아키텍처](docs/architecture.md)
- [⚙️ 백엔드 구현](docs/backend.md)
- [💻 프론트엔드 구현](docs/frontend.md)
- [🔄 스트리밍 구현](docs/streaming.md)
- [🚀 고급 기능 가이드](docs/advanced-features.md) ⭐ **NEW**
- [📊 프로젝트 현재 상태](docs/project-status.md) ⭐ **NEW**
- [🚀 배포 가이드](docs/deployment.md)

## 🎨 주요 기능

### ✅ 핵심 기능
- **🤖 멀티 AI 모델** - OpenAI GPT-3.5/4, Claude 3.5 Sonnet, DeepSeek Chat
- **💬 실시간 스트리밍** - Server-Sent Events(SSE) 기반
- **🌙 다크/라이트 모드** - 완전한 테마 시스템
- **📋 메시지 복사** - 호버 시 복사 버튼 표시
- **⏰ 타임스탬프** - 각 메시지 전송 시간 표시
- **💬 타이핑 인디케이터** - AI 응답 대기 중 애니메이션
- **📤 대화 내보내기** - JSON 형태로 대화 기록 저장
- **🔢 글자 수 카운터** - 실시간 입력 제한 (1000자)
- **📱 반응형 UI** - 모바일 최적화 디자인

### 🎮 게임 기능
- **📖 스토리 어드벤처** - 6가지 장르별 인터랙티브 스토리 생성
- **🕵️ 추리 게임** - 3단계 난이도별 미스터리 사건 해결
- **🎯 미니 게임** - 단어퍼즐, 수학퀴즈, 기억력 게임
- **👥 협력 스토리** - 실시간 멀티플레이어 스토리 생성 ⭐ **NEW**
- **⏱️ 타임어택 추리** - 시간제한 추리 게임 + 점수 시스템 ⭐ **NEW**

### 🚀 고급 기능  
- **🎯 컨텍스트 유지** - 대화 기록 기반 지능형 응답
- **⚡ 자동 스크롤** - 새 메시지 시 부드러운 스크롤
- **💾 설정 저장** - 다크모드, AI 모델 선택 자동 저장
- **🎨 인터랙티브 UI** - 호버 효과 및 부드러운 애니메이션
- **🌐 WebSocket 지원** - 실시간 멀티플레이어 게임 인프라 ⭐ **NEW**

## 🛠️ 기술 스택

### Backend
- **FastAPI** - 고성능 Python 웹 프레임워크
- **OpenAI GPT-3.5-turbo/4** - AI 모델
- **Claude 3.5 Sonnet** - AI 모델  
- **WebSocket** - 실시간 멀티플레이어 통신 ⭐ **NEW**
- **Server-Sent Events** - 실시간 스트리밍
- **Pydantic** - 데이터 검증
- **Uvicorn** - ASGI 서버

### Frontend  
- **React 18 + TypeScript** - UI 라이브러리
- **TailwindCSS** - 유틸리티 스타일링
- **Vite** - 빠른 개발 서버
- **Lucide React** - 아이콘 라이브러리
- **EventSource API** - SSE 클라이언트
- **WebSocket API** - 실시간 멀티플레이어 클라이언트 ⭐ **NEW**

## 📁 프로젝트 구조

```
ai-service/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py         # 메인 애플리케이션
│   │   ├── models.py       # Pydantic 모델
│   │   ├── routers/        # API 라우터
│   │   │   ├── chat.py    # 채팅 API
│   │   │   ├── games.py   # 게임 API
│   │   │   └── websocket.py # WebSocket API ⭐ NEW
│   │   └── services/       # 비즈니스 로직
│   │       ├── ai_service.py        # AI 모델 서비스
│   │       ├── story_game_service.py # 스토리 게임
│   │       ├── mystery_game_service.py # 추리 게임
│   │       └── websocket_manager.py  # WebSocket 관리 ⭐ NEW
│   └── requirements.txt    # Python 의존성
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   │   ├── ChatContainer.tsx     # AI 채팅
│   │   │   ├── StoryAdventure.tsx    # 스토리 게임
│   │   │   ├── MysteryDetective.tsx  # 추리 게임
│   │   │   ├── MiniGames.tsx         # 미니게임 ⭐ NEW
│   │   │   ├── CooperativeStory.tsx  # 협력 스토리 ⭐ NEW
│   │   │   └── TimeAttackMystery.tsx # 타임어택 ⭐ NEW
│   │   ├── hooks/         # 커스텀 훅
│   │   └── types/         # TypeScript 타입
│   └── package.json       # Node.js 의존성
├── docs/                  # 프로젝트 문서
└── .env                   # 환경 변수 (OpenAI API 키)
```

## 🔧 개발 환경

- Python 3.8+
- Node.js 16+
- OpenAI API 키 필요

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request