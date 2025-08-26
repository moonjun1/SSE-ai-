# 협력 스토리 (Cooperative Story)

## 개요

협력 스토리는 여러 플레이어가 실시간으로 함께 참여하여 하나의 창의적인 이야기를 만들어가는 멀티플레이어 게임입니다. WebSocket 기술을 활용한 실시간 통신으로 플레이어들이 턴을 번갈아가며 스토리를 작성할 수 있습니다.

## 주요 기능

### 🏠 방 시스템
- **방 생성**: 호스트가 새로운 게임 방을 생성
- **방 참가**: 방 코드를 입력하여 기존 방에 참가
- **실시간 동기화**: 모든 플레이어의 상태가 실시간으로 동기화
- **최대 4명**: 한 방에 최대 4명까지 참여 가능

### 📖 스토리 텔링
- **턴 기반**: 플레이어들이 순서대로 스토리를 이어서 작성
- **장르 선택**: 판타지, SF, 미스터리, 호러, 로맨스, 어드벤처 중 선택
- **자동 어시스턴트**: AI 어시스턴트가 자동으로 참여하여 스토리 진행
- **시간 제한**: 각 턴마다 60초 시간 제한

### ⚡ 실시간 기능
- **WebSocket 통신**: 실시간 메시지 전송 및 수신
- **플레이어 상태**: 온라인/오프라인 상태 실시간 표시
- **턴 알림**: 현재 차례인 플레이어에게 시각적 알림
- **자동 진행**: AI 턴이 자동으로 처리되어 게임 흐름 유지

## 게임 플레이

### 1. 방 생성
```typescript
// 호스트가 방을 생성
const createRoom = () => {
  const playerId = 'player-' + Math.random().toString(36).substr(2, 9);
  websocket.current = new WebSocket(`ws://localhost:8000/ws/${playerId}`);
  
  websocket.current.send(JSON.stringify({
    type: 'create_room',
    player_name: playerName,
    game_settings: {
      genre: selectedGenre,
      model: 'openai-gpt3.5'
    }
  }));
};
```

### 2. 방 참가
```typescript
// 다른 플레이어가 방에 참가
const joinRoom = () => {
  websocket.current.send(JSON.stringify({
    type: 'join_room',
    player_name: playerName,
    room_id: roomId
  }));
};
```

### 3. 게임 진행
```typescript
// 턴 제출
const submitTurn = () => {
  websocket.current.send(JSON.stringify({
    type: 'submit_turn',
    text: myInput
  }));
};
```

## 기술 구조

### 백엔드 아키텍처

#### WebSocket Manager (`websocket_manager.py`)
- 클라이언트 연결 관리
- 방 생성 및 참가 처리
- 턴 시스템 관리
- AI 턴 자동 처리

```python
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.rooms: Dict[str, Dict[str, any]] = {}
        self.player_rooms: Dict[str, str] = {}
```

#### Story Game Service (`story_game_service.py`)
- 협력 모드용 스토리 생성
- 장르별 스토리 템플릿
- AI 어시스턴트 응답 생성

```python
def start_cooperative_story(self, genre: str, model: str = "openai-gpt3.5"):
    """협력 모드용 새로운 스토리 시작"""
    # 장르에 맞는 초기 스토리 생성
    
def continue_cooperative_story(self, current_story: str, genre: str, model: str):
    """협력 모드용 스토리 계속하기"""
    # 현재 스토리를 이어서 AI 응답 생성
