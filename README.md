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
