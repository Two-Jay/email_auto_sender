from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.routes import email, template, recipient, upload

# FastAPI 앱 생성
app = FastAPI(
    title="Email Auto Sender API",
    description="Naver와 Google 메일을 기반으로 한 자동 메일링 API",
    version="1.0.0"
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 서빙 (업로드된 파일)
if os.path.exists(settings.upload_dir):
    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# 라우터 등록
app.include_router(email.router, prefix="/api/email", tags=["Email"])
app.include_router(template.router, prefix="/api/template", tags=["Template"])
app.include_router(recipient.router, prefix="/api/recipient", tags=["Recipient"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "Email Auto Sender API",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=True
    )
