import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { FileText, ShieldCheck, Upload, Mic, Square } from 'lucide-react';
import Button from '../../../components/common/Button/Button';
import { useAuth } from '../../../context/AuthContext';
import { healthRecordService } from '../../../services/healthRecordService';
import './DashboardHome.css';

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const records = healthRecordService.getRecords();
  const history = healthRecordService.getHistory();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // swap per selected kiosk language

    recognition.onresult = (event) => {
      let combined = '';
      for (let i = 0; i < event.results.length; i += 1) {
        combined += event.results[i][0].transcript;
      }
      setTranscript(combined);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const useTranscript = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    navigate('/dashboard/upload', { state: { transcript } });
  };

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

      <section className="voice-panel">
        <div className="panel-heading">
          <div>
            <h2>Tell us what's bothering you</h2>
            <p>Speak instead of typing — we'll transcribe it for your visit.</p>
          </div>
        </div>

        {!speechSupported ? (
          <div className="empty">Voice input isn't supported in this browser. Try Chrome or Edge.</div>
        ) : (
          <div className="voice-recorder">
            <button
              type="button"
              className={`mic-button ${isListening ? 'is-listening' : ''}`}
              onClick={toggleListening}
              aria-label={isListening ? 'Stop recording' : 'Start recording'}
            >
              {isListening ? <Square size={20} /> : <Mic size={22} />}
            </button>
            <div className="voice-transcript">
              {transcript ? (
                <p>{transcript}</p>
              ) : (
                <p className="placeholder">
                  {isListening ? 'Listening…' : 'Tap the mic and start speaking.'}
                </p>
              )}
            </div>
            {transcript && !isListening && (
              <Button onClick={useTranscript}>Use this</Button>
            )}
          </div>
        )}
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