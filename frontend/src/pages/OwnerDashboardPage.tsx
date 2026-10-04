import React, { FormEvent, useEffect, useState } from "react";
import {
  ArrowUpRight,
  CreditCard,
  KeyRound,
  Plus,
  Search,
  UsersRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { OwnerSidebar } from "../components/owner/OwnerSidebar";

type Firm = {
  id: string;
  name: string;
  owner: string;
  email: string;
  plan: string;
  seatsUsed: number;
  seatsTotal: number;
  status: "Active" | "Trial" | "Suspended";
  renewal: string;
  monthlyValue: number;
};

const initialFirms: Firm[] = [
  {
    id: "mehta-partners",
    name: "Mehta & Partners",
    owner: "Ananya Mehta",
    email: "ananya@mehtapartners.com",
    plan: "Chambers",
    seatsUsed: 4,
    seatsTotal: 5,
    status: "Active",
    renewal: "12 Sep 2026",
    monthlyValue: 24980,
  },
  {
    id: "rao-ip-chambers",
    name: "Rao IP Chambers",
    owner: "Vikram Rao",
    email: "vikram@raoipchambers.com",
    plan: "Solo Counsel",
    seatsUsed: 1,
    seatsTotal: 1,
    status: "Active",
    renewal: "28 Sep 2026",
    monthlyValue: 9990,
  },
  {
    id: "northstar-legal",
    name: "Northstar Legal",
    owner: "Kavita Singh",
    email: "kavita@northstarlegal.com",
    plan: "Firm Office",
    seatsUsed: 8,
    seatsTotal: 15,
    status: "Trial",
    renewal: "Trial ends 24 Aug",
    monthlyValue: 0,
  },
];

const planSeats: Record<string, number> = {
  "Solo Counsel": 1,
  Chambers: 5,
  "Firm Office": 15,
};

const planValue: Record<string, number> = {
  "Solo Counsel": 9990,
  Chambers: 24980,
  "Firm Office": 49990,
};

const readFirms = (): Firm[] => {
  try {
    const saved = localStorage.getItem("ld_owner_firms");
    return saved ? JSON.parse(saved) : initialFirms;
  } catch {
    return initialFirms;
  }
};

export const OwnerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [firmList, setFirmList] = useState<Firm[]>(readFirms);
  const [loadingFirms, setLoadingFirms] = useState(true);
  const [apiError, setApiError] = useState("");
  const [query, setQuery] = useState("");
  const [showNewFirm, setShowNewFirm] = useState(false);
  const [credentials, setCredentials] = useState<{
    firmName: string;
    owner: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);
  const [newFirm, setNewFirm] = useState({
    name: "",
    owner: "",
    email: "",
    plan: "Solo Counsel",
  });
  const [formError, setFormError] = useState("");
  const [selectedFirmForTeam, setSelectedFirmForTeam] = useState<Firm | null>(null);
  const [firmLawyers, setFirmLawyers] = useState<{ id: string; name: string; email: string; role: string; status: string }[]>([]);
  const [loadingLawyers, setLoadingLawyers] = useState(false);
  const [newLawyerForm, setNewLawyerForm] = useState({ name: "", email: "", role: "ATTORNEY" });
  const [lawyerFormError, setLawyerFormError] = useState("");
  const [provisionedCreds, setProvisionedCreds] = useState<{ name: string; email: string; temporaryPassword: string } | null>(null);
  const visibleFirms = firmList.filter((firm) =>
    `${firm.name} ${firm.owner} ${firm.plan}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const activeFirms = firmList.filter((firm) => firm.status === "Active").length;
  const paidSeats = firmList
    .filter((firm) => firm.status === "Active")
    .reduce((total, firm) => total + firm.seatsUsed, 0);
  const provisionedSeats = firmList.reduce((total, firm) => total + firm.seatsTotal, 0);
  const monthlyRecurring = firmList
    .filter((firm) => firm.status === "Active")
    .reduce((total, firm) => total + firm.monthlyValue, 0);
  const renewalsThisWeek = firmList.filter((firm) => {
    const date = new Date(firm.renewal);
    if (Number.isNaN(date.getTime())) return false;
    const days = Math.ceil((date.getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 7;
  }).length;

  useEffect(() => {
    if (sessionStorage.getItem("ld_owner_portal") !== "true") {
      navigate("/owner/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem("ld_owner_firms", JSON.stringify(firmList));
  }, [firmList]);

  useEffect(() => {
    let active = true;
    const loadFirms = async () => {
      try {
        const response = await fetch("/api/v1/owner/firms", {
          credentials: "include",
        });
        if (response.status === 401) {
          sessionStorage.removeItem("ld_owner_portal");
          navigate("/owner/login", { replace: true });
          return;
        }
        if (!response.ok) throw new Error("Unable to load firms from the server.");
        const result = await response.json();
        if (active) {
          setFirmList(result.data || []);
          setApiError("");
        }
      } catch {
        if (active) setApiError("Showing local data. Start the backend to sync with MongoDB.");
      } finally {
        if (active) setLoadingFirms(false);
      }
    };
    loadFirms();
    return () => {
      active = false;
    };
  }, []);

  const logout = () => {
    fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    sessionStorage.removeItem("ld_owner_portal");
    navigate("/owner/login");
  };

  const submitFirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newFirm.name.trim();
    const owner = newFirm.owner.trim();
    const email = newFirm.email.trim();
    if (!name || !owner || !email) {
      setFormError("Firm name, owner name, and email are required.");
      return;
    }
    if (firmList.some((firm) => firm.email.toLowerCase() === email.toLowerCase())) {
      setFormError("A firm with this owner email already exists.");
      return;
    }
    const seatsTotal = planSeats[newFirm.plan];
    const createFirm = async () => {
      try {
        const response = await fetch("/api/v1/owner/firms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name, owner, email, plan: newFirm.plan }),
        });
        const result = await response.json();
        if (response.status === 401) {
          sessionStorage.removeItem("ld_owner_portal");
          navigate("/owner/login", { replace: true });
          return;
        }
        if (!response.ok) throw new Error(result.message || "Unable to create firm.");
        setFirmList((current) => [result.data.firm, ...current]);
        setNewFirm({ name: "", owner: "", email: "", plan: "Solo Counsel" });
        setFormError("");
        setApiError("");
        setCredentials({
          firmName: result.data.firm.name,
          owner: result.data.firm.owner,
          email: result.data.firm.email,
          temporaryPassword: result.data.temporaryPassword,
        });
        setShowNewFirm(false);
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Unable to create firm.");
      }
    };
    createFirm();
  };

  const toggleFirmStatus = async (firm: Firm) => {
    const nextStatus = firm.status === "Suspended" ? "Active" : "Suspended";
    try {
      const response = await fetch(`/api/v1/owner/firms/${firm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.message || "Failed to update firm status");
      }
    } catch {
      // Local fallback for offline simulation
    }
    setFirmList((current) =>
      current.map((item) =>
        item.id === firm.id ? { ...item, status: nextStatus } : item
      )
    );
  };

  const renewMonthly = async (firm: Firm) => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const renewalFormatted = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    try {
      const response = await fetch(`/api/v1/owner/firms/${firm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ renewMonthly: true }),
      });
      if (response.ok) {
        const res = await response.json();
        if (res.data?.renewal) {
          setFirmList((current) =>
            current.map((item) =>
              item.id === firm.id
                ? { ...item, status: "Active", renewal: res.data.renewal }
                : item
            )
          );
          return;
        }
      }
    } catch {
      // Local fallback for offline simulation
    }
    setFirmList((current) =>
      current.map((item) =>
        item.id === firm.id
          ? { ...item, status: "Active", renewal: renewalFormatted }
          : item
      )
    );
  };

  const openFirmTeam = async (firm: Firm) => {
    setSelectedFirmForTeam(firm);
    setProvisionedCreds(null);
    setLawyerFormError("");
    setLoadingLawyers(true);
    try {
      const res = await fetch(`/api/v1/owner/firms/${firm.id}/users`, { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.data) {
        setFirmLawyers(
          json.data.map((u: any) => ({
            id: u._id || u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.isActive !== false ? (u.mustChangePassword ? "Pending" : "Active") : "Revoked",
          }))
        );
      } else {
        setFirmLawyers([
          { id: "admin-1", name: firm.owner, email: firm.email, role: "FIRM_ADMIN", status: "Active" },
        ]);
      }
    } catch {
      setFirmLawyers([
        { id: "admin-1", name: firm.owner, email: firm.email, role: "FIRM_ADMIN", status: "Active" },
      ]);
    } finally {
      setLoadingLawyers(false);
    }
  };

  const addLawyerToFirm = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFirmForTeam) return;
    if (!newLawyerForm.name.trim() || !newLawyerForm.email.trim()) {
      setLawyerFormError("Lawyer name and email are required.");
      return;
    }
    setLawyerFormError("");
    try {
      const res = await fetch(`/api/v1/owner/firms/${selectedFirmForTeam.id}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newLawyerForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to provision lawyer");

      setFirmLawyers((prev) => [json.data.user, ...prev]);
      setProvisionedCreds({
        name: json.data.user.name,
        email: json.data.user.email,
        temporaryPassword: json.data.temporaryPassword,
      });
      setFirmList((prev) =>
        prev.map((f) =>
          f.id === selectedFirmForTeam.id ? { ...f, seatsUsed: json.data.seatsUsed } : f
        )
      );
      setSelectedFirmForTeam((prev) =>
        prev ? { ...prev, seatsUsed: json.data.seatsUsed } : null
      );
      setNewLawyerForm({ name: "", email: "", role: "ATTORNEY" });
    } catch (err) {
      setLawyerFormError(err instanceof Error ? err.message : "Failed to provision lawyer");
    }
  };

  return (
    <main className="owner-portal">
      <OwnerSidebar />
      <section className="owner-main">
        <header className="owner-topbar">
          <div>
            <span className="owner-kicker">Wednesday, 19 August 2026</span>
            <h1>Good evening, owner.</h1>
          </div>
          <div className="owner-top-actions">
            <span className="owner-live">
              <i /> System operational
            </span>
            <button className="owner-avatar" type="button">
              PA
            </button>
          </div>
        </header>
        <div className="owner-content">
          <section className="owner-welcome">
            <div>
              <span className="owner-kicker">Your business at a glance</span>
              <h2>
                The firms using
                <br />
                <em>Lawyers Diary.</em>
              </h2>
              <p>
                Provision access only after a plan is confirmed. Each firm
                receives its own private workspace, users, and data boundary.
              </p>
            </div>
            <button
              className="button button-primary"
              type="button"
              onClick={() => setShowNewFirm(true)}
            >
              <Plus size={16} /> Add subscribed firm
            </button>
          </section>
          <div className="owner-stats">
            <div>
              <span>Active firms</span>
              <strong>{activeFirms}</strong>
              <small>
                <ArrowUpRight size={14} /> 3 this month
              </small>
            </div>
            <div>
              <span>Paid seats</span>
              <strong>{paidSeats}</strong>
              <small>of {provisionedSeats} provisioned</small>
            </div>
            <div>
              <span>Monthly recurring</span>
              <strong>₹{monthlyRecurring.toLocaleString("en-IN")}</strong>
              <small>Across all plans</small>
            </div>
            <div>
              <span>Renewals this week</span>
              <strong>{String(renewalsThisWeek).padStart(2, "0")}</strong>
              <small>Action required</small>
            </div>
          </div>
          {apiError && <p className="owner-login-error">{apiError}</p>}
          <section className="owner-table-panel" id="overview">
            <div className="owner-table-head">
              <div>
                <span className="owner-kicker">Customer workspaces</span>
                <h2>Subscribed firms</h2>
              </div>
              <label className="owner-search">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search firms"
                />
              </label>
            </div>
            <div className="owner-table">
              <div className="owner-table-row owner-table-label">
                <span>Firm</span>
                <span>Plan</span>
                <span>Seats</span>
                <span>Status</span>
                <span>Renewal</span>
                <span>Actions</span>
              </div>
              {loadingFirms && <p>Loading subscribed firms...</p>}
              {!loadingFirms && visibleFirms.map((firm) => (
                <div className="owner-table-row" key={firm.id}>
                  <div className="firm-cell">
                    <span>{firm.name.slice(0, 1)}</span>
                    <div>
                      <strong>{firm.name}</strong>
                      <small>{firm.owner}</small>
                    </div>
                  </div>
                  <span className="owner-plan">{firm.plan}</span>
                  <span className="owner-seats-pill">
                    {firm.seatsUsed} / {firm.seatsTotal}
                  </span>
                  <span className={`firm-status ${firm.status.toLowerCase()}`}>
                    {firm.status}
                  </span>
                  <span>{firm.renewal}</span>
                  <div className="owner-row-actions">
                    <button
                      type="button"
                      className={`owner-row-btn ${firm.status === "Suspended" ? "activate" : "suspend"}`}
                      onClick={() => toggleFirmStatus(firm)}
                      title={firm.status === "Suspended" ? "Reactivate firm subscription" : "Suspend firm access"}
                    >
                      {firm.status === "Suspended" ? "Activate" : "Suspend"}
                    </button>
                    <button
                      type="button"
                      className="owner-row-btn renew"
                      onClick={() => renewMonthly(firm)}
                      title="Record monthly renewal payment (+30 days)"
                    >
                      +30d
                    </button>
                    <button
                      className="owner-more"
                      type="button"
                      onClick={() => openFirmTeam(firm)}
                      title="Manage lawyer accounts"
                    >
                      <UsersRound size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="owner-action-grid" id="access">
            <article>
              <KeyRound size={19} />
              <h3>Provision lawyer access</h3>
              <p>
                Create named accounts for a paid firm and hand over temporary
                credentials securely.
              </p>
              <button
                type="button"
                className="owner-inline-action"
                onClick={() => {
                  if (visibleFirms[0]) openFirmTeam(visibleFirms[0]);
                }}
              >
                Open access manager <ArrowUpRight size={15} />
              </button>
            </article>
            <article id="billing">
              <CreditCard size={19} />
              <h3>Keep subscriptions current</h3>
              <p>
                Track renewals, plan changes, and the number of seats each
                subscribed firm is using.
              </p>
              <button type="button" onClick={() => setShowNewFirm(true)}>
                Record a subscription <ArrowUpRight size={15} />
              </button>
            </article>
          </section>
        </div>
      </section>
      {showNewFirm && (
        <div
          className="owner-modal-backdrop"
          role="presentation"
          onClick={() => setShowNewFirm(false)}
        >
          <form
            className="owner-modal"
            role="dialog"
            aria-modal="true"
            onSubmit={submitFirm}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="owner-kicker">New customer</span>
            <h2>Add a subscribed firm</h2>
            <p>
              Record the commercial relationship first, then provision the firm
              owner and seats.
            </p>
            <label>
              Firm name
              <input
                value={newFirm.name}
                onChange={(event) => setNewFirm({ ...newFirm, name: event.target.value })}
                placeholder="e.g. Mehta & Partners"
              />
            </label>
            <label>
              Owner email
              <input
                type="email"
                value={newFirm.email}
                onChange={(event) => setNewFirm({ ...newFirm, email: event.target.value })}
                placeholder="owner@firm.com"
              />
            </label>
            <label>
              Owner name
              <input
                value={newFirm.owner}
                onChange={(event) => setNewFirm({ ...newFirm, owner: event.target.value })}
                placeholder="e.g. Ananya Mehta"
              />
            </label>
            <label>
              Plan
              <select
                value={newFirm.plan}
                onChange={(event) => setNewFirm({ ...newFirm, plan: event.target.value })}
              >
                <option>Solo Counsel</option>
                <option>Chambers</option>
                <option>Firm Office</option>
              </select>
            </label>
            {formError && <p className="owner-login-error">{formError}</p>}
            <button
              className="button button-primary"
              type="submit"
            >
              Save firm and continue <ArrowUpRight size={16} />
            </button>
          </form>
        </div>
      )}
      {credentials && (
        <div
          className="owner-modal-backdrop"
          role="presentation"
          onClick={() => setCredentials(null)}
        >
          <section
            className="owner-modal owner-credentials-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="credentials-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="owner-kicker">Share securely</span>
            <h2 id="credentials-title">Owner login created</h2>
            <p>
              These credentials are shown once. Share them privately and ask the owner to change the password after signing in.
            </p>
            <div className="owner-credential-box">
              <span>Firm</span>
              <strong>{credentials.firmName}</strong>
              <span>Owner</span>
              <strong>{credentials.owner}</strong>
              <span>Login email</span>
              <strong>{credentials.email}</strong>
              <span>Temporary password</span>
              <strong className="owner-temporary-password">{credentials.temporaryPassword}</strong>
            </div>
            <div className="owner-credential-actions">
              <button
                className="button button-primary"
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Lawyers Diary login\nFirm: ${credentials.firmName}\nEmail: ${credentials.email}\nTemporary password: ${credentials.temporaryPassword}`,
                  );
                }}
              >
                Copy credentials
              </button>
              <button className="owner-secondary-button" type="button" onClick={() => setCredentials(null)}>
                Done
              </button>
            </div>
          </section>
        </div>
      )}
      {selectedFirmForTeam && (
        <div
          className="owner-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedFirmForTeam(null)}
        >
          <div
            className="owner-modal owner-credentials-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: "560px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className="owner-kicker">{selectedFirmForTeam.name}</span>
                <h2>Firm Lawyers & Seats</h2>
                <p>
                  {selectedFirmForTeam.plan} Plan · <strong>{selectedFirmForTeam.seatsUsed}</strong> of <strong>{selectedFirmForTeam.seatsTotal}</strong> seats provisioned
                </p>
              </div>
              <button
                type="button"
                className="owner-more"
                onClick={() => setSelectedFirmForTeam(null)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div style={{ margin: "1rem 0", display: "grid", gap: "0.5rem" }}>
              <span className="owner-kicker">Accounts with Access</span>
              {loadingLawyers ? (
                <p>Loading accounts...</p>
              ) : firmLawyers.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "0.78rem" }}>No lawyer accounts yet.</p>
              ) : (
                firmLawyers.map((lawyer) => (
                  <div
                    key={lawyer.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.6rem 0.8rem",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "0.78rem",
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", color: "#17324d" }}>{lawyer.name}</strong>
                      <span style={{ color: "#64748b", fontSize: "0.72rem" }}>{lawyer.email} · {lawyer.role}</span>
                    </div>
                    <span className={`firm-status ${lawyer.status.toLowerCase()}`}>
                      {lawyer.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            {selectedFirmForTeam.seatsUsed >= selectedFirmForTeam.seatsTotal ? (
              <div
                style={{
                  padding: "0.75rem",
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "6px",
                  color: "#92400e",
                  fontSize: "0.76rem",
                }}
              >
                Seat quota full ({selectedFirmForTeam.seatsUsed}/{selectedFirmForTeam.seatsTotal}). To provision additional lawyers, upgrade this firm's monthly subscription plan.
              </div>
            ) : (
              <form onSubmit={addLawyerToFirm} style={{ display: "grid", gap: "0.75rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                <span className="owner-kicker">Add Lawyer for this Firm</span>
                <label>
                  Full name
                  <input
                    required
                    placeholder="e.g. Adv. Raman Sharma"
                    value={newLawyerForm.name}
                    onChange={(e) => setNewLawyerForm({ ...newLawyerForm, name: e.target.value })}
                  />
                </label>
                <label>
                  Work email
                  <input
                    required
                    type="email"
                    placeholder="raman@firm.com"
                    value={newLawyerForm.email}
                    onChange={(e) => setNewLawyerForm({ ...newLawyerForm, email: e.target.value })}
                  />
                </label>
                <label>
                  Role
                  <select
                    value={newLawyerForm.role}
                    onChange={(e) => setNewLawyerForm({ ...newLawyerForm, role: e.target.value })}
                  >
                    <option value="ATTORNEY">Attorney</option>
                    <option value="PARALEGAL">Paralegal</option>
                    <option value="STAFF">Staff</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </label>
                {lawyerFormError && <p className="owner-login-error">{lawyerFormError}</p>}
                <button type="submit" className="button button-primary">
                  Provision Lawyer Credentials
                </button>
              </form>
            )}

            {provisionedCreds && (
              <div className="owner-credential-box" style={{ marginTop: "1rem" }}>
                <span>Account Created</span>
                <strong>{provisionedCreds.name} ({provisionedCreds.email})</strong>
                <span>Temporary Password</span>
                <strong className="owner-temporary-password">{provisionedCreds.temporaryPassword}</strong>
                <button
                  type="button"
                  className="button button-primary"
                  style={{ gridColumn: "1 / -1", marginTop: "0.5rem" }}
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Lawyers Diary login\nFirm: ${selectedFirmForTeam.name}\nEmail: ${provisionedCreds.email}\nTemporary password: ${provisionedCreds.temporaryPassword}\nFirst sign-in requires setting your permanent password.`
                    );
                  }}
                >
                  Copy Credentials Handoff
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
