import React, { FormEvent, useEffect, useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  Mail,
  ShieldCheck,
  UserPlus,
  UserRoundX,
} from "lucide-react";

type Role = "ATTORNEY" | "PARALEGAL" | "STAFF" | "VIEWER";
type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "Active" | "Pending";
};

type Credentials = { name: string; email: string; password: string };

const roleLabels: Record<Role, string> = {
  ATTORNEY: "Attorney",
  PARALEGAL: "Paralegal",
  STAFF: "Staff",
  VIEWER: "Viewer",
};

export const TeamPage: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "ATTORNEY" as Role,
  });

  useEffect(() => {
    fetch("/api/v1/users", { credentials: "include" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load team members");
        setMembers(result.data.map((member: { _id: string; name: string; email: string; role: Role; mustChangePassword: boolean; isActive: boolean }) => ({
          id: member._id,
          name: member.name,
          email: member.email,
          role: member.role,
          status: member.isActive && !member.mustChangePassword ? "Active" : "Pending",
        })));
      })
      .catch((loadError) => {
        setMembers([]);
        setError(loadError instanceof Error ? loadError.message : "Unable to load team members");
      })
      .finally(() => setLoading(false));
  }, []);

  const inviteMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      setMembers((current) => [...current, { ...member, status: "Pending" }]);
      setCredentials({ name: member.name, email: member.email, password: result.data.temporaryPassword });
      setForm({ name: "", email: "", role: "ATTORNEY" });
      setError("");
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Unable to create team member");
    }
  };

  const copyCredentials = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(
      `Lawyers Diary login\nEmail: ${credentials.email}\nTemporary password: ${credentials.password}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const revokeMember = (id: string) =>
    setMembers((current) => current.filter((member) => member.id !== id));

  return (
    <div className="team-page">
      <div className="team-heading">
        <div>
          <div className="pg-eyebrow">Owner workspace</div>
          <h1>Team access</h1>
          <p>
            Create secure accounts for the lawyers and staff who work in your
            practice.
          </p>
        </div>
        <div className="team-security">
          <ShieldCheck size={18} />
          <span>
            Firm data stays
            <br />
            <strong>permissioned</strong>
          </span>
        </div>
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
            We generate a temporary password for the new member. Share it
            securely, then ask them to change it after their first login.
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
                placeholder="e.g. Priya Sharma"
              />
            </label>
            <label>
              Work email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                placeholder="priya@yourfirm.com"
              />
            </label>
            <label>
              Access role
              <select
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value as Role })
                }
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button className="button button-primary" type="submit">
              Create login credentials <KeyRound size={16} />
            </button>
          </form>
        </section>
        <section className="team-panel credential-panel">
          {credentials ? (
            <>
              <div className="credential-icon">
                <KeyRound size={20} />
              </div>
              <span className="team-kicker">Ready to share</span>
              <h2>{credentials.name}'s login</h2>
              <p>
                These credentials are shown once. Send them through a private
                channel.
              </p>
              <div className="credential-box">
                <span>Email</span>
                <strong>{credentials.email}</strong>
                <span>Temporary password</span>
                <strong>{credentials.password}</strong>
              </div>
              <button
                className="button button-outline"
                type="button"
                onClick={copyCredentials}
              >
                {copied ? (
                  <>
                    <Check size={16} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Copy secure handoff
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
                After you create a member, copy their temporary login details
                from this private handoff panel.
              </p>
            </div>
          )}
        </section>
      </div>
      <section className="team-panel members-panel">
        <div className="team-panel-head">
          <div>
            <span className="team-kicker">Your practice</span>
            <h2>People with access</h2>
          </div>
          <span className="member-count">
            {loading ? "Loading..." : `${members.length} account${members.length === 1 ? "" : "s"}`}
          </span>
        </div>
        {error && <p className="team-error">{error}</p>}
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
              <span className="member-role">{roleLabels[member.role]}</span>
              <span className={`member-status ${member.status.toLowerCase()}`}>
                {member.status}
              </span>
              {member.id !== "owner" && (
                <button
                  className="revoke-button"
                  type="button"
                  onClick={() => revokeMember(member.id)}
                  title="Revoke access"
                >
                  <UserRoundX size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
      <div className="team-note">
        <ShieldCheck size={16} />
        <span>
          Owner tip: never send passwords in a public group. Share the temporary
          password privately and ask every new member to change it immediately.
        </span>
      </div>
    </div>
  );
};
