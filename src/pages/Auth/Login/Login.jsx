import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../../assets/logos/mediokiosk-icon.png';
import Button from '../../../components/common/Button/Button';
import Loader from '../../../components/common/Loader/Loader';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services/authService';
import { APP_NAME, DEMO_OTP, PORTAL_NAME } from '../../../utils/constants';
import { maskMobile, validateMobile } from '../../../utils/helpers';
import './Login.css';

export default function Login() {
  const { completeRegistration } = useAuth();
  const navigate = useNavigate();
  const existing = authService.getUser();
  const [mobile, setMobile] = useState(existing?.mobile || '');
  const [stage, setStage] = useState('mobile');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const otpRefs = useRef([]);

  const sendOtp = async () => {
    if (!validateMobile(mobile)) {
      setError('Enter the 10-digit mobile number used at registration.');
      return;
    }
    if (existing && existing.mobile !== mobile) {
      setError('This number does not match a registered citizen profile on this device.');
      return;
    }
    if (!existing) {
      setError('No verified profile found. Please complete identity registration first.');
      return;
    }
    setBusy(true);
    setError('');
    await authService.sendOtp(mobile);
    setBusy(false);
    setStage('otp');
  };

  const confirm = async () => {
    setBusy(true);
    const ok = await authService.confirmOtp(otpDigits.join(''));
    setBusy(false);
    if (!ok) {
      setError(`Invalid OTP. Demo code is ${DEMO_OTP}.`);
      return;
    }
    completeRegistration(existing);
    navigate('/dashboard');
  };

  return (
    <main className="auth-shell">
      <div className="gov-strip">
        <span>Government of India · Citizen login</span>
        <span className="secure-badge">▣ OTP protected</span>
      </div>
      <div className="tricolor" aria-hidden="true"><i /><i /><i /></div>
      <div className="auth-top">
        <Link className="brand" to="/">
          <img src={logo} alt="" />
          <span>
            <b>{APP_NAME}</b>
            <small>{PORTAL_NAME}</small>
          </span>
        </Link>
      </div>
      <section className="auth-wrap login-card">
        {busy && <Loader label="Contacting authentication service…" />}
        {!busy && stage === 'mobile' && (
          <>
            <p className="eyebrow">Returning citizen</p>
            <h1>Login with mobile OTP</h1>
            <p className="lede">Use the mobile number linked during Aadhaar or driving licence verification.</p>
            <div className="field">
              <label htmlFor="login-mobile">Registered mobile number</label>
              <input
                id="login-mobile"
                className="input"
                value={mobile}
                maxLength={10}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number"
              />
            </div>
            <p className="error-text">{error}</p>
            <Button className="full" onClick={sendOtp}>Send OTP</Button>
          </>
        )}
        {!busy && stage === 'otp' && (
          <>
            <button className="back" onClick={() => setStage('mobile')}>← Change number</button>
            <h1>Enter OTP</h1>
            <p className="lede">Code sent to {maskMobile(mobile)}.</p>
            <div className="otp">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpRefs.current[index] = el; }}
                  maxLength={1}
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => {
                    const next = [...otpDigits];
                    next[index] = e.target.value.replace(/\D/g, '').slice(-1);
                    setOtpDigits(next);
                    if (next[index] && index < 3) otpRefs.current[index + 1]?.focus();
                  }}
                />
              ))}
            </div>
            <p className="helper">Demo code: <b>{DEMO_OTP}</b></p>
            <p className="error-text">{error}</p>
            <Button className="full" onClick={confirm}>Open dashboard</Button>
          </>
        )}
        <p className="switch-auth">New citizen? <Link to="/register">Verify identity</Link></p>
      </section>
    </main>
  );
}
