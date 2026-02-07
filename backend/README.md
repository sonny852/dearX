# DearX Backend API

FastAPI 기반 백엔드 서버

## 기술 스택

- **FastAPI**: 고성능 Python 웹 프레임워크
- **Supabase**: PostgreSQL 기반 BaaS (Backend as a Service)
- **Pydantic**: 데이터 검증 및 설정 관리
- **Uvicorn**: ASGI 서버

## 프로젝트 구조

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱 진입점
│   ├── config.py            # 환경 설정
│   ├── database.py          # Supabase 연결 관리
│   ├── dependencies.py      # 의존성 주입 (인증 등)
│   ├── models/              # Pydantic 모델
│   │   ├── user.py
│   │   ├── person.py
│   │   └── message.py
│   ├── routers/             # API 라우터
│   │   ├── auth.py          # 인증 관련
│   │   ├── people.py        # 사람 관리
│   │   └── messages.py      # 메시지 관리
│   └── services/            # 비즈니스 로직
│       ├── auth.py
│       └── storage.py
├── requirements.txt         # Python 패키지
├── .env.example            # 환경 변수 예시
└── README.md
```

## 설치 및 실행

### 1. 가상환경 생성 및 활성화

```bash
cd backend
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 2. 패키지 설치

```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정

`.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일 수정:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000
```

### 4. 서버 실행

```bash
# 개발 모드 (자동 재시작)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 또는
python -m app.main
```

### 5. API 문서 확인

서버 실행 후 아래 URL에서 자동 생성된 API 문서 확인:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 엔드포인트

### 인증 (Auth)

- `GET /auth/me` - 현재 사용자 정보 조회
- `POST /auth/logout` - 로그아웃

### 사람 관리 (People)

- `GET /people` - 사람 목록 조회
- `POST /people` - 새 사람 추가
- `GET /people/{person_id}` - 특정 사람 정보 조회
- `PATCH /people/{person_id}` - 사람 정보 수정
- `DELETE /people/{person_id}` - 사람 삭제

### 메시지 (Messages)

- `GET /messages?person_id={person_id}&limit={limit}` - 대화 기록 조회
- `POST /messages` - 새 메시지 저장

## 인증 방식

프론트엔드에서 Supabase OAuth 로그인 후 받은 액세스 토큰을 사용:

```
Authorization: Bearer {access_token}
```

## 개발 노트

### Supabase 연동

- 프론트엔드의 `src/lib/supabase.js`와 동일한 Supabase 프로젝트 사용
- 인증은 프론트엔드에서 처리 (카카오/구글 OAuth)
- 백엔드는 토큰 검증 및 데이터 접근 제어

### 데이터베이스 테이블

- `profiles`: 사용자 프로필
- `people`: 사용자가 관리하는 사람들
- `messages`: 대화 기록
- `photos` (Storage): 사진 저장

### 보안

- Row Level Security (RLS)를 통한 데이터 접근 제어
- 사용자별 데이터 격리
- CORS 설정으로 허용된 출처만 접근 가능
