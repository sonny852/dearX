// Stripe 결제 관련 유틸리티

const PAYMENT_FUNCTION_URL = process.env.REACT_APP_SUPABASE_URL
  ? `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/payment`
  : null;

/**
 * 결제 인텐트 생성
 * @param {string} planType - 'day' | 'week' | 'month'
 * @param {string} userId - 사용자 ID
 * @param {string} email - 사용자 이메일
 * @returns {Promise<{clientSecret: string, amount: number, currency: string}>}
 */
export async function createPaymentIntent(planType, userId, email) {
  if (!PAYMENT_FUNCTION_URL) {
    // Demo mode - 테스트용 더미 반환
    return {
      clientSecret: 'demo_secret',
      amount: planType === 'day' ? 299 : planType === 'week' ? 999 : 1999,
      currency: 'usd',
      planName: planType === 'day' ? '1 Day' : planType === 'week' ? '1 Week' : '1 Month',
    };
  }

  const response = await fetch(`${PAYMENT_FUNCTION_URL}/create-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ planType, userId, email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create payment intent');
  }

  return response.json();
}

/**
 * 결제 확인 및 프리미엄 적용
 * @param {string} paymentIntentId - Stripe Payment Intent ID
 * @param {string} userId - 사용자 ID
 * @returns {Promise<{success: boolean, expiresAt: string}>}
 */
export async function confirmPayment(paymentIntentId, userId) {
  if (!PAYMENT_FUNCTION_URL) {
    // Demo mode
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return {
      success: true,
      expiresAt: expiresAt.toISOString(),
    };
  }

  const response = await fetch(`${PAYMENT_FUNCTION_URL}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentIntentId, userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to confirm payment');
  }

  return response.json();
}

/**
 * 프리미엄 상태 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<{isPremium: boolean, expiresAt: string | null}>}
 */
export async function getPremiumStatus(userId) {
  if (!PAYMENT_FUNCTION_URL) {
    return { isPremium: false, expiresAt: null };
  }

  const response = await fetch(`${PAYMENT_FUNCTION_URL}/status?userId=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return { isPremium: false, expiresAt: null };
  }

  return response.json();
}

/**
 * 금액 포맷팅
 * @param {number} amount - 센트 단위 금액
 * @param {string} currency - 통화 코드
 * @returns {string}
 */
export function formatAmount(amount, currency = 'usd') {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
  return formatter.format(amount / 100);
}
