import { Link } from 'react-router-dom';
import { ArrowRight, FileHeart, History, MessageSquareText, ShieldCheck, Upload } from 'lucide-react';
import Header from '../../components/common/Header/Header';
import Footer from '../../components/common/Footer/Footer';
import Button from '../../components/common/Button/Button';
import './Landing.css';

const services = [
  [Upload, 'Upload records', 'Store prescriptions, lab reports and discharge summaries against your Health Services ID.'],
  [FileHeart, 'View details', 'Review documents linked to your verified citizen profile at any authorised kiosk or device.'],
  [History, 'Access history', 'See a clear log of identity checks, uploads and document views.'],
  [MessageSquareText, 'Health assistant', 'Ask guided questions about using this portal. It does not replace clinical advice.'],
];

const steps = [
  ['01', 'Choose ID type', 'Select Aadhaar or Driving Licence to begin citizen verification.'],
  ['02', 'Verify identity', 'Enter the document number. The portal simulates a secure identity check.'],
  ['03', 'Confirm mobile OTP', 'Link a 10-digit mobile number and confirm with a one-time password.'],
  ['04', 'Open dashboard', 'After confirmation, your Health Services dashboard is issued.'],
];

export default function Landing() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="hero">
          <div>
            <p className="eyebrow">Citizen health kiosk</p>
            <h1>Official access to your <em>health records</em>, after identity verification.</h1>
            <p className="hero-text">
              Mediokiosk is presented as a National Health Services Portal. Verify Aadhaar or a driving licence, confirm your mobile number, and then manage medical documents from a single government-style dashboard.
            </p>
            <div className="hero-buttons">
              <Link to="/register"><Button>Begin identity verification <ArrowRight size={16} /></Button></Link>
              <a className="watch-link" href="#how-it-works">Registration steps ↓</a>
            </div>
            <div className="trust-line">
              <span>UIDAI-style ID check (demo)</span>
              <span>OTP-protected access</span>
              <span>Citizen-controlled records</span>
            </div>
          </div>
          <aside className="hero-panel">
            <div className="card-kicker"><span>HEALTH SERVICES ID</span><span>VERIFIED</span></div>
            <h2>Citizen health snapshot</h2>
            <p>Issued after Aadhaar or licence verification and mobile OTP confirmation.</p>
            <div className="id-preview">
              <article><span>ID type</span><b>Aadhaar</b></article>
              <article><span>Document</span><b>XXXX XXXX 4821</b></article>
              <article><span>Mobile</span><b>98 •••••• 21</b></article>
              <article><span>Health ID</span><b>HSP-48291</b></article>
            </div>
          </aside>
        </section>

        <section id="services" className="services">
          <p className="eyebrow">Citizen services</p>
          <h2>Available after you are verified</h2>
          <div className="services-grid">
            {services.map(([Icon, title, text]) => (
              <article key={title}>
                <Icon color="#0f6b4c" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="how-section">
          <p className="eyebrow">Registration sequence</p>
          <h2>Four steps to your dashboard</h2>
          <div className="how-grid">
            {steps.map(([number, title, text]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="security" className="security-callout">
          <div>
            <p className="eyebrow" style={{ color: '#ffb347' }}>Information security</p>
            <h2>Your identity is checked before records are shown.</h2>
            <p>
              This frontend simulates government identity verification. Full Aadhaar numbers are never stored. Only a masked document reference, mobile number and Health Services ID are kept in the browser for this demo.
            </p>
          </div>
          <Link to="/register"><Button variant="light">Verify and continue</Button></Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
