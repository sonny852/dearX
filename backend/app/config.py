from pydantic_settings import BaseSettings
from typing import List
from pydantic import field_validator


class Settings(BaseSettings):
    """애플리케이션 설정"""

    supabase_url: str
    supabase_key: str
    supabase_service_role_key: str | None = None

    # External API keys
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    stripe_secret_key: str | None = None

    # Rate limiting
    free_message_limit: int = 5

    api_host: str = "0.0.0.0"
    api_port: int = 8000

    cors_origins: str = "http://localhost:3000"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return v
        return v

    def get_cors_origins(self) -> List[str]:
        """CORS origins를 리스트로 반환"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
