from pydantic import BaseModel
from datetime import datetime


class PersonBase(BaseModel):
    """Person 기본 모델"""
    name: str
    relationship: str | None = None
    description: str | None = None
    photo_url: str | None = None


class PersonCreate(PersonBase):
    """Person 생성 모델"""
    pass


class PersonUpdate(BaseModel):
    """Person 업데이트 모델"""
    name: str | None = None
    relationship: str | None = None
    description: str | None = None
    photo_url: str | None = None


class Person(PersonBase):
    """Person 전체 모델"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True
