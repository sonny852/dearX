from supabase import Client
from app.database import get_supabase


class AuthService:
    """인증 관련 서비스"""

    @staticmethod
    def get_or_create_profile(user_id: str):
        """사용자 프로필 조회 또는 생성"""
        supabase: Client = get_supabase()

        # 프로필 조회
        result = supabase.table("profiles") \
            .select("*") \
            .eq("id", user_id) \
            .execute()

        if result.data:
            return result.data[0]

        # 프로필이 없으면 생성
        result = supabase.table("profiles") \
            .insert({"id": user_id}) \
            .execute()

        return result.data[0] if result.data else None

    @staticmethod
    def update_profile(user_id: str, updates: dict):
        """사용자 프로필 업데이트"""
        supabase: Client = get_supabase()

        result = supabase.table("profiles") \
            .update(updates) \
            .eq("id", user_id) \
            .execute()

        return result.data[0] if result.data else None
