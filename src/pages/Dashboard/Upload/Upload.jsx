import { useState } from 'react';
import { CheckCircle2, FileText, UploadCloud, X } from 'lucide-react';
import Button from '../../../components/common/Button/Button';
import { DOCUMENT_TYPES } from '../../../utils/constants';
import { formatDateTime, formatFileSize } from '../../../utils/helpers';
import { healthRecordService } from '../../../services/healthRecordService';
import './Upload.css';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [type, setType] = useState(DOCUMENT_TYPES[0]);
  const [name, setName] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

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

  const save = () => {
    healthRecordService.addRecord({
      id: `${Date.now()}`,
      name: name || file.name,
      type,
      date: formatDateTime(),
      size: formatFileSize(file.size),
    });
    setDone(true);
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
            <Button onClick={() => { setFile(null); setName(''); setDone(false); }}>Upload another</Button>
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
              <Button disabled={!file} onClick={save}>Upload securely</Button>
            </div>
            <p className="error-text">{error}</p>
          </>
        )}
      </section>
    </>
  );
}
