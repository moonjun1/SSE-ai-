# 멀티플레이어 시스템 (Multiplayer System)

## 개요

AI 게임 센터의 멀티플레이어 시스템은 WebSocket 기반의 실시간 통신을 통해 여러 사용자가 동시에 게임에 참여할 수 있는 환경을 제공합니다. 현재 협력 스토리 모드에서 활용되고 있으며, 향후 다른 게임 모드에도 확장 적용 예정입니다.

## 아키텍처

### 시스템 구조
```
클라이언트 1 ←→ WebSocket ←→ Connection Manager ←→ Room Manager ←→ Game Logic
클라이언트 2 ←→ WebSocket ←→ Connection Manager ←→ Room Manager ←→ Game Logic  
클라이언트 3 ←→ WebSocket ←→ Connection Manager ←→ Room Manager ←→ Game Logic
                                      ↓
                               AI Service (자동 참여)
```

### 핵심 컴포넌트

#### 1. Connection Manager
- WebSocket 연결 관리
- 클라이언트 생명주기 추적
- 메시지 라우팅

#### 2. Room Manager  
- 게임 방 생성/삭제
- 플레이어 참가/퇴장 관리
- 방 상태 동기화

#### 3. Game Logic
- 턴 기반 게임 진행
- 규칙 엔진
- AI 플레이어 통합

## WebSocket 연결 관리

### 연결 수명주기

1. **연결 설정**
   ```python
   async def connect(self, websocket: WebSocket, player_id: str):
       await websocket.accept()
       self.active_connections[player_id] = websocket
   ```

2. **메시지 처리**
   ```python
   async def handle_message(self, message: dict, player_id: str):
       message_type = message.get('type')
       # 메시지 타입별 처리 로직
   ```

3. **연결 해제**
   ```python
   def disconnect(self, player_id: str):
       if player_id in self.active_connections:
           del self.active_connections[player_id]
   ```

### 메시지 브로드캐스팅

#### 개인 메시지
```python
async def send_personal_message(self, message: dict, player_id: str):
    if player_id in self.active_connections:
        await self.active_connections[player_id].send_text(json.dumps(message))
```

#### 방 전체 메시지
```python
async def send_room_message(self, message: dict, room_id: str):
    room = self.rooms[room_id]
    for player_id in room['players']:
        await self.send_personal_message(message, player_id)
```

## 방(Room) 시스템

### 방 데이터 구조
```python
room = {
    'host': 'player-abc123',
    'players': {
        'player-abc123': {
            'name': '플레이어1',
            'is_host': True,
            'is_online': True,
            'joined_at': '2024-01-01T00:00:00'
        },
        'ai_room123': {
            'name': 'AI 어시스턴트', 
            'is_host': False,
            'is_online': True,
            'joined_at': '2024-01-01T00:01:00'
        }
    },
    'game_state': 'playing',  # waiting, playing, finished
    'game_settings': {
        'genre': 'fantasy',
        'model': 'openai-gpt3.5',
        'max_players': 4
    },
    'story_content': [...],
    'current_turn': 'player-abc123',
    'created_at': '2024-01-01T00:00:00'
}
```

### 방 생성 프로세스
1. 고유한 방 ID 생성 (8자리 대문자)
2. 호스트 플레이어 추가
3. 기본 게임 설정 적용
4. 방 상태를 'waiting'으로 설정

### 방 참가 프로세스
1. 방 ID 유효성 검증
2. 방 인원 제한 확인
3. 게임 상태 확인 (대기 중인지)
4. 플레이어 정보 추가
5. 기존 플레이어들에게 알림

## 턴 기반 게임 시스템

### 턴 관리
```python
def next_turn(self, room_id: str):
    room = self.rooms[room_id]
    player_ids = list(room['players'].keys())
    current_index = player_ids.index(room['current_turn'])
    next_index = (current_index + 1) % len(player_ids)
    room['current_turn'] = player_ids[next_index]
```

### 시간 제한 처리
- 각 턴마다 60초 제한
- 시간 초과 시 자동으로 다음 턴
- 프론트엔드에서 시각적 카운트다운

### AI 턴 자동 처리
```python
async def handle_ai_turn(self, room_id: str):
    if room['current_turn'].startswith('ai_'):
        # AI 응답 생성
        ai_response = story_service.continue_cooperative_story(...)
        # 턴 추가 및 다음 턴으로 이동
        self.submit_ai_turn(room_id, ai_response)
```

