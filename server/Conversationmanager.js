const { getNextStep, LlmError } = require('./llmService');
const { synthesize, BhashiniError } = require('./ttsService');

/**
 * One intake session for one patient conversation.
 * Usage per turn:
 *   const session = new IntakeSession('hi'); // language code
 *   const { status, audioBase64, question, summary } = await session.handleUserTurn(transcribedText);
 * Keep looping while status === 'ask'. Stop and show `summary` to the doctor when
 * status === 'summarize'. If status === 'escalate', surface `message` immediately and
 * stop the automated flow — this is not something to keep chatting through.
 */
class IntakeSession {
  constructor(language = 'en', voiceGender = 'female') {
    this.language = language;
    this.voiceGender = voiceGender;
    this.history = []; // [{role: 'user'|'assistant', content: string}]
    this.finalSummary = null;
    this.ended = false;
  }

  async handleUserTurn(transcribedText) {
    if (this.ended) {
      throw new Error('This intake session has already ended.');
    }

    let step;
    try {
      step = await getNextStep(this.history, transcribedText);
    } catch (err) {
      if (err instanceof LlmError) throw err;
      throw err;
    }

    this.history.push({ role: 'user', content: transcribedText });

    if (step.action === 'ask') {
      this.history.push({ role: 'assistant', content: step.question });
      const audioBase64 = await this._speak(step.question);
      return { status: 'ask', question: step.question, audioBase64 };
    }

    if (step.action === 'escalate') {
      this.ended = true;
      const audioBase64 = await this._speak(step.message);
      return { status: 'escalate', message: step.message, audioBase64 };
    }

    if (step.action === 'summarize') {
      this.ended = true;
      this.finalSummary = step.summary;
      return { status: 'summarize', summary: step.summary };
    }

    throw new Error(`Unknown action from LLM: ${step.action}`);
  }

  async _speak(text) {
    try {
      return await synthesize(text, this.language, this.voiceGender);
    } catch (err) {
      if (err instanceof BhashiniError) {
        // Don't kill the whole turn just because TTS failed — the frontend
        // can still show the question as text and let the doctor-summary
        // flow continue.
        console.error('[conversationManager] TTS failed:', err.message);
        return null;
      }
      throw err;
    }
  }

  // Call this if you need the structured summary object for the doctor's
  // dashboard/UI at any point after the session ends.
  getSummaryForDoctor() {
    if (!this.finalSummary) return null;
    return this.finalSummary;
  }
}

export default { IntakeSession };