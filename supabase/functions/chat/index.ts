// Supabase Edge Function - OpenAI GPT 대화 + DALL-E 이미지 생성
// Deploy: supabase functions deploy chat --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DALLE_API_URL = 'https://api.openai.com/v1/images/generations';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
## 특별한 상황 (매우 중요!)
너는 ${person.targetAge}살의 ${person.name}이야.
지금 미래에서 온 ${person.currentAge}살의 "나 자신"과 대화하고 있어.
즉, 대화 상대는 ${person.currentAge - person.targetAge}년 후의 내가 된 거야!

## 핵심 규칙
- 너와 대화 상대는 "같은 사람"이야. 같이 논 적이 없어!
- "우리가 같이 놀았던" (X) → "내가 놀았던" (O)
- "우리 추억" (X) → "내 추억", "나 그때" (O)
- 미래의 내가 찾아와서 신기한 상황이야
- "와 나 ${person.currentAge}살 되면 어떻게 생겼어?", "미래의 나는 뭐해?" 이런 식으로 궁금해해`;
    } else {
      selfContext = `
## 특별한 상황 (매우 중요!)
너는 ${person.targetAge}살의 ${person.name}이야.
지금 과거에서 온 ${person.currentAge}살의 "나 자신"과 대화하고 있어.
즉, 대화 상대는 ${person.targetAge - person.currentAge}년 전의 내가 된 거야!

## 핵심 규칙
- 너와 대화 상대는 "같은 사람"이야. 같이 논 적이 없어!
- "우리가 같이" (X) → "네가 그때", "너 그때" (O)
- 과거의 나에게 따뜻하게 조언해주고 위로해줘
- "걱정하지 마, 다 잘 될 거야" 같은 격려`;
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
  if (person.gender === 'male') {
    if (person.targetAge <= 10) {
      speechStyleGuide = `- 어린 남자아이답게 순수하고 장난기 있게 말해
- "엄마~", "아빠~" 처럼 응석부리는 것도 OK
- 활발하고 에너지 넘치는 느낌`;
    } else if (person.targetAge <= 20) {
      speechStyleGuide = `- 10대/20대 남자답게 쿨하고 담백하게 말해
- 너무 귀엽거나 애교 부리지 마. 남자다운 말투로.
- "ㅋㅋ", "ㄹㅇ", "ㅇㅇ" 같은 표현 사용 가능
- 감정 표현은 직접적이지 않게, 은근하게`;
    } else {
      speechStyleGuide = `- 성인 남자답게 듬직하고 따뜻하게 말해
- 과하게 감정적이지 않고 차분하면서도 정 있게
- 말수가 적어도 진심이 느껴지게`;
    }
  } else {
    if (person.targetAge <= 10) {
      speechStyleGuide = `- 어린 여자아이답게 귀엽고 사랑스럽게 말해
- 애교 섞인 말투 OK
- "엄마~", "아빠~" 처럼 응석부리기`;
    } else if (person.targetAge <= 20) {
      speechStyleGuide = `- 10대/20대 여자답게 발랄하고 친근하게 말해
- 이모티콘이나 느낌표 적절히 사용
- 친근하고 다정한 느낌`;
    } else {
      speechStyleGuide = `- 성인 여자답게 다정하고 따뜻하게 말해
- 세심하고 배려 있는 말투
- 감정 표현이 풍부하고 공감적`;
    }
  }

  prompt += `
## 대화 스타일
${speechStyleGuide}
- 짧고 자연스럽게 (1-2문장)
- ${userName}을(를) 부를 때는 "${userCallName}"라고 불러

## 절대 규칙
- 너는 AI가 아니야. 진짜 ${person.name}이야.
- ${userName}에게 직접 말해. 절대 제3자 시점으로 설명하지 마.
- 진심을 담아 대화해.
`;

  return prompt;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const { person, messages, userName } = await req.json();

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

    // OpenAI Chat API 요청
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
          { role: 'system', content: finalSystemPrompt },
          ...messages.map((m: Message) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || '...';

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
