from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.dependencies import get_current_user
from app.database import get_supabase
from app.models import Person, PersonCreate, PersonUpdate

router = APIRouter(prefix="/people", tags=["people"])


@router.get("", response_model=List[Person])
async def get_people(current_user=Depends(get_current_user)):
    """현재 사용자의 사람 목록 조회"""
    try:
        supabase = get_supabase()
        result = supabase.table("people") \
            .select("*") \
            .eq("user_id", current_user.id) \
            .order("created_at", desc=True) \
            .execute()

        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=Person)
async def create_person(person: PersonCreate, current_user=Depends(get_current_user)):
    """새 사람 추가"""
    try:
        supabase = get_supabase()
        result = supabase.table("people").insert({
            **person.model_dump(),
            "user_id": current_user.id
        }).execute()

        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{person_id}", response_model=Person)
async def get_person(person_id: str, current_user=Depends(get_current_user)):
    """특정 사람 정보 조회"""
    try:
        supabase = get_supabase()
        result = supabase.table("people") \
            .select("*") \
            .eq("id", person_id) \
            .eq("user_id", current_user.id) \
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Person not found")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{person_id}", response_model=Person)
async def update_person(
    person_id: str,
    person_update: PersonUpdate,
    current_user=Depends(get_current_user)
):
    """사람 정보 수정"""
    try:
        supabase = get_supabase()

        # 권한 확인
        existing = supabase.table("people") \
            .select("*") \
            .eq("id", person_id) \
            .eq("user_id", current_user.id) \
            .execute()

        if not existing.data:
            raise HTTPException(status_code=404, detail="Person not found")

        # 업데이트
        update_data = person_update.model_dump(exclude_unset=True)
        result = supabase.table("people") \
            .update(update_data) \
            .eq("id", person_id) \
            .execute()

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{person_id}")
async def delete_person(person_id: str, current_user=Depends(get_current_user)):
    """사람 삭제"""
    try:
        supabase = get_supabase()

        # 권한 확인
        existing = supabase.table("people") \
            .select("*") \
            .eq("id", person_id) \
            .eq("user_id", current_user.id) \
            .execute()

        if not existing.data:
            raise HTTPException(status_code=404, detail="Person not found")

        # 삭제
        supabase.table("people").delete().eq("id", person_id).execute()

        return {"message": "Person deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
