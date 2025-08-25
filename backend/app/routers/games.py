from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json
import uuid
from ..services.story_game_service import StoryGameService
from ..services.mystery_game_service import MysteryGameService

router = APIRouter(prefix="/api/games", tags=["games"])

# 서비스 인스턴스
story_service = StoryGameService()
mystery_service = MysteryGameService()

# 요청 모델들
class StartStoryRequest(BaseModel):
    genre: Optional[str] = "fantasy"
    model: Optional[str] = "openai-gpt3.5"

class ContinueStoryRequest(BaseModel):
    session_id: str
    choice: Optional[int] = None
    custom_action: Optional[str] = None

class CreateMysteryRequest(BaseModel):
    difficulty: Optional[str] = "normal"
    model: Optional[str] = "openai-gpt3.5"

class AskQuestionRequest(BaseModel):
    session_id: str
    question: str

class MakeAccusationRequest(BaseModel):
    session_id: str
    accused_name: str
    reasoning: str

# 스토리 어드벤처 게임 엔드포인트
@router.post("/story/start")
async def start_story(request: StartStoryRequest):
    """새로운 스토리 어드벤처 시작"""
    try:
        session_id = str(uuid.uuid4())
        result = story_service.start_new_story(session_id, request.genre, request.model)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/story/start/stream")
async def start_story_stream(request: StartStoryRequest):
    """새로운 스토리 어드벤처 시작 (스트리밍)"""
    try:
        session_id = str(uuid.uuid4())
        
        def generate():
            try:
                for chunk in story_service.start_new_story_stream(session_id, request.genre, request.model):
                    yield f"data: {json.dumps({'chunk': chunk, 'session_id': session_id})}\n\n"
                yield f"data: {json.dumps({'done': True, 'session_id': session_id})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/story/continue")
async def continue_story(request: ContinueStoryRequest):
    """스토리 진행"""
    try:
        result = story_service.continue_story(
            request.session_id, 
            request.choice, 
            request.custom_action
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/story/continue/stream")
async def continue_story_stream(request: ContinueStoryRequest):
    """스토리 진행 (스트리밍)"""
    try:
        def generate():
            try:
                for chunk in story_service.continue_story_stream(
                    request.session_id, 
                    request.choice, 
                    request.custom_action
                ):
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/story/{session_id}/summary")
async def get_story_summary(session_id: str):
    """스토리 요약 조회"""
    try:
        result = story_service.get_story_summary(session_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 추리 게임 엔드포인트
@router.post("/mystery/create")
async def create_mystery(request: CreateMysteryRequest):
    """새로운 추리 게임 생성"""
    try:
        session_id = str(uuid.uuid4())
        result = mystery_service.create_new_mystery(session_id, request.difficulty, request.model)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mystery/question")
async def ask_question(request: AskQuestionRequest):
    """추리 게임에서 질문하기"""
    try:
        result = mystery_service.ask_question(request.session_id, request.question)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mystery/question/stream")
async def ask_question_stream(request: AskQuestionRequest):
    """추리 게임에서 질문하기 (스트리밍)"""
    try:
        def generate():
            try:
                for chunk in mystery_service.ask_question_stream(request.session_id, request.question):
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mystery/accuse")
async def make_accusation(request: MakeAccusationRequest):
    """범인 지목하기"""
    try:
        result = mystery_service.make_accusation(
            request.session_id, 
            request.accused_name, 
            request.reasoning
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mystery/{session_id}/status")
async def get_mystery_status(session_id: str):
    """추리 게임 상태 조회"""
    try:
        result = mystery_service.get_game_status(session_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 게임 목록 및 정보
@router.get("/")
async def get_available_games():
    """사용 가능한 게임 목록"""
    return {
        "games": [
            {
                "id": "story-adventure",
                "name": "AI 스토리 어드벤처",
                "description": "AI가 실시간으로 생성하는 인터랙티브 스토리",
                "genres": ["fantasy", "sci-fi", "mystery", "horror", "romance", "adventure"],
                "features": ["실시간 스토리 생성", "선택지 기반 진행", "무한 분기"]
            },
            {
                "id": "mystery-detective",
                "name": "AI 추리 게임",
                "description": "AI가 만든 미스터리 사건을 해결하는 추리 게임",
                "difficulties": ["easy", "normal", "hard"],
                "features": ["매번 다른 사건", "질문 기반 수사", "논리적 추리"]
            }
        ]
    }