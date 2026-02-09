from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.database import get_admin_supabase
from app.config import settings
from datetime import datetime, timezone
import httpx
import random

router = APIRouter(prefix="/chat", tags=["chat"])


# ── Request / Response 모델 ───────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str


class PersonInfo(BaseModel):
    name: str
    relationship: str
    targetAge: int
    gender: str
    timeDirection: str  # 'past' | 'future'
    currentAge: int | None = None
    personality: str | None = None
    speechStyle: str | None = None
    hobbies: str | None = None
    memories: str | None = None
    favoriteWords: str | None = None
    habits: str | None = None
    family: str | None = None
    photo: str | None = None
    pastPhoto: str | None = None
    currentPhoto: str | None = None
    myNickname: str | None = None


class ChatRequest(BaseModel):
    person_id: str | None = None
    person: PersonInfo
    messages: list[ChatMessage]
    userName: str = "User"
    language: str = "ko"


class ChatResponse(BaseModel):
    message: str
    imageUrl: str | None = None
    remainingMessages: int | None = None
    usage: dict | None = None


# ── 사진 요청 감지 ────────────────────────────────────────────────

PHOTO_KEYWORDS = [
    "사진", "셀카", "얼굴", "모습", "보여줘", "보내줘",
    "찍어", "이미지", "그림", "어떻게 생겼", "얼굴 보여",
]


def is_photo_request(message: str) -> bool:
    lower = message.lower()
    return any(kw in lower for kw in PHOTO_KEYWORDS)


# ── GPT-4 Vision 사진 분석 ────────────────────────────────────────

async def analyze_photo(photo_base64: str) -> str:
    if not settings.openai_api_key:
        return ""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {settings.openai_api_key}",
                },
                json={
                    "model": "gpt-4o-mini",
                    "max_tokens": 500,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an artist creating a character design based on reference photos. Describe visual features for illustration purposes only.",
                        },
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": (
                                        "As an illustrator, I need to create a cartoon/anime style character based on this reference.\n"
                                        "Please describe the following visual characteristics for my character design (in English):\n"
                                        "- Hair style and color\n"
                                        "- Face shape (round, oval, square, heart-shaped)\n"
                                        "- Eye shape and style\n"
                                        "- General build/body type\n"
                                        "- Any distinctive visual features\n"
                                        "- Overall vibe/impression\n\n"
                                        "This is for creating an original illustrated character, not identifying anyone. "
                                        "Just describe the visual elements I should include in my character design."
                                    ),
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {"url": photo_base64, "detail": "low"},
                                },
                            ],
                        },
                    ],
                },
            )
            if resp.status_code != 200:
                return ""
            data = resp.json()
            result = data["choices"][0]["message"]["content"] or ""
            if "sorry" in result.lower() or "cannot" in result.lower():
                return ""
            return result
    except Exception:
        return ""


# ── DALL-E 이미지 생성 ────────────────────────────────────────────

def build_image_prompt(person: PersonInfo, face_description: str = "") -> str:
    gender = "boy" if person.gender == "male" else "girl"
    age = person.targetAge

    if age <= 5:
        age_group = "toddler"
    elif age <= 12:
        age_group = "child"
    elif age <= 19:
        age_group = "teenager"
    elif age <= 30:
        age_group = "young adult"
    elif age <= 50:
        age_group = "middle-aged adult"
    else:
        age_group = "elderly"

    features = (
        f"Character design reference: {face_description}. Apply these characteristics to a {age}-year-old version."
        if face_description
        else ""
    )

    return (
        f"A warm, heartfelt portrait photo of a Korean {age_group} {gender}, approximately {age} years old.\n"
        f"{features}\n"
        "Natural lighting, genuine happy smile, casual everyday Korean home setting.\n"
        "The photo should feel like a cherished family memory, candid and authentic.\n"
        "Soft warm color tones, high quality realistic photograph style.\n"
        "Portrait shot focusing on face and upper body.\n"
        "NO text, NO watermarks, NO artificial elements, NO anime style."
    )


