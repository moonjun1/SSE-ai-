import json
import random
from typing import List, Dict, Any, Optional
from ..services.simple_ai_service import SimpleAIService

class StoryGameService:
    def __init__(self):
        self.ai_service = SimpleAIService()
        self.story_contexts = {}
        
    def start_new_story(self, session_id: str, genre: str = "fantasy", model: str = "openai-gpt3.5") -> Dict[str, Any]:
        """새로운 스토리 시작"""
        genre_prompts = {
            "fantasy": "판타지 세계에서 모험을 시작하는",
            "sci-fi": "미래 우주에서 펼쳐지는 SF",
            "mystery": "수상한 사건이 벌어지는 미스터리",
            "horror": "오싹한 공포 요소가 담긴",
            "romance": "로맨틱한 사랑 이야기의",
            "adventure": "스릴 넘치는 모험"
        }
        
        system_prompt = f"""당신은 인터랙티브 {genre_prompts.get(genre, '모험')} 스토리텔러입니다.

규칙:
1. 2-3문단 분량의 생생한 스토리 작성
2. 마지막에 반드시 3가지 선택지 제공 (1, 2, 3번)
3. 플레이어의 선택에 따라 스토리 전개
4. 긴장감과 몰입감 있는 서술
5. 한국어로 작성

예시 형식:
[스토리 내용]

**선택하세요:**
1. [선택지 1]
2. [선택지 2] 
3. [선택지 3]"""

        initial_prompt = f"{genre_prompts.get(genre, '모험')} 스토리를 시작해주세요. 주인공은 갑작스러운 상황에 놓이게 됩니다."
        
        # AI로부터 초기 스토리 생성
        try:
            print(f"스토리 생성 시작 - AI Service Type: {type(self.ai_service)}")
            story_response = self.ai_service.generate_response(initial_prompt, [], model, system_prompt=system_prompt)
            print(f"Generated story: {story_response[:100]}...")
        except Exception as e:
            print(f"Story generation error: {e}")
            story_response = f"스토리 생성 중 오류가 발생했습니다: {str(e)}"
        
        # 세션 컨텍스트 저장
        self.story_contexts[session_id] = {
            "genre": genre,
            "model": model,
            "story_history": [
                {"type": "story", "content": story_response}
            ],
            "turn": 1
        }
        
        return {
            "session_id": session_id,
            "story": story_response,
            "turn": 1,
            "genre": genre
        }
    
    def start_new_story_stream(self, session_id: str, genre: str = "fantasy", model: str = "openai-gpt3.5"):
        """새로운 스토리 시작 (스트리밍)"""
        genre_prompts = {
            "fantasy": "판타지 세계에서 모험을 시작하는",
            "sci-fi": "미래 우주에서 펼쳐지는 SF",
            "mystery": "수상한 사건이 벌어지는 미스터리",
            "horror": "오싹한 공포 요소가 담긴",
            "romance": "로맨틱한 사랑 이야기의",
            "adventure": "스릴 넘치는 모험"
        }
        
        system_prompt = f"""당신은 인터랙티브 {genre_prompts.get(genre, '모험')} 스토리텔러입니다.

규칙:
1. 2-3문단 분량의 생생한 스토리 작성
2. 마지막에 반드시 3가지 선택지 제공 (1, 2, 3번)
3. 플레이어의 선택에 따라 스토리 전개
4. 긴장감과 몰입감 있는 서술
5. 한국어로 작성

예시 형식:
[스토리 내용]

**선택하세요:**
1. [선택지 1]
2. [선택지 2] 
3. [선택지 3]"""

        initial_prompt = f"{genre_prompts.get(genre, '모험')} 스토리를 시작해주세요. 주인공은 갑작스러운 상황에 놓이게 됩니다."
        
        # AI 서비스에서 스트리밍으로 스토리 생성
        from ..services.ai_service import AIService
        ai_service = AIService()
        
        story_chunks = []
        for chunk in ai_service.stream_chat(initial_prompt, [], model, system_prompt=system_prompt):
            story_chunks.append(chunk)
            yield chunk
        
        # 완전한 스토리를 세션에 저장
        complete_story = ''.join(story_chunks)
        self.story_contexts[session_id] = {
            "genre": genre,
            "model": model,
            "story_history": [
                {"type": "story", "content": complete_story}
            ],
            "turn": 1
        }
    
    def continue_story(self, session_id: str, choice: int, custom_action: str = None) -> Dict[str, Any]:
        """선택에 따라 스토리 진행"""
        if session_id not in self.story_contexts:
            return {"error": "세션을 찾을 수 없습니다"}
        
        context = self.story_contexts[session_id]
        
        # 선택사항 또는 커스텀 액션 준비
        action_text = custom_action if custom_action else f"{choice}번 선택"
        
        # 이전 스토리 히스토리 구성
        history_text = "\n\n".join([
            item["content"] for item in context["story_history"]
        ])
        
        system_prompt = f"""당신은 인터랙티브 {context['genre']} 스토리텔러입니다.

이전 스토리:
{history_text}

플레이어의 행동: {action_text}

규칙:
1. 플레이어의 선택/행동에 따른 자연스러운 스토리 전개
2. 2-3문단 분량의 생생한 서술
3. 마지막에 새로운 3가지 선택지 제공
4. 긴장감과 흥미를 유지
5. 한국어로 작성

**선택하세요:**
1. [선택지 1]
2. [선택지 2]
3. [선택지 3]"""

        continuation_prompt = f"플레이어가 '{action_text}'을(를) 선택했습니다. 스토리를 이어서 진행해주세요."
        
        # AI로부터 스토리 계속 생성
        story_response = self.ai_service.generate_response(continuation_prompt, [], context["model"], system_prompt=system_prompt)
        
        # 컨텍스트 업데이트
        context["story_history"].append({
            "type": "choice", 
            "content": f"플레이어 선택: {action_text}"
        })
        context["story_history"].append({
            "type": "story", 
            "content": story_response
        })
        context["turn"] += 1
        
        return {
            "session_id": session_id,
            "story": story_response,
            "turn": context["turn"],
            "genre": context["genre"]
        }
    
    def continue_story_stream(self, session_id: str, choice: int, custom_action: str = None):
        """선택에 따라 스토리 진행 (스트리밍)"""
        if session_id not in self.story_contexts:
            yield "오류: 세션을 찾을 수 없습니다"
            return
        
        context = self.story_contexts[session_id]
        
        # 선택사항 또는 커스텀 액션 준비
        action_text = custom_action if custom_action else f"{choice}번 선택"
        
        # 이전 스토리 히스토리 구성
        history_text = "\n\n".join([
            item["content"] for item in context["story_history"]
        ])
        
        system_prompt = f"""당신은 인터랙티브 {context['genre']} 스토리텔러입니다.

이전 스토리:
{history_text}

플레이어의 행동: {action_text}

규칙:
1. 플레이어의 선택/행동에 따른 자연스러운 스토리 전개
2. 2-3문단 분량의 생생한 서술
3. 마지막에 새로운 3가지 선택지 제공
4. 긴장감과 흥미를 유지
5. 한국어로 작성

**선택하세요:**
1. [선택지 1]
2. [선택지 2]
3. [선택지 3]"""

        continuation_prompt = f"플레이어가 '{action_text}'을(를) 선택했습니다. 스토리를 이어서 진행해주세요."
        
        # AI 서비스에서 스트리밍으로 스토리 생성
        from ..services.ai_service import AIService
        ai_service = AIService()
        
        story_chunks = []
        for chunk in ai_service.stream_chat(continuation_prompt, [], context["model"], system_prompt=system_prompt):
            story_chunks.append(chunk)
            yield chunk
        
        # 완전한 스토리를 컨텍스트에 저장
        complete_story = ''.join(story_chunks)
        context["story_history"].append({
            "type": "choice", 
            "content": f"플레이어 선택: {action_text}"
        })
        context["story_history"].append({
            "type": "story", 
            "content": complete_story
        })
        context["turn"] += 1
    
    def get_story_summary(self, session_id: str) -> Dict[str, Any]:
        """스토리 요약 가져오기"""
        if session_id not in self.story_contexts:
            return {"error": "세션을 찾을 수 없습니다"}
        
        context = self.story_contexts[session_id]
        return {
            "session_id": session_id,
            "genre": context["genre"],
            "turn": context["turn"],
            "history_length": len(context["story_history"])
        }