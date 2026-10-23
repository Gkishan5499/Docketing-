import React, { useState, useEffect } from 'react';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  KeyRound,
  RotateCw,
  Edit3
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { login, sendOtp, loginWithOtp } = useLawyersDiary();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Countdown for Resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (await login(email, password)) navigate('/db');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setSubmitting(true);
    try {
      const res = await sendOtp(email.trim().toLowerCase(), undefined, 'LOGIN');
      if (res.success) {
        setOtpSent(true);
        setCountdown(45);
        if (res.debugOtp) setDevCode(res.debugOtp);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim().replace(/\s+/g, '');
    if (!cleanOtp || cleanOtp.length < 6) return;
    setSubmitting(true);
    try {
      if (await loginWithOtp(email.trim().toLowerCase(), cleanOtp)) {
        navigate('/db');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      const res = await sendOtp(email.trim().toLowerCase(), undefined, 'LOGIN');
      if (res.success) {
        setCountdown(45);
        if (res.debugOtp) setDevCode(res.debugOtp);
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
            <span className="login-eyebrow">Advocate portal</span>
            <h2>Welcome back.</h2>
            <p>
              {authMode === 'otp'
                ? otpSent
                  ? `Enter code sent to ${email}`
                  : 'Sign in with one-time verification code.'
                : 'Sign in to continue to your practice.'}
            </p>
          </div>
        </div>

        {/* Auth mode toggle tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            marginBottom: '1.25rem',
            background: '#f1f5f9',
            padding: '3px',
            borderRadius: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => { setAuthMode('password'); setOtpSent(false); }}
            style={{
              flex: 1,
              padding: '0.45rem',
              fontSize: '0.76rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              background: authMode === 'password' ? '#fff' : 'transparent',
              color: authMode === 'password' ? 'var(--pr)' : '#64748b',
              boxShadow: authMode === 'password' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('otp')}
            style={{
              flex: 1,
              padding: '0.45rem',
              fontSize: '0.76rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              background: authMode === 'otp' ? '#fff' : 'transparent',
              color: authMode === 'otp' ? 'var(--pr)' : '#64748b',
              boxShadow: authMode === 'otp' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Email OTP
          </button>
        </div>

        {authMode === 'password' ? (
          <form onSubmit={handlePasswordSubmit} className="lf">
            <label htmlFor="li-e">Advocate email ID</label>
            <div className="login-input-wrap">
              <Mail size={16} />
              <input
                type="email"
                id="li-e"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@yourfirm.com"
                required
              />
            </div>

            <label htmlFor="li-p">Password</label>
            <div className="login-input-wrap">
              <LockKeyhole size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="li-p"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                className="login-password-toggle"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button type="submit" className="btn-login" disabled={submitting}>
              {submitting ? 'Authenticating...' : (
                <>
                  Enter practice <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : !otpSent ? (
          <form onSubmit={handleSendOtp} className="lf">
            <label htmlFor="otp-login-email">Advocate email ID</label>
            <div className="login-input-wrap">
              <Mail size={16} />
              <input
                type="email"
                id="otp-login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@yourfirm.com"
                required
              />
            </div>

            <button type="submit" className="btn-login" disabled={submitting} style={{ marginTop: '0.4rem' }}>
              {submitting ? 'Sending verification code...' : (
                <>
                  Send verification code <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtpSubmit} className="lf">
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
                onClick={() => setOtpSent(false)}
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

            <label htmlFor="otp-code">6-Digit Verification Code</label>
            <div className="login-input-wrap">
              <KeyRound size={16} />
              <input
                type="text"
                id="otp-code"
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
              {submitting ? 'Verifying...' : (
                <>
                  Verify &amp; Enter practice <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: 'var(--interactive)', fontWeight: 700, textDecoration: 'none' }}>
            Start 1-Month Free Trial
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

export default LoginPage;
