# Passage

A Progressive Web App that serves as an AI companion for people navigating difficult life passages (burnout, grief, divorce, addiction recovery, career crisis, life transitions).

## What it does

- Listens via voice or text
- Remembers everything via RAG (vector database)
- Spots patterns across conversations
- Provides 24/7 psychology-informed support
- Helps users prepare for therapy/treatment

## What it's NOT

- Not therapy or diagnosis
- Not crisis intervention
- Not medical advice

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS (Mobile-first)
- **Backend/Auth**: Supabase (Auth + PostgreSQL)
- **AI Engine**: Claude API (Anthropic SDK)
- **Voice Recording**: MediaRecorder API (Browser native)
- **Transcription**: OpenAI Whisper API (whisper-1 model)
- **Vector DB**: Pinecone (Serverless, cosine similarity)
- **Embeddings**: OpenAI (text-embedding-3-small, 1536 dimensions)
- **Payments**: Stripe (Checkout + Customer Portal)
- **Hosting**: Vercel (not set up yet)

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account
- OpenAI API key
- Anthropic API key
- Pinecone account
- Stripe account (optional for now)

### 2. Clone and Install

```bash
cd passage-app
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to Project Settings > API
3. Copy your project URL and anon key
4. Go to SQL Editor and run the migration:
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and execute in SQL Editor
5. Enable Email Auth in Authentication settings

### 4. Set Up Pinecone

1. Create a Pinecone account at https://www.pinecone.io
2. Create a new index with these settings:
   - Name: `passage-conversations`
   - Dimensions: `1536`
   - Metric: `cosine`
   - Cloud: `aws`
   - Region: `us-east-1`
3. Copy your API key from the dashboard

### 5. Get API Keys

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key

**Anthropic:**
1. Go to https://console.anthropic.com/
2. Create a new API key

**Stripe (Optional for now):**
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your publishable and secret keys

### 6. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your keys:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI (Whisper + Embeddings)
OPENAI_API_KEY=your_openai_api_key

# Anthropic (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=passage-conversations

# Stripe (Optional for now)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
passage-app/
├── app/                    # Next.js App Router
│   ├── (app)/             # Protected routes
│   │   ├── home/          # Dashboard
│   │   ├── talk/          # Conversation screen
│   │   ├── memories/      # History & patterns
│   │   └── settings/      # Account settings
│   ├── auth/              # Authentication pages
│   ├── onboard/           # Entry point selection
│   └── page.tsx           # Landing page
├── components/            # Reusable UI components
├── lib/                   # Core utilities
│   ├── supabase/         # Supabase clients
│   ├── claude/           # Claude AI integration
│   ├── pinecone/         # Vector DB operations
│   ├── whisper/          # Audio transcription
│   └── stripe/           # Payment processing
├── types/                 # TypeScript types
├── supabase/             # Database migrations
└── public/               # Static assets & PWA files
```

## Development Phases

### ✅ Phase 1: Foundation (COMPLETE)
- Next.js 14 project initialized
- Tailwind CSS configured
- Supabase authentication setup
- Database schema created
- PWA configuration
- All routes scaffolded

### 🚧 Phase 2: Voice & Transcription (TODO)
- VoiceRecorder component
- Audio upload to Supabase Storage
- Whisper API integration
- Text input fallback
- Conversation thread UI

### 🚧 Phase 3: RAG & AI (TODO)
- Pinecone client setup
- Embedding generation
- Store/retrieve functions
- Claude API integration
- Model routing (Haiku/Sonnet)
- Context injection from RAG

### 🚧 Phase 4: Features (TODO)
- Memory tagging system
- Pattern detection
- Recall query handling
- Crisis resources component

### 🚧 Phase 5: Polish (TODO)
- Error handling
- Loading states
- Mobile responsiveness
- PWA install prompt

## Current Status

**Phase 1 Complete** ✅

The foundation is fully set up:
- All authentication flows working
- Database schema ready
- Entry point onboarding
- Protected routes
- All placeholder pages created
- Integration libraries configured

**Next Steps:**
1. Add API keys to `.env.local`
2. Run migrations in Supabase
3. Create Pinecone index
4. Test signup/signin flow
5. Begin Phase 2: Voice & Transcription

## Key Features (Planned)

### P0 - MVP
- ✅ Entry point selection
- ⏳ Voice input (MediaRecorder API, 10-min max)
- ⏳ Whisper transcription
- ⏳ Text input fallback
- ⏳ Claude AI responses (Haiku 70% / Sonnet 30%)
- ⏳ RAG memory (store all conversations)
- ⏳ Basic pattern detection
- ⏳ Recall queries
- ⏳ Memory tagging
- ⏳ Crisis resources component

### P1 - Post-MVP
- Hume AI emotion analysis
- Voice output (TTS)
- Export to therapist
- Push notifications
- Therapist portal

## Important Notes

- **Mobile-first design** - test on phone constantly
- **Simple & calming UI** - not clinical, not childish
- Every page needs loading and error states
- Voice recording needs clear permission handling
- Store audio files in Supabase Storage
- Embed both user AND assistant messages in Pinecone
- Use streaming for Claude responses (better UX)

## Contributing

This is a personal project. If you have suggestions, please reach out.

## License

Private - All Rights Reserved
