import React, { FormEvent, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  KeyRound,
  Mail,
  Pencil,
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
  rawRenewalDate?: string;
  monthlyValue: number;
  lastPaymentDate?: string | null;
  lastPaymentAmount?: number | null;
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
    monthlyValue: 1599,
    lastPaymentDate: "2026-08-12",
    lastPaymentAmount: 1599,
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
    monthlyValue: 759,
    lastPaymentDate: "2026-08-28",
    lastPaymentAmount: 759,
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
    lastPaymentDate: null,
    lastPaymentAmount: null,
  },
];

const planSeats: Record<string, number> = {
  "Solo Counsel": 1,
  Chambers: 5,
  "Firm Office": 15,
  Custom: 20,
};

const planValue: Record<string, number> = {
  "Solo Counsel": 759,
  Chambers: 1599,
  "Firm Office": 2999,
  Custom: 4999,
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
    setupPasswordToken?: string;
    emailDelivery?: {
      sent: boolean;
      configured?: boolean;
      reason?: string;
      message?: string;
    };
  } | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // New firm form state (includes custom agreed monthly fee and seats)
  const [newFirm, setNewFirm] = useState({
    name: "",
    owner: "",
    email: "",
    plan: "Solo Counsel",
    seatsTotal: 1,
    monthlyValue: 759,
  });
  const [formError, setFormError] = useState("");

  // Lawyer access provisioning modal state
  const [selectedFirmForTeam, setSelectedFirmForTeam] = useState<Firm | null>(null);
  const [firmLawyers, setFirmLawyers] = useState<{ id: string; name: string; email: string; role: string; status: string }[]>([]);
  const [loadingLawyers, setLoadingLawyers] = useState(false);
  const [newLawyerForm, setNewLawyerForm] = useState({ name: "", email: "", role: "ATTORNEY" });
  const [lawyerFormError, setLawyerFormError] = useState("");
  const [provisionedCreds, setProvisionedCreds] = useState<{ name: string; email: string; temporaryPassword: string } | null>(null);

  // Manual payment recording modal state
  const [recordingPaymentFirm, setRecordingPaymentFirm] = useState<Firm | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "UPI",
    referenceNumber: "",
    periodMonths: 1,
    notes: "",
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState("");

  // Edit monthly fee & plan modal state
  const [editingPricingFirm, setEditingPricingFirm] = useState<Firm | null>(null);
  const [pricingForm, setPricingForm] = useState({
    plan: "Solo Counsel",
    monthlyValue: 0,
    seatsTotal: 1,
    status: "Active" as "Active" | "Trial" | "Suspended",
    renewalDate: "",
  });
  const [pricingSubmitting, setPricingSubmitting] = useState(false);
  const [pricingError, setPricingError] = useState("");

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
    .reduce((total, firm) => total + (firm.monthlyValue || 0), 0);
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

  const onPlanSelectChange = (selectedPlan: string) => {
    setNewFirm((prev) => ({
      ...prev,
      plan: selectedPlan,
      seatsTotal: planSeats[selectedPlan] || prev.seatsTotal,
      monthlyValue: planValue[selectedPlan] || prev.monthlyValue,
    }));
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

    const createFirm = async () => {
      try {
        const response = await fetch("/api/v1/owner/firms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name,
            owner,
            email,
            plan: newFirm.plan,
            seatsTotal: Number(newFirm.seatsTotal) || planSeats[newFirm.plan] || 1,
            monthlyValue: Number(newFirm.monthlyValue) || planValue[newFirm.plan] || 0,
          }),
        });
        const result = await response.json();
        if (response.status === 401) {
          sessionStorage.removeItem("ld_owner_portal");
          navigate("/owner/login", { replace: true });
          return;
        }
        if (!response.ok) throw new Error(result.message || "Unable to create firm.");
        setFirmList((current) => [result.data.firm, ...current]);
        setNewFirm({
          name: "",
          owner: "",
          email: "",
          plan: "Solo Counsel",
          seatsTotal: 1,
          monthlyValue: 7590,
        });
        setFormError("");
        setApiError("");
        setCredentials({
          firmName: result.data.firm.name,
          owner: result.data.firm.owner,
          email: result.data.firm.email,
          temporaryPassword: result.data.temporaryPassword,
          setupPasswordToken: result.data.setupPasswordToken,
          emailDelivery: result.data.emailDelivery,
        });
        setShowNewFirm(false);
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Unable to create firm.");
      }
    };
    createFirm();
  };

  const resendFirmInvite = async (firm: Firm) => {
    setResendingId(firm.id);
    try {
      const response = await fetch(`/api/v1/owner/firms/${firm.id}/resend-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to resend credentials");

      setCredentials({
        firmName: firm.name,
        owner: firm.owner,
        email: firm.email,
        temporaryPassword: result.data.temporaryPassword,
        setupPasswordToken: result.data.setupPasswordToken,
        emailDelivery: result.data.emailDelivery,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to dispatch email");
    } finally {
      setResendingId(null);
    }
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

  const openRecordPaymentModal = (firm: Firm) => {
    setRecordingPaymentFirm(firm);
    setPaymentError("");
    setPaymentSuccessMsg("");
    setPaymentForm({
      amount: firm.monthlyValue || planValue[firm.plan] || 0,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "UPI",
      referenceNumber: "",
      periodMonths: 1,
      notes: "",
    });
  };

  const submitRecordPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!recordingPaymentFirm) return;
    setPaymentSubmitting(true);
    setPaymentError("");

    try {
      const response = await fetch(`/api/v1/owner/firms/${recordingPaymentFirm.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(paymentForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to record payment");

      if (result.data?.firm) {
        setFirmList((current) =>
          current.map((f) => (f.id === recordingPaymentFirm.id ? result.data.firm : f))
        );
      }
      setPaymentSuccessMsg("Payment recorded! Subscription renewal date extended successfully.");
      setTimeout(() => {
        setRecordingPaymentFirm(null);
        setPaymentSuccessMsg("");
      }, 1200);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const openEditPricingModal = (firm: Firm) => {
    setEditingPricingFirm(firm);
    setPricingError("");
    const parsedDate = firm.rawRenewalDate
      ? new Date(firm.rawRenewalDate).toISOString().split("T")[0]
      : "";
    setPricingForm({
      plan: firm.plan,
      monthlyValue: firm.monthlyValue ?? planValue[firm.plan] ?? 0,
      seatsTotal: firm.seatsTotal ?? planSeats[firm.plan] ?? 1,
      status: firm.status,
      renewalDate: parsedDate,
    });
  };

  const submitUpdatePricing = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPricingFirm) return;
    setPricingSubmitting(true);
    setPricingError("");

    try {
      const response = await fetch(`/api/v1/owner/firms/${editingPricingFirm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          plan: pricingForm.plan,
          monthlyValue: Number(pricingForm.monthlyValue),
          seatsTotal: Number(pricingForm.seatsTotal),
          status: pricingForm.status,
          renewalDate: pricingForm.renewalDate || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to update firm pricing");

      const updatedFirm = result.data;
      setFirmList((current) =>
        current.map((f) => (f.id === editingPricingFirm.id ? updatedFirm : f))
      );
      setEditingPricingFirm(null);
    } catch (err) {
      setPricingError(err instanceof Error ? err.message : "Failed to update firm pricing");
    } finally {
      setPricingSubmitting(false);
    }
  };

  const renewMonthly = async (firm: Firm) => {
    openRecordPaymentModal(firm);
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
                <em>DexFora.</em>
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
                <span>Monthly Fee</span>
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
                  <div className="owner-fee-badge">
                    <span>₹{(firm.monthlyValue || 0).toLocaleString("en-IN")}/mo</span>
                    <button
                      type="button"
                      className="owner-fee-edit-btn"
                      onClick={() => openEditPricingModal(firm)}
                      title="Edit agreed monthly subscription rate"
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                  <span className={`firm-status ${firm.status.toLowerCase()}`}>
                    {firm.status}
                  </span>
                  <div>
                    <span>{firm.renewal}</span>
                    {firm.lastPaymentAmount ? (
                      <small style={{ color: "#16a34a", fontSize: "0.68rem", display: "block" }}>
                        Paid ₹{firm.lastPaymentAmount.toLocaleString("en-IN")}
                      </small>
                    ) : null}
                  </div>
                  <div className="owner-row-actions">
                    <button
                      type="button"
                      className="owner-row-btn paid"
                      onClick={() => openRecordPaymentModal(firm)}
                      title="Record offline payment received after connection/enquiry (+auto renew)"
                      style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}
                    >
                      <DollarSign size={11} />
                      <span>Paid</span>
                    </button>
                    <button
                      type="button"
                      className="owner-row-btn"
                      onClick={() => resendFirmInvite(firm)}
                      disabled={resendingId === firm.id}
                      title="Resend welcome email with temporary password & setup link via Gmail SMTP"
                      style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      <Mail size={12} />
                      <span>{resendingId === firm.id ? "Sending..." : "Invite"}</span>
                    </button>
                    <button
                      type="button"
                      className={`owner-row-btn ${firm.status === "Suspended" ? "activate" : "suspend"}`}
                      onClick={() => toggleFirmStatus(firm)}
                      title={firm.status === "Suspended" ? "Reactivate firm subscription" : "Suspend firm access"}
                    >
                      {firm.status === "Suspended" ? "Activate" : "Suspend"}
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
            style={{ maxWidth: "480px" }}
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
                required
              />
            </label>
            <label>
              Owner email
              <input
                type="email"
                value={newFirm.email}
                onChange={(event) => setNewFirm({ ...newFirm, email: event.target.value })}
                placeholder="owner@firm.com"
                required
              />
            </label>
            <label>
              Owner name
              <input
                value={newFirm.owner}
                onChange={(event) => setNewFirm({ ...newFirm, owner: event.target.value })}
                placeholder="e.g. Ananya Mehta"
                required
              />
            </label>
            <label>
              Plan
              <select
                value={newFirm.plan}
                onChange={(event) => onPlanSelectChange(event.target.value)}
              >
                <option value="Solo Counsel">Solo Counsel (1 seat)</option>
                <option value="Chambers">Chambers (5 seats)</option>
                <option value="Firm Office">Firm Office (15 seats)</option>
                <option value="Custom">Custom Enterprise Plan</option>
              </select>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label>
                Monthly Fee (₹)
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newFirm.monthlyValue}
                  onChange={(event) => setNewFirm({ ...newFirm, monthlyValue: Number(event.target.value) })}
                  placeholder="759"
                  required
                />
              </label>
              <label>
                Provisioned Seats
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newFirm.seatsTotal}
                  onChange={(event) => setNewFirm({ ...newFirm, seatsTotal: Number(event.target.value) })}
                  placeholder="1"
                  required
                />
              </label>
            </div>
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

      {/* Record Manual Payment Modal */}
      {recordingPaymentFirm && (
        <div
          className="owner-modal-backdrop"
          role="presentation"
          onClick={() => setRecordingPaymentFirm(null)}
        >
          <form
            className="owner-modal"
            role="dialog"
            aria-modal="true"
            onSubmit={submitRecordPayment}
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: "520px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className="owner-kicker">Manual Payment Inflow</span>
                <h2>Record Payment</h2>
                <p style={{ margin: "0.25rem 0 0" }}>
                  Firm: <strong>{recordingPaymentFirm.name}</strong> ({recordingPaymentFirm.plan})
                </p>
              </div>
              <button
                type="button"
                className="owner-more"
                onClick={() => setRecordingPaymentFirm(null)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 12px", borderRadius: "6px", fontSize: "0.78rem", color: "#475569" }}>
              <div>Agreed Monthly Rate: <strong>₹{(recordingPaymentFirm.monthlyValue || 0).toLocaleString("en-IN")}/mo</strong></div>
              <div>Current Renewal Date: <strong>{recordingPaymentFirm.renewal}</strong></div>
            </div>

            {paymentSuccessMsg && (
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "10px 14px", borderRadius: "6px", fontSize: "0.82rem", color: "#065f46" }}>
                ✓ {paymentSuccessMsg}
              </div>
            )}
            {paymentError && <p className="owner-login-error">{paymentError}</p>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label>
                Amount Paid (₹)
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                />
              </label>
              <label>
                Renewal Period
                <select
                  value={paymentForm.periodMonths}
                  onChange={(e) => setPaymentForm({ ...paymentForm, periodMonths: Number(e.target.value) })}
                >
                  <option value={1}>1 Month (+30 Days)</option>
                  <option value={3}>3 Months (+90 Days - Quarter)</option>
                  <option value={6}>6 Months (+180 Days)</option>
                  <option value={12}>12 Months (+365 Days - Annual)</option>
                </select>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label>
                Payment Method
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label>
                Payment Date
                <input
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                />
              </label>
            </div>

            <label>
              Transaction Ref / UTR
              <input
                placeholder="e.g. UPI Ref / UTR / Cheque No."
                value={paymentForm.referenceNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
              />
            </label>

            <label>
              Enquiry / Payment Notes
              <input
                placeholder="e.g. Paid after enquiry call; WhatsApp confirmation"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="owner-secondary-button"
                onClick={() => setRecordingPaymentFirm(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={paymentSubmitting}
              >
                {paymentSubmitting ? "Recording..." : "Record Payment & Advance Renewal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Pricing & Subscription Modal */}
      {editingPricingFirm && (
        <div
          className="owner-modal-backdrop"
          role="presentation"
          onClick={() => setEditingPricingFirm(null)}
        >
          <form
            className="owner-modal"
            role="dialog"
            aria-modal="true"
            onSubmit={submitUpdatePricing}
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: "480px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className="owner-kicker">Subscription & Pricing</span>
                <h2>Edit Monthly Fee</h2>
                <p style={{ margin: "0.25rem 0 0" }}>
                  Firm: <strong>{editingPricingFirm.name}</strong>
                </p>
              </div>
              <button
                type="button"
                className="owner-more"
                onClick={() => setEditingPricingFirm(null)}
                title="Close"
              >
                ✕
              </button>
            </div>

            {pricingError && <p className="owner-login-error">{pricingError}</p>}

            <label>
              Plan
              <select
                value={pricingForm.plan}
                onChange={(e) => {
                  const p = e.target.value;
                  setPricingForm({
                    ...pricingForm,
                    plan: p,
                    monthlyValue: planValue[p] !== undefined ? planValue[p] : pricingForm.monthlyValue,
                    seatsTotal: planSeats[p] !== undefined ? planSeats[p] : pricingForm.seatsTotal,
                  });
                }}
              >
                <option value="Solo Counsel">Solo Counsel</option>
                <option value="Chambers">Chambers</option>
                <option value="Firm Office">Firm Office</option>
                <option value="Custom">Custom Enterprise</option>
              </select>
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label>
                Monthly Rate (₹)
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={pricingForm.monthlyValue}
                  onChange={(e) => setPricingForm({ ...pricingForm, monthlyValue: Number(e.target.value) })}
                />
              </label>
              <label>
                Allocated Seats
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={pricingForm.seatsTotal}
                  onChange={(e) => setPricingForm({ ...pricingForm, seatsTotal: Number(e.target.value) })}
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label>
                Subscription Status
                <select
                  value={pricingForm.status}
                  onChange={(e) => setPricingForm({ ...pricingForm, status: e.target.value as any })}
                >
                  <option value="Active">Active</option>
                  <option value="Trial">Trial</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </label>
              <label>
                Renewal Date
                <input
                  type="date"
                  value={pricingForm.renewalDate}
                  onChange={(e) => setPricingForm({ ...pricingForm, renewalDate: e.target.value })}
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="owner-secondary-button"
                onClick={() => setEditingPricingFirm(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={pricingSubmitting}
              >
                {pricingSubmitting ? "Saving..." : "Save Pricing & Subscription"}
              </button>
            </div>
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
            <span className="owner-kicker">Subscription Provisioned</span>
            <h2 id="credentials-title">Firm Owner Access Created</h2>
            <p>
              Credentials and automated password creation link generated for the subscribed firm.
            </p>

            {/* Gmail SMTP delivery status */}
            {credentials.emailDelivery?.sent ? (
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "10px 14px", borderRadius: "8px", margin: "12px 0", fontSize: "0.82rem", color: "#065f46", display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={18} style={{ color: "#059669", flexShrink: 0 }} />
                <span>
                  <strong>Email Sent via Gmail SMTP:</strong> Welcome email with temporary password &amp; setup link dispatched to <strong>{credentials.email}</strong>.
                </span>
              </div>
            ) : (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "10px 14px", borderRadius: "8px", margin: "12px 0", fontSize: "0.82rem", color: "#92400e", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <Mail size={18} style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong>Email Delivery:</strong> {credentials.emailDelivery?.message || "Gmail SMTP App Password not configured in backend/.env"}.
                  <br />
                  <span style={{ color: "#78350f" }}>Please share the credentials or the direct setup link below with the firm owner.</span>
                </div>
              </div>
            )}

            <div className="owner-credential-box">
              <span>Firm</span>
              <strong>{credentials.firmName}</strong>
              <span>Owner</span>
              <strong>{credentials.owner}</strong>
              <span>Login email</span>
              <strong>{credentials.email}</strong>
              <span>Temporary password</span>
              <strong className="owner-temporary-password">{credentials.temporaryPassword}</strong>
              {credentials.setupPasswordToken && (
                <>
                  <span>Password Setup Link</span>
                  <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#1d4ed8", background: "#eff6ff", padding: "8px", borderRadius: "6px", border: "1px solid #bfdbfe", wordBreak: "break-all", userSelect: "all" }}>
                    {`${window.location.origin}/set-password?token=${credentials.setupPasswordToken}&email=${encodeURIComponent(credentials.email)}`}
                  </div>
                </>
              )}
            </div>
            <div className="owner-credential-actions" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
              <button
                className="button button-primary"
                type="button"
                onClick={() => {
                  const setupUrl = credentials.setupPasswordToken
                    ? `${window.location.origin}/set-password?token=${credentials.setupPasswordToken}&email=${encodeURIComponent(credentials.email)}`
                    : `${window.location.origin}/login?email=${encodeURIComponent(credentials.email)}`;
                  navigator.clipboard.writeText(
                    `DexFora Practice Management Access\nFirm: ${credentials.firmName}\nEmail: ${credentials.email}\nTemporary password: ${credentials.temporaryPassword}\nCreate your permanent password: ${setupUrl}`,
                  );
                  alert("Credentials and setup link copied to clipboard!");
                }}
              >
                Copy credentials &amp; link
              </button>
              {credentials.setupPasswordToken && (
                <button
                  className="owner-secondary-button"
                  type="button"
                  onClick={() => {
                    const setupUrl = `${window.location.origin}/set-password?token=${credentials.setupPasswordToken}&email=${encodeURIComponent(credentials.email)}`;
                    navigator.clipboard.writeText(setupUrl);
                    alert("Password setup link copied to clipboard!");
                  }}
                >
                  Copy Link Only
                </button>
              )}
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
                      `DexFora login\nFirm: ${selectedFirmForTeam.name}\nEmail: ${provisionedCreds.email}\nTemporary password: ${provisionedCreds.temporaryPassword}\nFirst sign-in requires setting your permanent password.`
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
