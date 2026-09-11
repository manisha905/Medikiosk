import { useState } from 'react';
import { Bot, Send, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { healthRecordService } from '../../../services/healthRecordService';
import './AIChat.css';

const starters = ['What records do I have?', 'How was my identity verified?', 'How do I upload a report?'];

function replyFor(question, user, records) {
  const text = question.toLowerCase();
  if (text.includes('record')) {
    if (!records.length) return 'No health records are stored yet. Open Upload and attach a PDF, JPG or PNG.';
    return `This Health Services ID currently has ${records.length} document(s), including “${records[0].name}”. Open View details for the full register.`;
  }
  if (text.includes('ident') || text.includes('aadhaar') || text.includes('licence')) {
    return `Your identity was verified with ${user?.idType === 'licence' ? 'Driving Licence' : 'Aadhaar'} (${user?.maskedId}) and confirmed by mobile OTP.`;
  }
  if (text.includes('upload')) {
    return 'Go to Upload, choose the document type, select a file up to 10 MB, then store it against your Health Services ID.';
  }
  return 'I can help with portal steps: identity verification, uploads, viewing records and access history. I do not provide medical diagnosis.';
}

export default function AIChat() {
  const { user } = useAuth();
  const records = healthRecordService.getRecords();
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Namaste. I am the Mediokiosk health assistant. I can explain this portal. I do not replace a registered medical practitioner.' },
  ]);
  const [text, setText] = useState('');

  const send = (value = text) => {
    if (!value.trim()) return;
    setMessages((current) => [
      ...current,
      { from: 'user', text: value },
      { from: 'bot', text: replyFor(value, user, records) },
    ]);
    setText('');
  };

  return (
    <>
      <section className="overview-intro">
        <div>
          <p className="eyebrow">Citizen helpdesk</p>
          <h1>Health assistant</h1>
          <p>Guided answers about using Mediokiosk. Not a substitute for clinical advice.</p>
        </div>
      </section>
      <section className="chat-panel">
        <div className="chat-header">
          <div className="chat-mark"><Sparkles size={18} /></div>
          <div>
            <b>Mediokiosk assistant</b>
            <span>Available for portal guidance</span>
          </div>
        </div>
        <div className="messages">
          {messages.map((message, index) => (
            <div className={`message ${message.from}`} key={index}>
              <div className="message-icon">{message.from === 'bot' ? <Bot size={16} /> : <UserRound size={16} />}</div>
              <p>{message.text}</p>
            </div>
          ))}
        </div>
        <div className="starters">
          {starters.map((item) => (
            <button key={item} type="button" onClick={() => send(item)}>{item}</button>
          ))}
        </div>
        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about identity, records or uploads…" />
          <button type="submit" aria-label="Send message"><Send size={16} /></button>
        </form>
      </section>
    </>
  );
}
