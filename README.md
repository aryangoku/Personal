# Shona Chatbot App

A personal romantic chatbot web app that:

- answers questions using an AI assistant
- chats like a real boyfriend (warm, romantic, non-robotic tone)
- always addresses her as **Shona**
- plays responses in **your cloned voice** (via ElevenLabs)
- shows your couple photos with a floating up/down animation

## 1) Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill in keys:

- `GROQ_API_KEY`
- `GROQ_MODEL` (optional, default already set)
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `SUPABASE_URL` (optional, for chat logging)
- `SUPABASE_SERVICE_ROLE_KEY` (optional, for chat logging)
- `CHAT_ADMIN_TOKEN` (optional, protects chat log endpoint)

3. Add your photos:

- `public/images/us1.jpg`
- `public/images/us2.jpg`

## 2) Run

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## 3) Clone your voice quickly (ElevenLabs)

1. Create/login to ElevenLabs.
2. Use VoiceLab to clone your voice from clean samples.
3. Copy the generated `voice_id` into `.env` as `ELEVENLABS_VOICE_ID`.

## Notes

- Keep `.env` private.
- You can tune tone in `server.js` by editing `SYSTEM_PROMPT`.
- If Supabase env vars are set, `/api/chat` logs both user and assistant messages.
- With `chat_memories` table present, Aru remembers facts and scheduled follow-ups (e.g. asks how her movie was the next day).

## Optional: Chat Logging Database (Supabase)

Create this table in Supabase SQL editor:

```sql
create table if not exists chat_logs (
  id bigserial primary key,
  session_id text not null,
  role text not null check (role in ('user', 'assistant')),
  message text not null,
  created_at timestamptz not null default now()
);
```

Read logs using:

```bash
GET /api/chats?sessionId=<optional>&limit=100
Header: x-admin-token: <CHAT_ADMIN_TOKEN>
```

## Optional: Chat memory (facts + “ask next day” follow-ups)

Create this table in Supabase:

```sql
create table if not exists chat_memories (
  id bigserial primary key,
  session_id text not null,
  kind text not null check (kind in ('fact', 'follow_up')),
  memory_text text not null,
  follow_up_hint text,
  follow_up_after timestamptz,
  consumed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists chat_memories_session_kind_idx
  on chat_memories (session_id, kind);

create index if not exists chat_memories_followup_due_idx
  on chat_memories (session_id, follow_up_after)
  where kind = 'follow_up' and consumed = false;
```

After each message, the server extracts facts and future-event follow-ups via Groq and stores them here. When `follow_up_after` is in the past, the next reply includes those hints so Aru can ask how things went—naturally, in his voice.
