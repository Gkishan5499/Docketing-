import React, { FormEvent, useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserRoundX,
  UsersRound,
} from "lucide-react";
import { useLawyersDiary } from "../context/LawyersDiaryContext";

type Role = "ATTORNEY" | "PARALEGAL" | "STAFF" | "VIEWER";
type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "Active" | "Pending";
  googleCalendarEmail?: string;
  googleCalendarSync?: boolean;
};

const GoogleCalendarIcon: React.FC<{ size?: number }> = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <rect x="3" y="4" width="18" height="18" rx="3.5" fill="#4285F4" />
    <path d="M3 8.5H21V19C21 20.6569 19.6569 22 18 22H6C4.34315 22 3 20.6569 3 19V8.5Z" fill="#FFFFFF" />
    <path d="M8 2V5" stroke="#1A73E8" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M16 2V5" stroke="#1A73E8" strokeWidth="2.2" strokeLinecap="round" />
    <text x="12" y="17" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#1A73E8" fontFamily="system-ui, sans-serif">
      {new Date().getDate()}
    </text>
  </svg>
);

type SeatInfo = {
  seatsUsed: number;
  seatsTotal: number;
  plan: string;
  subscription: string;
};

type Credentials = { name: string; email: string; password: string };

const roleLabels: Record<Role, string> = {
  ATTORNEY: "Attorney",
  PARALEGAL: "Paralegal",
  STAFF: "Staff",
  VIEWER: "Viewer",
};

