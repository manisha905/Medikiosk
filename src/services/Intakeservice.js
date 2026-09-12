const INTAKE_URL = '/api/intake/turn';

export const intakeService = {
  /**
   * @param {Blob} audioBlob - the patient's recorded answer
   * @param {{sessionId?: string, language?: string, voiceGender?: string}} opts
   * @returns {Promise<{sessionId, transcript, status: 'ask'|'escalate'|'summarize', question?, message?, summary?, audioBase64}>}
   */
  async sendTurn(audioBlob, { sessionId, language = 'hi', voiceGender = 'female' } = {}) {
    const form = new FormData();
    form.append('audio', audioBlob, 'recording.webm');
    if (sessionId) form.append('sessionId', sessionId);
    form.append('language', language);
    form.append('voiceGender', voiceGender);

    const res = await fetch(INTAKE_URL, { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not process that. Please try again.');
    return data;
  },
};

/** Decodes base64 WAV audio and plays it. Returns the Audio element in case the caller wants to stop it early. */
export function playBase64Audio(base64) {
  if (!base64) return null;
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i += 1) byteNumbers[i] = byteChars.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  audio.play().catch(() => {
    // Autoplay can be blocked in some browsers if not tied closely enough to
    // a user gesture. It isn't fatal — the question text is already on
    // screen either way — but worth knowing about if audio never plays.
    URL.revokeObjectURL(url);
  });
  return audio;
}