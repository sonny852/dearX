// Supabase Edge Function - Stripe 결제
// Deploy: supabase functions deploy payment --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 요금제 정보
const PLANS = {
  day: {
    amount: 299, // $2.99 in cents
    currency: 'usd',
    duration_days: 1,
    name: '1 Day Plan',
  },
  week: {
    amount: 999, // $9.99 in cents
    currency: 'usd',
    duration_days: 7,
    name: '1 Week Plan',
  },
  month: {
    amount: 1999, // $19.99 in cents
    currency: 'usd',
    duration_days: 30,
    name: '1 Month Plan',
  },
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // POST /payment/create-intent - 결제 인텐트 생성
    if (req.method === 'POST' && path === 'create-intent') {
      const { planType, userId, email } = await req.json();

      if (!planType || !PLANS[planType]) {
        throw new Error('Invalid plan type');
      }

      const plan = PLANS[planType];

      // 고객 생성 또는 조회
      let customer;
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: email,
          metadata: { userId: userId },
        });
      }

      // Payment Intent 생성
      const paymentIntent = await stripe.paymentIntents.create({
        amount: plan.amount,
        currency: plan.currency,
        customer: customer.id,
        metadata: {
          userId: userId,
          planType: planType,
          durationDays: plan.duration_days.toString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return new Response(
        JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          planName: plan.name,
          amount: plan.amount,
          currency: plan.currency,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // POST /payment/confirm - 결제 확인 및 프리미엄 적용
    if (req.method === 'POST' && path === 'confirm') {
      const { paymentIntentId, userId } = await req.json();

      // Payment Intent 조회
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment not completed');
      }

      const planType = paymentIntent.metadata.planType;
      const durationDays = parseInt(paymentIntent.metadata.durationDays);

      // Supabase에 프리미엄 상태 업데이트
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);

        // profiles 테이블 업데이트
        const profileResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              is_premium: true,
              premium_expires_at: expiresAt.toISOString(),
            }),
          }
        );

        // subscriptions 테이블에 기록
        const subscriptionResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/subscriptions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              user_id: userId,
              plan_type: planType,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency.toUpperCase(),
              status: 'completed',
              payment_provider: 'stripe',
              payment_id: paymentIntentId,
              starts_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
            }),
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Premium activated',
          expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // GET /payment/status - 프리미엄 상태 조회
    if (req.method === 'GET' && path === 'status') {
      const userId = url.searchParams.get('userId');

      if (!userId || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing parameters');
      }

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=is_premium,premium_expires_at`,
        {
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );

      const data = await response.json();
      const profile = data[0];

      if (!profile) {
        return new Response(
          JSON.stringify({ isPremium: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 만료 체크
      const isPremium = profile.is_premium &&
        profile.premium_expires_at &&
        new Date(profile.premium_expires_at) > new Date();

      return new Response(
        JSON.stringify({
          isPremium,
          expiresAt: profile.premium_expires_at,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid endpoint');
  } catch (error) {
    console.error('Payment error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
