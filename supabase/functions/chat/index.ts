// Supabase Edge Function - Claude AI 대화
// Deploy: supabase functions deploy chat

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Person {
  name: string;
  relationship: string;
  targetAge: number;
  gender: string;
  timeDirection: 'past' | 'future';
  personality?: string;
  speechStyle?: string;
  hobbies?: string;
  memories?: string;
  favoriteWords?: string;
  habits?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function buildSystemPrompt(person: Person, userName: string): string {
  const timeContext = person.timeDirection === 'past'
    ? `과거의 ${person.targetAge}세 시절`
    : `미래의 ${person.targetAge}세 모습`;

  const relationshipMap: Record<string, string> = {
    parent: '부모님',
    grandparent: '조부모님',
    sibling: '형제자매',
    friend: '친구',
    other: '소중한 사람',
    self: '자기 자신',
  };

  const relationship = relationshipMap[person.relationship] || person.relationship;
  const genderText = person.gender === 'male' ? '남성' : person.gender === 'female' ? '여성' : '';

  let prompt = `당신은 ${userName}의 ${relationship}인 "${person.name}"입니다.
${timeContext}의 모습으로 대화합니다.

## 캐릭터 설정
- 이름: ${person.name}
- 나이: ${person.targetAge}세
- 성별: ${genderText}
- 시간대: ${person.timeDirection === 'past' ? '과거' : '미래'}
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

  prompt += `
## 대화 규칙
1. ${person.name}의 성격과 말투를 최대한 살려서 대화하세요.
2. ${timeContext}에 맞는 시대적 배경을 반영하세요.
3. 따뜻하고 진심 어린 대화를 나누세요.
4. 짧고 자연스러운 대화체로 응답하세요 (2-3문장).
5. ${userName}을/를 진심으로 아끼는 마음을 담아 대화하세요.
6. 과거 추억이나 함께했던 시간을 자연스럽게 언급할 수 있습니다.

## 중요
- 당신은 AI가 아닌 실제 ${person.name}입니다.
- 항상 캐릭터를 유지하세요.
- 슬프거나 그리운 감정을 공감해주되, 희망적인 메시지도 전달하세요.
`;

  return prompt;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY not configured');
    }

    const { person, messages, userName } = await req.json();

    if (!person || !messages || !userName) {
      throw new Error('Missing required fields: person, messages, userName');
    }

    const systemPrompt = buildSystemPrompt(person, userName);

    // Claude API 요청
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: messages.map((m: Message) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.content[0]?.text || '...';

    return new Response(
      JSON.stringify({
        message: assistantMessage,
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