```

### 프론트엔드 컴포넌트

#### CooperativeStory Component
- 게임 상태 관리 (setup, waiting, playing)
- WebSocket 연결 및 메시지 처리
- 실시간 UI 업데이트
- 턴 타이머 및 플레이어 상태 표시

```typescript
interface CooperativeStoryProps {
  onBack: () => void;
  darkMode: boolean;
}

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isOnline: boolean;
}
```

### WebSocket 메시지 프로토콜

#### 클라이언트 → 서버
```json
{
  "type": "create_room",
  "player_name": "플레이어1",
  "game_settings": {
    "genre": "fantasy",
    "model": "openai-gpt3.5"
  }
}
```

```json
{
  "type": "join_room",
  "player_name": "플레이어2",
  "room_id": "ABC123"
}
```

```json
{
  "type": "submit_turn",
  "text": "주인공은 신비로운 문을 열었습니다..."
}
```

#### 서버 → 클라이언트
```json
{
  "type": "room_created",
  "room_id": "ABC123",
  "room_info": {
    "players": {...},
    "game_state": "waiting"
  }
}
```

```json
{
  "type": "game_started",
  "room_info": {...},
  "story_content": [
    {
      "player": "AI",
      "text": "어둠 속에서 모험이 시작됩니다...",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## 사용 방법

### 1. 새 방 만들기
1. 협력 스토리 메뉴 선택
2. 플레이어 이름 입력
3. 원하는 장르 선택
4. "방 만들기" 클릭
5. 생성된 방 코드를 친구들과 공유

### 2. 방 참가하기
1. 협력 스토리 메뉴 선택
2. 플레이어 이름 입력
3. 친구로부터 받은 방 코드 입력
4. "방 참가하기" 클릭

### 3. 게임 플레이
1. 모든 플레이어가 준비되면 호스트가 "게임 시작하기" 클릭
2. AI가 초기 스토리를 생성
3. 순서대로 각자의 턴에 스토리 이어서 작성
4. 60초 시간 제한 내에 입력 완료
5. AI 어시스턴트가 자동으로 참여하여 스토리 진행

## 장르별 특징

### 🧙‍♂️ 판타지 (Fantasy)
- 마법과 모험이 가득한 세계
- 용, 마법사, 기사 등 판타지 요소

### 🚀 SF (Sci-Fi)
- 미래와 우주를 탐험하는 이야기
- 첨단 기술과 외계 생명체

### 🔍 미스터리 (Mystery)
- 수수께끼와 추리가 중심인 스토리
- 사건 해결과 단서 찾기

### 👻 호러 (Horror)
- 공포와 스릴이 넘치는 어두운 이야기
- 긴장감 넘치는 무서운 상황

### 💕 로맨스 (Romance)
- 사랑과 감정이 중심인 이야기
- 로맨틱한 만남과 관계 발전

### 🗺️ 어드벤처 (Adventure)
- 액션과 모험이 가득한 스토리
- 여행과 탐험, 액션 시퀀스

## 기술적 고려사항

### 성능 최적화
- WebSocket 연결 풀링으로 메모리 사용량 최적화
- 턴 타임아웃으로 무한 대기 방지
- 자동 재연결 시스템으로 네트워크 안정성 확보

### 확장성
- 모듈화된 구조로 새로운 게임 모드 추가 용이
- 플러그인 방식의 AI 모델 지원
- 수평 확장 가능한 WebSocket 아키텍처

### 보안
- 플레이어 ID 랜덤 생성으로 예측 불가능
- 입력 검증 및 XSS 방지
- Rate limiting으로 스팸 방지

## 향후 개선 계획

- [ ] 방 비밀번호 설정 기능
- [ ] 스토리 저장 및 공유 기능
- [ ] 보이스 채팅 통합
- [ ] 모바일 최적화
- [ ] 다국어 지원
- [ ] 커스텀 장르 생성
- [ ] 플레이어 통계 및 업적 시스템

## 트러블슈팅

### 연결 문제
- 브라우저 새로고침 후 재시도
- 방화벽 설정 확인
- WebSocket 지원 브라우저 사용

### 게임 진행 문제
- 모든 플레이어의 네트워크 상태 확인
- 시간 초과 시 자동으로 다음 턴으로 진행
- AI 응답 생성 실패 시 기본 응답 제공