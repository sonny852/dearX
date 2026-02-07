from fastapi import Header, HTTPException, status
from supabase import Client
from app.database import get_supabase


async def get_current_user(authorization: str = Header(None)):
    """인증 토큰에서 현재 사용자 정보 추출"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )

    try:
        # Bearer 토큰 파싱
        token = authorization.replace("Bearer ", "")

        # Supabase에서 사용자 정보 가져오기
        supabase: Client = get_supabase()
        user = supabase.auth.get_user(token)

        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )

        return user.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


async def get_optional_user(authorization: str = Header(None)):
    """선택적 인증 (토큰이 없어도 됨)"""
    if not authorization:
        return None

    try:
        return await get_current_user(authorization)
    except:
        return None
