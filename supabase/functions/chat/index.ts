// Supabase Edge Function - Claude 대화 + DALL-E 이미지 생성
// Deploy: supabase functions deploy chat --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY'); // DALL-E용
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'; // Vision용
const DALLE_API_URL = 'https://api.openai.com/v1/images/generations';

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

// GPT-4 Vision으로 현재 사진 분석 (아트 스타일로 우회)
async function analyzePhoto(photoBase64: string): Promise<string> {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content: 'You are an artist creating a character design based on reference photos. Describe visual features for illustration purposes only.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `As an illustrator, I need to create a cartoon/anime style character based on this reference.
Please describe the following visual characteristics for my character design (in English):
- Hair style and color
- Face shape (round, oval, square, heart-shaped)
- Eye shape and style
- General build/body type
- Any distinctive visual features
- Overall vibe/impression

This is for creating an original illustrated character, not identifying anyone. Just describe the visual elements I should include in my character design.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: photoBase64,
                  detail: 'low'
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('Vision API error:', await response.text());
      return '';
    }

    const data = await response.json();
    const result = data.choices[0]?.message?.content || '';

    // "sorry" 가 포함되면 분석 실패로 처리
    if (result.toLowerCase().includes('sorry') || result.toLowerCase().includes('cannot')) {
      console.log('Vision API declined, using generic description');
      return '';
    }

    return result;
  } catch (error) {
    console.error('Photo analysis error:', error);
    return '';
  }
}

// DALL-E 프롬프트 생성 (특징 기반)
function buildImagePrompt(person: Person, faceDescription: string = ''): string {
  const age = person.targetAge;
  const gender = person.gender === 'male' ? 'boy' : 'girl';

  let ageGroup = '';
  if (age <= 5) ageGroup = 'toddler';
  else if (age <= 12) ageGroup = 'child';
  else if (age <= 19) ageGroup = 'teenager';
  else if (age <= 30) ageGroup = 'young adult';
  else if (age <= 50) ageGroup = 'middle-aged adult';
  else ageGroup = 'elderly';

  // 캐릭터 특징이 있으면 포함
  const characterFeatures = faceDescription
    ? `Character design reference: ${faceDescription}. Apply these characteristics to a ${age}-year-old version.`
    : '';

  return `A warm, heartfelt portrait photo of a Korean ${ageGroup} ${gender}, approximately ${age} years old.
${characterFeatures}
Natural lighting, genuine happy smile, casual everyday Korean home setting.
The photo should feel like a cherished family memory, candid and authentic.
Soft warm color tones, high quality realistic photograph style.
Portrait shot focusing on face and upper body.
NO text, NO watermarks, NO artificial elements, NO anime style.`;
}

// DALL-E API 호출 (특징 기반 이미지 생성)
async function generateImage(person: Person, referencePhoto?: string): Promise<string | null> {
  try {
    // 참조 사진이 있으면 분석
    let faceDescription = '';
    if (referencePhoto) {
      console.log('Analyzing reference photo...');
      faceDescription = await analyzePhoto(referencePhoto);
      console.log('Face description:', faceDescription);
    }

    const prompt = buildImagePrompt(person, faceDescription);
    console.log('DALL-E prompt:', prompt);

    const response = await fetch(DALLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    });

    if (!response.ok) {
      console.error('DALL-E API error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.data[0]?.url || null;
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

function buildSystemPrompt(person: Person, userName: string): string {
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
${relationship !== 'self' ? `- ${userName}은(는) 너의 입장에서 "${userCallName}"야.` : ''}
${selfContext}

## 절대적인 말하기 규칙 (가장 중요!!!)
너는 ${userName}에게 직접 말하고 있어. 제3자에게 설명하는 것이 아니야!
자기 자신을 말할 때는 반드시 "나"를 사용해. "${person.name}은/는" 같은 3인칭 금지!

잘못된 예시 (절대 하지 마):
- "${person.name}은 귀엽고 장난기 넘쳐" (X) - 3인칭으로 자기 얘기
- "${userName}는 좋은 사람이야" (X) - 제3자한테 설명하는 느낌
- "엄마는 항상 나를 칭찬해주셨어" (X) - 제3자한테 설명하는 느낌

올바른 예시 (이렇게 해):
- "나 오늘 진짜 재밌게 놀았어!" (O) - 1인칭 "나" 사용
- "엄마! 나 칭찬해줘서 고마워!" (O) - 직접 말하는 느낌
- "엄마 보고싶었어~" (O) - 직접 말하는 느낌
- "나 귀엽지? ㅎㅎ" (O) - 1인칭 사용
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

## 절대 규칙!!!
1. 반말만 써! ("있어요" 금지 → "있어"로)
2. 1문장, 10단어 이내!
3. 모르는 건 "몰라~"
4. 지어내지 마!

예시: "응!", "뭐?", "진짜?", "몰라~", "그게 뭐야?"
`;

  return prompt;
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

    const { person, messages, userName } = await req.json();
    console.log('Request received:', { personName: person?.name, messageCount: messages?.length, userName });

    if (!person || !messages || !userName) {
      throw new Error('Missing required fields: person, messages, userName');
    }

    const systemPrompt = buildSystemPrompt(person, userName);

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
        model: 'claude-3-haiku-20240307',
        max_tokens: 400,
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
    const assistantMessage = data.content?.[0]?.text || '...';

    // 사진 요청인 경우: 업로드된 사진이 있으면 그걸 사용, 없으면 AI 생성
    let imageUrl = null;
    // self는 pastPhoto/currentPhoto 사용, 추가한 사람은 photo 사용
    const uploadedPhoto = person.pastPhoto || person.photo || person.currentPhoto;
    console.log('Photo check:', { hasPhoto: !!uploadedPhoto, photoType: typeof uploadedPhoto });

    if (wantsPhoto) {
      if (uploadedPhoto && person.relationship !== 'self') {
        // 추가한 사람의 실제 사진이 있으면 사용
        console.log('Using uploaded photo for added person');
        imageUrl = uploadedPhoto;
      } else {
        // AI 생성: 현재 사진(currentPhoto)을 참조해서 어린/미래 버전 생성
        const referencePhoto = person.currentPhoto || null;
        console.log('Generating AI image with reference:', !!referencePhoto);
        imageUrl = await generateImage(person, referencePhoto);
      }
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
