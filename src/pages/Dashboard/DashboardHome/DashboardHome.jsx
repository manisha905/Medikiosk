import { Link } from 'react-router-dom';
import { useRef, useState } from 'react';
import { FileText, ShieldCheck, Upload, Mic, Square, AlertTriangle } from 'lucide-react';
import Button from '../../../components/common/Button/Button';
import { useAuth } from '../../../context/AuthContext';
import { healthRecordService } from '../../../services/healthRecordService';
import { intakeService, playBase64Audio } from '../../../services/Intakeservice';
import { formatDateTime } from '../../../utils/helpers';
import './DashboardHome.css';

// Swap for a language picker later if the kiosk needs to support more than one.
const LANGUAGE = 'hi';
const VOICE_GENDER = 'female';

export default function DashboardHome() {
  const { user } = useAuth();
  const records = healthRecordService.getRecords();
  const history = healthRecordService.getHistory();

  const [micSupported, setMicSupported] = useState(
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && !!window.MediaRecorder
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const [sessionId, setSessionId] = useState(null);
  const [log, setLog] = useState([]); // [{role: 'user'|'assistant', content, urgent?}]
  const [interviewStatus, setInterviewStatus] = useState('idle'); // idle | in_progress | escalated | summarized
  const [summary, setSummary] = useState(null);
  const [saved, setSaved] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = async () => {
    setVoiceError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleRecordingStop;

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setMicSupported(false);
      setVoiceError("Could not access the microphone. Check your browser's site permissions and try again.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  const handleRecordingStop = async () => {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    chunksRef.current = [];

    if (blob.size === 0) {
      setVoiceError('No audio captured — try again.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await intakeService.sendTurn(blob, {
        sessionId,
        language: LANGUAGE,
        voiceGender: VOICE_GENDER,
      });

      setSessionId(result.sessionId);
      setLog((prev) => [...prev, { role: 'user', content: result.transcript }]);

      if (result.status === 'ask') {
        setInterviewStatus('in_progress');
        setLog((prev) => [...prev, { role: 'assistant', content: result.question }]);
        playBase64Audio(result.audioBase64);
      } else if (result.status === 'escalate') {
        setInterviewStatus('escalated');
        setLog((prev) => [...prev, { role: 'assistant', content: result.message, urgent: true }]);
        playBase64Audio(result.audioBase64);
      } else if (result.status === 'summarize') {
        setInterviewStatus('summarized');
        setSummary(result.summary);
      }
    } catch (err) {
      setVoiceError(err.message || 'Could not process that. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startNewInterview = () => {
    setSessionId(null);
    setLog([]);
    setInterviewStatus('idle');
    setSummary(null);
    setSaved(false);
    setVoiceError('');
  };

  const saveSummary = () => {
    healthRecordService.addRecord({
      id: `${Date.now()}`,
      name: 'AI intake summary',
      type: 'Intake summary',
      date: formatDateTime(),
      size: '—',
      intakeSummary: summary,
    });
    setSaved(true);
  };

  const interviewEnded = interviewStatus === 'escalated' || interviewStatus === 'summarized';

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
            <p>Speak your answers — we'll ask a few short follow-up questions before your visit.</p>
          </div>
        </div>

        {!micSupported ? (
          <div className="empty">Microphone access isn't available. Check your browser's site permissions and try again.</div>
        ) : (
          <div className="voice-recorder">
            {log.length > 0 && (
              <div className="chat-log">
                {log.map((turn, i) => (
                  <div key={i} className={`chat-bubble ${turn.role} ${turn.urgent ? 'urgent' : ''}`}>
                    {turn.urgent && <AlertTriangle size={14} />}
                    <p>{turn.content}</p>
                  </div>
                ))}
              </div>
            )}

            {interviewStatus === 'escalated' && (
              <div className="urgent-banner">
                <AlertTriangle size={18} />
                <p>This sounds urgent. Please seek immediate in-person medical care — don't wait for a kiosk queue.</p>
              </div>
            )}

            {interviewStatus === 'summarized' && summary && (
              <div className="summary-card">
                <h3>Summary for the doctor</h3>
                <dl>
                  <div><dt>Chief complaint</dt><dd>{summary.chiefComplaint}</dd></div>
                  <div><dt>Onset / duration</dt><dd>{summary.onsetDuration}</dd></div>
                  <div><dt>Severity</dt><dd>{summary.severity}</dd></div>
                  <div><dt>Associated symptoms</dt><dd>{summary.associatedSymptoms}</dd></div>
                  <div><dt>Medical history</dt><dd>{summary.medicalHistory}</dd></div>
                  <div><dt>Medications</dt><dd>{summary.medications}</dd></div>
                  <div><dt>Red flags</dt><dd>{summary.redFlags}</dd></div>
                </dl>
                <Button onClick={saveSummary} disabled={saved}>
                  {saved ? 'Saved to your records' : 'Save summary to my records'}
                </Button>
              </div>
            )}

            {!interviewEnded && (
              <>
                <button
                  type="button"
                  className={`mic-button ${isRecording ? 'is-listening' : ''}`}
                  onClick={toggleRecording}
                  disabled={isProcessing}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  {isRecording ? <Square size={20} /> : <Mic size={22} />}
                </button>
                <div className="voice-transcript">
                  {isProcessing ? (
                    <p className="placeholder">Thinking…</p>
                  ) : (
                    <p className="placeholder">
                      {isRecording
                        ? 'Listening… tap again to stop.'
                        : log.length === 0
                          ? 'Tap the mic and start speaking.'
                          : 'Tap the mic to answer.'}
                    </p>
                  )}
                </div>
              </>
            )}

            {voiceError && <p className="error-text">{voiceError}</p>}

            {interviewEnded && (
              <Button onClick={startNewInterview}>Start a new conversation</Button>
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
