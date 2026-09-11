import { Link } from 'react-router-dom';
import { FileText, ShieldCheck, Upload } from 'lucide-react';
import Button from '../../../components/common/Button/Button';
import { useAuth } from '../../../context/AuthContext';
import { healthRecordService } from '../../../services/healthRecordService';
import './DashboardHome.css';

export default function DashboardHome() {
  const { user } = useAuth();
  const records = healthRecordService.getRecords();
  const history = healthRecordService.getHistory();

  return (
    <>
      <section className="overview-intro">
        <div>
          <p className="eyebrow">Citizen dashboard</p>
          <h1>Health records linked to {user?.healthId}</h1>
          <p>
            Identity verified with {user?.idType === 'licence' ? 'Driving Licence' : 'Aadhaar'} ({user?.maskedId}).
            Upload documents, review details, and inspect access history from this workspace.
          </p>
        </div>
        <Link to="/dashboard/upload"><Button>Upload document</Button></Link>
      </section>
      <section className="stats">
        <article>
          <span>Health Services ID</span>
          <b>{user?.healthId}</b>
          <small>Issued after OTP confirmation</small>
        </article>
        <article>
          <span>Documents</span>
          <b>{records.length}</b>
          <small>Stored against this citizen profile</small>
        </article>
        <article>
          <span>Account status</span>
          <b>Verified</b>
          <small>Mobile {user?.mobile}</small>
        </article>
      </section>
      <section className="records-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent records</h2>
            <p>Latest files in your health kiosk</p>
          </div>
          <Link to="/dashboard/records">View details</Link>
        </div>
        {records.length === 0 ? (
          <div className="empty">No documents yet. Upload a medical record to see it here.</div>
        ) : (
          records.slice(0, 3).map((record) => (
            <article className="record-item" key={record.id}>
              <div className="file-badge"><FileText size={18} /></div>
              <div className="record-info">
                <h3>{record.name}</h3>
                <p>{record.type} · {record.date}</p>
              </div>
            </article>
          ))
        )}
      </section>
      <section className="activity-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent activity</h2>
            <p>Identity and document events</p>
          </div>
          <Link to="/dashboard/history">Access history</Link>
        </div>
        {history.slice(0, 3).map((entry) => (
          <div className="activity" key={entry.title + entry.time}>
            {entry.title.includes('verified') ? <ShieldCheck size={18} /> : <Upload size={18} />}
            <p>
              <b>{entry.title}</b> {entry.item}
              <span>{entry.time}</span>
            </p>
          </div>
        ))}
      </section>
    </>
  );
}
