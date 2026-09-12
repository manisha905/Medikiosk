/**
 * summaryService.js
 * ------------------------------------------------------------
 * Backend module that summarizes a patient's medical data:
 *   - Chronic & Allergy: always fully summarized (safety-critical, no filtering)
 *   - Non-chronic: only the records matching the doctor's query keywords
 *
 * Uses the Anthropic API (Claude) to turn raw structuredSummary fields
 * from MongoDB into one consolidated clinical-style summary.
 *
 * Requires:
 *   npm install @anthropic-ai/sdk express mongoose
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY   - your API key
 *   ANTHROPIC_MODEL      - e.g. "claude-sonnet-4-5" (check your Console for
 *                          the current model slugs available to your account)
 */

const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const { MedicalRecord, DoctorQuery } = require("./schema");
const { extractKeywords } = require("./queries");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

/* ------------------------------------------------------------------ */
/* Core summarization helper                                          */
/* ------------------------------------------------------------------ */

/**
 * Calls Claude to merge a list of individual record summaries into one
 * concise clinical note for a given category.
 *
 * @param {"chronic"|"allergy"|"non_chronic"} category
 * @param {Array} records - MedicalRecord documents
 * @returns {Promise<string>} consolidated summary text
 */
async function summarizeRecords(category, records) {
  if (!records.length) {
    return `No ${category.replace("_", "-")} records on file.`;
  }

  const bulletList = records
    .map((r, i) => {
      const date = r.onsetDate ? r.onsetDate.toISOString().slice(0, 10) : "unknown date";
      return `${i + 1}. [${date}] ${r.diseaseName || "Unnamed condition"} — ${r.structuredSummary} (severity: ${r.severity}, tags: ${r.tags.join(", ")})`;
    })
    .join("\n");

  const categoryInstructions = {
    chronic:
      "Summarize the patient's chronic condition history. Note current status, medications/management if mentioned, and anything a treating doctor should be aware of immediately (e.g. interactions, control level).",
    allergy:
      "Summarize the patient's allergy history. Clearly flag severity and known triggers/reactions, since this is safety-critical information (e.g. anaphylaxis risk).",
    non_chronic:
      "Summarize only the non-chronic episodes listed below, which have already been filtered to match the doctor's query. Keep it factual and dated.",
  };

  const prompt = `You are a clinical summarization assistant. ${categoryInstructions[category]}

Here are the individual records:
${bulletList}

Write a concise clinical-style summary (3-6 sentences, plain prose, no headers) suitable for a doctor to read quickly. Do not invent details not present in the records.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text.trim() : "";
}

/* ------------------------------------------------------------------ */
/* High-level summary builders                                        */
/* ------------------------------------------------------------------ */

/**
 * Always-on summary: chronic + allergy, fully summarized, no filtering.
 */
async function buildChronicAndAllergySummary(patientId) {
  const [chronicRecords, allergyRecords] = await Promise.all([
    MedicalRecord.find({ patientId, category: "chronic" }).sort({ onsetDate: -1 }),
    MedicalRecord.find({ patientId, category: "allergy" }).sort({ onsetDate: -1 }),
  ]);

  const [chronicSummary, allergySummary] = await Promise.all([
    summarizeRecords("chronic", chronicRecords),
    summarizeRecords("allergy", allergyRecords),
  ]);

  return {
    chronic: { summary: chronicSummary, recordCount: chronicRecords.length },
    allergy: { summary: allergySummary, recordCount: allergyRecords.length },
  };
}

/**
 * Query-scoped summary: only non-chronic records matching keywords
 * extracted from the doctor's query text. Logs the query for audit.
 */
async function buildNonChronicSummary({ doctorId, patientId, queryText }) {
  const keywords = extractKeywords(queryText);

  const matches = keywords.length
    ? await MedicalRecord.find({
        patientId,
        category: "non_chronic",
        $or: [
          { tags: { $in: keywords } },
          { diseaseName: { $regex: keywords.join("|"), $options: "i" } },
          { $text: { $search: keywords.join(" ") } },
        ],
      }).sort({ onsetDate: -1 })
    : [];

  const summary = await summarizeRecords("non_chronic", matches);

  await DoctorQuery.create({
    doctorId,
    patientId,
    queryText,
    extractedKeywords: keywords,
    matchedRecordIds: matches.map((m) => m._id),
  });

  return { summary, recordCount: matches.length, matchedKeywords: keywords };
}

/* ------------------------------------------------------------------ */
/* Express routes                                                      */
/* ------------------------------------------------------------------ */

const router = express.Router();

/**
 * GET /api/patients/:patientId/summary/core
 * Returns the always-on chronic + allergy summary.
 */
router.get("/patients/:patientId/summary/core", async (req, res) => {
  try {
    const { patientId } = req.params;
    const summary = await buildChronicAndAllergySummary(patientId);
    res.json({ patientId, ...summary });
  } catch (err) {
    console.error("Error building core summary:", err);
    res.status(500).json({ error: "Failed to build core summary" });
  }
});

/**
 * POST /api/patients/:patientId/summary/non-chronic
 * Body: { doctorId: string, queryText: string }
 * Returns non-chronic records matching the doctor's query, summarized.
 */
router.post("/patients/:patientId/summary/non-chronic", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { doctorId, queryText } = req.body;

    if (!doctorId || !queryText) {
      return res.status(400).json({ error: "doctorId and queryText are required" });
    }

    const result = await buildNonChronicSummary({ doctorId, patientId, queryText });
    res.json({ patientId, doctorId, queryText, ...result });
  } catch (err) {
    console.error("Error building non-chronic summary:", err);
    res.status(500).json({ error: "Failed to build non-chronic summary" });
  }
});

/**
 * GET /api/patients/:patientId/summary/full
 * Convenience endpoint: core (chronic + allergy) summary combined with
 * an optional non-chronic query, in one response.
 * Query params: ?doctorId=...&queryText=...
 */
router.get("/patients/:patientId/summary/full", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { doctorId, queryText } = req.query;

    const core = await buildChronicAndAllergySummary(patientId);

    let nonChronic = { summary: "No query provided.", recordCount: 0 };
    if (doctorId && queryText) {
      nonChronic = await buildNonChronicSummary({ doctorId, patientId, queryText });
    }

    res.json({ patientId, ...core, non_chronic: nonChronic });
  } catch (err) {
    console.error("Error building full summary:", err);
    res.status(500).json({ error: "Failed to build full summary" });
  }
});

module.exports = {
  router,
  buildChronicAndAllergySummary,
  buildNonChronicSummary,
  summarizeRecords,
};
