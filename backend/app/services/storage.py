from fastapi import UploadFile
from supabase import Client
from datetime import datetime
from app.database import get_supabase


class StorageService:
    """스토리지 관련 서비스"""

    @staticmethod
    async def upload_photo(user_id: str, file: UploadFile, path: str = "photos"):
        """사진 업로드"""
        supabase: Client = get_supabase()

        # 파일 확장자 추출
        file_ext = file.filename.split(".")[-1] if file.filename else "jpg"
        file_name = f"{user_id}/{path}/{int(datetime.now().timestamp() * 1000)}.{file_ext}"

        # 파일 읽기
        file_content = await file.read()

        # Supabase Storage에 업로드
        result = supabase.storage.from_("photos").upload(
            file_name,
            file_content,
            {"content-type": file.content_type}
        )

        # 공개 URL 가져오기
        public_url = supabase.storage.from_("photos").get_public_url(file_name)

        return {
            "path": file_name,
            "url": public_url
        }

    @staticmethod
    def delete_photo(path: str):
        """사진 삭제"""
        supabase: Client = get_supabase()

        result = supabase.storage.from_("photos").remove([path])

        return result
