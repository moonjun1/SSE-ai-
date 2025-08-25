import os
from openai import OpenAI
from anthropic import Anthropic
from typing import List
from ..models import ChatMessage
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

class SimpleAIService:
    def __init__(self):
        # OpenAI 클라이언트
        openai_key = os.getenv("OPENAI_API_KEY")
        print(f"OpenAI key exists: {'Yes' if openai_key else 'No'}")
        if openai_key:
            self.openai_client = OpenAI(api_key=openai_key)
        else:
            print("WARNING: No OpenAI API key found!")
            self.openai_client = None
        
        # Anthropic 클라이언트
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        print(f"Anthropic key exists: {'Yes' if anthropic_key else 'No'}")
        if anthropic_key:
            self.anthropic_client = Anthropic(api_key=anthropic_key)
        else:
            self.anthropic_client = None
        
    def generate_response(self, message: str, history: List[ChatMessage] = [], model: str = "openai-gpt3.5", system_prompt: str = None) -> str:
        messages = []
        
        # 시스템 프롬프트 추가
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})
        
        messages.append({"role": "user", "content": message})
        
        try:
            if model.startswith("openai-"):
                return self._call_openai(messages, model)
            elif model.startswith("claude-"):
                return self._call_claude(messages, model)
            else:
                return self._call_openai(messages, "openai-gpt3.5")
                
        except Exception as e:
            print(f"AI service error: {e}")
            return f"죄송합니다. AI 서비스에 문제가 발생했습니다: {str(e)}"
    
    def _call_openai(self, messages: List[dict], model: str) -> str:
        try:
            if not self.openai_client:
                return "OpenAI API 키가 설정되지 않았습니다."
            
            openai_model_map = {
                "openai-gpt3.5": "gpt-3.5-turbo",
                "openai-gpt4": "gpt-4"
            }
            
            actual_model = openai_model_map.get(model, "gpt-3.5-turbo")
            print(f"OpenAI API 호출: {actual_model}")
            print(f"메시지 개수: {len(messages)}")
            
            response = self.openai_client.chat.completions.create(
                model=actual_model,
                messages=messages,
                max_tokens=1500,
                temperature=0.7
            )
            
            result = response.choices[0].message.content
            print(f"OpenAI 응답 성공: {len(result)} 문자")
            return result or "응답이 비어있습니다."
            
        except Exception as e:
            print(f"OpenAI API 에러: {e}")
            # 에러 발생 시 더미 데이터 반환
            user_message = messages[-1]["content"] if messages else ""
            
            if "스토리를 시작해주세요" in user_message:
                return """**환상의 숲에서 깨어나다**

깊은 숲속에서 당신은 갑작스럽게 눈을 뜹니다. 머리가 아프고 어떻게 여기까지 왔는지 기억이 나지 않습니다.

주변을 둘러보니 고대의 유적처럼 보이는 돌기둥들이 원형으로 배치되어 있고, 그 중앙에 푸른 빛이 나는 수정구가 떠 있습니다. 멀리서 늑대의 울음소리가 들려오고, 하늘은 어둠이 짙어져 가고 있습니다.

**선택하세요:**
1. 수정구에 다가가서 자세히 살펴본다
2. 숲 밖으로 나가는 길을 찾는다  
3. 돌기둥 뒤에 숨어서 상황을 관찰한다"""
            else:
                return f"""API 연결 문제로 임시 응답입니다.

당신의 모험이 계속됩니다...

**선택하세요:**
1. 용감하게 앞으로 나아간다
2. 신중하게 주변을 탐색한다
3. 다른 방법을 모색해본다"""
    
    def _call_claude(self, messages: List[dict], model: str) -> str:
        # 시스템 메시지 분리
        system_content = ""
        user_messages = []
        
        for msg in messages:
            if msg["role"] == "system":
                system_content = msg["content"]
            else:
                user_messages.append(msg)
        
        response = self.anthropic_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1500,
            system=system_content if system_content else "You are a helpful assistant.",
            messages=user_messages
        )
        
        return response.content[0].text