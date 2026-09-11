import { History, ShieldCheck } from 'lucide-react';
import { healthRecordService } from '../../../services/healthRecordService';
import './AccessHistory.css';

export default function AccessHistory() {
  const logs = healthRecordService.getHistory();

  return (
    <>
      <section className="overview-intro">
        <div>
          <p className="eyebrow">Audit trail</p>
          <h1>Access history</h1>
          <p>A record of identity verification, uploads and other activity on this Health Services ID.</p>
        </div>
      </section>
      <section className="history-panel">
        <div className="privacy-note">
          <ShieldCheck size={18} />
          <span><b>Your information is protected.</b> This log is visible only on the device used for this demo profile.</span>
        </div>
        <div className="timeline">
          {logs.map((entry) => (
            <article key={entry.title + entry.time}>
              <div className="timeline-icon"><History size={16} /></div>
              <div>
                <h3>{entry.title}</h3>
                <p>{entry.item}</p>
                <time>{entry.time}</time>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
