const defaultDocuments = [
  { id: 1, name: 'Aadhaar Card.pdf', type: 'Identity proof', uploadedAt: '10 Sep 2026', size: '1.2 MB', url: '' },
  { id: 2, name: 'Clinic Visit Summary.pdf', type: 'Medical record', uploadedAt: '11 Sep 2026', size: '480 KB', url: '' },
  { id: 3, name: 'Diagnostic Report.png', type: 'Lab result', uploadedAt: '09 Sep 2026', size: '2.1 MB', url: '' }
];

const savedPatient = JSON.parse(localStorage.getItem('medikioskPatient') || 'null');
const patient = savedPatient || { medikioskId: 'MK-DEMO-0001', documents: defaultDocuments };
let selectedId = patient.documents[0]?.id ?? null;

const list = document.querySelector('#document-list');
const preview = document.querySelector('#document-preview');
const fileInput = document.querySelector('#file-input');
const bytes = value => {
  if (!value) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 || value / 1024 ** index >= 10 ? 0 : 1)} ${units[index]}`;
};
const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
const selectedDocument = () => patient.documents.find(doc => doc.id === selectedId) || patient.documents[0];
function openDocument(doc) {
  if (doc.url) window.open(doc.url, '_blank', 'noopener');
  else window.open(`data:text/plain;charset=utf-8,${encodeURIComponent(`Preview unavailable for ${doc.name}. This seeded prototype record does not include the original file.`)}`, '_blank', 'noopener');
}
function render() {
  document.querySelector('#patient-id').textContent = patient.medikioskId;
  document.querySelector('#document-count').textContent = patient.documents.length;
  if (!patient.documents.length) { list.replaceChildren(document.querySelector('#empty-state').content.cloneNode(true)); preview.innerHTML = '<p class="preview-text">Select or upload a document to review it here.</p>'; return; }
  const current = selectedDocument();
  list.innerHTML = patient.documents.map(doc => `<article class="document ${doc.id === current.id ? 'selected' : ''}"><span class="file-icon">${escapeHtml(doc.name.split('.').pop().slice(0, 3).toUpperCase())}</span><div class="document-info"><div class="document-name">${escapeHtml(doc.name)}</div><div class="document-meta">${escapeHtml(doc.type)} · ${escapeHtml(doc.uploadedAt)} · ${escapeHtml(doc.size)}</div></div><div class="actions"><button class="small-button primary" data-review="${doc.id}">Review</button><button class="small-button" data-open="${doc.id}">Open</button></div></article>`).join('');
  preview.innerHTML = `<h2 class="preview-name">${escapeHtml(current.name)}</h2><p class="preview-meta">${escapeHtml(current.type)} · Uploaded ${escapeHtml(current.uploadedAt)} · ${escapeHtml(current.size)}</p><p class="preview-text">This document is ready for you to inspect. Open it to review the original file in a separate tab.</p><div class="preview-actions"><button class="button" id="open-selected">Open document</button></div>`;
  document.querySelectorAll('[data-review]').forEach(button => button.onclick = () => { selectedId = Number(button.dataset.review); render(); });
  document.querySelectorAll('[data-open]').forEach(button => button.onclick = () => openDocument(patient.documents.find(doc => doc.id === Number(button.dataset.open))));
  document.querySelector('#open-selected').onclick = () => openDocument(current);
}
document.querySelector('#upload-button').onclick = () => fileInput.click();
fileInput.onchange = event => {
  [...event.target.files].forEach(file => patient.documents.unshift({ id: Date.now() + Math.random(), name: file.name, type: file.type.includes('pdf') ? 'Medical record' : file.type.includes('image') ? 'Image file' : 'Uploaded file', uploadedAt: new Intl.DateTimeFormat('en-GB', { day:'2-digit', month:'short', year:'numeric' }).format(new Date()), size: bytes(file.size), url: URL.createObjectURL(file) }));
  selectedId = patient.documents[0]?.id ?? null;
  render();
  fileInput.value = '';
};
render();
