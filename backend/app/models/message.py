from pydantic import BaseModel
from datetime import datetime


class MessageBase(BaseModel):
    """Message 기본 모델"""
    role: str  # 'user' or 'assistant'
    content: str
    image_url: str | None = None


class MessageCreate(MessageBase):
    """Message 생성 모델"""
    person_id: str


class Message(MessageBase):
    """Message 전체 모델"""
    id: str
    user_id: str
    person_id: str
    created_at: datetime

    class Config:
        from_attributes = True
