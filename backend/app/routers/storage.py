from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.dependencies import get_current_user
from app.services import StorageService

router = APIRouter(prefix="/storage", tags=["storage"])


@router.post("/upload")
async def upload_photo(
    file: UploadFile = File(...),
    path: str = "photos",
    current_user=Depends(get_current_user)
):
    """사진 업로드"""
    try:
        # 파일 타입 검증
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are allowed")

        # 파일 크기 검증 (10MB 제한)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

        # 파일 포인터 리셋
        await file.seek(0)

        # 업로드
        result = await StorageService.upload_photo(
            user_id=current_user.id,
            file=file,
            path=path
        )

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete")
async def delete_photo(
    file_path: str,
    current_user=Depends(get_current_user)
):
    """사진 삭제"""
    try:
        # 파일 경로에 사용자 ID가 포함되어 있는지 확인 (보안)
        if not file_path.startswith(current_user.id):
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to delete this file"
            )

        result = StorageService.delete_photo(file_path)

        return {"message": "Photo deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
