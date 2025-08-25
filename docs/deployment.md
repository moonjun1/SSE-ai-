# 🚀 배포 가이드

## 🌐 배포 옵션 개요

이 프로젝트는 다양한 플랫폼에 배포할 수 있습니다. 개발 단계와 프로덕션 단계로 나누어 최적의 배포 방법을 제시합니다.

## 🔧 배포 전 준비사항

### 1. 환경 변수 설정
```bash
# 프로덕션 환경 변수
OPENAI_API_KEY=your_production_api_key
NODE_ENV=production
CORS_ORIGINS=https://yourdomain.com
```

### 2. 빌드 최적화
```bash
# 프론트엔드 빌드
cd frontend
npm run build

# 백엔드 의존성 확인
cd backend
pip freeze > requirements.txt
```

## 🚀 백엔드 배포

### Option 1: Railway (추천 - 개발/소규모)

**장점:**
- 간단한 설정
- 자동 HTTPS
- 무료 티어 제공
- Git 연동 자동 배포

**배포 단계:**
1. Railway 계정 생성 및 프로젝트 연결
2. 환경 변수 설정
3. `railway.toml` 설정:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"

[[services]]
name = "backend"
```

4. 배포 명령:
```bash
railway login
railway link
railway up
```

### Option 2: Render

**장점:**
- 무료 SSL 인증서
- 자동 배포
- 환경 변수 관리

**설정 파일 (`render.yaml`):**
```yaml
services:
  - type: web
    name: ai-chat-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: OPENAI_API_KEY
        sync: false
```

### Option 3: Docker + AWS EC2

**Dockerfile (백엔드):**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 복사
COPY . .

# 포트 노출
EXPOSE 8000

# 실행 명령
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped
```

**AWS EC2 배포:**
```bash
# EC2 인스턴스에 Docker 설치
sudo yum update -y
sudo yum install docker -y
sudo service docker start

# 프로젝트 클론 및 실행
git clone your-repo
cd your-repo
sudo docker-compose up -d
```

## 💻 프론트엔드 배포

### Option 1: Vercel (추천)

**장점:**
- 자동 HTTPS
- CDN 지원
- Git 연동
- 서버리스 함수 지원

**배포 단계:**
1. Vercel 계정 생성
2. GitHub 저장소 연결
3. 빌드 설정:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

4. 환경 변수 설정:
```bash
VITE_API_URL=https://your-backend-url.com
```

### Option 2: Netlify

**배포 설정 (`netlify.toml`):**
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: AWS S3 + CloudFront

**S3 정적 웹 호스팅:**
```bash
# AWS CLI로 배포
aws s3 sync dist/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

**CloudFront 설정:**
- Origin: S3 버킷
- Viewer Protocol Policy: Redirect HTTP to HTTPS
- Compress Objects Automatically: Yes

## 🔄 CI/CD 파이프라인

### GitHub Actions 설정

**백엔드 배포 (`.github/workflows/deploy-backend.yml`):**
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        uses: railwayapp/railway-deploy-action@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend
```

**프론트엔드 배포 (`.github/workflows/deploy-frontend.yml`):**
```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths: ['frontend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          
      - name: Build
        run: |
          cd frontend
          npm run build
          
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 🌐 도메인 및 SSL

### 도메인 연결
1. **백엔드**: `api.yourdomain.com`
2. **프론트엔드**: `yourdomain.com`

### SSL 인증서
- **Vercel/Netlify**: 자동 SSL 제공
- **Railway/Render**: 자동 SSL 제공
- **커스텀 서버**: Let's Encrypt 사용

```bash
# Let's Encrypt 설정 (Ubuntu)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 📊 모니터링 및 로깅

### 애플리케이션 모니터링

**Sentry 설정 (에러 추적):**
```python
# 백엔드 (main.py)
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="YOUR_SENTRY_DSN",
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)
```

```typescript
// 프론트엔드
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
});
```

### 로깅 설정

**백엔드 로깅:**
```python
import logging
from pythonjsonlogger import jsonlogger

# 구조화된 로깅
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger = logging.getLogger()
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)
```

## 💰 비용 최적화

### 무료 티어 활용
- **Railway**: 월 $5 크레딧 무료
- **Render**: 무료 웹 서비스 (제한 있음)
- **Vercel**: 개인 프로젝트 무료
- **Netlify**: 월 100GB 대역폭 무료

### 비용 효율적인 구성
```
프론트엔드: Vercel (무료)
백엔드: Railway ($5/월)
데이터베이스: 미사용 (API 키만 사용)
총 비용: ~$5/월
```

## 🔒 보안 고려사항

### 환경별 CORS 설정
```python
# 프로덕션 환경
if os.getenv("NODE_ENV") == "production":
    allowed_origins = ["https://yourdomain.com"]
else:
    allowed_origins = ["http://localhost:5173"]
```

### API 키 보안
- 환경 변수로만 관리
- 코드에 하드코딩 금지
- 정기적인 키 로테이션

### Rate Limiting
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

@router.post("/stream")
@limiter.limit("10/minute")
async def stream_chat(request: Request, ...):
    # API 호출 제한
```

## 📋 배포 체크리스트

### 배포 전
- [ ] 환경 변수 설정 확인
- [ ] API 키 보안 점검
- [ ] CORS 설정 확인
- [ ] 빌드 테스트 완료
- [ ] 에러 처리 검증

### 배포 후
- [ ] API 엔드포인트 동작 확인
- [ ] 프론트엔드-백엔드 통신 테스트
- [ ] SSL 인증서 확인
- [ ] 모니터링 설정 완료
- [ ] 로그 수집 확인

## 🔧 문제 해결

### 일반적인 이슈

**CORS 에러:**
```python
# 백엔드 CORS 설정 확인
allow_origins=["https://your-frontend-domain.com"]
```

**API 연결 실패:**
```typescript
// 프론트엔드 API URL 확인
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-domain.com' 
  : 'http://localhost:8000';
```

**빌드 실패:**
```bash
# 의존성 버전 충돌 해결
npm ci --legacy-peer-deps
```

## 📈 스케일링

### 수평 확장
- 로드 밸런서 추가
- 멀티 인스턴스 배포
- CDN 활용

### 성능 최적화
- Redis 캐싱 추가
- 데이터베이스 도입
- API 응답 압축