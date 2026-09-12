const OCR_API_URL = '/api/ocr';

export const ocrService = {
  async extractText(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(OCR_API_URL, { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'OCR failed');
    return data; // { pages, text, red_flags, raw }
  },
};