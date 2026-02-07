from supabase import create_client, Client
from app.config import settings


class SupabaseClient:
    """Supabase 클라이언트 싱글톤"""

    _client: Client | None = None

    @classmethod
    def get_client(cls) -> Client:
        """Supabase 클라이언트 인스턴스 반환"""
        if cls._client is None:
            cls._client = create_client(
                settings.supabase_url,
                settings.supabase_key
            )
        return cls._client

    @classmethod
    def get_admin_client(cls) -> Client:
        """Supabase 관리자 클라이언트 반환 (Service Role Key 사용)"""
        if settings.supabase_service_role_key:
            return create_client(
                settings.supabase_url,
                settings.supabase_service_role_key
            )
        return cls.get_client()


# 헬퍼 함수들
def get_supabase() -> Client:
    """일반 Supabase 클라이언트"""
    return SupabaseClient.get_client()


def get_admin_supabase() -> Client:
    """관리자 Supabase 클라이언트"""
    return SupabaseClient.get_admin_client()
