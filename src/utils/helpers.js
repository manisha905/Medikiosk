export function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function maskId(value, type) {
  const clean = String(value || '').replace(/\s/g, '');
  if (type === 'aadhaar') {
    return `XXXX XXXX ${clean.slice(-4)}`;
  }
  return `${clean.slice(0, 4)}••••${clean.slice(-3)}`;
}

export function maskMobile(mobile) {
  const value = String(mobile || '');
  return `${value.slice(0, 2)} •••••• ${value.slice(-2)}`;
}

export function createHealthId() {
  return `HSP-${Math.floor(100000 + Math.random() * 899999)}`;
}

export function formatDateTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function validateAadhaar(value) {
  return /^\d{12}$/.test(String(value).replace(/\s/g, ''));
}

export function validateLicence(value) {
  return String(value).replace(/\s/g, '').length >= 10;
}

export function validateMobile(value) {
  return /^[6-9]\d{9}$/.test(String(value));
}

export function delay(ms = 700) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
