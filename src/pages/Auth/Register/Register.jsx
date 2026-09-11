import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, IdCard } from 'lucide-react';
import logo from '../../../assets/logos/mediokiosk-icon.png';
import Button from '../../../components/common/Button/Button';
import Loader from '../../../components/common/Loader/Loader';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services/authService';
import { APP_NAME, DEMO_OTP, ID_TYPES, PORTAL_NAME } from '../../../utils/constants';
import {
  createHealthId,
  maskId,
  maskMobile,
  validateAadhaar,
  validateLicence,
  validateMobile,
} from '../../../utils/helpers';
import './Register.css';

const STEP_LABELS = ['Choose ID', 'Verify identity', 'Mobile number', 'OTP confirm'];

export default function Register() {
  const { completeRegistration } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [idType, setIdType] = useState('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [healthId, setHealthId] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const otpRefs = useRef([]);

  const isAadhaar = idType === 'aadhaar';

  const stepper = (
    <div className="steps">
      {STEP_LABELS.map((label, index) => {
        const number = index + 1;
        const status = step === number ? 'active' : step > number ? 'done' : '';
        return (
          <div className={`step ${status}`} key={label}>
            <div className="bubble">{step > number ? '✓' : number}</div>
            {label}
          </div>
        );
      })}
    </div>
  );

  const verifyIdentity = async () => {
    const valid = isAadhaar ? validateAadhaar(idNumber) : validateLicence(idNumber);
    if (!valid) {
      setError(isAadhaar ? 'Enter a valid 12-digit Aadhaar number.' : 'Enter a valid driving licence number.');
      return;
    }
    setBusy(true);
    setError('');
    await authService.verifyIdentity({ idType, idNumber });
    setBusy(false);
    setStep(3);
  };

  const sendOtp = async () => {
    if (!validateMobile(mobile)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setBusy(true);
    setError('');
    await authService.sendOtp(mobile);
    setBusy(false);
    setStep(4);
  };

  const confirmOtp = async () => {
    const otp = otpDigits.join('');
    setBusy(true);
    const ok = await authService.confirmOtp(otp);
    setBusy(false);
    if (!ok) {
      setError('That OTP does not match. Use the demo code 1234.');
      return;
    }
    const issued = createHealthId();
    completeRegistration({
      healthId: issued,
      name: 'Verified citizen',
      idType,
      maskedId: maskId(idNumber, idType),
      mobile,
    });
    setHealthId(issued);
    setStep(5);
  };

  const onOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < 3) otpRefs.current[index + 1]?.focus();
  };

  return (
    <main className="auth-shell">
      <div className="gov-strip">
        <span>Government of India · Secure citizen registration</span>
        <span className="secure-badge">▣ Identity verification</span>
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
      <section className="auth-wrap">
        {step < 5 && stepper}
        {busy && <Loader label={step === 2 ? 'Checking identity records…' : 'Please wait…'} />}

        {!busy && step === 1 && (
          <>
            <p className="eyebrow">Step 1 of 4</p>
            <h1>Select identity document</h1>
            <p className="lede">Choose one officially issued ID. Only Aadhaar and Driving Licence are enabled in this release.</p>
            <div className="choices">
              {ID_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`choice ${idType === type.id ? 'selected' : ''}`}
                  onClick={() => setIdType(type.id)}
                >
                  <i className="tick">✓</i>
                  {type.id === 'aadhaar' ? <IdCard /> : <CreditCard />}
                  <b>{type.title}</b>
                  <span>{type.description}</span>
                </button>
              ))}
            </div>
            <Button className="full" style={{ marginTop: 24 }} onClick={() => setStep(2)}>
              Continue to verification
            </Button>
          </>
        )}

        {!busy && step === 2 && (
          <>
            <button className="back" onClick={() => setStep(1)}>← Change ID type</button>
            <p className="eyebrow">Step 2 of 4</p>
            <h1>Verify your {isAadhaar ? 'Aadhaar' : 'driving licence'}</h1>
            <p className="lede">Enter the document number. This prototype simulates a secure identity check and stores only a masked reference.</p>
            <div className="field">
              <label htmlFor="identity">{isAadhaar ? 'Aadhaar number' : 'Driving licence number'}</label>
              <input
                id="identity"
                className="input"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                maxLength={20}
                placeholder={isAadhaar ? 'XXXX XXXX XXXX' : 'e.g. KA0120241234567'}
              />
              <div className="hint">Do not share this number outside official health kiosks.</div>
            </div>
            <div className="notice">This information is used only to verify identity for health services.</div>
            <p className="error-text">{error}</p>
            <Button className="full" onClick={verifyIdentity}>Verify identity</Button>
          </>
        )}

        {!busy && step === 3 && (
          <>
            <button className="back" onClick={() => setStep(2)}>← Back to identity verification</button>
            <p className="eyebrow">Step 3 of 4</p>
            <h1>Confirm mobile number</h1>
            <p className="lede">A one-time password will be sent to this number to complete registration.</p>
            <div className="field">
              <label htmlFor="mobile">Mobile number</label>
              <input
                id="mobile"
                className="input"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit Indian mobile number"
              />
            </div>
            <p className="error-text">{error}</p>
            <Button className="full" onClick={sendOtp}>Send OTP</Button>
          </>
        )}

        {!busy && step === 4 && (
          <>
            <button className="back" onClick={() => setStep(3)}>← Change mobile number</button>
            <p className="eyebrow">Step 4 of 4</p>
            <h1>Enter the OTP</h1>
            <p className="lede">A four-digit code was sent to <b>{maskMobile(mobile)}</b>.</p>
            <div className="otp">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpRefs.current[index] = el; }}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  aria-label={`OTP digit ${index + 1}`}
                  onChange={(e) => onOtpChange(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otpDigits[index] && index) {
                      otpRefs.current[index - 1]?.focus();
                    }
                  }}
                />
              ))}
            </div>
            <p className="helper">Demo code: <b>{DEMO_OTP}</b> · <button className="resend" type="button">Resend code</button></p>
            <p className="error-text">{error}</p>
            <Button className="full" onClick={confirmOtp}>Confirm and continue</Button>
          </>
        )}

        {!busy && step === 5 && (
          <div className="success">
            <div className="success-mark">✓</div>
            <p className="eyebrow">Registration complete</p>
            <h1>Your identity is confirmed</h1>
            <p className="lede">A Health Services ID has been issued. You may now open the citizen dashboard.</p>
            <div className="id-panel">
              <small>Health Services ID</small>
              <b>{healthId}</b>
            </div>
            <Button className="full" onClick={() => navigate('/dashboard')}>Open dashboard</Button>
          </div>
        )}

        <p className="privacy">Your information is protected and used only for health services.</p>
        {step === 1 && (
          <p className="switch-auth">Already registered? <Link to="/login">Citizen login</Link></p>
        )}
      </section>
    </main>
  );
}
