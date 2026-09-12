import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { healthRecordService } from '../../../services/healthRecordService';
import './ViewDetails.css';

export default function ViewDetails() {
  const records = healthRecordService.getRecords();
  const [expandedId, setExpandedId] = useState(null);

  const toggle = (id) => setExpandedId((current) => (current === id ? null : id));

  return (
    <>
      <section className="overview-intro">
        <div>
          <p className="eyebrow">Document register</p>
          <h1>View details</h1>
          <p>Medical files linked to your verified citizen profile. Download and sharing remain local to this demo.</p>
        </div>
      </section>
      <section className="records-panel" style={{ marginTop: 24 }}>
        <div className="panel-heading">
          <div>
            <h2>All records</h2>
            <p>{records.length} document{records.length === 1 ? '' : 's'} stored</p>
          </div>
        </div>
        {records.length === 0 ? (
          <div className="empty">No records found. Use Upload to add a prescription, lab report or other document.</div>
        ) : (
          records.map((record) => {
            const isOpen = expandedId === record.id;
            const hasText = Boolean(record.extractedText);
            const hasFlags = Boolean(record.redFlags?.length);
            return (
              <article className="record-item" key={record.id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <div className="file-badge"><FileText size={18} /></div>
                  <div className="record-info">
                    <h3>{record.name}</h3>
                    <p>{record.type} · {record.date}</p>
                    <span>{record.size}</span>
                  </div>
                  {hasFlags && (
                    <span className="record-flag" title={record.redFlags.join(', ')}>
                      <AlertTriangle size={14} /> Flagged
                    </span>
                  )}
                  {hasText ? (
                    <button type="button" className="record-toggle" onClick={() => toggle(record.id)}>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {isOpen ? 'Hide text' : 'View extracted text'}
                    </button>
                  ) : (
                    <div className="record-actions">On file</div>
                  )}
                </div>
                {isOpen && hasText && (
                  <div className="record-extracted-text">
                    {hasFlags && (
                      <p className="record-flag-detail">
                        <AlertTriangle size={14} /> Possible flag: {record.redFlags.join(', ')}
                      </p>
                    )}
                    <pre>{record.extractedText}</pre>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </>
  );
}