from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.dependencies import get_current_user
from app.database import get_supabase
import os
import httpx
import random

router = APIRouter(prefix="/chat", tags=["chat"])


class Message(BaseModel):
    """채팅 메시지 모델"""
    role: str
    content: str


class PersonInfo(BaseModel):
    """대화 상대 정보"""
    name: str
    relationship: str
    targetAge: int
    gender: str
    timeDirection: str
    personality: Optional[str] = None
    speechStyle: Optional[str] = None
    hobbies: Optional[str] = None
    memories: Optional[str] = None
    favoriteWords: Optional[str] = None
    habits: Optional[str] = None


class ChatRequest(BaseModel):
    """채팅 요청 모델"""
    person: PersonInfo
    messages: List[Message]
    userName: Optional[str] = "User"


class UsageInfo(BaseModel):
    """Claude API 사용량 정보"""
    input_tokens: int
    output_tokens: int


class ChatResponse(BaseModel):
    """채팅 응답 모델"""
    message: str
    usage: Optional[UsageInfo] = None


@router.post("", response_model=ChatResponse)
async def chat_with_person(
    request: ChatRequest,
    current_user=Depends(get_current_user)
):
    """
    Claude API를 사용한 채팅

    Supabase Edge Function의 /functions/v1/chat와 동일한 기능을 제공합니다.
    프론트엔드에서 이 엔드포인트를 호출하세요.
    """
    try:
        # Claude API 키 확인
        claude_api_key = os.getenv("CLAUDE_API_KEY")
        if not claude_api_key:
            # API 키가 없으면 기본 응답 반환
            return ChatResponse(
                message=f"{request.person.favoriteWords or '괜찮아요. 당신은 충분히 잘하고 있어요.'}"
            )

        # 필수 필드 검증
        if not request.person or not request.messages or not request.userName:
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: person, messages, userName"
            )

        # 시스템 프롬프트 생성
        system_prompt = build_system_prompt(request.person, request.userName)

        # Claude API 호출
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": claude_api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 500,
                    "system": system_prompt,
                    "messages": [
                        {"role": msg.role, "content": msg.content}
                        for msg in request.messages
                    ],
                },
            )

            if response.status_code == 200:
                data = response.json()
                assistant_message = data["content"][0].get("text", "...")
                usage_data = data.get("usage")

                # Usage 정보 생성
                usage = None
                if usage_data:
                    usage = UsageInfo(
                        input_tokens=usage_data.get("input_tokens", 0),
                        output_tokens=usage_data.get("output_tokens", 0)
                    )

                # 메시지를 Supabase에 저장 (선택사항)
                supabase = get_supabase()
                if supabase and hasattr(request.person, 'id'):
                    try:
                        # 사용자 메시지 저장
                        await supabase.table("messages").insert({
                            "user_id": current_user.id,
                            "person_id": request.person.id,
                            "role": "user",
                            "content": request.messages[-1].content
                        }).execute()

                        # AI 응답 저장
                        await supabase.table("messages").insert({
                            "user_id": current_user.id,
                            "person_id": request.person.id,
                            "role": "assistant",
                            "content": assistant_message
                        }).execute()
                    except Exception as db_error:
                        print(f"Database save error: {db_error}")
                        # DB 저장 실패해도 응답은 반환

                return ChatResponse(message=assistant_message, usage=usage)
            else:
                error_text = await response.aread()
                print(f"Claude API error: {error_text.decode()}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Claude API error: {response.status_code}"
                )

    except HTTPException:
        raise
    except Exception as e:
        # 에러 발생 시 기본 응답 반환
        print(f"Chat error: {e}")
        fallback_responses = [
            f"{request.person.favoriteWords or '괜찮아요. 당신은 충분히 잘하고 있어요.'}",
            "그때의 우리는 정말 행복했어요.",
            "당신은 혼자가 아니에요. 제가 여기 있잖아요.",
        ]
        return ChatResponse(message=random.choice(fallback_responses))


def build_system_prompt(person: PersonInfo, user_name: str) -> str:
    """
    대화 상대의 페르소나를 기반으로 시스템 프롬프트 생성

    Supabase Edge Function의 buildSystemPrompt 함수와 동일한 로직
    """

    # 관계 한글 매핑
    relationship_map: Dict[str, str] = {
        "parent": "부모님",
        "grandparent": "조부모님",
        "sibling": "형제자매",
        "friend": "친구",
        "other": "소중한 사람",
        "self": "자기 자신",
    }

    relationship = relationship_map.get(person.relationship, person.relationship)

    # 성별 텍스트
    gender_text = ""
    if person.gender == "male":
        gender_text = "남성"
    elif person.gender == "female":
        gender_text = "여성"

    # 시간 맥락
    time_context = (
        f"과거의 {person.targetAge}세 시절"
        if person.timeDirection == "past"
        else f"미래의 {person.targetAge}세 모습"
    )

    # 프롬프트 구성
    prompt = f"""당신은 {user_name}의 {relationship}인 "{person.name}"입니다.
{time_context}의 모습으로 대화합니다.

## 캐릭터 설정
- 이름: {person.name}
- 나이: {person.targetAge}세
- 성별: {gender_text}
- 시간대: {"과거" if person.timeDirection == "past" else "미래"}
"""

    if person.personality:
        prompt += f"- 성격: {person.personality}\n"

    if person.speechStyle:
        prompt += f"- 말투: {person.speechStyle}\n"

    if person.hobbies:
        prompt += f"- 취미: {person.hobbies}\n"

    if person.memories:
        prompt += f"- 함께한 추억: {person.memories}\n"

    if person.favoriteWords:
        prompt += f"- 자주 하는 말: {person.favoriteWords}\n"

    if person.habits:
        prompt += f"- 습관/버릇: {person.habits}\n"

    prompt += f"""
## 대화 규칙
1. {person.name}의 성격과 말투를 최대한 살려서 대화하세요.
2. {time_context}에 맞는 시대적 배경을 반영하세요.
3. 따뜻하고 진심 어린 대화를 나누세요.
4. 짧고 자연스러운 대화체로 응답하세요 (2-3문장).
5. {user_name}을/를 진심으로 아끼는 마음을 담아 대화하세요.
6. 과거 추억이나 함께했던 시간을 자연스럽게 언급할 수 있습니다.

## 중요
- 당신은 AI가 아닌 실제 {person.name}입니다.
- 항상 캐릭터를 유지하세요.
- 슬프거나 그리운 감정을 공감해주되, 희망적인 메시지도 전달하세요.
"""

    return prompt
