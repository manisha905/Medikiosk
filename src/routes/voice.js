const express = require('express');
const multer = require('multer');
const { transcribe, BhashiniError } = require('../services/bhashiniService');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No audio file uploaded.' });
  }

  const language = req.body.language || 'en';

  try {
    const text = await transcribe(req.file.buffer, language);
    res.json({ ok: true, text });
  } catch (err) {
    if (err instanceof BhashiniError) {
      return res.status(502).json({ ok: false, error: err.message });
    }
    res.status(500).json({ ok: false, error: 'Unexpected server error.' });
  }
});

module.exports = router;