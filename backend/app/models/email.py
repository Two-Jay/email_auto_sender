from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Optional
from enum import Enum


class EmailProvider(str, Enum):
    """메일 서비스 제공자"""
    NAVER = "naver"
    GOOGLE = "google"


class SenderConfig(BaseModel):
    """발신자 설정"""
    provider: EmailProvider
    email: EmailStr
    password: str
    name: Optional[str] = None


class Recipient(BaseModel):
    """수신자 정보"""
    email: EmailStr
    variables: Dict[str, str] = Field(default_factory=dict)

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "variables": {
                    "name": "홍길동",
                    "company": "ABC회사"
                }
            }
        }


class EmailTemplate(BaseModel):
    """이메일 템플릿"""
    subject: str
    html_content: str

    class Config:
        json_schema_extra = {
            "example": {
                "subject": "{{name}}님께 드리는 안내",
                "html_content": "<p>안녕하세요 {{name}}님,</p><p>{{company}}에서 연락드립니다.</p>"
            }
        }


class EmailSendRequest(BaseModel):
    """단일 메일 발송 요청"""
    sender: SenderConfig
    recipient: Recipient
    template: EmailTemplate
    cc: List[EmailStr] = Field(default_factory=list)
    attachments: List[str] = Field(default_factory=list)


class BulkEmailRequest(BaseModel):
    """대량 메일 발송 요청"""
    sender: SenderConfig
    recipients: List[Recipient]
    template: EmailTemplate
    cc: List[EmailStr] = Field(default_factory=list)
    attachments: List[str] = Field(default_factory=list)


class EmailSendResponse(BaseModel):
    """메일 발송 응답"""
    success: bool
    message: str
    failed_recipients: List[str] = Field(default_factory=list)
    total_sent: int = 0
    total_failed: int = 0
