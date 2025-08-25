from fastapi import APIRouter, HTTPException, Query, Form
from fastapi.responses import StreamingResponse
from ..models import ChatRequest, ChatMessage
from ..services.ai_service import AIService
import json
from typing import List, Optional

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("/stream")
async def stream_chat(request: ChatRequest):
    try:
        ai_service = AIService()
        def generate():
            for chunk in ai_service.stream_chat(request.message, request.history, request.model):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        
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

@router.get("/stream")
async def stream_chat_get(
    message: str = Query(...),
    history: str = Query("[]"),
    model: str = Query("openai-gpt3.5")
):
    try:
        print(f"Received message: {message}")
        print(f"Received history: {history}")
        print(f"Selected model: {model}")
        
        # Parse history from JSON string
        history_list = []
        if history != "[]":
            history_data = json.loads(history)
            history_list = [ChatMessage(**item) for item in history_data]
        
        print("Creating AI service...")
        ai_service = AIService()
        print("AI service created successfully")
        
        def generate():
            try:
                print("Starting stream generation...")
                for chunk in ai_service.stream_chat(message, history_list, model):
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
                print("Stream generation completed")
            except Exception as gen_error:
                print(f"Error in generate: {str(gen_error)}")
                yield f"data: {json.dumps({'error': str(gen_error)})}\n\n"
        
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
        print(f"Error in stream_chat_get: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))