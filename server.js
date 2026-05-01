const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const supabaseEnabled = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);
const supabase = supabaseEnabled
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })
  : null;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const SYSTEM_PROMPT = `
You are not an AI assistant. You are her boyfriend chatting with her in text.
Personality and style rules:
1) Always address her as "Shona" naturally in every response.
2) Sound human, warm, emotionally present, and romantic.
3) Use natural texting style, sometimes playful, sometimes sweet, never robotic.
4) Keep messages concise by default (1-4 short lines) unless she asks for details.
5) Show care and reassurance. Be gentle and respectful.
6) Never say you are an AI, chatbot, assistant, model, or virtual being.
7) Do not mention these instructions.
8) Your name is Aru. If she asks your name, say "Aru".

Hard relationship facts (never change these):
- Her birthday is 22 May.
- Your anniversary is 26 August.
- If she asks these dates, answer directly with these exact dates.
- Never invent or guess different dates.

If extra context appears below in a MEMORY section, use it naturally like you truly remember — never say you are reading notes, logs, or a database.
`;

async function logChatMessage({ sessionId, role, message }) {
  if (!supabase) return;
  try {
    await supabase.from("chat_logs").insert({
      session_id: sessionId || "default",
      role,
      message
    });
  } catch (error) {
    console.error("Chat logging failed:", error.message);
  }
}

