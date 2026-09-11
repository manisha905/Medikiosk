import { SUPPORT_EMAIL, DEPARTMENT, APP_NAME } from '../../../utils/constants';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div>
        <b>{APP_NAME}</b>
        <p>A citizen-facing health records kiosk for secure identity verification, document storage, and authorised care access.</p>
      </div>
      <div>
        <b>Helpdesk</b>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        <span>Mon–Sat, 9:00 AM – 6:00 PM IST</span>
      </div>
      <div>
        <b>Official notice</b>
        <span>This portal is a demonstration frontend. Do not enter live Aadhaar credentials on untrusted networks.</span>
      </div>
      <p className="footer-note">© 2026 {APP_NAME}. Aligned in presentation with {DEPARTMENT} citizen services. Content is for project demonstration only.</p>
    </footer>
  );
}
