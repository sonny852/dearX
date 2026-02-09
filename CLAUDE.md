# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DearX is a full-stack AI chat application where users create virtual conversation partners (deceased loved ones, future selves) and chat with them via Claude API. Monorepo with React frontend and FastAPI backend.

## Commands

### Frontend (root directory)
```bash
npm start        # Dev server on port 3000
npm run build    # Production build
npm test         # Run tests (Jest + React Testing Library)
```

### Backend (`/backend` directory)
```bash
cd backend
pip install -r requirements.txt
python app/main.py   # Dev server on port 8000 with auto-reload
# Or: python -m uvicorn app.main:app --reload
```

### Supabase Edge Functions (`/supabase/functions/`)
Deployed via Supabase CLI. Functions: `chat` (Claude + DALL-E), `payment` (Stripe).

## Architecture

### Frontend (React 19 + Tailwind CSS)
- **No React Router** — screen navigation is managed entirely through state in `src/context/AppContext.jsx`
- `AppContext` is the single source of truth: auth state, modals, people CRUD, messages, language, premium status
- All components consume `useApp()` hook from AppContext
- **Screens**: hero → conversation → form → dashboard (controlled by `currentScreen` state in App.jsx)
- **Modals**: ChatInterface, PersonForm, PeopleManager, PaymentPopup, MyPage, NameInputPopup — all toggled via AppContext booleans
- **i18n**: Hardcoded translation objects in `src/constants/translations.js` (ko/en/ja)
- **Auth**: Supabase OAuth (Kakao, Google) with `onAuthStateChange` listener in AppContext
- **Monetization**: Free tier (5 messages/day tracked in localStorage, 1 person max) vs premium (Stripe)

### Backend (FastAPI)
- Entry: `backend/app/main.py` — registers 6 routers: auth, people, messages, storage, chat, premium
- Config via pydantic-settings in `backend/app/config.py`
- Supabase client singleton in `backend/app/database.py`
- Auth dependency in `backend/app/dependencies.py` extracts Bearer token → validates via Supabase
- Chat router builds dynamic system prompts from person attributes (personality, speech_style, memories, etc.) and calls Claude Sonnet API

### Database (Supabase PostgreSQL)
- Schema in `supabase/schema.sql` — tables: profiles, people, messages, subscriptions
- Row-Level Security enabled on all tables (users access only their own data)
- `profiles.is_premium` + `premium_expires_at` control premium access

### External Services
- **Supabase**: Auth (OAuth), database, storage, edge functions
- **Anthropic Claude API**: Chat responses (backend + edge function)
- **OpenAI API**: GPT-4 Vision photo analysis + DALL-E image generation (edge function only)
- **Stripe**: Payment processing

## Styling

- Tailwind 3 with custom theme colors: coral (#ff8c69), gold (#ffc17a), cream (#f5e6d3), dark (#1a1612)
- Fonts: Playfair Display (headings), SUIT Variable (body), Noto Serif KR (serif)
- Custom animations in `src/styles/animations.css`

## Environment Variables

Frontend (`.env`): `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`, `REACT_APP_STRIPE_PUBLISHABLE_KEY`

Backend (`.env`): `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGINS`

Edge Functions: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY` (set via Supabase secrets)

## Key Patterns

- Demo/fallback mode throughout — app degrades gracefully when Supabase is not configured
- Photos stored as base64 in Supabase storage via `/storage` router
- Free message counting uses localStorage with daily date reset (`freeMessageDate`/`freeMessageCount` keys)
- Frontend uses `html2canvas` for chat capture-to-image and `qrcode.react` for share QR codes
