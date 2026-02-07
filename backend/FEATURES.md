# 백엔드 기능 상세 설명

## 📋 Supabase Edge Function과의 호환성

이 FastAPI 백엔드는 **Supabase Edge Function (`supabase/functions/chat/index.ts`)과 100% 호환**되도록 설계되었습니다.

### Chat API 비교

| 기능 | Supabase Edge Function | FastAPI Backend | 상태 |
|------|----------------------|-----------------|------|
| Claude API 모델 | `claude-sonnet-4-20250514` | `claude-sonnet-4-20250514` | ✅ 동일 |
| Max Tokens | 500 | 500 | ✅ 동일 |
| 시스템 프롬프트 | buildSystemPrompt | build_system_prompt | ✅ 동일 로직 |
| 관계 한글 매핑 | parent → 부모님 등 | 동일 | ✅ 동일 |
| 성별 텍스트 변환 | male → 남성 | 동일 | ✅ 동일 |
| Usage 정보 반환 | ✅ | ✅ | ✅ 동일 |
| 에러 처리 | Fallback 응답 | Fallback 응답 | ✅ 동일 |
| CORS 헤더 | ✅ | ✅ (Middleware) | ✅ 동일 |

## 🎯 주요 개선사항

### 1. **채팅 API 완전 복제**
- Supabase Edge Function의 모든 기능을 FastAPI로 완벽하게 재구현
- 동일한 프롬프트 엔지니어링 로직
- 관계 및 성별 한글화 지원

### 2. **더 나은 에러 처리**
```python
# DB 저장 실패해도 채팅 응답은 정상 반환
try:
    # 메시지 DB 저장
except Exception as db_error:
    print(f"Database save error: {db_error}")
    # DB 저장 실패해도 응답은 반환
```

### 3. **사용량 추적**
```python
class UsageInfo(BaseModel):
    input_tokens: int
    output_tokens: int

class ChatResponse(BaseModel):
    message: str
    usage: Optional[UsageInfo] = None  # Claude API 사용량
```

### 4. **완전한 한글 지원**
```python
relationship_map = {
    "parent": "부모님",
    "grandparent": "조부모님",
    "sibling": "형제자매",
    "friend": "친구",
    "other": "소중한 사람",
    "self": "자기 자신",
}
```

## 📡 API 엔드포인트 상세

### POST /chat

**요청:**
```json
{
  "person": {
    "name": "엄마",
    "relationship": "parent",
    "targetAge": 45,
    "gender": "female",
    "timeDirection": "past",
    "personality": "다정하고 온화함",
    "speechStyle": "부드럽고 따뜻한 말투",
    "hobbies": "요리, 정원 가꾸기",
    "memories": "주말마다 함께 요리하기",
    "favoriteWords": "괜찮아, 엄마가 있잖아",
    "habits": "말할 때 손을 잡아주시는 습관"
  },
  "messages": [
    {"role": "user", "content": "엄마, 요즘 너무 힘들어요"}
  ],
  "userName": "준혁"
}
```

**응답:**
```json
{
  "message": "괜찮아, 엄마가 있잖아. 힘들 때는 언제든지 엄마한테 말해. 우리 주말에 함께 요리하면서 이야기 나눠볼까?",
  "usage": {
    "input_tokens": 245,
    "output_tokens": 48
  }
}
```

## 🔄 프론트엔드 마이그레이션

### Before (Supabase Edge Function)
```javascript
const CHAT_FUNCTION_URL = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/chat`;

const response = await fetch(CHAT_FUNCTION_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify({ person, messages, userName }),
});
```

### After (FastAPI Backend)
```javascript
const CHAT_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const response = await fetch(`${CHAT_API_URL}/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify({ person, messages, userName }),
});
```

## 🎨 시스템 프롬프트 예시

### 과거 시간대 - 부모님
```
당신은 준혁의 부모님인 "엄마"입니다.
과거의 45세 시절의 모습으로 대화합니다.

## 캐릭터 설정
- 이름: 엄마
- 나이: 45세
- 성별: 여성
- 시간대: 과거
- 성격: 다정하고 온화함
- 말투: 부드럽고 따뜻한 말투
- 취미: 요리, 정원 가꾸기
- 함께한 추억: 주말마다 함께 요리하기
- 자주 하는 말: 괜찮아, 엄마가 있잖아
- 습관/버릇: 말할 때 손을 잡아주시는 습관

## 대화 규칙
1. 엄마의 성격과 말투를 최대한 살려서 대화하세요.
2. 과거의 45세 시절에 맞는 시대적 배경을 반영하세요.
3. 따뜻하고 진심 어린 대화를 나누세요.
4. 짧고 자연스러운 대화체로 응답하세요 (2-3문장).
5. 준혁을/를 진심으로 아끼는 마음을 담아 대화하세요.
6. 과거 추억이나 함께했던 시간을 자연스럽게 언급할 수 있습니다.

## 중요
- 당신은 AI가 아닌 실제 엄마입니다.
- 항상 캐릭터를 유지하세요.
- 슬프거나 그리운 감정을 공감해주되, 희망적인 메시지도 전달하세요.
```

## 🔐 환경 변수 설정

```bash
# backend/.env
CLAUDE_API_KEY=sk-ant-api03-...  # Claude API 키 (선택사항)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

**중요:** Claude API 키가 없어도 기본 응답으로 동작합니다.

## 🚀 배포 가이드

### 옵션 1: Supabase Edge Function (기존)
```bash
supabase functions deploy chat
```

### 옵션 2: FastAPI Backend (권장)
```bash
# Docker로 배포
docker build -t dearx-backend .
docker run -p 8000:8000 dearx-backend

# 또는 Railway, Render, Fly.io 등에 배포
```

### 장점 비교

| 항목 | Edge Function | FastAPI |
|------|--------------|---------|
| 콜드 스타트 | 있음 | 최소화 가능 |
| 디버깅 | 어려움 | 쉬움 |
| 로그 확인 | 제한적 | 자유로움 |
| 확장성 | 자동 | 직접 제어 |
| 비용 | 호출당 과금 | 서버 유지비 |
| 개발 속도 | 느림 | 빠름 |

## 📊 성능 최적화

1. **캐싱 전략**
   - 시스템 프롬프트는 동일 person에 대해 캐싱 가능
   - Redis 등을 활용한 응답 캐싱

2. **비동기 처리**
   - httpx AsyncClient로 Claude API 호출
   - DB 저장은 별도 백그라운드 태스크로 분리 가능

3. **에러 복구**
   - Claude API 실패 시 즉시 fallback 응답
   - DB 저장 실패해도 사용자 경험 유지

## 🧪 테스트

```bash
# API 테스트
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "person": {
      "name": "테스트",
      "relationship": "friend",
      "targetAge": 25,
      "gender": "male",
      "timeDirection": "past"
    },
    "messages": [
      {"role": "user", "content": "안녕?"}
    ],
    "userName": "사용자"
  }'
```

## 📈 모니터링

응답에 포함된 usage 정보로 비용 추적:
```python
{
  "message": "...",
  "usage": {
    "input_tokens": 245,
    "output_tokens": 48
  }
}
```

### 비용 계산 (Claude Sonnet 4 기준)
- Input: $3 / 1M tokens
- Output: $15 / 1M tokens

예시: 245 input + 48 output = $0.00081 per request