export const TeamPage: React.FC = () => {
  const { showToast } = useLawyersDiary();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [seatInfo, setSeatInfo] = useState<SeatInfo>({
    seatsUsed: 1,
    seatsTotal: 5,
    plan: "Chambers",
    subscription: "active",
  });
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "ATTORNEY" as Role,
    googleCalendarEmail: "",
  });

  const loadTeam = async () => {
    try {
      const response = await fetch("/api/v1/users", { credentials: "include" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to load team members");

      const rawUsers = Array.isArray(result.data) ? result.data : result.data?.users || [];
      if (result.data?.seatInfo) {
        setSeatInfo(result.data.seatInfo);
      } else {
        const activeCount = rawUsers.filter((u: any) => u.isActive !== false).length;
        setSeatInfo((prev) => ({ ...prev, seatsUsed: activeCount || 1 }));
      }

      setMembers(
        rawUsers.map((member: any) => ({
          id: member._id || member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          status: member.isActive && !member.mustChangePassword ? "Active" : "Pending",
          googleCalendarEmail: member.googleCalendarEmail,
          googleCalendarSync: Boolean(member.googleCalendarSync),
        }))
      );
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load team members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const isQuotaFull = seatInfo.seatsUsed >= seatInfo.seatsTotal;
  const remainingSeats = Math.max(0, seatInfo.seatsTotal - seatInfo.seatsUsed);
  const seatPercentage = Math.min(100, Math.round((seatInfo.seatsUsed / seatInfo.seatsTotal) * 100));

  const inviteMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isQuotaFull) {
      setError(`Cannot add more members. Your firm's plan limit of ${seatInfo.seatsTotal} seats is reached.`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to create team member");

      const member = result.data.user;
      setMembers((current) => [
        {
          id: member.id || member._id,
          name: member.name,
          email: member.email,
          role: member.role,
          status: "Pending",
          googleCalendarEmail: member.googleCalendarEmail || form.googleCalendarEmail,
          googleCalendarSync: Boolean(member.googleCalendarSync || form.googleCalendarEmail),
        },
        ...current,
      ]);
      setSeatInfo((prev) => ({
        ...prev,
        seatsUsed: Math.min(prev.seatsTotal, prev.seatsUsed + 1),
      }));
      setCredentials({
        name: member.name,
        email: member.email,
        password: result.data.temporaryPassword,
      });
      setForm({ name: "", email: "", role: "ATTORNEY", googleCalendarEmail: "" });
      showToast(`Account created for ${member.name}! Temporary credentials generated.`, "ok");
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Unable to create team member");
      showToast(inviteError instanceof Error ? inviteError.message : "Failed to invite lawyer", "er");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(
      `Lawyers Diary login\nEmail: ${credentials.email}\nTemporary password: ${credentials.password}\nNote: You will be prompted to set your private permanent password on first sign-in.`,
    );
    setCopied(true);
    showToast("Credentials copied to clipboard", "ok");
    window.setTimeout(() => setCopied(false), 2000);
  };

  const revokeMember = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${name}? They will no longer be able to sign in.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to revoke member access");
      }
      setMembers((current) => current.filter((member) => member.id !== id));
      setSeatInfo((prev) => ({
        ...prev,
        seatsUsed: Math.max(1, prev.seatsUsed - 1),
      }));
      showToast(`Access revoked for ${name}. Seat freed.`, "in");
    } catch (revokeError) {
      // Fallback local update
      setMembers((current) => current.filter((member) => member.id !== id));
      setSeatInfo((prev) => ({
        ...prev,
        seatsUsed: Math.max(1, prev.seatsUsed - 1),
      }));
      showToast(`Access revoked locally for ${name}.`, "in");
    }
  };

  return (
    <div className="team-page">
      <div className="team-heading">
        <div>
          <div className="pg-eyebrow">Firm Administration</div>
          <h1>Lawyer & Staff Access</h1>
          <p>
            Manage team accounts, seat allocations, and secure credential provisioning for your practice.
          </p>
        </div>
        <div className="team-security">
          <ShieldCheck size={18} />
          <span>
            Strict Tenant Isolation
            <br />
            <strong>Encrypted Practice Records</strong>
          </span>
        </div>
      </div>

      {/* Subscription Seat Quota Banner */}
      <div className="team-quota-card">
        <div className="team-quota-head">
          <div className="team-quota-meta">
            <span className="team-quota-badge">
              <Sparkles size={13} /> {seatInfo.plan} Plan
            </span>
            <span className="team-quota-sub">
              Monthly Active Subscription
            </span>
          </div>
          <div className="team-quota-counts">
            <strong>{seatInfo.seatsUsed}</strong>
            <span>of {seatInfo.seatsTotal} seats used</span>
            <span className={`team-seat-pill ${isQuotaFull ? "full" : "available"}`}>
              {isQuotaFull ? "At capacity" : `${remainingSeats} available`}
            </span>
          </div>
        </div>

        <div className="team-quota-track">
          <div
            className={`team-quota-fill ${isQuotaFull ? "full" : ""}`}
            style={{ width: `${seatPercentage}%` }}
          />
        </div>

        {isQuotaFull && (
          <div className="team-quota-alert">
            <AlertTriangle size={16} />
            <span>
              All <strong>{seatInfo.seatsTotal} seats</strong> on your current <strong>{seatInfo.plan}</strong> subscription are filled. To invite more advocates, contact the platform owner to upgrade your monthly plan.
            </span>
          </div>
        )}
      </div>

      <div className="team-grid">
        <section className="team-panel">
          <div className="team-panel-head">
            <div>
              <span className="team-kicker">New access</span>
              <h2>Invite a lawyer</h2>
            </div>
            <UserPlus size={21} />
          </div>
          <p className="team-help">
            We generate randomized temporary credentials with forced password rotation. The lawyer must establish a permanent password before accessing client records.
          </p>

          <form className="team-form" onSubmit={inviteMember}>
            <label>
              Full name
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="e.g. Adv. Priya Sharma"
                disabled={isQuotaFull}
              />
            </label>
            <label>
              Professional work email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                placeholder="priya@yourfirm.com"
                disabled={isQuotaFull}
              />
            </label>
            <label>
              Access role & permissions
              <select
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value as Role })
                }
                disabled={isQuotaFull}
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Gmail for Calendar Sync (optional)
              <input
                type="email"
                value={form.googleCalendarEmail}
                onChange={(event) =>
                  setForm({ ...form, googleCalendarEmail: event.target.value })
                }
                placeholder="e.g. adv.priya@gmail.com"
                disabled={isQuotaFull}
              />
            </label>

            {error && <p className="team-error">{error}</p>}

            <button
              className="button button-primary"
              type="submit"
              disabled={isQuotaFull || submitting}
            >
              {isQuotaFull
                ? "Seat Limit Reached (Upgrade Plan)"
                : submitting
                ? "Creating account..."
                : "Create temporary credentials"}
              {!isQuotaFull && !submitting && <KeyRound size={16} />}
            </button>
          </form>
        </section>

        <section className="team-panel credential-panel">
          {credentials ? (
            <>
              <div className="credential-icon">
                <KeyRound size={20} />
              </div>
              <span className="team-kicker">Secure Handover</span>
              <h2>{credentials.name}'s temporary login</h2>
              <p>
                These temporary credentials are shown once. Share them privately. The user will be required to change this password on their first login.
              </p>
              <div className="credential-box">
                <span>Login Email</span>
                <strong>{credentials.email}</strong>
                <span>Temporary Password</span>
                <strong>{credentials.password}</strong>
              </div>
              <button
                className="button button-outline"
                type="button"
                onClick={copyCredentials}
              >
                {copied ? (
                  <>
                    <Check size={16} /> Copied securely
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Copy credentials handoff
                  </>
                )}
              </button>
              <button
                className="team-dismiss"
                type="button"
                onClick={() => setCredentials(null)}
              >
                Dismiss credential view
              </button>
            </>
          ) : (
            <div className="empty-credential">
              <Mail size={28} />
              <h2>Credentials appear here</h2>
              <p>
                After provisioning a new lawyer or team member, their temporary login details and copyable handoff text will appear here.
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="team-panel members-panel">
        <div className="team-panel-head">
          <div>
            <span className="team-kicker">Practice Workspace</span>
            <h2>Active team members</h2>
          </div>
          <span className="member-count">
            {loading ? "Loading..." : `${members.length} member${members.length === 1 ? "" : "s"}`}
          </span>
        </div>
        <div className="member-list">
          {members.map((member) => (
            <div className="member-row" key={member.id}>
              <div className="member-avatar">
                {member.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="member-info">
                <strong>{member.name}</strong>
                <span>{member.email}</span>
              </div>
              <span className="member-role">{roleLabels[member.role] || member.role}</span>
              <span className={`member-status ${member.status.toLowerCase()}`}>
                {member.status === "Pending" ? "Password reset required" : "Active"}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.28rem',
                  fontSize: '0.72rem',
                  padding: '0.22rem 0.5rem',
                  borderRadius: '999px',
                  background: (member.googleCalendarEmail || member.email.includes('@gmail.com')) ? 'rgba(66, 133, 244, 0.1)' : 'var(--bg)',
                  color: (member.googleCalendarEmail || member.email.includes('@gmail.com')) ? '#1A73E8' : 'var(--tx2)',
                  border: '1px solid',
                  borderColor: (member.googleCalendarEmail || member.email.includes('@gmail.com')) ? 'rgba(66, 133, 244, 0.3)' : 'var(--bd)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
                title={member.googleCalendarEmail ? `Google Calendar synced to ${member.googleCalendarEmail}` : 'Google Calendar sync ready'}
              >
                <GoogleCalendarIcon size={12} />
                <span>
                  {member.googleCalendarEmail
                    ? member.googleCalendarEmail.length > 18
                      ? member.googleCalendarEmail.slice(0, 16) + '…'
                      : member.googleCalendarEmail
                    : member.email.includes('@gmail.com')
                    ? 'Gmail Linked'
                    : 'Cal Ready'}
                </span>
              </span>
              {member.id !== "owner" && (
                <button
                  className="revoke-button"
                  type="button"
                  onClick={() => revokeMember(member.id, member.name)}
                  title="Revoke access & free seat"
                >
                  <UserRoundX size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="team-note">
        <ShieldAlert size={16} />
        <span>
          <strong>Security Protocol:</strong> Never transmit passwords over unencrypted communication channels. Every temporary password expires once replaced by the user during first login.
        </span>
      </div>
    </div>
  );
};
