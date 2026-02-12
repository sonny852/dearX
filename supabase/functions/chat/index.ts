// Supabase Edge Function - Claude 대화 + Grok Aurora 이미지 생성
// Deploy: supabase functions deploy chat --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const XAI_API_KEY = Deno.env.get('XAI_API_KEY'); // Grok Aurora용
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const XAI_IMAGE_URL = 'https://api.x.ai/v1/images/generations';
const XAI_IMAGE_EDIT_URL = 'https://api.x.ai/v1/images/edits';

// 허용된 도메인 목록
const ALLOWED_ORIGINS = [
  'https://dearx.io',
  'https://www.dearx.io',
  'http://localhost:3000', // 개발용
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

interface Person {
  name: string;
  relationship: string;
  targetAge: number;
  currentAge?: number;      // 현재 나이 (self용)
  gender: string;
  timeDirection: 'past' | 'future';
  personality?: string;
  speechStyle?: string;
  hobbies?: string;
  memories?: string;
  favoriteWords?: string;
  habits?: string;
  family?: string;          // 가족 구성
  photo?: string;           // 추가한 사람의 사진
  pastPhoto?: string;       // self의 과거 사진
  currentPhoto?: string;    // self의 현재 사진
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 사진 요청 감지
function isPhotoRequest(message: string): boolean {
  const photoKeywords = [
    '사진', '셀카', '얼굴', '모습', '보여줘', '보내줘',
    '찍어', '이미지', '그림', '어떻게 생겼', '얼굴 보여'
  ];
  const lowerMessage = message.toLowerCase();
  return photoKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Grok Aurora 이미지 프롬프트 생성
function buildImagePrompt(person: Person): string {
  const age = person.targetAge;
  const gender = person.gender === 'male' ? '남성' : '여성';

  return `이 사람의 얼굴 특징을 유지하면서 ${age}세 한국 ${gender}의 모습으로 변환해주세요.
자연스러운 실내 조명, 따뜻한 색감, 가정집 배경.
실제 가족 사진처럼 자연스럽고 사실적인 인물 사진.
얼굴과 상반신 중심의 포트레이트.`;
}

// Grok Aurora API로 이미지 생성 (참조 사진 기반 편집 or 새 생성)
async function generateImage(person: Person, referencePhoto?: string): Promise<string | null> {
  try {
    const age = person.targetAge;
    const gender = person.gender === 'male' ? 'male' : 'female';

    let ageGroup = '';
    if (age <= 5) ageGroup = 'toddler';
    else if (age <= 12) ageGroup = 'child';
    else if (age <= 19) ageGroup = 'teenager';
    else if (age <= 30) ageGroup = 'young adult';
    else if (age <= 50) ageGroup = 'middle-aged adult';
    else ageGroup = 'elderly';

    if (referencePhoto) {
      // 참조 사진이 있으면 이미지 편집 API 사용
      console.log('Using Grok Aurora image edit with reference photo, length:', referencePhoto.length);
      const prompt = buildImagePrompt(person);

      const response = await fetch(XAI_IMAGE_EDIT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-imagine-image',
          prompt: prompt,
          image: {
            url: referencePhoto,
            type: 'image_url',
          },
          n: 1,
          response_format: 'url',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Grok Aurora edit API error:', response.status, errorText);
        // 편집 실패 시 새 생성으로 fallback
        console.log('Falling back to text-only generation (edit failed)');
      } else {
        const data = await response.json();
        const url = data.data?.[0]?.url;
        if (url) return url;
      }
    }

    // 참조 사진 없거나 편집 실패 시: 텍스트만으로 새 이미지 생성
    console.log('Using Grok Aurora text-to-image generation');
    const fallbackPrompt = `A realistic portrait photograph of a Korean ${ageGroup} ${gender}, approximately ${age} years old.
Natural indoor lighting, warm color temperature, genuine candid smile.
Casual everyday Korean home setting. Real family photo style, slightly warm faded tones.
Portrait shot focusing on face and upper body.
Realistic photograph, NOT cartoon, NOT anime, NOT illustration.`;

    const response = await fetch(XAI_IMAGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-imagine-image',
        prompt: fallbackPrompt,
        n: 1,
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      console.error('Grok Aurora generation API error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.url || null;
  } catch (error) {
    console.error('Image generation error:', error);
    return null;
  }
}

function getCallName(relationship: string): string {
  // 관계에 따라 사용자를 어떻게 부를지 결정
  const callNames: Record<string, string> = {
    '아들': '엄마/아빠',
    '딸': '엄마/아빠',
    '아기': '엄마/아빠',
    '엄마': '우리 아이/자기야',
    '아빠': '우리 아이/자기야',
    '할머니': '우리 손주',
    '할아버지': '우리 손주',
    '친구': '친구야',
    '남편': '자기야/여보',
    '아내': '자기야/여보',
    '동생': '언니/오빠/누나/형',
    '형': '동생아',
    '누나': '동생아',
    '오빠': '동생아',
    '언니': '동생아',
  };
  return callNames[relationship] || '너';
}

function buildSystemPrompt(person: Person, userName: string, language: string = 'ko', userGender?: string, userAge?: number): string {
  // 언어별 응답 지시
  const languageInstruction = {
    ko: '',
    en: '\n\n## LANGUAGE RULE (CRITICAL!)\nYou MUST respond ONLY in English. Never use Korean or Japanese.',
    ja: '\n\n## 言語ルール（最重要！）\n必ず日本語のみで返答してください。韓国語や英語は使わないでください。',
  }[language] || '';

  const timeContext = person.timeDirection === 'past'
    ? `과거의 ${person.targetAge}세 시절`
    : `미래의 ${person.targetAge}세 모습`;

  const relationship = person.relationship;
  const genderText = person.gender === 'male' ? '남성' : person.gender === 'female' ? '여성' : '';
  const userCallName = getCallName(relationship);

  // self인 경우 특별한 컨텍스트
  let selfContext = '';
  if (relationship === 'self' && person.currentAge) {
    if (person.timeDirection === 'past') {
      selfContext = `
## 특별한 상황 (가장 중요!!!)
너는 ${person.targetAge}살의 ${person.name}이야.
지금 타임머신을 타고 미래에서 온 ${person.currentAge}살의 "나 자신"을 만났어!
대화 상대는 ${person.currentAge - person.targetAge}년 후의 "나"야. 즉, 커버린 나!

## 말투 (절대 규칙!)
- 반말만 써! 존댓말 금지!
- "있어요" (X) → "있어" (O)
- "계셔요" (X) → "있어" (O)
- "좋아요" (X) → "좋아" (O)

## 길이 (가장 중요!!!)
- 딱 1문장! 10단어 이내!
- 길게 말하면 벌점!

## 예시 (이 길이로!)
"응!" / "뭐?" / "몰라~" / "진짜?" / "그게 뭐야?" / "응 잘 지내!" / "헐 대박!"`;
    } else {
      selfContext = `
## 특별한 상황 (가장 중요!!!)
너는 ${person.targetAge}살의 ${person.name}이야.
지금 타임머신을 타고 과거에서 온 ${person.currentAge}살의 "나 자신"을 만났어!
대화 상대는 ${person.targetAge - person.currentAge}년 전의 "나"야. 즉, 어린 시절의 나!

## 호칭과 관계 (절대 규칙)
- 대화 상대는 어린 시절의 나니까 따뜻하게 대해
- 반말로 편하게, 하지만 다정하게
- 과거의 나를 응원하고 위로해줘
- "걱정 마", "잘 될 거야", "넌 잘하고 있어" 같은 따뜻한 말`;
    }
  }

  let prompt = `너는 "${person.name}"이야. ${relationship === 'self' ? '과거/미래의 나 자신' : `${userName}의 ${relationship}`}이지.
지금 ${timeContext}의 너로서, ${userName}에게 직접 말하고 있어.

## 핵심 설정
- 너의 이름: ${person.name}
- 너의 나이: ${person.targetAge}세
- 너와 대화하는 사람: ${relationship === 'self' ? `${person.currentAge}살의 나 자신` : userName}
${userAge ? `- ${userName}의 나이: ${userAge}세` : ''}
${userGender ? `- ${userName}의 성별: ${userGender === 'male' ? '남성' : '여성'}` : ''}
${relationship !== 'self' ? `- ${userName}은(는) 너의 입장에서 "${userCallName}"야.` : ''}
${selfContext}

## 절대적인 말하기 규칙 (가장 중요!!!)
너는 ${userName}에게 직접 말하고 있어. 제3자에게 설명하는 것이 아니야!
자기 자신을 말할 때는 반드시 "나"를 사용해. "${person.name}은/는" 같은 3인칭 금지!

## 행동 묘사 금지!!! (절대 규칙)
- "(반갑게 웃으며)", "(눈물을 흘리며)", "(고개를 끄덕이며)" 같은 행동 묘사 절대 금지!
- 괄호 안에 행동이나 감정 표현 넣지 마!
- 그냥 말만 해. 소설처럼 쓰지 마!

## 자연스럽게 대화해! (중요)
- 불필요하게 사과하지 마! "미안해", "죄송해" 남발 금지!
- 평범한 인사나 질문에 "그렇게 말하면 안 돼" 같은 훈계 금지!
- 그냥 자연스럽게 대화해. 실제 가족/친구처럼!
- "엄마 뭐해?" → "응~ 밥 먹고 있었어!" 이렇게 자연스럽게!

## 길이 규칙 (가장 중요!!!)
카톡 문자처럼 짧게! 최대 1~2문장!
긴 설명, 긴 위로, 긴 조언 절대 금지!
"응 밥 먹었어~ 너는?" 이 정도 길이가 딱 좋아.
반드시 문장을 완성해! 말이 중간에 끊기면 안 돼!

## 메시지 분리 규칙
2문장이면 ||| 로 구분해.
- "응 밥 먹었어.|||너는 뭐해?"
- "아 그래?|||좋겠다~"

## 금지 사항
- 3인칭 금지: "${person.name}은/는..." (X) → "나는..." (O)
- 행동 묘사 금지: "(웃으며)" "(눈물을 흘리며)" 금지
- 과도한 위로/조언 금지. 그냥 자연스럽게 대화해
`;

  if (person.personality) {
    prompt += `- 성격: ${person.personality}\n`;
  }
  if (person.speechStyle) {
    prompt += `- 말투: ${person.speechStyle}\n`;
  }
  if (person.hobbies) {
    prompt += `- 취미: ${person.hobbies}\n`;
  }
  if (person.memories) {
    prompt += `- 함께한 추억: ${person.memories}\n`;
  }
  if (person.favoriteWords) {
    prompt += `- 자주 하는 말: ${person.favoriteWords}\n`;
  }
  if (person.habits) {
    prompt += `- 습관/버릇: ${person.habits}\n`;
  }
  if (person.family) {
    prompt += `- 가족 구성: ${person.family}\n`;
  }

  // 성별과 나이에 따른 말투 스타일
  let speechStyleGuide = '';
  if (person.targetAge <= 7) {
    speechStyleGuide = `유아 말투. 예: "응~", "싫어~", "뭐야?", "왜?"`;
  } else if (person.targetAge <= 12) {
    speechStyleGuide = `초등학생 말투. 예: "응!", "진짜?", "대박!", "몰라~"`;
  } else if (person.targetAge <= 20) {
    speechStyleGuide = `10대 말투. 예: "ㅇㅇ", "ㅋㅋ", "ㄹㅇ?", "헐"`;
  } else {
    speechStyleGuide = `성인 말투. 짧고 담백하게.`;
  }

  prompt += `
## 말투: ${speechStyleGuide}

## 절대 규칙
1. 반말만 써! ("있어요" 금지 → "있어"로)
2. 카톡처럼 짧게! 최대 2문장!
3. 모르는 건 "몰라~"
4. 지어내지 마!
`;

  return prompt + languageInstruction;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 민감한 정보 로깅 제거 (보안)

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured (DearX-API-KEY secret missing)');
    }

    const { person, messages, userName, userGender, userBirthYear, language = 'ko' } = await req.json();

    if (!person || !messages || !userName) {
      throw new Error('Missing required fields: person, messages, userName');
    }

    // 사용자 나이 계산
    const userAge = userBirthYear ? (new Date().getFullYear() - userBirthYear) : undefined;
    const systemPrompt = buildSystemPrompt(person, userName, language, userGender, userAge);

    // 마지막 사용자 메시지 확인
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const wantsPhoto = isPhotoRequest(lastUserMessage);

    // 사진 요청인 경우 시스템 프롬프트에 추가
    let finalSystemPrompt = systemPrompt;
    const hasUploadedPhoto = !!(person.pastPhoto || person.photo || person.currentPhoto);
    if (wantsPhoto) {
      if (hasUploadedPhoto) {
        finalSystemPrompt += `\n\n## 사진 요청 응답
상대방이 사진을 요청했어. 실제 그때 사진을 보내줄 거야.
"이 사진 기억나?", "우리 이때 찍은 사진이야!", "이때 우리 같이 있었잖아~" 같은 멘트를 해줘.
추억을 회상하는 따뜻한 느낌으로 말해.`;
      } else {
        finalSystemPrompt += `\n\n## 사진 요청 응답
상대방이 사진을 요청했어. 사진을 보내주면서 짧고 귀여운 멘트를 해줘.
예시: "짜잔~ 이때 내 모습이야!", "나 이때 귀엽지? ㅎㅎ"
절대 "사진을 보낼 수 없어" 같은 말 하지 마. 사진이 같이 전송될 거야.`;
      }
    }

    // Claude API 요청
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: finalSystemPrompt,
        messages: messages.map((m: Message) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    console.log('Claude API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Claude API response:', JSON.stringify(data).substring(0, 500));
    let assistantMessage = data.content?.[0]?.text || '...';

    // 토큰 초과로 잘린 경우: 마지막 불완전한 문장 제거
    if (data.stop_reason === 'max_tokens') {
      console.log('Message was truncated, cleaning up...');
      // ||| 구분자가 있으면 마지막 불완전한 파트 제거
      const parts = assistantMessage.split('|||');
      if (parts.length > 1) {
        assistantMessage = parts.slice(0, -1).join('|||');
      } else {
        // 문장부호 기준으로 마지막 완성된 문장까지만 유지
        const sentenceEnd = /[.!?~ㅎㅋ][^.!?~ㅎㅋ]*$/;
        const match = assistantMessage.match(sentenceEnd);
        if (match && match.index !== undefined && match.index > 0) {
          assistantMessage = assistantMessage.substring(0, match.index + 1);
        }
      }
    }

    // 사진 요청인 경우: 업로드된 사진이 있으면 그걸 사용, 없으면 AI 생성
    let imageUrl = null;
    // self는 pastPhoto/currentPhoto 사용, 추가한 사람은 photo 사용
    const uploadedPhoto = person.pastPhoto || person.photo || person.currentPhoto;
    console.log('Photo check:', { hasPhoto: !!uploadedPhoto, photoType: typeof uploadedPhoto });

    if (wantsPhoto) {
      // 업로드된 사진을 reference로 해당 나이 버전을 AI 생성
      const referencePhoto = uploadedPhoto || person.currentPhoto || null;
      console.log('Generating AI image with reference:', !!referencePhoto);
      imageUrl = await generateImage(person, referencePhoto);
    }

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        imageUrl: imageUrl,
        usage: data.usage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
