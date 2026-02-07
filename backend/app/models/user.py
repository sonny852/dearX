from pydantic import BaseModel
from datetime import datetime


class UserProfile(BaseModel):
    """사용자 프로필 모델"""
    id: str
    name: str | None = None
    is_premium: bool = False
    premium_expires_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    """사용자 프로필 업데이트 모델"""
    name: str | None = None
    is_premium: bool | None = None
    premium_expires_at: datetime | None = None
