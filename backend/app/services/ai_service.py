import os
import httpx
from openai import OpenAI
from anthropic import Anthropic
from typing import Generator, List
from ..models import ChatMessage
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

class AIService:
    def __init__(self):
        # OpenAI 클라이언트
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            self.openai_client = OpenAI(api_key=openai_key)
        
        # Anthropic 클라이언트
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_key:
            self.anthropic_client = Anthropic(api_key=anthropic_key)
        
        # DeepSeek API Key
        self.deepseek_key = os.getenv("DEEPSEEK_API_KEY")
    
    def stream_chat(self, message: str, history: List[ChatMessage] = [], model: str = "openai-gpt3.5") -> Generator[str, None, None]:
        messages = []
        
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})
        
        messages.append({"role": "user", "content": message})
        
        try:
            if model.startswith("openai-"):
                yield from self._stream_openai(messages, model)
            elif model.startswith("claude-"):
                yield from self._stream_claude(messages, model)
            elif model.startswith("deepseek-"):
                yield from self._stream_deepseek(messages, model)
            else:
                yield "지원하지 않는 모델입니다."
                
        except Exception as e:
            error_msg = f"오류가 발생했습니다: {str(e)}"
            print(f"Error in stream_chat: {error_msg}")
            yield error_msg
    
    def _stream_openai(self, messages: List[dict], model: str) -> Generator[str, None, None]:
        if not hasattr(self, 'openai_client'):
            yield "OpenAI API 키가 설정되지 않았습니다."
            return
            
        openai_model = "gpt-3.5-turbo" if "gpt3.5" in model else "gpt-4"
        
        print(f"Calling OpenAI {openai_model} with messages: {messages}")
        response = self.openai_client.chat.completions.create(
            model=openai_model,
            messages=messages,
            stream=True,
            max_tokens=1000,
            temperature=0.7
        )
        
        for chunk in response:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content
    
    def _stream_claude(self, messages: List[dict], model: str) -> Generator[str, None, None]:
        if not hasattr(self, 'anthropic_client'):
            yield "Claude API 키가 설정되지 않았습니다."
            return
        
        # Claude는 system 메시지를 따로 처리
        system_message = "당신은 도움이 되는 AI 어시스턴트입니다."
        user_messages = [msg for msg in messages if msg["role"] != "system"]
        
        print(f"Calling Claude with messages: {user_messages}")
        
        with self.anthropic_client.messages.stream(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            system=system_message,
            messages=user_messages
        ) as stream:
            for text in stream.text_stream:
                yield text
    
    def _stream_deepseek(self, messages: List[dict], model: str) -> Generator[str, None, None]:
        if not self.deepseek_key:
            yield "DeepSeek API 키가 설정되지 않았습니다."
            return
        
        print(f"Calling DeepSeek with messages: {messages}")
        
        try:
            # DeepSeek API는 OpenAI 호환 API이므로 직접 호출
            with httpx.Client(timeout=60.0) as client:
                response = client.post(
                    "https://api.deepseek.com/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.deepseek_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "deepseek-chat",
                        "messages": messages,
                        "stream": False,  # 스트리밍 대신 일반 응답
                        "max_tokens": 1000,
                        "temperature": 0.7
                    }
                )
                
                if response.status_code != 200:
                    yield f"DeepSeek API 오류: HTTP {response.status_code} - {response.text}"
                    return
                
                result = response.json()
                if result.get("choices") and len(result["choices"]) > 0:
                    content = result["choices"][0]["message"]["content"]
                    
                    # 스트리밍 효과를 위해 문자 단위로 나누어 전송
                    import time
                    for i, char in enumerate(content):
                        yield char
                        # 더 자연스러운 타이핑 효과
                        if char in [' ', '\n']:
                            time.sleep(0.02)
                        else:
                            time.sleep(0.01)
                else:
                    yield "DeepSeek에서 응답을 받지 못했습니다."
                        
        except httpx.TimeoutException:
            yield "DeepSeek API 타임아웃이 발생했습니다. 잠시 후 다시 시도해주세요."
        except httpx.ConnectError:
            yield "DeepSeek API에 연결할 수 없습니다. 네트워크 연결을 확인해주세요."
        except Exception as e:
            yield f"DeepSeek API 오류: {str(e)}"