from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.database import get_admin_supabase
from app.config import settings
from datetime import datetime, timezone, timedelta
import stripe as stripe_lib

router = APIRouter(prefix="/payment", tags=["payment"])

# 요금제 정보 (Edge Function과 동일)
PLANS = {
    "day": {"amount": 299, "currency": "usd", "duration_days": 1, "name": "1 Day Plan"},
    "week": {"amount": 999, "currency": "usd", "duration_days": 7, "name": "1 Week Plan"},
    "month": {"amount": 1999, "currency": "usd", "duration_days": 30, "name": "1 Month Plan"},
}


# ── Request / Response 모델 ───────────────────────────────────────

class CreateIntentRequest(BaseModel):
    planType: str
    userId: str
    email: str


class CreateIntentResponse(BaseModel):
    clientSecret: str
    planName: str
    amount: int
    currency: str


class ConfirmRequest(BaseModel):
    paymentIntentId: str
    userId: str


class ConfirmResponse(BaseModel):
    success: bool
    message: str | None = None
    expiresAt: str | None = None


class StatusResponse(BaseModel):
    isPremium: bool
    expiresAt: str | None = None


# ── 엔드포인트 ────────────────────────────────────────────────────

@router.post("/create-intent", response_model=CreateIntentResponse)
async def create_payment_intent(
    request: CreateIntentRequest,
    current_user=Depends(get_current_user),
):
    """Stripe PaymentIntent 생성"""
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    if request.planType not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan type")

    plan = PLANS[request.planType]
    stripe_lib.api_key = settings.stripe_secret_key

    try:
        # 고객 조회 또는 생성
        existing = stripe_lib.Customer.list(email=request.email, limit=1)
        if existing.data:
            customer = existing.data[0]
        else:
            customer = stripe_lib.Customer.create(
                email=request.email,
                metadata={"userId": request.userId},
            )

        # PaymentIntent 생성
        intent = stripe_lib.PaymentIntent.create(
            amount=plan["amount"],
            currency=plan["currency"],
            customer=customer.id,
            metadata={
                "userId": request.userId,
                "planType": request.planType,
                "durationDays": str(plan["duration_days"]),
            },
            automatic_payment_methods={"enabled": True},
        )

        return CreateIntentResponse(
            clientSecret=intent.client_secret,
            planName=plan["name"],
            amount=plan["amount"],
            currency=plan["currency"],
        )
    except stripe_lib.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/confirm", response_model=ConfirmResponse)
async def confirm_payment(
    request: ConfirmRequest,
    current_user=Depends(get_current_user),
):
    """결제 확인 및 프리미엄 적용"""
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    stripe_lib.api_key = settings.stripe_secret_key

    try:
        # PaymentIntent 조회
        intent = stripe_lib.PaymentIntent.retrieve(request.paymentIntentId)

        if intent.status != "succeeded":
            raise HTTPException(status_code=400, detail="Payment not completed")

        plan_type = intent.metadata.get("planType")
        duration_days = int(intent.metadata.get("durationDays", "7"))

        # 만료일 계산
        expires_at = datetime.now(timezone.utc) + timedelta(days=duration_days)

        # Supabase에 프리미엄 상태 업데이트
        supabase = get_admin_supabase()

        supabase.table("profiles").update(
            {
                "is_premium": True,
                "premium_expires_at": expires_at.isoformat(),
            }
        ).eq("id", request.userId).execute()

        # subscriptions 테이블에 기록
        supabase.table("subscriptions").insert(
            {
                "user_id": request.userId,
                "plan_type": plan_type,
                "amount": intent.amount,
                "currency": intent.currency.upper(),
                "status": "completed",
                "payment_provider": "stripe",
                "payment_id": request.paymentIntentId,
                "starts_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": expires_at.isoformat(),
            }
        ).execute()

        return ConfirmResponse(
            success=True,
            message="Premium activated",
            expiresAt=expires_at.isoformat(),
        )
    except stripe_lib.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/status", response_model=StatusResponse)
async def get_payment_status(
    userId: str = Query(..., description="사용자 ID"),
    current_user=Depends(get_current_user),
):
    """프리미엄 상태 조회"""
    supabase = get_admin_supabase()

    result = (
        supabase.table("profiles")
        .select("is_premium, premium_expires_at")
        .eq("id", userId)
        .execute()
    )

    if not result.data:
        return StatusResponse(isPremium=False)

    profile = result.data[0]
    is_premium = profile.get("is_premium", False)
    expires_at = profile.get("premium_expires_at")

    # 만료 체크
    if is_premium and expires_at:
        expires = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        if expires <= datetime.now(timezone.utc):
            is_premium = False

    return StatusResponse(
        isPremium=is_premium,
        expiresAt=expires_at,
    )
