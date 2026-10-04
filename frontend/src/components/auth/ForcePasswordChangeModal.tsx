import React, { useState } from 'react';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { Eye, EyeOff, KeyRound, Lock, LogOut, ShieldAlert, ShieldCheck } from 'lucide-react';

export const ForcePasswordChangeModal: React.FC = () => {
  const { mustChangePassword, completePasswordSetup, logout, currentUser, currentEmail } = useLawyersDiary();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!mustChangePassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Please enter the temporary password provided by your firm.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from the temporary password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    const success = await completePasswordSetup(currentPassword, newPassword);
    setIsSubmitting(false);

    if (!success) {
      setError('Failed to update password. Check that the current temporary password is correct.');
    }
  };

  // Password strength calculation
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
  const strengthScore = [hasMinLength, hasNumber, hasLetter, hasSpecial].filter(Boolean).length;

  return (
    <div className="force-pwd-backdrop" role="dialog" aria-modal="true" aria-labelledby="force-pwd-title">
      <div className="force-pwd-card">
        <div className="force-pwd-header">
          <div className="force-pwd-badge">
            <ShieldAlert size={20} />
          </div>
          <div>
            <span className="force-pwd-eyebrow">Zero-Trust Security</span>
            <h2 id="force-pwd-title">Set your permanent password</h2>
          </div>
        </div>

        <p className="force-pwd-lead">
          Welcome to Lawyers Diary, <strong>{currentUser || currentEmail}</strong>. You signed in using temporary credentials. To protect attorney-client confidentiality and docket security, you must choose your private password before accessing your firm's cases.
        </p>

        <form onSubmit={handleSubmit} className="force-pwd-form">
          <div className="force-pwd-field">
            <label htmlFor="fp-current">Current Temporary Password</label>
            <div className="force-pwd-input-wrap">
              <KeyRound size={16} className="force-pwd-icon" />
              <input
                id="fp-current"
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter temporary password received"
              />
              <button
                type="button"
                className="force-pwd-toggle"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label="Toggle password visibility"
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="force-pwd-field">
            <label htmlFor="fp-new">New Permanent Password</label>
            <div className="force-pwd-input-wrap">
              <Lock size={16} className="force-pwd-icon" />
              <input
                id="fp-new"
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                className="force-pwd-toggle"
                onClick={() => setShowNew(!showNew)}
                aria-label="Toggle password visibility"
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {newPassword && (
              <div className="force-pwd-strength">
                <div className="force-pwd-strength-bar">
                  <div
                    className={`force-pwd-strength-fill score-${strengthScore}`}
                    style={{ width: `${(strengthScore / 4) * 100}%` }}
                  />
                </div>
                <span className="force-pwd-strength-label">
                  {strengthScore <= 1 ? 'Weak' : strengthScore === 2 ? 'Fair' : strengthScore === 3 ? 'Good' : 'Strong'}
                </span>
              </div>
            )}
          </div>

          <div className="force-pwd-field">
            <label htmlFor="fp-confirm">Confirm New Password</label>
            <div className="force-pwd-input-wrap">
              <Lock size={16} className="force-pwd-icon" />
              <input
                id="fp-confirm"
                type={showNew ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
              />
            </div>
          </div>

          {error && <div className="force-pwd-error">{error}</div>}

          <div className="force-pwd-guidelines">
            <div className={`force-pwd-guide-item ${hasMinLength ? 'met' : ''}`}>
              <ShieldCheck size={14} /> At least 8 characters
            </div>
            <div className={`force-pwd-guide-item ${hasNumber && hasLetter ? 'met' : ''}`}>
              <ShieldCheck size={14} /> Letters & numbers
            </div>
          </div>

          <div className="force-pwd-actions">
            <button
              type="submit"
              className="button button-primary force-pwd-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Securing account...' : 'Set password & enter practice'}
            </button>
            <button
              type="button"
              className="force-pwd-logout"
              onClick={logout}
              title="Sign out of temporary session"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
