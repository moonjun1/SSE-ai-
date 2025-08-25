@echo off
echo Starting AI Chat Service Backend...
cd backend
call venv\Scripts\activate
uvicorn app.main:app --reload --port 8000