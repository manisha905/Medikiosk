/**
 * OCR backend — wraps the api4ai OCR API (https://ocr43.p.rapidapi.com).
 *
 * Flow:
 *   client uploads a file -> this server forwards it to api4ai -> parses the
 *   response into plain text (per page, since PDFs come back as one "result"
 *   per page) -> runs the hackathon's rule-based red-flag keyword check on
 *   that text -> returns { pages, text, red_flags } to the client.
 *
 * api4ai request shape (confirmed against their docs/tutorials):
 *   POST https://ocr43.p.rapidapi.com/v1/results
 *   headers: X-RapidAPI-Key, X-RapidAPI-Host
 *   body: multipart/form-data, field name "image" (works for both images
 *         and PDFs — their own multi-page-PDF tutorial uses the same field)
 *
 * api4ai response shape:
 *   {
 *     "results": [               // one entry per page
 *       {
 *         "status": { "code": "ok" | "failure", "message": "..." },
 *         "entities": [
 *           {
 *             "kind": "objects",
 *             "name": "text",
 *             "objects": [
 *               { "box": [...], "entities": [{ "kind": "text", "text": "..." }] },
 *               ...                 // one per detected text block on the page
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 *
 * Run:
 *   npm install
 *   cp .env.example .env   # then paste your RapidAPI key in
 *   npm start
 */

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');
const voiceRouter = require('./routes/voice');
const app = express();

app.use(cors());
app.use('/api/voice', voiceRouter);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'ocr43.p.rapidapi.com';
const OCR_URL = `https://${RAPIDAPI_HOST}/v1/results`;

if (!RAPIDAPI_KEY) {
  console.warn('WARNING: RAPIDAPI_KEY is not set — /api/ocr will return 500 until it is.');
}

// Placeholder list for the hackathon's simple if/else red-flag alerting.
// Swap/extend this with whatever your team actually agreed on.
const RED_FLAG_KEYWORDS = [
  'chest pain',
  'shortness of breath',
  'unconscious',
  'severe bleeding',
  'stroke',
  'seizure',
  'anaphylaxis',
  'suicidal',
  'overdose',
];

/** Turn api4ai's nested response into a plain array of per-page text. */
function extractText(apiResult) {
  if (!Array.isArray(apiResult?.results)) return [];
  return apiResult.results.map((page) => {
    if (page?.status?.code !== 'ok') return '';
    const textEntity = page.entities?.find((e) => e.name === 'text');
    if (!textEntity?.objects?.length) return '';
    // A page can have several detected text blocks — join them in order.
    return textEntity.objects
      .map((obj) => obj.entities?.find((e) => e.kind === 'text')?.text || '')
      .filter(Boolean)
      .join('\n');
  });
}

function findRedFlags(text) {
  const lower = text.toLowerCase();
  return RED_FLAG_KEYWORDS.filter((kw) => lower.includes(kw));
}

app.post('/api/ocr', upload.single('file'), async (req, res) => {
  if (!RAPIDAPI_KEY) {
    return res.status(500).json({ error: 'Server is missing RAPIDAPI_KEY (see .env.example).' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided (multipart field name: "file").' });
  }

  const form = new FormData();
  form.append('image', req.file.buffer, { filename: req.file.originalname });

  try {
    const apiRes = await axios.post(OCR_URL, form, {
      headers: {
        ...form.getHeaders(),
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
      maxBodyLength: Infinity,
      timeout: 30000,
    });

    const pages = extractText(apiRes.data);
    const text = pages.join('\n\n--- page break ---\n\n');
    const redFlags = findRedFlags(text);

    res.json({
      pages,       // array of strings, one per page (images: length 1)
      text,        // all pages joined, for convenience
      red_flags: redFlags,
      raw: apiRes.data, // full api4ai payload — useful while wiring up the LLM
                        // summarizer step; drop this once you don't need it
    });
  } catch (err) {
    const status = err.response?.status || 500;
    const details = err.response?.data || err.message;
    console.error('OCR request failed:', details);
    res.status(status).json({ error: 'OCR request failed.', details });
  }
});

app.get('/api/ocr/health', (_req, res) => res.json({ ok: true, hasKey: !!RAPIDAPI_KEY }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`OCR backend listening on http://localhost:${PORT}`));

module.exports = app;