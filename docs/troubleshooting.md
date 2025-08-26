# 🔧 문제 해결 가이드 (Troubleshooting)

> **자주 발생하는 문제들과 해결 방법을 정리했습니다. 문제가 발생하면 차례대로 확인해보세요.**

## 🚨 설치 및 실행 문제

### ❌ Python이 설치되지 않았다는 오류
**증상:**
```
'python' is not recognized as an internal or external command
```

**해결방법:**
1. Python 재설치 시 "Add Python to PATH" 체크 필수
2. 설치 후 터미널 재시작
3. 환경 변수 수동 추가:
   - Windows: 시스템 환경 변수에서 PATH에 Python 경로 추가
   - macOS/Linux: `~/.bashrc` 또는 `~/.zshrc`에 추가

### ❌ Node.js/npm 명령어가 인식되지 않음
**증상:**
```
'node' is not recognized as an internal or external command
'npm' is not recognized as an internal or external command
```

**해결방법:**
1. Node.js 재설치 (LTS 버전 권장)
2. 터미널 재시작
3. 설치 경로 확인: `C:\Program Files\nodejs\` (Windows)

### ❌ Git 명령어가 인식되지 않음
**증상:**
```
'git' is not recognized as an internal or external command
```

**해결방법:**
1. Git Bash 사용 (Windows 검색에서 "Git Bash" 실행)
2. 또는 Git을 PATH에 추가하여 Command Prompt에서 사용
3. VS Code 터미널에서는 Git Bash를 기본으로 설정 가능

## 🔑 API 키 관련 문제

### ❌ OpenAI API 키 오류
**증상:**
```
OpenAI API 오류: Incorrect API key provided
Authentication failed
```

**해결방법:**
1. `.env` 파일 위치 확인 (프로젝트 최상위 폴더)
2. API 키 형식 확인: `OPENAI_API_KEY=sk-proj-...`
3. API 키 재발급 후 교체
4. 따옴표 없이 입력 확인

### ❌ API 크레딧 부족
**증상:**
```
You exceeded your current quota
insufficient_quota
```

**해결방법:**
1. [OpenAI Billing](https://platform.openai.com/account/billing/overview) 접속
2. 결제 방법 추가 및 크레딧 충전
3. Usage limits 확인

### ❌ API 키가 로드되지 않음
**증상:**
- 백엔드에서 "No OpenAI API key found!" 메시지

**해결방법:**
1. `.env` 파일이 올바른 위치에 있는지 확인
2. 파일명이 정확히 `.env`인지 확인 (확장자 없음)
3. 백엔드 서버 재시작

## 🌐 네트워크 및 연결 문제

### ❌ 포트가 이미 사용 중
**증상:**
```
Error: listen EADDRINUSE: address already in use :::8000
Port 5173 is already in use
```

**해결방법:**
1. 다른 포트 사용:
   ```bash
   # 백엔드
   uvicorn app.main:app --reload --port 8001
   
   # 프론트엔드  
   npm run dev -- --port 5174
   ```

2. 기존 프로세스 종료:
   ```bash
   # Windows
   netstat -ano | findstr :8000
   taskkill /PID <PID번호> /F
   
   # macOS/Linux
   lsof -ti:8000 | xargs kill -9
   ```

### ❌ CORS 오류
**증상:**
```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**해결방법:**
1. 백엔드와 프론트엔드 URL 확인
2. `main.py`의 CORS 설정 확인:
   ```python
   allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"]
   ```
3. 브라우저 캐시 삭제 후 새로고침

### ❌ WebSocket 연결 실패
**증상:**
- 협력 스토리에서 "연결 실패" 또는 플레이어 목록 (0/4)

**해결방법:**
1. 백엔드 서버 상태 확인
2. 브라우저 새로고침 (Ctrl+F5)
3. 방화벽 설정 확인
4. 다른 브라우저에서 테스트

## 💻 프론트엔드 문제

### ❌ npm install 실패
**증상:**
```
npm ERR! code ENOENT
npm ERR! network request failed
```

**해결방법:**
1. Node.js 버전 확인 (16.x 이상 권장)
2. npm 캐시 정리:
   ```bash
   npm cache clean --force
   ```
3. `package-lock.json` 및 `node_modules` 삭제 후 재설치:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### ❌ Vite 빌드 오류
**증상:**
```
Build failed with errors
TypeError: Cannot read properties of undefined
```

**해결방법:**
1. TypeScript 오류 확인 및 수정
2. 의존성 업데이트:
   ```bash
   npm update
   ```
3. 개발 서버 재시작

### ❌ 화면이 깨지거나 스타일 미적용
**증상:**
- CSS 스타일이 적용되지 않음
- 레이아웃이 깨짐

**해결방법:**
1. Tailwind CSS 설정 확인
2. 브라우저 캐시 강제 새로고침 (Ctrl+Shift+R)
3. 다크모드 토글 시도

## 🖥️ 백엔드 문제

### ❌ Python 패키지 설치 실패
**증상:**
```
ERROR: Could not find a version that satisfies the requirement
ERROR: No matching distribution found
```

**해결방법:**
1. Python 버전 확인 (3.8+ 권장)
2. pip 업그레이드:
   ```bash
   python -m pip install --upgrade pip
   ```
3. 가상환경 재생성:
   ```bash
   rm -rf venv
   python -m venv venv
   source venv/bin/activate  # macOS/Linux
   venv\Scripts\activate     # Windows
   pip install -r requirements.txt
   ```

### ❌ FastAPI 서버 시작 실패
**증상:**
```
ModuleNotFoundError: No module named 'app'
ImportError: cannot import name 'FastAPI'
```

