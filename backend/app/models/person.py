from pydantic import BaseModel
from datetime import datetime


class PersonBase(BaseModel):
    """Person 기본 모델"""
    name: str
    relationship: str | None = None
    photo_url: str | None = None
    target_age: int | None = None
    gender: str | None = None
    time_direction: str | None = None  # 'past' or 'future'
    personality: str | None = None
    speech_style: str | None = None
    hobbies: str | None = None
    memories: str | None = None
    favorite_words: str | None = None
    habits: str | None = None
    my_nickname: str | None = None
    family: str | None = None
    current_age: int | None = None  # For 'self' relationship


class PersonCreate(PersonBase):
    """Person 생성 모델"""
    pass


class PersonUpdate(BaseModel):
    """Person 업데이트 모델"""
    name: str | None = None
    relationship: str | None = None
    photo_url: str | None = None
    target_age: int | None = None
    gender: str | None = None
    time_direction: str | None = None
    personality: str | None = None
    speech_style: str | None = None
    hobbies: str | None = None
    memories: str | None = None
    favorite_words: str | None = None
    habits: str | None = None
    my_nickname: str | None = None
    family: str | None = None
    current_age: int | None = None


class Person(PersonBase):
    """Person 전체 모델"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True
