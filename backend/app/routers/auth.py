from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.database import get_supabase
from app.models import UserProfile, UserProfileUpdate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user=Depends(get_current_user)):
    """현재 로그인한 사용자 정보 조회"""
    try:
        supabase = get_supabase()

        # 프로필 조회 또는 생성
        result = supabase.table("profiles").select("*").eq("id", current_user.id).execute()

        if not result.data:
            # 프로필이 없으면 생성
            result = supabase.table("profiles").insert({"id": current_user.id}).execute()

        return result.data[0] if result.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/me", response_model=UserProfile)
async def update_current_user_profile(
    profile_update: UserProfileUpdate,
    current_user=Depends(get_current_user)
):
    """현재 사용자 프로필 업데이트"""
    try:
        supabase = get_supabase()

        update_data = profile_update.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        result = supabase.table("profiles") \
            .update(update_data) \
            .eq("id", current_user.id) \
            .execute()

        if not result.data:
            # 프로필이 없으면 생성
            result = supabase.table("profiles").insert({
                "id": current_user.id,
                **update_data
            }).execute()

        return result.data[0] if result.data else None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/logout")
async def logout(current_user=Depends(get_current_user)):
    """로그아웃"""
    try:
        supabase = get_supabase()
        supabase.auth.sign_out()
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
