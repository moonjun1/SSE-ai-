# 🚀 고급 기능 상세 가이드

## 🌙 다크 모드 시스템

### 구현 방법
- **토글 버튼**: 헤더 우측 상단의 달/해 아이콘
- **상태 관리**: React useState + localStorage 연동
- **실시간 적용**: body 클래스 동적 변경
- **테마 색상**: Tailwind CSS 조건부 클래스 적용

### 코드 예시
```typescript
// useChatStream.ts
const toggleDarkMode = useCallback(() => {
  setChatState(prev => {
    const newDarkMode = !prev.darkMode;
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.body.className = newDarkMode ? 'dark bg-gray-900' : 'bg-gray-50';
    return { ...prev, darkMode: newDarkMode };
  });
}, []);
```

### 특징
- ✅ 설정 자동 저장 (새로고침 시 유지)
- ✅ 모든 UI 요소에 일관된 테마 적용
- ✅ 부드러운 transition 효과

---

## 🤖 멀티 AI 모델 지원

### 지원 모델
1. **OpenAI GPT-3.5 Turbo** ✅
   - 빠른 응답 속도
   - 비용 효율적
   - 일반적인 대화에 최적화

2. **OpenAI GPT-4** ✅
   - 고급 추론 능력
   - 복잡한 작업 처리
   - 더 정확한 응답

3. **Claude 3.5 Sonnet** ✅
   - Anthropic의 안전한 AI
   - 도움이 되는 응답
   - 윤리적 고려사항 반영

4. **DeepSeek Chat** 🔄
   - 중국의 오픈소스 모델
   - API 호환성 테스트 중

### 백엔드 구현
```python
# ai_service.py
class AIService:
    def __init__(self):
        # 각 AI 제공업체별 클라이언트 초기화
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.deepseek_key = os.getenv("DEEPSEEK_API_KEY")
    
    def stream_chat(self, message: str, history: List[ChatMessage] = [], model: str = "openai-gpt3.5"):
        if model.startswith("openai-"):
            yield from self._stream_openai(messages, model)
        elif model.startswith("claude-"):
            yield from self._stream_claude(messages, model)
        elif model.startswith("deepseek-"):
            yield from self._stream_deepseek(messages, model)
```

### 프론트엔드 구현
```typescript
// ChatContainer.tsx
<select value={selectedModel} onChange={(e) => selectModel(e.target.value)}>
  {Object.entries(AI_MODELS).map(([key, model]) => (
    <option key={key} value={key}>
      {model.status} {model.name} ({model.provider})
    </option>
  ))}
</select>
```

---

## 📋 메시지 복사 기능

### 사용자 경험
- **호버 트리거**: 메시지에 마우스 올릴 때 복사 버튼 표시
- **원클릭 복사**: 버튼 클릭으로 클립보드에 즉시 복사
- **시각적 피드백**: 복사 완료 시 체크 아이콘으로 2초간 표시

### 구현 코드
```typescript
// Message.tsx
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error('복사 실패:', err);
  }
};

<button onClick={handleCopy} className="opacity-0 group-hover:opacity-100">
  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
</button>
```

---

## ⏰ 메시지 타임스탬프

### 기능
- 각 메시지 우측 상단에 전송 시간 표시
- 한국어 시간 형식 (오후 2:30)
- 작은 글씨로 자연스럽게 배치

### 구현
```typescript
const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('ko-KR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

<div className="text-xs text-gray-500">
  {formatTime(message.timestamp)}
</div>
```

---

## 💬 고급 타이핑 인디케이터

### 기능
1. **스트리밍 중 커서**: 현재 입력 중인 메시지에 깜박이는 커서 (`|`)
2. **대기 중 애니메이션**: 사용자 메시지 후 AI 응답 대기 시 점점점 애니메이션
3. **부드러운 효과**: CSS 애니메이션으로 자연스러운 움직임

### 구현
```typescript
// 스트리밍 중 커서
{isStreaming && <span className="animate-pulse">|</span>}

// 대기 중 애니메이션
<div className="flex space-x-1">
  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
</div>
```

---

## 📤 대화 내보내기

### 기능
- **JSON 형식**: 구조화된 데이터로 저장
- **자동 파일명**: 날짜 기반 파일명 자동 생성
- **다운로드 버튼**: 헤더의 다운로드 아이콘

### 구현
```typescript
const exportChat = () => {
  const chatData = messages.map(msg => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp.toISOString()
  }));
  
  const dataStr = JSON.stringify(chatData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
};
```

---

## 🔢 실시간 글자 수 카운터

### 기능
- **실시간 카운팅**: 입력과 동시에 글자 수 표시
- **제한 표시**: 1000자 제한 표시
- **경고 색상**: 50자 미만 남을 때 빨간색 표시
- **사용법 가이드**: Enter/Shift+Enter 안내

### 구현
```typescript
const maxLength = 1000;
const remainingChars = maxLength - message.length;

<div className={remainingChars < 50 ? 'text-red-500' : ''}>
  {message.length}/{maxLength}
</div>
```

---

## 📱 반응형 디자인

### 브레이크포인트
- **모바일**: `< 640px` - 버튼 텍스트 숨김, 아이콘만 표시
- **태블릿**: `640px - 1024px` - 적절한 간격 조정  
- **데스크톱**: `> 1024px` - 전체 기능 표시

### 적용 예시
```typescript
<span className="hidden sm:inline">전송</span> // 모바일에서 숨김
<div className="max-w-4xl mx-auto"> // 최대 너비 제한
```

---

## ⚡ 성능 최적화

### React 최적화
- **useCallback**: 함수 메모이제이션으로 불필요한 리렌더링 방지
- **조건부 렌더링**: 필요한 요소만 렌더링
- **지연 로딩**: 아이콘 컴포넌트 최적화

### 네트워크 최적화
- **EventSource**: 효율적인 SSE 연결 관리
- **자동 정리**: 컴포넌트 언마운트 시 연결 정리
- **에러 복구**: 연결 실패 시 재시도 로직

---

## 🎨 UI/UX 개선사항

### 인터랙션
- **호버 효과**: 모든 버튼에 부드러운 호버 애니메이션
- **포커스 스타일**: 키보드 네비게이션 지원
- **로딩 상태**: 버튼 비활성화로 중복 클릭 방지

### 접근성
- **키보드 네비게이션**: Tab으로 모든 요소 접근 가능
- **시각적 피드백**: 상태 변화에 따른 명확한 피드백
- **색상 대비**: WCAG 가이드라인 준수