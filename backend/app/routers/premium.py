from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.dependencies import get_current_user
from app.database import get_supabase
from app.models import UserProfile

router = APIRouter(prefix="/premium", tags=["premium"])


class UpgradeRequest(BaseModel):
    """프리미엄 업그레이드 요청"""
    plan: str  # "monthly" or "yearly"
    payment_method: str | None = None


class PremiumStatus(BaseModel):
    """프리미엄 상태"""
    is_premium: bool
    expires_at: datetime | None
    days_remaining: int | None


@router.get("/status", response_model=PremiumStatus)
async def get_premium_status(current_user=Depends(get_current_user)):
    """현재 사용자의 프리미엄 상태 조회"""
    try:
        supabase = get_supabase()
        result = supabase.table("profiles") \
            .select("is_premium, premium_expires_at") \
            .eq("id", current_user.id) \
            .execute()

        if not result.data:
            return PremiumStatus(
                is_premium=False,
                expires_at=None,
                days_remaining=None
            )

        profile = result.data[0]
        is_premium = profile.get("is_premium", False)
        expires_at = profile.get("premium_expires_at")

        days_remaining = None
        if is_premium and expires_at:
            expires_date = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            days_remaining = (expires_date - datetime.now()).days

        return PremiumStatus(
            is_premium=is_premium,
            expires_at=expires_at,
            days_remaining=days_remaining
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upgrade", response_model=UserProfile)
async def upgrade_to_premium(
    request: UpgradeRequest,
    current_user=Depends(get_current_user)
):
    """
    프리미엄으로 업그레이드

    실제 결제 로직은 별도로 구현해야 합니다.
    현재는 데모용으로 바로 프리미엄을 활성화합니다.
    """
    try:
        supabase = get_supabase()

        # 만료일 계산
        if request.plan == "monthly":
            expires_at = datetime.now() + timedelta(days=30)
        elif request.plan == "yearly":
            expires_at = datetime.now() + timedelta(days=365)
        else:
            raise HTTPException(status_code=400, detail="Invalid plan type")

        # 프로필 업데이트
        result = supabase.table("profiles") \
            .update({
                "is_premium": True,
                "premium_expires_at": expires_at.isoformat()
            }) \
            .eq("id", current_user.id) \
            .execute()

        if not result.data:
            # 프로필이 없으면 생성
            result = supabase.table("profiles").insert({
                "id": current_user.id,
                "is_premium": True,
                "premium_expires_at": expires_at.isoformat()
            }).execute()

        return result.data[0] if result.data else None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cancel")
async def cancel_premium(current_user=Depends(get_current_user)):
    """프리미엄 구독 취소"""
    try:
        supabase = get_supabase()

        result = supabase.table("profiles") \
            .update({
                "is_premium": False,
                "premium_expires_at": None
            }) \
            .eq("id", current_user.id) \
            .execute()

        return {"message": "Premium subscription cancelled successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
