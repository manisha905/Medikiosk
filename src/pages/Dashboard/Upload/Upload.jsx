import { useState } from 'react';
import { CheckCircle2, FileText, UploadCloud, X } from 'lucide-react';
import Button from '../../../components/common/Button/Button';
import { DOCUMENT_TYPES } from '../../../utils/constants';
import { formatDateTime, formatFileSize } from '../../../utils/helpers';
import { healthRecordService } from '../../../services/healthRecordService';
import { ocrService } from '../../../services/ocrService';
import './Upload.css';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [type, setType] = useState(DOCUMENT_TYPES[0]);
  const [name, setName] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState('');

  const select = (event) => {
    const next = event.target.files?.[0];
    setDone(false);
    if (!next) return;
    if (next.size > healthRecordService.maxFileSize) {
      setError('File must be 10 MB or smaller.');
      return;
    }
    setError('');
    setFile(next);
  };

  const save = async () => {
    setError('');
    setExtracting(true);
    try {
      const ocrResult = await ocrService.extractText(file);
      setExtractedText(ocrResult.text);

      healthRecordService.addRecord({
        id: `${Date.now()}`,
        name: name || file.name,
        type,
        date: formatDateTime(),
        size: formatFileSize(file.size),
        extractedText: ocrResult.text,
        redFlags: ocrResult.red_flags,
      });
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not read this document. Please try again.');
    } finally {
      setExtracting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setName('');
    setDone(false);
    setExtractedText('');
    setError('');
  };

  return (
    <>
      <section className="overview-intro">
        <div>
          <p className="eyebrow">Document intake</p>
          <h1>Upload a health record</h1>
          <p>Attach a prescription, report or other medical document to your verified Health Services ID.</p>
        </div>
      </section>
      <section className="upload-panel">
        {done ? (
          <div className="upload-success">
            <CheckCircle2 color="#0f6b4c" size={42} />
            <h2>Record stored securely</h2>
            <p>{name || file?.name} is now listed under View details.</p>
            {extractedText && (
              <div className="ocr-preview">
                <b>Extracted text</b>
                <pre>{extractedText}</pre>
              </div>
            )}
            <Button onClick={reset}>Upload another</Button>
          </div>
        ) : (
          <>
            <label className="drop-zone">
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={select} />
              {file ? (
                <>
                  <FileText />
                  <b>{file.name}</b>
                  <span>{formatFileSize(file.size)} · ready to upload</span>
                  <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }}>
                    <X size={14} /> Remove
                  </button>
                </>
              ) : (
                <>
                  <UploadCloud size={40} />
                  <b>Choose a file from this device</b>
                  <span>PDF, JPG or PNG · Maximum 10 MB</span>
                </>
              )}
            </label>
            <div className="upload-form">
              <label>
                Document type
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {DOCUMENT_TYPES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                Display name (optional)
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Annual health checkup" />
              </label>
              <Button disabled={!file || extracting} onClick={save}>
                {extracting ? 'Reading document…' : 'Upload securely'}
              </Button>
            </div>
            <p className="error-text">{error}</p>
          </>
        )}
      </section>
    </>
  );
}