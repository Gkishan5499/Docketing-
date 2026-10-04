import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Save,
} from 'lucide-react';

export const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    currentEmail,
    currentRole,
    updateProfile,
    showToast,
    googleCalendarEmail,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
  } = useLawyersDiary();

  const [name, setName] = useState(currentUser || '');
  const [email, setEmail] = useState(currentEmail || '');
  const [gcalEmail, setGcalEmail] = useState(googleCalendarEmail || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const roleLabel: Record<string, string> = {
    FIRM_ADMIN: 'Firm Admin',
    ATTORNEY: 'Attorney',
    PARALEGAL: 'Paralegal',
    STAFF: 'Staff',
    VIEWER: 'Viewer',
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Display name is required', 'er');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'er');
      return;
    }
    if (newPassword && newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'er');
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    updateProfile({ name: name.trim(), email: email.trim() });

    if (gcalEmail.trim() !== (googleCalendarEmail || '')) {
      if (gcalEmail.trim()) {
        await connectGoogleCalendar(gcalEmail.trim());
      } else {
        await disconnectGoogleCalendar();
      }
    }

    setSaving(false);
    navigate(-1);
  };

  return (
    <div className="ep-page">
      <button className="ep-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="ep-container">
        {/* Left — Avatar Card */}
        <aside className="ep-sidebar">
          <div className="ep-avatar-wrap">
            <span className="ep-avatar-lg">{initials}</span>
            <h2 className="ep-avatar-name">{name || 'Your Name'}</h2>
            <span className="ep-role-pill">
              <ShieldCheck size={12} />
              {roleLabel[currentRole] ?? currentRole}
            </span>
          </div>
          <p className="ep-sidebar-hint">
            Changes saved here update your display name across the entire practice workspace.
          </p>
        </aside>

        {/* Right — Form */}
        <form className="ep-form" onSubmit={handleSave} noValidate>
          <div className="ep-section">
            <h3 className="ep-section-title">Personal Information</h3>

            <label className="ep-label">
              <span><User size={14} /> Display Name</span>
              <input
                className="ep-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </label>

            <label className="ep-label">
              <span><Mail size={14} /> Work Email</span>
              <input
                className="ep-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourfirm.com"
              />
              <small className="ep-hint">Used for login — contact your admin to change this.</small>
            </label>
          </div>

          <div className="ep-divider" />

          <div className="ep-section">
            <h3 className="ep-section-title">Google Calendar &amp; Gmail Sync</h3>
            <p className="ep-section-desc">
              Connect your personal or chamber Gmail ID to receive automated court listings, hearing alerts, and limitation deadlines in your Google Calendar.
            </p>

            <label className="ep-label">
              <span><Mail size={14} /> Lawyer Gmail Address for Calendar Alerts</span>
              <input
                className="ep-input"
                type="email"
                value={gcalEmail}
                onChange={(e) => setGcalEmail(e.target.value)}
                placeholder="e.g. advocate.sharma@gmail.com"
              />
              <small className="ep-hint">
                Court appearances and hearings will be drafted and invited to this Gmail account. Leave blank to disconnect.
              </small>
            </label>
          </div>

          <div className="ep-divider" />

          <div className="ep-section">
            <h3 className="ep-section-title">Change Password</h3>
            <p className="ep-section-desc">Leave blank if you don't want to change your password.</p>

            <label className="ep-label">
              <span><Lock size={14} /> Current Password</span>
              <div className="ep-pw-wrap">
                <input
                  className="ep-input"
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
                <button type="button" className="ep-pw-toggle" onClick={() => setShowCurrentPw((v) => !v)}>
                  {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            <div className="ep-pw-row">
              <label className="ep-label">
                <span><Lock size={14} /> New Password</span>
                <div className="ep-pw-wrap">
                  <input
                    className="ep-input"
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                  />
                  <button type="button" className="ep-pw-toggle" onClick={() => setShowNewPw((v) => !v)}>
                    {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>
              <label className="ep-label">
                <span><Lock size={14} /> Confirm New Password</span>
                <div className="ep-pw-wrap">
                  <input
                    className="ep-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                </div>
              </label>
            </div>
          </div>

          <div className="ep-actions">
            <button type="button" className="ep-btn-cancel" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="ep-btn-save" disabled={saving}>
              {saving ? <span>Saving…</span> : <><Save size={15} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
