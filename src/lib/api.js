// FastAPI 백엔드 클라이언트
// Chat AI, 메시지 저장(rate limit 포함), Payment 관련 호출 담당

import { supabase } from './supabase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

async function getAuthToken() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function apiRequest(path, options = {}) {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    const err = new Error(error.detail || error.error || `HTTP ${response.status}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

// Chat API — FastAPI가 메시지 저장 + rate limit + Claude API 호출을 모두 처리
export async function sendChatMessage({ personId, person, messages, userName, language }) {
  return apiRequest('/chat', {
    method: 'POST',
    body: JSON.stringify({
      person_id: personId,
      person,
      messages,
      userName,
      language,
    }),
  });
}

// Payment APIs
export async function createPaymentIntent(planType, userId, email) {
  return apiRequest('/payment/create-intent', {
    method: 'POST',
    body: JSON.stringify({ planType, userId, email }),
  });
}

export async function confirmPayment(paymentIntentId, userId) {
  return apiRequest('/payment/confirm', {
    method: 'POST',
    body: JSON.stringify({ paymentIntentId, userId }),
  });
}

export async function getPaymentStatus(userId) {
  return apiRequest(`/payment/status?userId=${userId}`);
}
