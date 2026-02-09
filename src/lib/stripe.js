// Stripe 결제 관련 유틸리티
// FastAPI 백엔드의 /payment 엔드포인트를 통해 처리

import {
  createPaymentIntent as apiCreatePaymentIntent,
  confirmPayment as apiConfirmPayment,
  getPaymentStatus as apiGetPaymentStatus,
} from './api';

const API_URL = process.env.REACT_APP_API_URL;

/**
 * 결제 인텐트 생성
 * @param {string} planType - 'day' | 'week' | 'month'
 * @param {string} userId - 사용자 ID
 * @param {string} email - 사용자 이메일
 * @returns {Promise<{clientSecret: string, amount: number, currency: string}>}
 */
export async function createPaymentIntent(planType, userId, email) {
  if (!API_URL) {
    // Demo mode - 테스트용 더미 반환
    return {
      clientSecret: 'demo_secret',
      amount: planType === 'day' ? 299 : planType === 'week' ? 999 : 1999,
      currency: 'usd',
      planName: planType === 'day' ? '1 Day' : planType === 'week' ? '1 Week' : '1 Month',
    };
  }

  return apiCreatePaymentIntent(planType, userId, email);
}

/**
 * 결제 확인 및 프리미엄 적용
 * @param {string} paymentIntentId - Stripe Payment Intent ID
 * @param {string} userId - 사용자 ID
 * @returns {Promise<{success: boolean, expiresAt: string}>}
 */
export async function confirmPayment(paymentIntentId, userId) {
  if (!API_URL) {
    // Demo mode
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return {
      success: true,
      expiresAt: expiresAt.toISOString(),
    };
  }

  return apiConfirmPayment(paymentIntentId, userId);
}

/**
 * 프리미엄 상태 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<{isPremium: boolean, expiresAt: string | null}>}
 */
export async function getPremiumStatus(userId) {
  if (!API_URL) {
    return { isPremium: false, expiresAt: null };
  }

  return apiGetPaymentStatus(userId);
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
