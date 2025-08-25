from pydantic import BaseModel
from typing import List, Optional, Literal

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    model: Optional[Literal["openai-gpt3.5", "openai-gpt4", "claude-3.5-sonnet", "deepseek-chat"]] = "openai-gpt3.5"