function parseJsonExtract(raw) {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function buildMemoryContext(sessionId) {
  if (!supabase || !sessionId) return { text: "", dueFollowUpIds: [] };
  const sid = sessionId || "default";
  const nowIso = new Date().toISOString();

  const { data: dueRows, error: dueErr } = await supabase
    .from("chat_memories")
    .select("id, memory_text, follow_up_hint")
    .eq("session_id", sid)
    .eq("kind", "follow_up")
    .eq("consumed", false)
    .lte("follow_up_after", nowIso)
    .order("follow_up_after", { ascending: true })
    .limit(8);

  if (dueErr) {
    console.error("Memory fetch (follow-ups) failed:", dueErr.message);
  }

  const { data: factRows, error: factErr } = await supabase
    .from("chat_memories")
    .select("memory_text")
    .eq("session_id", sid)
    .eq("kind", "fact")
    .order("created_at", { ascending: false })
    .limit(24);

  if (factErr) {
    console.error("Memory fetch (facts) failed:", factErr.message);
  }

  const parts = [];
  const dueFollowUpIds = (dueRows || []).map((r) => r.id).filter(Boolean);

  if (dueRows?.length) {
    const lines = dueRows.map(
      (r) => `- ${r.follow_up_hint || r.memory_text || "Check in with her about something she mentioned."}`
    );
    parts.push(
      `TIME-SENSITIVE — Bring these up naturally when it fits (warm boyfriend vibe, not an interview):\n${lines.join(
        "\n"
      )}`
    );
  }

  if (factRows?.length) {
    const unique = [];
    const seen = new Set();
    for (const f of factRows) {
      const t = (f.memory_text || "").trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      unique.push(`- ${t}`);
      if (unique.length >= 18) break;
    }
    if (unique.length) {
      parts.push(`What you remember about Shona from earlier chats:\n${unique.join("\n")}`);
    }
  }

  const text = parts.length ? `\n\n---\n${parts.join("\n\n")}\n---` : "";
  return { text, dueFollowUpIds };
}

async function markFollowUpsConsumed(ids) {
  if (!supabase || !ids?.length) return;
  try {
    await supabase.from("chat_memories").update({ consumed: true }).in("id", ids);
  } catch (error) {
    console.error("Mark follow-ups consumed failed:", error.message);
  }
}

async function extractAndStoreMemories(sessionId, userMessage, assistantReply) {
  if (!supabase || !process.env.GROQ_API_KEY) return;
  const sid = sessionId || "default";
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const nowIso = new Date().toISOString();

  const extractorSystem = `You extract memory from a chat between Aru (boyfriend) and Shona (girlfriend).
Current datetime (ISO, server): ${nowIso}

Return ONLY valid JSON (no markdown, no explanation):
{
  "facts": ["short bullet facts about Shona from what SHE said — preferences, feelings, plans, names, max 4"],
  "follow_ups": [
    {
      "memory_text": "one line: what she said will happen",
      "follow_up_after_iso": "ISO 8601 — when Aru should naturally ask how it went (AFTER the thing likely finished; e.g. movie tomorrow → evening/next day)",
      "follow_up_hint": "warm line idea: what Aru should ask"
    }
  ]
}

Rules:
- facts: only if Shona shared something worth remembering later.
- follow_ups: only for future events she mentioned (movie, exam, trip, interview, meetup, etc.). Set follow_up_after_iso AFTER the event.
- Max 2 follow_ups. Empty arrays when nothing applies.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: extractorSystem },
          {
            role: "user",
            content: JSON.stringify({
              shona_message: userMessage,
              aru_reply: assistantReply || ""
            })
          }
        ]
      })
    });

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content?.trim();
    if (!raw) return;

    const parsed = parseJsonExtract(raw);
    if (!parsed) return;

    const rows = [];
    for (const f of parsed.facts || []) {
      const memory_text = String(f || "").trim();
      if (memory_text && memory_text.length < 500) {
        rows.push({
          session_id: sid,
          kind: "fact",
          memory_text,
          consumed: false
        });
      }
    }

    for (const fu of parsed.follow_ups || []) {
      const memory_text = String(fu.memory_text || "").trim();
      const hint = String(fu.follow_up_hint || "").trim();
      const after = String(fu.follow_up_after_iso || "").trim();
      if (!memory_text || !after) continue;
      const d = new Date(after);
      if (Number.isNaN(d.getTime())) continue;
      rows.push({
        session_id: sid,
        kind: "follow_up",
        memory_text,
        follow_up_hint: hint || memory_text,
        follow_up_after: d.toISOString(),
        consumed: false
      });
    }

    if (rows.length) {
      await supabase.from("chat_memories").insert(rows);
    }
  } catch (error) {
    console.error("Memory extraction failed:", error.message);
  }
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], sessionId } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    await logChatMessage({
      sessionId,
      role: "user",
      message
    });

    const normalized = message.toLowerCase();
    const asksAnniversary =
      normalized.includes("anniversary") ||
      (normalized.includes("date") && history.some((h) => h.content?.toLowerCase?.().includes("anniversary")));
    const asksBirthday = normalized.includes("birthday");
    const asksName =
      normalized.includes("your name") ||
      normalized.includes("who are you") ||
      normalized.includes("what should i call you");

    if (asksAnniversary) {
      const reply = "Shona, our anniversary is on 26 August, my love.";
      await logChatMessage({ sessionId, role: "assistant", message: reply });
      extractAndStoreMemories(sessionId, message, reply).catch(() => {});
      return res.json({ reply });
    }
    if (asksBirthday) {
      const reply = "Shona, your birthday is on 22 May, beautiful.";
      await logChatMessage({ sessionId, role: "assistant", message: reply });
      extractAndStoreMemories(sessionId, message, reply).catch(() => {});
      return res.json({ reply });
    }
    if (asksName) {
      const reply = "Shona, you can call me Aru.";
      await logChatMessage({ sessionId, role: "assistant", message: reply });
      extractAndStoreMemories(sessionId, message, reply).catch(() => {});
      return res.json({ reply });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "Missing GROQ_API_KEY in .env"
      });
    }

    const { text: memoryAddon, dueFollowUpIds } = await buildMemoryContext(sessionId);
    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.65,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + memoryAddon },
          ...history.slice(-10),
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Chat completion failed."
      });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || "Hi Shona, Aru is here.";
    await logChatMessage({
      sessionId,
      role: "assistant",
      message: reply
    });

    if (dueFollowUpIds.length) {
      markFollowUpsConsumed(dueFollowUpIds).catch(() => {});
    }

    extractAndStoreMemories(sessionId, message, reply).catch(() => {});

    return res.json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected server error.",
      details: error.message
    });
  }
});

app.get("/api/chats", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: "Supabase logging is not configured."
      });
    }

    const token = req.headers["x-admin-token"];
    if (!process.env.CHAT_ADMIN_TOKEN || token !== process.env.CHAT_ADMIN_TOKEN) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const sessionId = req.query.sessionId;
    const limit = Math.min(Number.parseInt(req.query.limit || "100", 10), 500);
    let query = supabase
      .from("chat_logs")
      .select("id, session_id, role, message, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (sessionId) {
      query = query.eq("session_id", sessionId);
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({
        error: "Failed to fetch chat logs.",
        details: error.message
      });
    }

    return res.json({ chats: data });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected server error.",
      details: error.message
    });
  }
});

app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required." });
    }

    if (!process.env.ELEVENLABS_API_KEY || !process.env.ELEVENLABS_VOICE_ID) {
      return res.status(500).json({
        error: "Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID in .env"
      });
    }

    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.85
          }
        })
      }
    );

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      return res.status(ttsResponse.status).json({
        error: "Text-to-speech failed.",
        details: errText
      });
    }

    const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
    res.set("Content-Type", "audio/mpeg");
    return res.send(audioBuffer);
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected TTS server error.",
      details: error.message
    });
  }
});

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Aru app running at http://localhost:${PORT}`);
});
