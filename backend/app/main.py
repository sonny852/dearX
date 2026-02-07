from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth_router, people_router, messages_router, storage_router, chat_router, premium_router

# FastAPI 앱 생성
app = FastAPI(
    title="DearX API",
    description="FastAPI backend for DearX application",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth_router)
app.include_router(people_router)
app.include_router(messages_router)
app.include_router(storage_router)
app.include_router(chat_router)
app.include_router(premium_router)


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "Welcome to DearX API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )
