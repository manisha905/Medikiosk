import { FileText } from 'lucide-react';
import { healthRecordService } from '../../../services/healthRecordService';
import './ViewDetails.css';

export default function ViewDetails() {
  const records = healthRecordService.getRecords();

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
          records.map((record) => (
            <article className="record-item" key={record.id}>
              <div className="file-badge"><FileText size={18} /></div>
              <div className="record-info">
                <h3>{record.name}</h3>
                <p>{record.type} · {record.date}</p>
                <span>{record.size}</span>
              </div>
              <div className="record-actions">On file</div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
