import React, { useState, useEffect } from 'react';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  User,
  KeyRound,
  RotateCw,
  Edit3
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const RegisterPage: React.FC = () => {
  const { registerUser, sendOtp } = useLawyersDiary();
  const navigate = useNavigate();

  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your advocate or firm name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email ID.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await sendOtp(email.trim().toLowerCase(), name.trim(), 'REGISTRATION');
      if (res.success) {
        setStep('otp');
        setCountdown(45);
        if (res.debugOtp) setDevCode(res.debugOtp);
      } else {
        setErrorMsg(res.message || 'Failed to dispatch verification code.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanOtp = otp.trim().replace(/\s+/g, '');
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setSubmitting(true);
    try {
      const success = await registerUser({
        name: name.trim(),
        organizationName: `${name.trim()}'s Chambers`,
        email: email.trim().toLowerCase(),
        password,
        otp: cleanOtp,
      });

      if (success) {
        navigate('/db');
      } else {
        setErrorMsg('Invalid or expired verification code. Please check your email or request a new one.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setErrorMsg('');
    setResending(true);
    try {
      const res = await sendOtp(email.trim().toLowerCase(), name.trim(), 'REGISTRATION');
      if (res.success) {
        setCountdown(45);
        if (res.debugOtp) setDevCode(res.debugOtp);
      } else {
        setErrorMsg(res.message || 'Could not resend code. Please try again.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div id="login">
      <aside className="login-aside">
        <Link to="/" className="login-aside-brand">
          <img src="/logo-white.png" alt="DexFora" className="login-aside-logo" />
        </Link>
        <div className="login-aside-copy">
          <span className="login-eyebrow">Private practice workspace</span>
          <h1>Keep every matter<br /><em>in order.</em></h1>
          <p>One considered workspace for hearings, filings, deadlines, documents, and the work between them.</p>
        </div>
        <div className="login-aside-footer">
          <ShieldCheck size={17} />
          <span>Encrypted practice records</span>
        </div>
      </aside>

      <div className="lc">
        <div className="login-card-heading">
          <div className="logo-sq" style={{ width: '48px', height: '48px' }}>
            <img src="/favicon.png" alt="DexFora" className="logo-icon-img" />
          </div>
          <div>
            <span className="login-eyebrow">1-month free trial</span>
            <h2>{step === 'otp' ? 'Verify email.' : 'Create account.'}</h2>
            <p>
              {step === 'otp'
                ? `Enter the 6-digit code sent to ${email}`
                : '30 days free · Full access · No credit card required'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '0.6rem 0.8rem',
              marginBottom: '1rem',
              borderRadius: '6px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.78rem'
            }}
          >
            {errorMsg}
          </div>
        )}

        {step === 'details' ? (
          <form onSubmit={handleSendCode} className="lf">
            <label htmlFor="reg-name">Advocate full name</label>
            <div className="login-input-wrap">
              <User size={16} />
              <input
                type="text"
                id="reg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adv. Rajesh Sharma"
                required
              />
            </div>

            <label htmlFor="reg-email">Advocate email ID</label>
            <div className="login-input-wrap">
              <Mail size={16} />
              <input
                type="email"
                id="reg-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@yourfirm.com"
                required
              />
            </div>

            <label htmlFor="reg-pwd">Password</label>
            <div className="login-input-wrap">
              <LockKeyhole size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="reg-pwd"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create your password"
                minLength={6}
                required
              />
              <button
                className="login-password-toggle"
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button type="submit" className="btn-login" disabled={submitting}>
              {submitting ? 'Sending verification code...' : (
                <>
                  Verify email &amp; continue <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister} className="lf">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.45rem 0.65rem',
                borderRadius: '6px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.76rem',
                color: '#475569',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Code sent to: <strong>{email}</strong>
              </span>
              <button
                type="button"
                onClick={() => { setStep('details'); setErrorMsg(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--interactive)',
                  cursor: 'pointer',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                <Edit3 size={12} /> Edit
              </button>
            </div>

            <label htmlFor="reg-otp">6-Digit Verification Code</label>
            <div className="login-input-wrap">
              <KeyRound size={16} />
              <input
                type="text"
                id="reg-otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                autoFocus
                style={{
                  letterSpacing: '0.35em',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--pr)',
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
              <span style={{ color: '#64748b' }}>Didn't receive email?</span>
              {countdown > 0 ? (
                <span style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                  Resend in {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--interactive)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <RotateCw size={12} className={resending ? 'animate-spin' : ''} />
                  Resend code
                </button>
              )}
            </div>

            <div
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: '6px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.72rem',
                color: '#64748b',
                lineHeight: 1.4,
              }}
            >
              ✉️ <strong>Note:</strong> Please check your <strong>Inbox</strong> and <strong>Spam / Junk</strong> folder.
              {devCode && (
                <div style={{ marginTop: '0.25rem', color: '#0369a1', fontWeight: 700 }}>
                  Active verification code: <span style={{ letterSpacing: '0.1em' }}>{devCode}</span>
                </div>
              )}
            </div>

            <button type="submit" className="btn-login" disabled={submitting} style={{ marginTop: '0.25rem' }}>
              {submitting ? 'Activating chambers...' : (
                <>
                  Verify &amp; Start 1-Month Free Trial <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--interactive)', fontWeight: 700, textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>

        <Link to="/" className="login-back-link">
          Back to DexFora
        </Link>

        <div className="login-card-footer">
          DexFora Enterprise <span>·</span> Cloud-encrypted practice management
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