async def generate_image(person: PersonInfo, reference_photo: str | None = None) -> str | None:
    if not settings.openai_api_key:
        return None
    try:
        face_description = ""
        if reference_photo:
            face_description = await analyze_photo(reference_photo)

        prompt = build_image_prompt(person, face_description)

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {settings.openai_api_key}",
                },
                json={
                    "model": "dall-e-3",
                    "prompt": prompt,
                    "n": 1,
                    "size": "1024x1024",
                    "quality": "standard",
                },
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            return data["data"][0].get("url")
    except Exception:
        return None


# ── 관계별 호칭 매핑 ──────────────────────────────────────────────

def get_call_name(relationship: str) -> str:
    call_names = {
        "아들": "엄마/아빠",
        "딸": "엄마/아빠",
        "아기": "엄마/아빠",
        "엄마": "우리 아이/자기야",
        "아빠": "우리 아이/자기야",
        "할머니": "우리 손주",
        "할아버지": "우리 손주",
        "친구": "친구야",
        "남편": "자기야/여보",
        "아내": "자기야/여보",
        "동생": "언니/오빠/누나/형",
        "형": "동생아",
        "누나": "동생아",
        "오빠": "동생아",
        "언니": "동생아",
    }
    return call_names.get(relationship, "너")


# ── 시스템 프롬프트 빌드 ──────────────────────────────────────────

def build_system_prompt(person: PersonInfo, user_name: str, language: str = "ko") -> str:
    language_instruction = {
        "ko": "",
        "en": "\n\n## LANGUAGE RULE (CRITICAL!)\nYou MUST respond ONLY in English. Never use Korean or Japanese.",
        "ja": "\n\n## 言語ルール（最重要！）\n必ず日本語のみで返答してください。韓国語や英語は使わないでください。",
    }.get(language, "")

    time_context = (
        f"과거의 {person.targetAge}세 시절"
        if person.timeDirection == "past"
        else f"미래의 {person.targetAge}세 모습"
    )

    relationship = person.relationship
    user_call_name = get_call_name(relationship)

    # self 대화 컨텍스트
    self_context = ""
    if relationship == "self" and person.currentAge:
        if person.timeDirection == "past":
            self_context = f"""
## 특별한 상황 (가장 중요!!!)
너는 {person.targetAge}살의 {person.name}이야.
지금 타임머신을 타고 미래에서 온 {person.currentAge}살의 "나 자신"을 만났어!
대화 상대는 {person.currentAge - person.targetAge}년 후의 "나"야. 즉, 커버린 나!

## 말투 (절대 규칙!)
- 반말만 써! 존댓말 금지!
- "있어요" (X) → "있어" (O)
- "계셔요" (X) → "있어" (O)
- "좋아요" (X) → "좋아" (O)

## 길이 (가장 중요!!!)
- 딱 1문장! 10단어 이내!
- 길게 말하면 벌점!

## 예시 (이 길이로!)
"응!" / "뭐?" / "몰라~" / "진짜?" / "그게 뭐야?" / "응 잘 지내!" / "헐 대박!\""""
        else:
            self_context = f"""
## 특별한 상황 (가장 중요!!!)
너는 {person.targetAge}살의 {person.name}이야.
지금 타임머신을 타고 과거에서 온 {person.currentAge}살의 "나 자신"을 만났어!
대화 상대는 {person.targetAge - person.currentAge}년 전의 "나"야. 즉, 어린 시절의 나!

## 호칭과 관계 (절대 규칙)
- 대화 상대는 어린 시절의 나니까 따뜻하게 대해
- 반말로 편하게, 하지만 다정하게
- 과거의 나를 응원하고 위로해줘
- "걱정 마", "잘 될 거야", "넌 잘하고 있어" 같은 따뜻한 말"""

    self_ref = "과거/미래의 나 자신" if relationship == "self" else f"{user_name}의 {relationship}"
    talk_to = f"{person.currentAge}살의 나 자신" if relationship == "self" else user_name
    call_line = "" if relationship == "self" else f'- {user_name}은(는) 너의 입장에서 "{user_call_name}"야.\n'

    prompt = f"""너는 "{person.name}"이야. {self_ref}이지.
지금 {time_context}의 너로서, {user_name}에게 직접 말하고 있어.

## 핵심 설정
- 너의 이름: {person.name}
- 너의 나이: {person.targetAge}세
- 너와 대화하는 사람: {talk_to}
{call_line}{self_context}

## 절대적인 말하기 규칙 (가장 중요!!!)
너는 {user_name}에게 직접 말하고 있어. 제3자에게 설명하는 것이 아니야!
자기 자신을 말할 때는 반드시 "나"를 사용해. "{person.name}은/는" 같은 3인칭 금지!

잘못된 예시 (절대 하지 마):
- "{person.name}은 귀엽고 장난기 넘쳐" (X) - 3인칭으로 자기 얘기
- "{user_name}는 좋은 사람이야" (X) - 제3자한테 설명하는 느낌
- "엄마는 항상 나를 칭찬해주셨어" (X) - 제3자한테 설명하는 느낌

올바른 예시 (이렇게 해):
- "나 오늘 진짜 재밌게 놀았어!" (O) - 1인칭 "나" 사용
- "엄마! 나 칭찬해줘서 고마워!" (O) - 직접 말하는 느낌
- "엄마 보고싶었어~" (O) - 직접 말하는 느낌
- "나 귀엽지? ㅎㅎ" (O) - 1인칭 사용
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
    if person.family:
        prompt += f"- 가족 구성: {person.family}\n"

    # 나이별 말투 가이드
    if person.targetAge <= 7:
        speech_guide = '유아 말투. 예: "응~", "싫어~", "뭐야?", "왜?"'
    elif person.targetAge <= 12:
        speech_guide = '초등학생 말투. 예: "응!", "진짜?", "대박!", "몰라~"'
    elif person.targetAge <= 20:
        speech_guide = '10대 말투. 예: "ㅇㅇ", "ㅋㅋ", "ㄹㅇ?", "헐"'
    else:
        speech_guide = "성인 말투. 짧고 담백하게."

    prompt += f"""
