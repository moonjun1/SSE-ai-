# 📋 완전한 설치 및 실행 가이드

> **처음 시작하는 분들을 위한 단계별 설치 가이드입니다. 컴퓨터 초보자도 쉽게 따라할 수 있도록 상세히 설명했습니다.**

## 🎯 준비물 체크리스트

다음 항목들이 준비되어야 합니다:
- [ ] Windows 10 이상 또는 macOS 또는 Linux
- [ ] 인터넷 연결
- [ ] OpenAI API 키 (필수)
- [ ] 약 30분의 시간

## 📥 1단계: 필수 프로그램 설치

### 1.1 Git 설치
**Git은 코드를 다운로드하기 위해 필요합니다.**

**Windows:**
1. [Git 공식 홈페이지](https://git-scm.com/download/win) 접속
2. "64-bit Git for Windows Setup" 다운로드
3. 다운로드된 파일 실행
4. 설치 과정에서 모든 옵션을 기본값으로 선택하고 "Next" 클릭
5. 설치 완료 후 "Git Bash" 프로그램이 생성됨

**macOS:**
```bash
# Homebrew가 있다면
brew install git

# 또는 Xcode Command Line Tools
xcode-select --install
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install git
```

### 1.2 Python 설치
**Python은 백엔드 서버를 실행하기 위해 필요합니다.**

**Windows:**
1. [Python 공식 홈페이지](https://www.python.org/downloads/) 접속
2. "Download Python 3.11.x" 클릭 (3.8 이상 버전)
3. 다운로드된 파일 실행
4. ⚠️ **중요**: "Add Python to PATH" 체크박스를 반드시 체크!
5. "Install Now" 클릭

**macOS:**
```bash
# Homebrew 사용 (권장)
brew install python

# 또는 공식 홈페이지에서 다운로드
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip

# CentOS/RHEL
sudo yum install python3 python3-pip
```

### 1.3 Node.js 설치
**Node.js는 프론트엔드를 실행하기 위해 필요합니다.**

**모든 운영체제:**
1. [Node.js 공식 홈페이지](https://nodejs.org/) 접속
2. "LTS" 버전 다운로드 (18.x 이상 권장)
3. 다운로드된 파일 실행하고 기본 옵션으로 설치

### 1.4 설치 확인
터미널(또는 명령 프롬프트)에서 다음 명령어들을 실행해보세요:

```bash
git --version
# 출력 예시: git version 2.40.0

python --version
# 출력 예시: Python 3.11.5

node --version  
# 출력 예시: v18.17.0

npm --version
# 출력 예시: 9.6.7
```

모든 명령어가 버전을 출력하면 설치가 완료된 것입니다!

## 🔑 2단계: OpenAI API 키 발급

### 2.1 OpenAI 계정 생성
1. [OpenAI 웹사이트](https://platform.openai.com/) 접속
2. "Sign Up" 클릭하여 계정 생성
3. 이메일 인증 및 전화번호 인증 완료

### 2.2 API 키 발급
1. [OpenAI API Keys 페이지](https://platform.openai.com/api-keys) 접속
2. "Create new secret key" 클릭
3. 키 이름 입력 (예: "AI-Game-Center")
4. **⚠️ 중요**: 생성된 키를 안전한 곳에 복사 저장 (다시 볼 수 없습니다!)

### 2.3 API 크레딧 확인
1. [Billing 페이지](https://platform.openai.com/account/billing/overview) 접속
2. 무료 크레딧이 있는지 확인
3. 필요시 결제 방법 추가 ($5-10 정도면 충분)

## 📦 3단계: 프로젝트 다운로드

### 3.1 프로젝트 클론
터미널(Git Bash)을 열고 다음 명령어를 실행:

```bash
# 작업할 폴더로 이동 (예: 바탕화면)
cd Desktop

# 프로젝트 다운로드
git clone https://github.com/moonjun1/SSE-ai-.git

# 프로젝트 폴더로 이동
cd SSE-ai-
```

### 3.2 프로젝트 구조 확인
```bash
ls
# 다음과 같은 폴더들이 보여야 함:
# backend/  frontend/  docs/  README.md
```

## ⚙️ 4단계: 환경 설정

### 4.1 환경 변수 파일 생성
프로젝트 최상위 폴더에서:

**Windows (메모장 사용):**
```bash
notepad .env
```

**macOS/Linux:**
```bash
nano .env
```

다음 내용을 입력하고 저장:
```env
OPENAI_API_KEY=여기에_발급받은_API_키_입력
ANTHROPIC_API_KEY=선택사항_Claude_사용시
```

예시:
```env
OPENAI_API_KEY=sk-proj-abcd1234efgh5678...
```

### 4.2 백엔드 설정
```bash
# 백엔드 폴더로 이동
cd backend

# Python 가상환경 생성 (권장)
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 필요한 패키지 설치
pip install -r requirements.txt
```

### 4.3 프론트엔드 설정
새 터미널을 열고:
```bash
# 프로젝트 폴더로 이동
cd Desktop/SSE-ai-/frontend

# Node.js 패키지 설치
npm install
```

## 🚀 5단계: 실행하기

### 5.1 백엔드 실행
백엔드 터미널에서:
```bash
# backend 폴더에서 실행
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

성공 메시지:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 5.2 프론트엔드 실행
프론트엔드 터미널에서:
```bash
# frontend 폴더에서 실행
cd frontend
npm run dev
```

성공 메시지:
```
VITE v4.4.5  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

## 🎉 6단계: 접속 확인

### 6.1 웹사이트 접속
브라우저에서 다음 주소들을 열어보세요:
- **메인 웹사이트**: http://localhost:5173
- **API 문서**: http://localhost:8000/docs
- **WebSocket 테스트**: http://localhost:8000/ws/test

### 6.2 기능 테스트
1. **채팅 기능**: AI 채팅 메뉴에서 메시지 전송 테스트
2. **게임 기능**: 스토리 어드벤처나 추리 게임 실행
3. **협력 스토리**: 방 만들기 및 멀티플레이어 기능 테스트

## 🔧 편리한 실행 방법

### Windows 사용자용 배치 파일
프로젝트 폴더에 다음 파일들을 생성하세요:

**run_backend.bat:**
```batch
@echo off
cd backend
call venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
```

**run_frontend.bat:**
```batch
@echo off
cd frontend
npm run dev
pause
```

### macOS/Linux 사용자용 쉘 스크립트
**run_backend.sh:**
```bash
#!/bin/bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**run_frontend.sh:**
```bash
#!/bin/bash
cd frontend
npm run dev
```

실행 권한 부여:
```bash
chmod +x run_backend.sh run_frontend.sh
```

## 📱 다른 기기에서 접속하기

### 같은 네트워크의 다른 기기에서 접속
1. 서버 컴퓨터의 IP 주소 확인:
   - Windows: `ipconfig`
   - macOS/Linux: `ifconfig` 또는 `ip addr`

2. 다른 기기에서 접속:
   - 프론트엔드: `http://서버IP:5173`
   - 백엔드: `http://서버IP:8000`

예시: `http://192.168.1.100:5173`

## 🎮 사용법 가이드

### AI 채팅 사용하기
1. 메인 화면에서 "AI 채팅" 선택
2. 원하는 AI 모델 선택 (GPT-3.5, GPT-4, Claude 등)
3. 메시지 입력하고 전송
4. 실시간 스트리밍으로 AI 응답 확인

### 협력 스토리 플레이
1. "협력 스토리" 메뉴 선택
2. **방 만들기**:
   - 플레이어 이름 입력
   - 장르 선택 (판타지, SF, 미스터리 등)
   - "방 만들기" 클릭
   - 생성된 방 코드를 친구들과 공유

3. **방 참가하기**:
   - 플레이어 이름 입력  
   - 친구로부터 받은 방 코드 입력
   - "방 참가하기" 클릭

4. **게임 플레이**:
   - 모든 플레이어 준비 → 호스트가 "게임 시작"
   - AI가 초기 스토리 생성
   - 순서대로 60초 내에 스토리 이어가기
   - AI 어시스턴트가 자동 참여

### 기타 게임들
- **스토리 어드벤처**: 혼자 즐기는 인터랙티브 소설
- **추리 게임**: AI가 낸 미스터리 사건 해결
- **미니 게임**: 단어 퍼즐, 수학 퀴즈, 기억력 게임
- **타임어택 추리**: 시간 제한 추리 게임

## 🛡️ 보안 주의사항

### API 키 보안
- `.env` 파일을 절대 다른 사람과 공유하지 마세요
- GitHub에 업로드하지 마세요
- API 키가 노출되면 즉시 재발급하세요

### 방화벽 설정
- 포트 8000, 5173을 방화벽에서 허용해야 할 수 있습니다
- 공유기 사용 시 포트 포워딩 설정이 필요할 수 있습니다

## 💡 유용한 팁

### 개발 시 유용한 도구
- **브라우저 개발자 도구** (F12): 네트워크 및 콘솔 로그 확인
- **Postman**: API 테스트
- **VS Code**: 코드 편집 (추천)

### 성능 최적화
- **메모리 부족 시**: Node.js 힙 메모리 증가
  ```bash
  node --max-old-space-size=4096 node_modules/.bin/vite
  ```

### 다크모드 및 테마
- 우상단 달/해 아이콘으로 다크모드 전환
- 설정은 자동으로 저장됩니다

## 📞 지원 및 문의

문제가 발생하면:
1. 이 가이드의 트러블슈팅 섹션 확인
2. [GitHub Issues](https://github.com/moonjun1/SSE-ai-/issues)에 문제 보고
3. 로그 파일과 에러 메시지를 함께 첨부

---

> 🎉 **축하합니다!** 이제 AI 게임 센터를 성공적으로 설치하고 실행했습니다. 
> 친구들과 함께 협력 스토리를 만들어보거나, 다양한 AI 게임들을 즐겨보세요!