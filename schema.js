/**
 * MongoDB Schema (Mongoose) — Patient Health Records System
 * ------------------------------------------------------------
 * Collections:
 *   1. patients
 *   2. medicalRecords
 *   3. chatSessions
 *   4. doctorQueries
 *   5. consentGrants
 *
 * Notes:
 * - Aadhaar is NEVER stored raw. Only a salted hash/token reference is kept
 *   (aadhaarRef), generated via HMAC-SHA256 with a server-side secret, or
 *   better, a token issued by an Aadhaar Data Vault / UIDAI-authorized service.
 * - healthId is the primary patient-facing identifier used across the system.
 * - Sensitive fields (mobileNumber, aadhaarRef) should additionally be
 *   encrypted at rest using MongoDB Client-Side Field Level Encryption (CSFLE)
 *   or Queryable Encryption if your MongoDB tier supports it.
 */

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

/* ------------------------------------------------------------------ */
/* 1. PATIENTS                                                        */
/* ------------------------------------------------------------------ */
const patientSchema = new Schema(
  {
    healthId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    aadhaarRef: {
      // Hashed/tokenized reference, NOT the raw Aadhaar number.
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false, // excluded from normal queries by default
    },
    mobileNumber: {
      type: String,
      required: true,
      match: /^[6-9]\d{9}$/, // basic Indian mobile format check
    },
    mobileVerified: {
      type: Boolean,
      default: false,
    },
    name: { type: String },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other", "unspecified"] },
  },
  { timestamps: true, collection: "patients" }
);

/* ------------------------------------------------------------------ */
/* 2. MEDICAL RECORDS                                                  */
/* ------------------------------------------------------------------ */
const medicalRecordSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["chronic", "non_chronic", "allergy"],
      required: true,
      index: true,
    },
    sourceType: {
      type: String,
      enum: ["file_upload", "text_chat", "voice_chat"],
      required: true,
    },
    // For file uploads: pointer to blob storage (S3/GridFS/Azure Blob etc.)
    fileRef: {
      url: { type: String },
      mimeType: { type: String },
      originalName: { type: String },
    },
    // Link back to the chat session that produced this record, if any
    chatSessionId: {
      type: Schema.Types.ObjectId,
      ref: "ChatSession",
    },
    diseaseName: {
      type: String, // normalized/free text label
      index: true,
    },
    icd10Code: {
      type: String, // optional ICD-10 mapping for interoperability
    },
    structuredSummary: {
      type: String, // AI-generated clinical-style summary
      required: true,
    },
    tags: {
      type: [String], // extracted keywords/entities for search & matching
      index: true,
    },
    severity: {
      type: String,
      enum: ["mild", "moderate", "severe", "unknown"],
      default: "unknown",
    },
    onsetDate: { type: Date },
    resolvedDate: { type: Date }, // relevant mainly for non_chronic
    confirmedByPatient: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: "medicalRecords" }
);

// Text index to support keyword search for non-chronic queries
medicalRecordSchema.index({
  diseaseName: "text",
  tags: "text",
  structuredSummary: "text",
});

/* ------------------------------------------------------------------ */
/* 3. CHAT SESSIONS (text/voice intake)                                */
/* ------------------------------------------------------------------ */
const chatMessageSchema = new Schema(
  {
    sender: { type: String, enum: ["patient", "bot"], required: true },
    message: { type: String, required: true },
    audioRef: { type: String }, // if voice, pointer to stored audio clip
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSessionSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["chronic", "non_chronic", "allergy"],
      required: true,
    },
    inputMode: {
      type: String,
      enum: ["text", "voice"],
      required: true,
    },
    transcript: {
      type: [chatMessageSchema],
      default: [],
    },
    finalSummary: {
      type: String, // draft summary shown to patient for confirmation
    },
    status: {
      type: String,
      enum: ["in_progress", "summarized", "confirmed_by_patient", "discarded"],
      default: "in_progress",
    },
    resultingRecordId: {
      type: Schema.Types.ObjectId,
      ref: "MedicalRecord",
    },
  },
  { timestamps: true, collection: "chatSessions" }
);

/* ------------------------------------------------------------------ */
/* 4. DOCTOR QUERIES (audit trail of non-chronic keyword lookups)     */
/* ------------------------------------------------------------------ */
const doctorQuerySchema = new Schema(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor", // assumes a separate Doctor/User collection exists
      required: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    queryText: {
      type: String,
      required: true,
    },
    extractedKeywords: {
      type: [String],
      default: [],
    },
    matchedRecordIds: {
      type: [Schema.Types.ObjectId],
      ref: "MedicalRecord",
      default: [],
    },
  },
  { timestamps: true, collection: "doctorQueries" }
);

/* ------------------------------------------------------------------ */
/* 5. CONSENT GRANTS (patient -> doctor/facility data-sharing consent) */
/* ------------------------------------------------------------------ */
const consentGrantSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    scope: {
      // which categories this consent covers
      type: [String],
      enum: ["chronic", "non_chronic", "allergy"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: "consentGrants" }
);

/* ------------------------------------------------------------------ */
/* MODEL EXPORTS                                                       */
/* ------------------------------------------------------------------ */
const Patient = model("Patient", patientSchema);
const MedicalRecord = model("MedicalRecord", medicalRecordSchema);
const ChatSession = model("ChatSession", chatSessionSchema);
const DoctorQuery = model("DoctorQuery", doctorQuerySchema);
const ConsentGrant = model("ConsentGrant", consentGrantSchema);

module.exports = {
  Patient,
  MedicalRecord,
  ChatSession,
  DoctorQuery,
  ConsentGrant,
};