## 말투: {speech_guide}

## 절대 규칙!!!
1. 반말만 써! ("있어요" 금지 → "있어"로)
2. 1문장, 10단어 이내!
3. 모르는 건 "몰라~"
4. 지어내지 마!

예시: "응!", "뭐?", "진짜?", "몰라~", "그게 뭐야?"
"""

    return prompt + language_instruction


# ── Rate Limit 체크 ───────────────────────────────────────────────

def check_rate_limit(user_id: str) -> tuple[bool, int]:
    """오늘 메시지 수를 DB에서 확인. (is_allowed, remaining) 반환."""
    supabase = get_admin_supabase()

    # 프리미엄 체크
    profile = (
        supabase.table("profiles")
        .select("is_premium, premium_expires_at")
        .eq("id", user_id)
        .execute()
    )
    if profile.data:
        p = profile.data[0]
        if p.get("is_premium") and p.get("premium_expires_at"):
            expires = datetime.fromisoformat(
                p["premium_expires_at"].replace("Z", "+00:00")
            )
            if expires > datetime.now(timezone.utc):
                return True, -1  # 프리미엄: 무제한

    # 오늘 유저 메시지 수 카운트
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    result = (
        supabase.table("messages")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("role", "user")
        .gte("created_at", today_start.isoformat())
        .execute()
    )
    count = result.count or 0
    limit = settings.free_message_limit
    remaining = max(0, limit - count)
    return count < limit, remaining


# ── 메인 엔드포인트 ──────────────────────────────────────────────

@router.post("", response_model=ChatResponse)
async def chat_with_person(
    request: ChatRequest,
    current_user=Depends(get_current_user),
):
    supabase = get_admin_supabase()

    # 1. Rate limit 체크
    is_allowed, remaining = check_rate_limit(current_user.id)
    if not is_allowed:
        raise HTTPException(status_code=429, detail="Daily message limit exceeded")

    # 2. 유저 메시지 DB 저장
    last_user_content = request.messages[-1].content if request.messages else ""
    if request.person_id:
        try:
            supabase.table("messages").insert(
                {
                    "user_id": current_user.id,
                    "person_id": request.person_id,
                    "role": "user",
                    "content": last_user_content,
                }
            ).execute()
        except Exception:
            pass  # DB 저장 실패해도 채팅은 계속

    # 3. 시스템 프롬프트 빌드
    system_prompt = build_system_prompt(request.person, request.userName, request.language)

    # 4. 사진 요청 감지 → 프롬프트 수정
    wants_photo = is_photo_request(last_user_content)
    has_uploaded_photo = bool(
        request.person.pastPhoto or request.person.photo or request.person.currentPhoto
    )

    if wants_photo:
        if has_uploaded_photo:
            system_prompt += (
                "\n\n## 사진 요청 응답\n"
                "상대방이 사진을 요청했어. 실제 그때 사진을 보내줄 거야.\n"
                '"이 사진 기억나?", "우리 이때 찍은 사진이야!", "이때 우리 같이 있었잖아~" 같은 멘트를 해줘.\n'
                "추억을 회상하는 따뜻한 느낌으로 말해."
            )
        else:
            system_prompt += (
                "\n\n## 사진 요청 응답\n"
                "상대방이 사진을 요청했어. 사진을 보내주면서 짧고 귀여운 멘트를 해줘.\n"
                '예시: "짜잔~ 이때 내 모습이야!", "나 이때 귀엽지? ㅎㅎ"\n'
                '절대 "사진을 보낼 수 없어" 같은 말 하지 마. 사진이 같이 전송될 거야.'
            )

    # 5. Claude API 호출
    assistant_message = ""
    usage = None

    if not settings.anthropic_api_key:
        # API 키 없으면 폴백
        assistant_message = request.person.favoriteWords or "괜찮아요. 당신은 충분히 잘하고 있어요."
    else:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": settings.anthropic_api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": "claude-3-haiku-20240307",
                        "max_tokens": 400,
                        "system": system_prompt,
                        "messages": [
                            {"role": m.role, "content": m.content}
                            for m in request.messages
                        ],
                    },
                )

                if resp.status_code == 200:
                    data = resp.json()
                    assistant_message = data["content"][0].get("text", "...")
                    usage = data.get("usage")
                else:
                    raise Exception(f"Claude API {resp.status_code}")
        except Exception:
            fallback_responses = [
                request.person.favoriteWords or "괜찮아요. 당신은 충분히 잘하고 있어요.",
                "그때의 우리는 정말 행복했어요.",
                "당신은 혼자가 아니에요. 제가 여기 있잖아요.",
            ]
            assistant_message = random.choice(fallback_responses)

    # 6. 사진 요청 시 이미지 생성
    image_url = None
    if wants_photo:
        uploaded_photo = (
            request.person.pastPhoto
            or request.person.photo
            or request.person.currentPhoto
        )
        if uploaded_photo and request.person.relationship != "self":
            image_url = uploaded_photo
        else:
            reference_photo = request.person.currentPhoto
            image_url = await generate_image(request.person, reference_photo)

    # 7. AI 응답 DB 저장
    if request.person_id:
        try:
            insert_data = {
                "user_id": current_user.id,
                "person_id": request.person_id,
                "role": "assistant",
                "content": assistant_message,
            }
            if image_url:
                insert_data["image_url"] = image_url
            supabase.table("messages").insert(insert_data).execute()
        except Exception:
            pass

    # 8. 응답 반환
    new_remaining = remaining - 1 if remaining > 0 else 0
    return ChatResponse(
        message=assistant_message,
        imageUrl=image_url,
        remainingMessages=new_remaining if remaining != -1 else None,
        usage=usage,
    )
