from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from app.dependencies import get_current_user
from app.database import get_supabase
from app.models import Message, MessageCreate

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("", response_model=List[Message])
async def get_messages(
    person_id: str = Query(..., description="대화 상대 ID"),
    limit: int = Query(50, ge=1, le=100, description="조회할 메시지 수"),
    current_user=Depends(get_current_user)
):
    """특정 사람과의 대화 기록 조회"""
    try:
        supabase = get_supabase()

        # 해당 person이 현재 사용자의 것인지 확인
        person = supabase.table("people") \
            .select("*") \
            .eq("id", person_id) \
            .eq("user_id", current_user.id) \
            .execute()

        if not person.data:
            raise HTTPException(status_code=404, detail="Person not found")

        # 메시지 조회
        result = supabase.table("messages") \
            .select("*") \
            .eq("user_id", current_user.id) \
            .eq("person_id", person_id) \
            .order("created_at", desc=False) \
            .limit(limit) \
            .execute()

        return result.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=Message)
async def create_message(
    message: MessageCreate,
    current_user=Depends(get_current_user)
):
    """새 메시지 저장"""
    try:
        supabase = get_supabase()

        # 해당 person이 현재 사용자의 것인지 확인
        person = supabase.table("people") \
            .select("*") \
            .eq("id", message.person_id) \
            .eq("user_id", current_user.id) \
            .execute()

        if not person.data:
            raise HTTPException(status_code=404, detail="Person not found")

        # 메시지 저장
        result = supabase.table("messages").insert({
            "user_id": current_user.id,
            "person_id": message.person_id,
            "role": message.role,
            "content": message.content
        }).execute()

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
