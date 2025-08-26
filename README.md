# AI Chat Service MVP

React + FastAPI 기반의 실시간 AI 채팅 서비스 MVP입니다.
<img width="1338" height="1252" alt="스크린샷 2025-08-26 151806" src="https://github.com/user-attachments/assets/c2e23b39-ff4d-4f20-80c9-0d10f3ce1658" />
<img width="1360" height="1251" alt="스크린샷 2025-08-26 151711" src="https://github.com/user-attachments/assets/20cd6663-9042-4dbe-9394-a20781957560" />
<img width="1435" height="1444" alt="스크린샷 2025-08-26 151610" src="https://github.com/user-attachments/assets/fa3bb60e-ab2e-4329-9c4a-b503f0d5d7c1" />
<img width="2536" height="1445" alt="스크린샷 2025-08-26 151532" src="https://github.com/user-attachments/assets/499d893e-8b51-4896-9a83-97d07c4ed2dc" />
<img width="1315" height="1225" alt="스크린샷 2025-08-26 151935" src="https://github.com/user-attachments/assets/563d28e7-e734-476b-9515-5a7f11e73586" />
<img width="1698" height="893" alt="스크린샷 2025-08-26 151918" src="https://github.com/user-attachments/assets/e0979ac2-a546-47c4-bee3-3d56fc67cef8" />
<img width="1751" height="1256" alt="스크린샷 2025-08-26 151902" src="https://github.com/user-attachments/assets/e39f3ee4-ef47-4fda-afff-4e7c6c9cbfe5" />
<img width="1359" height="703" alt="스크린샷 2025-08-26 122214" src="https://github.com/user-attachments/assets/e8cb4295-49d4-4548-a92a-aba7382c3ed3" />

## 🚀 빠른 실행

> **💡 처음 설치하시는 분은 [📋 완전한 설치 가이드](docs/installation-guide.md)를 먼저 보세요!**

### ⚡ 이미 설치된 경우
**Windows 사용자:**
- `run_backend.bat` 더블클릭
- `run_frontend.bat` 더블클릭 (새 창)

**macOS/Linux 사용자:**
```bash
# 터미널 1: 백엔드 실행
./run_backend.sh

# 터미널 2: 프론트엔드 실행  
./run_frontend.sh
```

### 📋 수동 실행 (개발자용)
```bash
# 1단계: 백엔드 실행
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2단계: 프론트엔드 실행 (새 터미널)
cd frontend  
npm run dev
```

### 🌐 접속하기
- **메인 웹사이트**: http://localhost:5173
- **API 문서**: http://localhost:8000/docs
- **WebSocket 테스트**: http://localhost:8000/ws/test

> **❗ 문제 발생시**: [🔧 문제 해결 가이드](docs/troubleshooting.md) 확인

## 📚 상세 문서

### 📖 시작하기
- [📋 **완전한 설치 가이드**](docs/installation-guide.md) ⭐ **추천**
- [🔧 **문제 해결 가이드**](docs/troubleshooting.md) ⭐ **필수**

### 📖 기본 가이드
- [📖 프로젝트 개요](docs/overview.md)
- [🏗️ 아키텍처](docs/architecture.md)
- [⚙️ 백엔드 구현](docs/backend.md)
- [💻 프론트엔드 구현](docs/frontend.md)
- [🔄 스트리밍 구현](docs/streaming.md)
- [🚀 배포 가이드](docs/deployment.md)

### 🎮 게임 시스템
- [👥 협력 스토리 가이드](docs/cooperative-story.md) ⭐ **NEW**
- [🌐 멀티플레이어 시스템](docs/multiplayer-system.md) ⭐ **NEW**

### 🚀 고급 기능
- [🚀 고급 기능 가이드](docs/advanced-features.md)
- [📊 프로젝트 현재 상태](docs/project-status.md)

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
- **👥 협력 스토리** ⭐ **NEW**
  - 🌐 **실시간 멀티플레이어**: 최대 4명이 함께 참여
  - 🏠 **방 시스템**: 방 코드로 친구 초대
  - 🤖 **자동 AI 참여**: 혼자서도 재미있게 플레이
  - ⏰ **턴 기반**: 60초 시간제한으로 긴장감 UP
  - 🎭 **6가지 장르**: 판타지, SF, 미스터리, 호러, 로맨스, 어드벤처
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

## 🎮 협력 스토리 사용법

### 🏠 방 만들기
1. **협력 스토리** 메뉴 선택
2. **플레이어 이름** 입력
3. **장르 선택** (판타지, SF, 미스터리, 호러, 로맨스, 어드벤처)
4. **"방 만들기"** 클릭
5. **생성된 방 코드를 친구들과 공유** 📤

### 👥 방 참가하기  
1. **협력 스토리** 메뉴 선택
2. **플레이어 이름** 입력
3. **친구로부터 받은 방 코드 입력**
4. **"방 참가하기"** 클릭

### 📖 게임 플레이
1. **모든 플레이어 준비 완료** → 호스트가 **"게임 시작하기"** 클릭
2. **AI가 초기 스토리 생성** 🤖
3. **순서대로 각자 턴에 스토리 이어서 작성** ✏️
4. **60초 시간제한** 내에 입력 완료 ⏰
5. **AI 어시스턴트가 자동 참여**하여 스토리 진행 🎭

> **💡 팁**: 혼자서도 AI와 함께 재미있게 플레이할 수 있어요!

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
