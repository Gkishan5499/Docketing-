import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useLawyersDiary } from '../context/LawyersDiaryContext';

export const SetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useLawyersDiary();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [token] = useState(tokenParam);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [tokenInfo, setTokenInfo] = useState<{ name?: string; firmName?: string; plan?: string } | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(tokenParam ? null : false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (tokenParam && emailParam) {
      fetch(`/api/v1/auth/verify-setup-token?token=${tokenParam}&email=${encodeURIComponent(emailParam)}`)
        .then(async (res) => {
          if (!res.ok) {
            setTokenValid(false);
            return;
          }
          const json = await res.json();
          setTokenValid(true);
          setTokenInfo(json.data);
          if (json.data?.email) setEmail(json.data.email);
        })
        .catch(() => setTokenValid(false));
    }
  }, [tokenParam, emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (!tokenValid && !currentPassword) {
      setError('Please provide the temporary password sent to your email.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (currentPassword && newPassword === currentPassword) {
      setError('New password must be different from your temporary password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token: tokenValid ? token : undefined,
          currentPassword: currentPassword || undefined,
          newPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Failed to set password');
      }

      setSuccess(true);
      showToast('Permanent password created successfully! Entering your workspace...', 'ok');

      setTimeout(() => {
        // Reload into dashboard with newly established authenticated session
        window.location.href = '/db';
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  const hasLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
  const score = [hasLength, hasNumber, hasLetter, hasSpecial].filter(Boolean).length;

  return (
    <div id="login">
      <aside className="login-aside">
        <Link to="/" className="login-aside-brand">
          <img src="/logo-white.png" alt="DexFora" className="login-aside-logo" />
        </Link>
        <div className="login-aside-copy">
          <span className="login-eyebrow">Zero-Trust Practice Security</span>
          <h1>Activate your<br /><em>workspace.</em></h1>
          <p>
            {tokenInfo?.firmName
              ? `You've been authorized for ${tokenInfo.firmName}. Choose your private password to decrypt and open your chambers docket.`
              : 'Protecting attorney-client privilege begins with your private password. No one else has access to your credentials.'}
          </p>
        </div>
        <div className="login-aside-footer">
          <ShieldCheck size={17} />
          <span>Encrypted practice workspace · AES-256</span>
        </div>
      </aside>

      <div className="lc">
        <div className="login-card-heading">
          <div className="logo-sq" style={{ width: '48px', height: '48px' }}>
            <img src="/favicon.png" alt="DexFora" className="logo-icon-img" />
          </div>
          <div>
            <span className="login-eyebrow">Credential Activation</span>
            <h2>{tokenInfo?.name ? `Welcome, ${tokenInfo.name}` : 'Set Your Password'}</h2>
            <p>
              {tokenInfo?.firmName
                ? `Activate account for ${tokenInfo.firmName}`
                : 'Choose your permanent password to access DexFora'}
            </p>
          </div>
        </div>

        {success ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
            <CheckCircle2 size={48} className="text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-emerald-950">Password Activated!</h3>
            <p className="text-sm text-emerald-800">
              Your permanent password has been set. Redirecting you to your chambers docket...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="lf">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2.5">
                <ShieldAlert size={18} className="shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <label htmlFor="sp-email">Work Email</label>
            <div className="login-input-wrap">
              <input
                id="sp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourfirm.com"
                required
                disabled={Boolean(tokenValid && emailParam)}
              />
            </div>

            {/* If token is invalid or missing, ask for temporary password */}
            {!tokenValid && (
              <>
                <label htmlFor="sp-current">Current Temporary Password</label>
                <div className="login-input-wrap">
                  <KeyRound size={16} />
                  <input
                    id="sp-current"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter temporary password from email"
                    required={!tokenValid}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="cursor-pointer text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </>
            )}

            <label htmlFor="sp-new">New Permanent Password</label>
            <div className="login-input-wrap">
              <Lock size={16} />
              <input
                id="sp-new"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Choose a strong password (min 8 chars)"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="cursor-pointer text-slate-400 hover:text-slate-600"
                aria-label="Toggle password visibility"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength meter */}
            {newPassword && (
              <div className="space-y-1.5 py-1">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Security strength:</span>
                  <span className={score >= 3 ? 'text-emerald-600' : 'text-amber-600'}>
                    {score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      score <= 1 ? 'w-1/4 bg-red-500' : score === 2 ? 'w-2/4 bg-amber-500' : score === 3 ? 'w-3/4 bg-blue-500' : 'w-full bg-emerald-500'
                    }`}
                  />
                </div>
              </div>
            )}

            <label htmlFor="sp-confirm">Confirm Permanent Password</label>
            <div className="login-input-wrap">
              <Lock size={16} />
              <input
                id="sp-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type your new password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="cursor-pointer text-slate-400 hover:text-slate-600"
                aria-label="Toggle password visibility"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="button button-primary w-full flex items-center justify-center gap-2 mt-2 py-3"
            >
              <span>{loading ? 'Activating Credentials...' : 'Save Password & Enter Workspace'}</span>
              <ArrowRight size={16} />
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-blue-600 hover:underline">
                Already know your password? Sign in to DexFora &rarr;
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
