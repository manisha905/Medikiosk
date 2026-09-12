/**
 * Ties together BhashiniService (ASR), conversationManager (LLM + TTS via
 * IntakeSession), and audio format conversion, behind one HTTP endpoint the
 * frontend mic can actually call.
 *
 * Mounted at /api/intake in server.js.
 *
 * Session handling: IntakeSession is a stateful JS object (it holds
 * conversation history), but HTTP requests are stateless — so this route
 * keeps a Map of sessionId -> IntakeSession in memory. The FIRST call
 * (no sessionId sent) creates a new session and returns its id; every
 * subsequent call for that same interview sends that id back.
 *
 * Caveat: this in-memory Map is fine for a hackathon demo (single process,
 * one kiosk) but is lost on server restart and won't work if you ever run
 * multiple server instances behind a load balancer. A real deployment would
 * move this to Redis or a DB — not needed for the demo.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

const BhashiniService = require('../services/BhashiniService');
const { IntakeSession } = require('../services/conversationManager');

ffmpeg.setFfmpegPath(ffmpegPath);

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const sessions = new Map(); // sessionId -> IntakeSession
function convertToWav16k(inputBuffer, originalName = 'audio') {
  return new Promise((resolve, reject) => {
    const tmpDir = os.tmpdir();
    const id = crypto.randomUUID();
    const inputExt = path.extname(originalName) || '.webm';
    const inputPath = path.join(tmpDir, `${id}-in${inputExt}`);
    const outputPath = path.join(tmpDir, `${id}-out.wav`);

    console.log('Input buffer size:', inputBuffer.length, 'bytes ->', inputPath); // TEMP

    fs.writeFile(inputPath, inputBuffer, (writeErr) => {
      if (writeErr) return reject(writeErr);

      ffmpeg(inputPath)
        .audioChannels(1)
        .audioFrequency(16000)
        .format('wav')
        .on('error', (err) => {
          console.log('ffmpeg failed. Input file kept at:', inputPath); // TEMP
          fs.unlink(outputPath, () => {});
          reject(err);
        })
        .on('end', () => {
          fs.readFile(outputPath, (readErr, data) => {
            fs.unlink(inputPath, () => {});
            fs.unlink(outputPath, () => {});
            if (readErr) return reject(readErr);
            resolve(data);
          });
        })
        .save(outputPath);
    });
  });
}

/**
 * POST multipart:
 *   audio          - patient's spoken answer (required)
 *   sessionId      - omit on the very first turn; send back on every turn after
 *   language       - e.g. "hi", "en", "ta" (only used when creating a new session)
 *   voiceGender    - "male" | "female" (only used when creating a new session)
 *
 * Response:
 *   { sessionId, transcript, status: "ask"|"escalate"|"summarize", question?, message?, summary?, audioBase64 }
 */
router.post('/turn', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio provided (field name: "audio").' });

  let sessionId = req.body.sessionId;
  let session = sessionId ? sessions.get(sessionId) : null;

  if (!session) {
    sessionId = crypto.randomUUID();
    session = new IntakeSession(req.body.language || 'hi', req.body.voiceGender || 'female');
    sessions.set(sessionId, session);
  }

  try {
    const wavBuffer = await convertToWav16k(req.file.buffer, req.file.originalname);
    const transcript = await BhashiniService.transcribe(wavBuffer, session.language, 'wav', 16000);

    const result = await session.handleUserTurn(transcript);

    res.json({ sessionId, transcript, ...result });
  } catch (err) {
    console.error('Intake turn failed:', err.message);
    res.status(500).json({ error: 'Intake turn failed.', details: err.message });
  }
});

/** Doctor-facing: pull the structured summary for a finished session. */
router.get('/:sessionId/summary', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  const summary = session.getSummaryForDoctor();
  if (!summary) return res.status(409).json({ error: 'This session has not reached a summary yet.' });
  res.json({ summary });
});

/** Explicit cleanup once a session's summary/escalation has been handled. */
router.delete('/:sessionId', (req, res) => {
  const existed = sessions.delete(req.params.sessionId);
  res.json({ deleted: existed });
});

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    activeSessions: sessions.size,
    hasBhashiniCreds: !!(process.env.ULCA_USER_ID && process.env.ULCA_API_KEY),
    hasOpenAiKey: !!process.env.OPENAI_API_KEY,
  });
});

module.exports = router;