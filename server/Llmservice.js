const OpenAI = require('openai');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!OPENAI_API_KEY) {
  // Don't throw at require-time so the rest of the app can still boot;
  // the actual call will fail loudly with a clear message instead.
  console.warn('[llmService] OPENAI_API_KEY is not set yet.');
}

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

class LlmError extends Error {}

// This is the whole "brain" of the intake bot. It is intentionally
// conservative: it only gathers information for the doctor, it never
// diagnoses, and it has a hard escape hatch for red-flag symptoms.
const SYSTEM_PROMPT = `You are a pre-consultation intake assistant inside a healthcare app.
A patient is speaking to you (their words arrive to you as transcribed text, possibly in an
Indian regional language). Your job is to have a short, structured conversation to prepare
a symptom summary for the doctor. You are NOT a doctor and must never diagnose, prescribe,
or claim to know what condition the patient has.

Rules:
1. Ask exactly ONE short, simple, relevant follow-up question per turn (onset, duration,
   severity, location, associated symptoms, medical history, medications, allergies).
2. Keep questions short and easy to answer verbally. Avoid medical jargon.
3. Reply in the SAME language the patient is using.
4. If the patient describes a potential emergency (e.g. chest pain, difficulty breathing,
   severe bleeding, stroke symptoms, suicidal thoughts, loss of consciousness), immediately
   stop the interview and use the "escalate" action telling them to seek emergency care now.
5. Once you have gathered enough information (usually 5-8 exchanges) to brief a doctor,
   stop asking questions and use the "summarize" action.
6. Never invent facts the patient did not say.

You must respond ONLY with strict JSON, no markdown, no commentary, matching one of these shapes:
{"action": "ask", "question": "<next question to speak to the patient>"}
{"action": "escalate", "message": "<urgent message telling the patient to seek immediate care>"}
{"action": "summarize", "summary": {
  "chiefComplaint": "...",
  "history": "...",
  "onsetDuration": "...",
  "severity": "...",
  "associatedSymptoms": "...",
  "medicalHistory": "...",
  "medications": "...",
  "redFlags": "none noted",
  "rawTranscriptNote": "brief note, not a diagnosis"
}}`;

function safeParseJson(text) {
  // Models sometimes wrap JSON in ```json fences even when told not to.
  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new LlmError(`Could not parse LLM response as JSON: ${text}`);
  }
}

/**
 * Advance the intake conversation by one turn.
 * @param {Array<{role: 'user'|'assistant', content: string}>} history - prior turns
 *        (assistant turns should be the plain question text you spoke to the patient,
 *        not the raw JSON).
 * @param {string} userMessage - latest transcribed patient text (from Bhashini ASR).
 * @returns {Promise<{action: 'ask'|'escalate'|'summarize', question?: string, message?: string, summary?: object}>}
 */
async function getNextStep(history, userMessage) {
  if (!OPENAI_API_KEY) {
    throw new LlmError('Set OPENAI_API_KEY env var first.');
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userMessage },
  ];

  let resp;
  try {
    resp = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });
  } catch (err) {
    throw new LlmError(`OpenAI call failed: ${err.message}`);
  }

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) throw new LlmError('Empty response from OpenAI.');

  const parsed = safeParseJson(raw);
  if (!parsed.action) throw new LlmError(`LLM response missing "action": ${raw}`);
  return parsed;
}

module.exports = { getNextStep, LlmError, SYSTEM_PROMPT };