**해결방법:**
1. 현재 디렉토리 확인 (`backend` 폴더에서 실행)
2. 가상환경 활성화 확인
3. 패키지 재설치:
   ```bash
   pip install fastapi uvicorn
   ```

### ❌ AI 모델 응답 오류
**증상:**
```
OpenAI API 호출 실패
모델 응답을 받을 수 없습니다
```

**해결방법:**
1. 인터넷 연결 확인
2. OpenAI API 서비스 상태 확인
3. 다른 모델로 변경 (GPT-3.5 → GPT-4 또는 그 반대)
4. 요청 빈도 제한 확인 (Rate Limit)

## 🎮 게임 관련 문제

### ❌ 협력 스토리에서 게임 시작 안됨
**증상:**
- "게임 시작하기" 버튼이 나타나지 않음
- 플레이어 목록이 비어있음

**해결방법:**
1. 브라우저 개발자 도구(F12) → Console 탭 확인
2. WebSocket 연결 상태 확인:
   ```javascript
   console.log('WebSocket 연결 상태:', websocket.readyState);
   ```
3. 백엔드 로그에서 WebSocket 연결 확인
4. 방 참가 순서 재시도 (방 생성 → 참가)

### ❌ AI 턴에서 멈춤
**증상:**
- AI 차례에서 계속 "작성 중..." 상태
- 턴이 넘어가지 않음

**해결방법:**
1. OpenAI API 키 및 크레딧 확인
2. 백엔드 콘솔에서 에러 메시지 확인
3. 게임 재시작 (뒤로가기 → 다시 시작)

### ❌ 스토리나 추리 게임 로딩 무한
**증상:**
- "스토리 생성 중..." 계속 표시
- 응답이 오지 않음

**해결방법:**
1. 네트워크 연결 확인
2. API 키 및 요청 한도 확인
3. 페이지 새로고침 후 재시도

## 🔍 디버깅 방법

### 로그 확인하기
**백엔드 로그:**
- 터미널에서 백엔드 실행 시 출력되는 메시지 확인
- ERROR, WARNING 메시지 중점 확인

**프론트엔드 로그:**  
- 브라우저 F12 → Console 탭
- Network 탭에서 API 요청/응답 확인
- Application 탭에서 LocalStorage 확인

### WebSocket 디버깅
1. http://localhost:8000/ws/test 접속
2. WebSocket 연결 테스트
3. 메시지 송수신 테스트

### API 테스트
1. http://localhost:8000/docs 접속
2. "Try it out" 기능으로 API 직접 테스트
3. 각 엔드포인트별 응답 확인

## 🚨 긴급 해결 방법

### 모든 것을 다시 시작
```bash
# 1. 모든 터미널/프로세스 종료

# 2. 가상환경 재생성
cd backend
rm -rf venv
python -m venv venv
source venv/bin/activate  # 또는 venv\Scripts\activate
pip install -r requirements.txt

# 3. Node.js 패키지 재설치  
cd ../frontend
rm -rf node_modules package-lock.json
npm install

# 4. 서버들 재시작
cd ../backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 새 터미널에서
cd frontend
npm run dev
```

### 프로젝트 재다운로드
```bash
# 기존 폴더 백업 후 삭제
mv SSE-ai- SSE-ai-backup

# 새로 다운로드
git clone https://github.com/moonjun1/SSE-ai-.git
cd SSE-ai-

# .env 파일 복사
cp ../SSE-ai-backup/.env .

# 처음부터 다시 설치
```

## 📱 브라우저별 호환성

### 권장 브라우저
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### 호환성 문제 해결
1. **WebSocket 지원 확인**: 구형 브라우저에서는 지원하지 않을 수 있음
2. **캐시 문제**: 시크릿/프라이빗 모드에서 테스트
3. **확장 프로그램**: 광고 차단기 등이 WebSocket을 차단할 수 있음

## 🏠 네트워크 설정

### 공유기/방화벽 설정
**포트 개방 필요:**
- 8000 (백엔드)
- 5173 (프론트엔드)

**Windows 방화벽:**
```bash
# 관리자 권한으로 실행
netsh advfirewall firewall add rule name="AI Game Server" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="AI Game Frontend" dir=in action=allow protocol=TCP localport=5173
```

### 외부 접속 설정
```bash
# 백엔드: 모든 IP에서 접속 허용 (이미 설정됨)
--host 0.0.0.0

# 프론트엔드: 외부 접속 허용
npm run dev -- --host
```

## 💬 도움 요청하기

### 이슈 보고 시 포함할 정보
1. **운영체제**: Windows 10, macOS Big Sur, Ubuntu 20.04 등
2. **브라우저**: Chrome 118.0.5993.88 등  
3. **Node.js 버전**: `node --version`
4. **Python 버전**: `python --version`
5. **에러 메시지**: 정확한 오류 내용
6. **재현 단계**: 어떤 동작을 했을 때 문제가 발생하는지

### GitHub 이슈 템플릿
```markdown
## 🐛 버그 리포트

**환경 정보:**
- OS: [Windows 10 / macOS 12.0 / Ubuntu 20.04]
- Browser: [Chrome 118 / Firefox 119 / Safari 16]
- Node.js: [18.17.0]
- Python: [3.11.5]

**문제 설명:**
[문제가 무엇인지 간단히 설명]

**재현 단계:**
1. [첫 번째 단계]
2. [두 번째 단계]
3. [에러 발생]

**에러 메시지:**
```
[여기에 정확한 에러 메시지 붙여넣기]
```

**스크린샷:**
[가능하다면 스크린샷 첨부]

**추가 정보:**
[기타 도움이 될만한 정보]
```

---

> 💡 **팁**: 대부분의 문제는 서버 재시작이나 브라우저 새로고침으로 해결됩니다!  
> 그래도 해결되지 않으면 위의 가이드를 차례대로 시도해보세요.