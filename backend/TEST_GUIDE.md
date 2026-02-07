# API 테스트 가이드

## 🌐 방법 1: Swagger UI (가장 쉬움)

### 1. 브라우저에서 API 문서 열기
```
http://localhost:8000/docs
```

### 2. 채팅 API 테스트하기

1. **POST /chat** 엔드포인트 클릭
2. **Try it out** 버튼 클릭
3. 다음 JSON을 입력:

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
    {
      "role": "user",
      "content": "엄마, 요즘 너무 힘들어요"
    }
  ],
  "userName": "준혁"
}
```

4. **Execute** 버튼 클릭
5. 응답 확인!

**주의:** 실제로는 인증 토큰이 필요하지만, 데모 모드에서는 생략 가능합니다.

---

## 💻 방법 2: curl 명령어로 테스트

### 헬스 체크
```bash
curl http://localhost:8000/health
```

### 채팅 API 테스트 (Claude API 키 없이)
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "person": {
      "name": "친구",
      "relationship": "friend",
      "targetAge": 25,
      "gender": "male",
      "timeDirection": "past",
      "favoriteWords": "힘내! 넌 할 수 있어!"
    },
    "messages": [
      {"role": "user", "content": "안녕?"}
    ],
    "userName": "사용자"
  }'
```

**예상 응답 (Claude API 키 없을 때):**
```json
{
  "message": "힘내! 넌 할 수 있어!",
  "usage": null
}
```

### 사람 목록 조회
```bash
curl http://localhost:8000/people
```

### 프리미엄 상태 확인
```bash
curl http://localhost:8000/premium/status
```

---

## 🎨 방법 3: 프론트엔드 실행 (Node.js 업그레이드 필요)

### 현재 문제
- 현재 Node.js 버전: **v14.16.1** (너무 낮음)
- 필요한 버전: **v18.0.0 이상**

### Node.js 업그레이드 방법

#### Option 1: nvm 사용 (권장)
```bash
# nvm 설치 (없는 경우)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 최신 LTS 버전 설치
nvm install --lts

# 사용
nvm use --lts

# 버전 확인
node --version  # v20.x.x 이상이어야 함
```

#### Option 2: 직접 다운로드
https://nodejs.org/ 에서 LTS 버전 다운로드

### 프론트엔드 실행
```bash
# Node 업그레이드 후
npm install
npm start
```

그러면 http://localhost:3000 에서 프론트엔드가 실행됩니다.

---

## 🔧 통합 테스트 시나리오

### 시나리오 1: 채팅 플로우 테스트

1. **사람 추가**
```bash
curl -X POST http://localhost:8000/people \
  -H "Content-Type: application/json" \
  -d '{
    "relationship": "parent",
    "name": "엄마",
    "photo_url": "https://example.com/photo.jpg",
    "target_age": 45,
    "gender": "female",
    "time_direction": "past",
    "personality": "다정함",
    "speech_style": "따뜻한 말투",
    "hobbies": "요리",
    "memories": "주말 요리",
    "favorite_words": "괜찮아",
    "habits": "손 잡기"
  }'
```

2. **채팅 시작**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "person": {
      "name": "엄마",
      "relationship": "parent",
      "targetAge": 45,
      "gender": "female",
      "timeDirection": "past",
      "favoriteWords": "괜찮아, 엄마가 있잖아"
    },
    "messages": [
      {"role": "user", "content": "엄마, 보고싶어요"}
    ],
    "userName": "준혁"
  }'
```

3. **메시지 저장**
```bash
curl -X POST http://localhost:8000/messages \
  -H "Content-Type: application/json" \
  -d '{
    "person_id": "person-id-here",
    "role": "user",
    "content": "안녕하세요"
  }'
```

---

## 📊 API 응답 예시

### 성공적인 채팅 응답 (Claude API 키 있을 때)
```json
{
  "message": "준혁아, 엄마도 보고 싶어. 요즘은 어떻게 지내니? 밥은 잘 챙겨 먹고 있어?",
  "usage": {
    "input_tokens": 245,
    "output_tokens": 48
  }
}
```

### Fallback 응답 (Claude API 키 없을 때)
```json
{
  "message": "괜찮아, 엄마가 있잖아",
  "usage": null
}
```

---

## 🎯 빠른 테스트 체크리스트

- [ ] 백엔드 실행 확인: http://localhost:8000
- [ ] API 문서 열기: http://localhost:8000/docs
- [ ] 헬스 체크: `curl http://localhost:8000/health`
- [ ] 채팅 API 테스트 (Swagger UI)
- [ ] 프론트엔드 실행 (Node 업그레이드 후)
- [ ] 전체 플로우 테스트

---

## 🐛 문제 해결

### "CORS error"
- 백엔드 `.env`의 `CORS_ORIGINS`에 프론트엔드 URL 추가
- 현재: `CORS_ORIGINS=http://localhost:3000`

### "Authentication failed"
- 데모 모드에서는 인증 토큰 없이 테스트 가능
- Swagger UI에서 "Authorize" 버튼 무시 가능

### "Claude API error"
- Claude API 키가 없으면 fallback 응답 반환
- `.env`에 `CLAUDE_API_KEY` 추가하면 실제 AI 응답 받음

---

## 📞 문의

문제가 있으면:
1. 백엔드 로그 확인: 터미널에서 에러 메시지 확인
2. API 문서에서 직접 테스트
3. curl 명령어로 단계별 테스트
