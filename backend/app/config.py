from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """애플리케이션 설정"""

    # 서버 설정
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    frontend_port: int = 3000

    # CORS 설정
    cors_origins: str = "http://localhost:3000"

    # Naver 메일 설정
    naver_smtp_server: str = "smtp.naver.com"
    naver_smtp_port: int = 587
    naver_email: str = ""
    naver_password: str = ""

    # Google 메일 설정
    google_smtp_server: str = "smtp.gmail.com"
    google_smtp_port: int = 587
    google_email: str = ""
    google_app_password: str = ""

    # 파일 저장 경로
    data_dir: str = "./data"
    upload_dir: str = "./backend/uploads"

    # 대량 발송 설정
    batch_size: int = 10
    delay_between_emails: int = 2

    @property
    def cors_origins_list(self) -> List[str]:
        """CORS 허용 도메인 리스트 반환"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# 전역 설정 객체
settings = Settings()

# 필요한 디렉토리 생성
os.makedirs(settings.data_dir, exist_ok=True)
os.makedirs(settings.upload_dir, exist_ok=True)