## 실시간 상태 동기화

### 플레이어 상태 업데이트
- 온라인/오프라인 상태
- 현재 턴 표시
- 게임 진행 상황

### 이벤트 기반 업데이트
```javascript
// 플레이어 참가
{
  "type": "player_joined",
  "player_id": "player-xyz789",
  "room_info": {...}
}

// 턴 제출
{
  "type": "turn_submitted", 
  "room_info": {...},
  "story_content": [...]
}

// AI 턴 완료
{
  "type": "ai_turn_completed",
  "room_info": {...},
  "story_content": [...]
}
```

## AI 통합

### 자동 AI 플레이어
- 게임 시작 시 자동으로 AI 어시스턴트 추가
- AI 턴이 되면 자동으로 응답 생성
- 네트워크 지연 시뮬레이션으로 자연스러운 진행

### AI 응답 생성
```python
def continue_cooperative_story(self, current_story: str, genre: str):
    # 현재 스토리 컨텍스트 분석
    # 장르에 맞는 응답 생성
    # 다음 플레이어가 이어갈 수 있는 열린 결말
```

## 에러 처리 및 복구

### 연결 끊김 처리
- 자동 재연결 시도
- 게임 상태 복구
- 다른 플레이어들에게 알림

### 게임 상태 복구
- 플레이어 복귀 시 현재 상태 전송
- 스토리 내용 동기화
- 턴 순서 재정렬

### 예외 상황 처리
```python
try:
    # 게임 로직 실행
except Exception as e:
    # 에러 로깅
    # 안전한 상태로 복구
    # 플레이어들에게 에러 알림
```

## 성능 최적화

### 메모리 관리
- 비활성 방 자동 정리
- 연결 끊긴 플레이어 정리
- 게임 히스토리 압축

### 네트워크 최적화
- 메시지 배치 처리
- 불필요한 업데이트 방지
- JSON 압축

### 확장성 고려사항
- 수평 확장 가능한 구조
- Redis 기반 세션 공유 (향후)
- 로드 밸런싱 대응 (향후)

## 보안 고려사항

### 입력 검증
- 메시지 크기 제한
- 특수 문자 필터링
- SQL Injection 방지

### Rate Limiting
- 메시지 전송 빈도 제한
- 방 생성 횟수 제한
- 스팸 방지

### 인증 및 권한
- 플레이어 ID 검증
- 호스트 권한 관리
- 방 접근 권한 확인

## 모니터링 및 로깅

### 메트릭 수집
- 동시 접속자 수
- 활성 방 개수
- 평균 게임 시간
- 에러 발생률

### 로깅 전략
```python
logger.info(f"Player {player_id} joined room {room_id}")
logger.warning(f"Game timeout in room {room_id}")
logger.error(f"WebSocket error: {error}")
```

## 개발 및 디버깅

### WebSocket 테스트
- `/ws/test` 엔드포인트 제공
- 브라우저 기반 테스트 인터페이스
- 메시지 로깅 및 디버깅

### 개발 도구
- WebSocket 연결 상태 모니터링
- 실시간 방 정보 조회
- 게임 상태 디버깅

## 향후 확장 계획

### 새로운 게임 모드
- 실시간 퀴즈 대전
- 협력 추리 게임
- 팀 기반 경쟁 게임

### 고급 기능
- 음성 채팅 통합
- 화면 공유
- 파일 공유
- 실시간 그림 그리기

### 인프라 개선
- Redis 클러스터 도입
- 마이크로서비스 아키텍처
- 글로벌 서버 분산
- CDN 최적화

## 문제 해결 가이드

### 일반적인 문제

1. **연결 실패**
   - 방화벽 설정 확인
   - WebSocket 지원 브라우저 사용
   - 네트워크 연결 상태 확인

2. **게임 진행 중단**
   - 브라우저 새로고침
   - 다른 플레이어들의 네트워크 상태 확인
   - 서버 상태 모니터링

3. **AI 응답 오류**
   - API 키 설정 확인
   - API 호출 한도 확인
   - 대체 응답 메커니즘 작동

### 디버깅 팁
- 브라우저 개발자 도구의 Network 탭에서 WebSocket 연결 확인
- Console에서 실시간 메시지 로그 확인
- 백엔드 로그에서 에러 메시지 추적