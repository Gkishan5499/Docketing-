import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import {
  ArrowLeft,
  Bell,
  Calendar,
  Shield,
  Monitor,
  Trash2,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Clock,
  Globe,
  Mail,
  Download,
  ExternalLink,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

type Section = 'notifications' | 'calendar' | 'security' | 'sessions' | 'danger';

export const AccountSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    currentEmail,
    currentRole,
    logout,
    showToast,
    googleCalendarEmail,
    googleCalendarSync,
    googleCalendarScope,
    setGoogleCalendarScope,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    subscribeGoogleCalendarFeed,
    exportAllEventsToGoogleCalendar,
  } = useLawyersDiary();

  const [activeSection, setActiveSection] = useState<Section>('notifications');
  const [gcalInput, setGcalInput] = useState(googleCalendarEmail || '');

  // Notification preferences (local state — wire to API as needed)
  const [emailDeadlines, setEmailDeadlines] = useState(true);
  const [emailTeam, setEmailTeam] = useState(true);
  const [pushHearings, setPushHearings] = useState(true);
  const [pushTasks, setPushTasks] = useState(false);
  const [digestWeekly, setDigestWeekly] = useState(false);

  // Security preferences
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');

  const roleLabel: Record<string, string> = {
    FIRM_ADMIN: 'Firm Admin',
    ATTORNEY: 'Attorney',
    PARALEGAL: 'Paralegal',
    STAFF: 'Staff',
    VIEWER: 'Viewer',
  };

  const initials = currentUser
    ? currentUser.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void; label: string; desc?: string }> = ({ value, onChange, label, desc }) => (
    <div className="as-toggle-row">
      <div>
        <p className="as-toggle-label">{label}</p>
        {desc && <p className="as-toggle-desc">{desc}</p>}
      </div>
      <button
        type="button"
        className={`as-toggle-btn ${value ? 'on' : ''}`}
        onClick={() => { onChange(!value); showToast(`${label} ${!value ? 'enabled' : 'disabled'}`, 'ok'); }}
        aria-pressed={value}
      >
        {value ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
      </button>
    </div>
  );

  const navItems: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { key: 'calendar', label: 'Google Calendar', icon: <Calendar size={16} /> },
    { key: 'security', label: 'Security', icon: <Shield size={16} /> },
    { key: 'sessions', label: 'Active Sessions', icon: <Monitor size={16} /> },
    { key: 'danger', label: 'Danger Zone', icon: <Trash2 size={16} /> },
  ];

  return (
    <div className="as-page">
      <button className="ep-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="as-layout">
        {/* Left nav */}
        <aside className="as-nav">
          {/* Profile mini-card */}
          <div className="as-profile-card">
            <span className="as-profile-avatar">{initials}</span>
            <div>
              <strong>{currentUser || 'Advocate'}</strong>
              <span className="ep-role-pill" style={{ marginTop: '0.35rem' }}>
                <ShieldCheck size={11} />
                {roleLabel[currentRole] ?? currentRole}
              </span>
            </div>
          </div>

          <nav className="as-nav-list">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`as-nav-item ${activeSection === item.key ? 'active' : ''}`}
                onClick={() => setActiveSection(item.key)}
              >
                {item.icon}
                {item.label}
                <ChevronRight size={14} className="as-nav-chevron" />
              </button>
            ))}
          </nav>
        </aside>

        {/* Main panel */}
        <main className="as-main">

          {/* ── Notifications ── */}
          {activeSection === 'notifications' && (
            <section className="as-section">
              <div className="as-section-header">
                <Bell size={20} />
                <div>
                  <h2>Notification Preferences</h2>
                  <p>Control how and when Lawyers Diary alerts you about your practice.</p>
                </div>
              </div>

              <div className="as-card">
                <h4 className="as-card-title">Email Alerts</h4>
                <Toggle value={emailDeadlines} onChange={setEmailDeadlines} label="Deadline & Hearing Reminders" desc="Email 24 hours before a scheduled court date or deadline." />
                <Toggle value={emailTeam} onChange={setEmailTeam} label="Team Activity" desc="When a colleague assigns a task or updates a matter." />
                <Toggle value={digestWeekly} onChange={setDigestWeekly} label="Weekly Digest" desc="Summary of upcoming hearings and open tasks every Monday." />
              </div>

              <div className="as-card">
                <h4 className="as-card-title">In-App Alerts</h4>
                <Toggle value={pushHearings} onChange={setPushHearings} label="Urgent Hearing Alerts" desc="Show a badge for hearings due within 48 hours." />
                <Toggle value={pushTasks} onChange={setPushTasks} label="Task Assignment Alerts" desc="Notify when a matter task is assigned to you." />
              </div>
            </section>
          )}

          {/* ── Google Calendar ── */}
          {activeSection === 'calendar' && (
            <section className="as-section">
              <div className="as-section-header">
                <Calendar size={20} />
                <div>
                  <h2>Google Calendar &amp; Chamber Sync</h2>
                  <p>Sync all your court listings, cause lists, and limitation deadlines into your Google Calendar.</p>
                </div>
              </div>

              <div className="as-card">
                <h4 className="as-card-title">Gmail Account Integration</h4>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--tx2)', marginBottom: '0.6rem' }}>
                    Connect your personal or chamber Gmail ID. Once connected, court dates and hearings can be added to your calendar with 1-click or subscribed continuously.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                      <input
                        className="ep-input"
                        type="email"
                        value={gcalInput}
                        onChange={(e) => setGcalInput(e.target.value)}
                        placeholder="e.g. advocate.sharma@gmail.com"
                        style={{ margin: 0, paddingLeft: '2.2rem' }}
                      />
                      <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx2)' }} />
                    </div>
                    <button
                      type="button"
                      className="btn btn-p btn-s"
                      onClick={() => {
                        if (gcalInput.trim()) {
                          connectGoogleCalendar(gcalInput.trim());
                        } else {
                          showToast('Please enter a valid Gmail ID', 'er');
                        }
                      }}
                    >
                      {googleCalendarSync ? 'Update Gmail' : 'Connect Gmail'}
                    </button>
                    {googleCalendarSync && (
                      <button
                        type="button"
                        className="btn btn-g btn-s"
                        onClick={() => disconnectGoogleCalendar()}
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                </div>

                {googleCalendarSync && googleCalendarEmail && (
                  <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--tx)' }}>
                      Connected to <strong>{googleCalendarEmail}</strong>. Court listings and alerts will be directed to this address.
                    </span>
                  </div>
                )}
              </div>

              <div className="as-card">
                <h4 className="as-card-title">Sync Preferences &amp; Subscriptions</h4>
                <div className="as-field-row" style={{ marginBottom: '1rem' }}>
                  <label className="as-field-label">Calendar Scope</label>
                  <select
                    className="as-select"
                    value={googleCalendarScope}
                    onChange={(e) => setGoogleCalendarScope(e.target.value as 'all' | 'assigned')}
                  >
                    <option value="all">All Firm Court Listings &amp; Deadlines</option>
                    <option value="assigned">Only Cases Assigned to Me ({currentUser || 'Counsel'})</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-p btn-s"
                    onClick={subscribeGoogleCalendarFeed}
                  >
                    <Sparkles size={14} className="text-yellow-300" />
                    <span>Subscribe in Google Calendar (Live Feed)</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-o btn-s"
                    onClick={() => exportAllEventsToGoogleCalendar()}
                  >
                    <Download size={14} />
                    <span>Export Firm Docket (.ics)</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-g btn-s"
                    onClick={() => window.open('https://calendar.google.com', '_blank')}
                  >
                    <span>Open Google Calendar</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ── Security ── */}
          {activeSection === 'security' && (
            <section className="as-section">
              <div className="as-section-header">
                <Shield size={20} />
                <div>
                  <h2>Security Settings</h2>
                  <p>Manage authentication and access control for your account.</p>
                </div>
              </div>

              <div className="as-card">
                <h4 className="as-card-title">Authentication</h4>
                <Toggle value={twoFactor} onChange={setTwoFactor} label="Two-Factor Authentication" desc="Add an extra layer of security to your login." />
                <div className="as-field-row">
                  <label className="as-field-label">
                    <Clock size={14} /> Session Timeout
                  </label>
                  <select
                    className="as-select"
                    value={sessionTimeout}
                    onChange={(e) => { setSessionTimeout(e.target.value); showToast('Session timeout updated', 'ok'); }}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="240">4 hours</option>
                    <option value="480">8 hours</option>
                  </select>
                </div>
              </div>

              <div className="as-card">
                <h4 className="as-card-title">Login Details</h4>
                <div className="as-info-row"><Globe size={14} /> <span>Registered email</span><strong>{currentEmail || '—'}</strong></div>
                <div className="as-info-row"><ShieldCheck size={14} /> <span>Role</span><strong>{roleLabel[currentRole] ?? currentRole}</strong></div>
                <button className="as-secondary-btn" onClick={() => navigate('/edit-profile')}>
                  Change Password →
                </button>
              </div>
            </section>
          )}

          {/* ── Active Sessions ── */}
          {activeSection === 'sessions' && (
            <section className="as-section">
              <div className="as-section-header">
                <Monitor size={20} />
                <div>
                  <h2>Active Sessions</h2>
                  <p>Devices and browsers currently signed in to your account.</p>
                </div>
              </div>
              <div className="as-card">
                <div className="as-session-row current">
                  <div className="as-session-icon"><Monitor size={18} /></div>
                  <div className="as-session-info">
                    <strong>This device · Chrome on Windows</strong>
                    <small>Last active: just now · Current session</small>
                  </div>
                  <span className="as-session-badge">Active</span>
                </div>
                <p className="as-empty-note">No other active sessions found.</p>
              </div>
            </section>
          )}

          {/* ── Danger Zone ── */}
          {activeSection === 'danger' && (
            <section className="as-section">
              <div className="as-section-header danger">
                <Trash2 size={20} />
                <div>
                  <h2>Danger Zone</h2>
                  <p>These actions are irreversible. Proceed with caution.</p>
                </div>
              </div>
              <div className="as-card danger-card">
                <div className="as-danger-row">
                  <div>
                    <strong>Sign out of all devices</strong>
                    <p>Immediately invalidates all active sessions for your account.</p>
                  </div>
                  <button
                    className="as-danger-btn"
                    onClick={() => { showToast('All sessions terminated', 'ok'); logout(); navigate('/login'); }}
                  >
                    Sign out everywhere
                  </button>
                </div>
                <div className="as-divider" />
                <div className="as-danger-row">
                  <div>
                    <strong>Delete account data</strong>
                    <p>Contact your firm administrator to remove your account from the workspace.</p>
                  </div>
                  <button className="as-danger-btn outline" onClick={() => showToast('Contact your Firm Admin to delete this account', 'in')}>
                    Request deletion
                  </button>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
