from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .routers import chat, games

load_dotenv()

app = FastAPI(title="AI Chat & Games Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(games.router)

@app.get("/")
async def root():
    return {"message": "AI Chat Service API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}