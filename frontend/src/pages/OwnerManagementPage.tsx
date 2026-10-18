import React, { FormEvent, useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  KeyRound,
  Mail,
  Pencil,
  Search,
  Settings2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { OwnerSidebar } from "../components/owner/OwnerSidebar";

type Section = "access" | "billing" | "settings";

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

type PaymentRecord = {
  _id: string;
  firmName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  periodMonths: number;
  notes?: string;
};

type EnquiryRecord = {
  _id: string;
  name: string;
  firm: string;
  email: string;
  phone?: string;
  plan: string;
  message: string;
  createdAt: string;
  emailSentToAdmin?: boolean;
};

type BillingOverviewData = {
  totalMRR: number;
  annualRunRate: number;
  totalCollected: number;
  activeFirmsCount: number;
  renewalsNext7Days: number;
  enquiriesCount?: number;
  firms: Firm[];
  recentPayments: PaymentRecord[];
  recentEnquiries?: EnquiryRecord[];
};

const content: Record<Section, { kicker: string; title: string; description: string }> = {
  access: {
    kicker: "Secure account delivery",
    title: "Provision access for subscribed firms",
    description: "Create and manage named lawyer accounts after a firm subscription is confirmed.",
  },
  billing: {
    kicker: "Revenue & Finance Operations",
    title: "Billing & Revenue Hub",
    description: "Manage monthly subscriber retainers, record manual offline payments, and track revenue inflow.",
  },
  settings: {
    kicker: "Platform controls",
    title: "Platform settings",
    description: "Keep owner policies and platform defaults ready for the firms using DexFora.",
  },
};

export const OwnerManagementPage: React.FC = () => {
  const location = useLocation();
  const section: Section = (location.pathname.split("/").pop() as Section) || "access";
  const current = content[section] || content.access;
  const Icon = section === "access" ? KeyRound : section === "billing" ? CreditCard : Settings2;

  // SMTP Settings test state
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpResult, setSmtpResult] = useState<{ connected: boolean; configured: boolean; message: string } | null>(null);

  // Billing overview data state
  const [billingData, setBillingData] = useState<BillingOverviewData | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [firmSearch, setFirmSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");

  // Record Payment Modal State
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

  // Edit Pricing Modal State
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

  const testSmtp = async () => {
    setTestingSmtp(true);
    setSmtpResult(null);
    try {
      const res = await fetch("/api/v1/owner/test-smtp", { credentials: "include" });
      const json = await res.json();
      setSmtpResult(json.data || { connected: false, configured: false, message: json.message || "Failed to check SMTP" });
    } catch (err) {
      setSmtpResult({
        connected: false,
        configured: false,
        message: err instanceof Error ? err.message : "Network error testing SMTP",
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  const loadBillingOverview = async () => {
    if (section !== "billing") return;
    setLoadingBilling(true);
    setBillingError("");
    try {
      const res = await fetch("/api/v1/owner/billing-overview", { credentials: "include" });
      if (!res.ok) throw new Error("Unable to load billing data.");
      const json = await res.json();
      setBillingData(json.data);
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : "Failed to load billing metrics");
    } finally {
      setLoadingBilling(false);
    }
  };

  useEffect(() => {
    if (section === "billing") {
      loadBillingOverview();
    }
  }, [section]);

  const openRecordPaymentModal = (firm: Firm) => {
    setRecordingPaymentFirm(firm);
    setPaymentError("");
    setPaymentSuccessMsg("");
    setPaymentForm({
      amount: firm.monthlyValue || 0,
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

      setPaymentSuccessMsg("Payment recorded! Subscription renewal date extended successfully.");
      loadBillingOverview();
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
      monthlyValue: firm.monthlyValue ?? 0,
      seatsTotal: firm.seatsTotal ?? 1,
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

      setEditingPricingFirm(null);
      loadBillingOverview();
    } catch (err) {
      setPricingError(err instanceof Error ? err.message : "Failed to update firm pricing");
    } finally {
      setPricingSubmitting(false);
    }
  };

  const exportPaymentsCsv = () => {
    if (!billingData?.recentPayments || billingData.recentPayments.length === 0) {
      alert("No payment records available to export.");
      return;
    }

    const headers = ["Date", "Firm Name", "Amount (INR)", "Payment Method", "Reference / UTR", "Period (Months)", "Notes"];
    const rows = billingData.recentPayments.map((p) => [
      `"${new Date(p.paymentDate).toLocaleDateString("en-IN")}"`,
      `"${p.firmName || ""}"`,
      p.amount,
      `"${p.paymentMethod}"`,
      `"${p.referenceNumber || ""}"`,
      p.periodMonths,
      `"${(p.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dexfora_revenue_ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredFirms = (billingData?.firms || []).filter((f) =>
    `${f.name} ${f.owner} ${f.plan}`.toLowerCase().includes(firmSearch.toLowerCase())
  );

  const filteredPayments = (billingData?.recentPayments || []).filter((p) =>
    `${p.firmName} ${p.paymentMethod} ${p.referenceNumber || ""} ${p.notes || ""}`
      .toLowerCase()
      .includes(paymentSearch.toLowerCase())
  );

  return (
    <main className="owner-portal">
      <OwnerSidebar />
      <section className="owner-main">
        <header className="owner-topbar">
          <div>
            <span className="owner-kicker">DexFora Platform Console</span>
            <h1>{section === "billing" ? "Finance & Subscriptions" : "Owner workspace"}</h1>
          </div>
          <span className="owner-live">
            <i /> System operational
          </span>
        </header>

        <div className="owner-content">
          <section className="owner-welcome">
            <div>
              <span className="owner-kicker">{current.kicker}</span>
              <h2>{current.title}</h2>
              <p>{current.description}</p>
            </div>
            <Icon className="owner-section-icon" size={34} strokeWidth={1.4} />
          </section>

          {/* ============================================================
              BILLING & REVENUE OPERATIONS HUB
             ============================================================ */}
          {section === "billing" && (
            <div className="owner-billing-container">
              {/* Financial KPI Cards */}
              <div className="owner-billing-kpis">
                <div className="owner-kpi-card green">
                  <span className="owner-kpi-label">Monthly Recurring (MRR)</span>
                  <span className="owner-kpi-value">
                    ₹{(billingData?.totalMRR || 0).toLocaleString("en-IN")}
                  </span>
                  <span className="owner-kpi-sub">
                    <TrendingUp size={14} style={{ color: "#10b981" }} /> Across active subscribers
                  </span>
                </div>

                <div className="owner-kpi-card purple">
                  <span className="owner-kpi-label">Annualized Run Rate (ARR)</span>
                  <span className="owner-kpi-value">
                    ₹{(billingData?.annualRunRate || 0).toLocaleString("en-IN")}
                  </span>
                  <span className="owner-kpi-sub">
                    <Clock size={14} style={{ color: "#8b5cf6" }} /> 12-month projected value
                  </span>
                </div>

                <div className="owner-kpi-card">
                  <span className="owner-kpi-label">Total Realized Inflow</span>
                  <span className="owner-kpi-value">
                    ₹{(billingData?.totalCollected || 0).toLocaleString("en-IN")}
                  </span>
                  <span className="owner-kpi-sub">
                    <DollarSign size={14} style={{ color: "#008cff" }} /> Offline &amp; manual receipts
                  </span>
                </div>

                <div className={`owner-kpi-card ${billingData?.renewalsNext7Days ? "amber" : ""}`}>
                  <span className="owner-kpi-label">Renewals Due (Next 7 Days)</span>
                  <span className="owner-kpi-value">
                    {String(billingData?.renewalsNext7Days || 0).padStart(2, "0")}
                  </span>
                  <span className="owner-kpi-sub">
                    <Calendar size={14} style={{ color: "#f59e0b" }} /> Subscribers to connect with
                  </span>
                </div>
              </div>

              {billingError && <p className="owner-login-error">{billingError}</p>}

              {/* Subscribed Firms & Monthly Pricing Directory */}
              <section className="owner-table-panel">
                <div className="owner-table-head">
                  <div>
                    <span className="owner-kicker">Subscribed Workspaces</span>
                    <h2>Monthly Retainers &amp; Renewals</h2>
                  </div>
                  <label className="owner-search">
                    <Search size={16} />
                    <input
                      value={firmSearch}
                      onChange={(e) => setFirmSearch(e.target.value)}
                      placeholder="Search firms or plans"
                    />
                  </label>
                </div>

                <div className="owner-table">
                  <div className="owner-billing-table-row header">
                    <span>Firm &amp; Owner</span>
                    <span>Plan &amp; Seats</span>
                    <span>Monthly Rate</span>
                    <span>Last Payment</span>
                    <span>Renewal Date</span>
                    <span style={{ textAlign: "right" }}>Actions</span>
                  </div>

                  {loadingBilling && <p style={{ padding: "1rem" }}>Loading financial data...</p>}

                  {!loadingBilling && filteredFirms.length === 0 && (
                    <p style={{ padding: "1rem", color: "#64748b" }}>No firms matched your search.</p>
                  )}

                  {!loadingBilling &&
                    filteredFirms.map((firm) => (
                      <div className="owner-billing-table-row" key={firm.id}>
                        <div className="firm-cell">
                          <span>{firm.name.slice(0, 1)}</span>
                          <div>
                            <strong>{firm.name}</strong>
                            <small>{firm.owner}</small>
                          </div>
                        </div>

                        <div>
                          <strong style={{ color: "#0047d9" }}>{firm.plan}</strong>
                          <div style={{ color: "#64748b", fontSize: "0.7rem" }}>
                            {firm.seatsUsed} of {firm.seatsTotal} seats
                          </div>
                        </div>

                        <div className="owner-fee-badge">
                          <span>₹{(firm.monthlyValue || 0).toLocaleString("en-IN")}/mo</span>
                          <button
                            type="button"
                            className="owner-fee-edit-btn"
                            onClick={() => openEditPricingModal(firm)}
                            title="Edit agreed monthly retainer"
                          >
                            <Pencil size={12} />
                          </button>
                        </div>

                        <div>
                          {firm.lastPaymentAmount ? (
                            <>
                              <strong style={{ color: "#16a34a" }}>
                                ₹{firm.lastPaymentAmount.toLocaleString("en-IN")}
                              </strong>
                              <div style={{ color: "#64748b", fontSize: "0.68rem" }}>
                                {firm.lastPaymentDate
                                  ? new Date(firm.lastPaymentDate).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                    })
                                  : "Recorded"}
                              </div>
                            </>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "0.72rem" }}>No payments yet</span>
                          )}
                        </div>

                        <div>
                          <strong>{firm.renewal}</strong>
                          <div style={{ color: "#64748b", fontSize: "0.68rem" }}>
                            Status: <span className={`firm-status ${firm.status.toLowerCase()}`}>{firm.status}</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="owner-row-btn paid"
                            onClick={() => openRecordPaymentModal(firm)}
                            title="Record offline payment received after connection/enquiry (+30 days)"
                            style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}
                          >
                            <DollarSign size={11} />
                            <span>Paid</span>
                          </button>
                          <button
                            type="button"
                            className="owner-row-btn"
                            onClick={() => openEditPricingModal(firm)}
                            title="Edit monthly fee or seats"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </section>

              {/* Offline Payment Ledger & History */}
              <section className="owner-table-panel">
                <div className="owner-table-head">
                  <div>
                    <span className="owner-kicker">Financial Ledger</span>
                    <h2>Recorded Payments &amp; Receipts</h2>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <label className="owner-search">
                      <Search size={16} />
                      <input
                        value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        placeholder="Search ref or firm"
                      />
                    </label>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={exportPaymentsCsv}
                      style={{ padding: "0.45rem 0.8rem", fontSize: "0.76rem", display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      <ArrowDownToLine size={14} /> Export CSV
                    </button>
                  </div>
                </div>

                <div className="owner-table">
                  <div className="owner-payment-ledger-row header">
                    <span>Date</span>
                    <span>Firm Name</span>
                    <span>Amount</span>
                    <span>Method</span>
                    <span>Reference / UTR</span>
                    <span>Period</span>
                    <span>Notes</span>
                  </div>

                  {!billingData?.recentPayments || billingData.recentPayments.length === 0 ? (
                    <p style={{ padding: "1.2rem", color: "#64748b", fontSize: "0.78rem" }}>
                      No manual payments recorded yet. Click "Paid" on any firm above to record an offline payment.
                    </p>
                  ) : filteredPayments.length === 0 ? (
                    <p style={{ padding: "1.2rem", color: "#64748b", fontSize: "0.78rem" }}>
                      No payments matched your search query.
                    </p>
                  ) : (
                    filteredPayments.map((payment) => (
                      <div className="owner-payment-ledger-row" key={payment._id}>
                        <span>{new Date(payment.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        <strong style={{ color: "#071b49" }}>{payment.firmName}</strong>
                        <strong style={{ color: "#16a34a" }}>₹{payment.amount.toLocaleString("en-IN")}</strong>
                        <span>
                          <span className={`owner-method-pill ${payment.paymentMethod === "UPI" ? "upi" : payment.paymentMethod === "Bank Transfer" ? "bank" : ""}`}>
                            {payment.paymentMethod}
                          </span>
                        </span>
                        <span style={{ fontFamily: "monospace", fontSize: "0.74rem", color: "#334155" }}>
                          {payment.referenceNumber || "—"}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          +{payment.periodMonths * 30} days ({payment.periodMonths} mo)
                        </span>
                        <span style={{ color: "#64748b", fontSize: "0.72rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={payment.notes}>
                          {payment.notes || "—"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Incoming Enquiries & Leads from Landing Page */}
              <section className="owner-table-panel">
                <div className="owner-table-head">
                  <div>
                    <span className="owner-kicker">Commercial Inbound Leads</span>
                    <h2>Landing Page Enquiries ({billingData?.recentEnquiries?.length || 0})</h2>
                  </div>
                  <div style={{ color: "#64748b", fontSize: "0.78rem" }}>
                    Emails dispatched to <strong>dexforaofficial@gmail.com</strong>
                  </div>
                </div>

                <div className="owner-table">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 1.6fr 1.6fr 1.1fr 2fr 110px",
                      gap: "0.8rem",
                      alignItems: "center",
                      padding: "0.8rem 0.6rem",
                      color: "#8b979d",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      minWidth: "860px",
                    }}
                  >
                    <span>Date</span>
                    <span>Advocate &amp; Firm</span>
                    <span>Contact Info</span>
                    <span>Requested Plan</span>
                    <span>Message</span>
                    <span style={{ textAlign: "right" }}>Action</span>
                  </div>

                  {!billingData?.recentEnquiries || billingData.recentEnquiries.length === 0 ? (
                    <p style={{ padding: "1.2rem", color: "#64748b", fontSize: "0.78rem" }}>
                      No prospective subscriber enquiries received yet.
                    </p>
                  ) : (
                    billingData.recentEnquiries.map((enq) => (
                      <div
                        key={enq._id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.2fr 1.6fr 1.6fr 1.1fr 2fr 110px",
                          gap: "0.8rem",
                          alignItems: "center",
                          padding: "0.8rem 0.6rem",
                          borderTop: "1px solid #edf0ee",
                          color: "#475569",
                          fontSize: "0.78rem",
                          minWidth: "860px",
                        }}
                      >
                        <div>
                          <span>
                            {new Date(enq.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <small style={{ display: "block", color: "#94a3b8", fontSize: "0.68rem" }}>
                            {new Date(enq.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </small>
                        </div>
                        <div>
                          <strong style={{ color: "#071b49", display: "block" }}>{enq.name}</strong>
                          <span style={{ color: "#64748b", fontSize: "0.72rem" }}>{enq.firm}</span>
                        </div>
                        <div>
                          <a
                            href={`mailto:${enq.email}`}
                            style={{ color: "#0047d9", textDecoration: "none", fontWeight: 600, display: "block" }}
                          >
                            {enq.email}
                          </a>
                          {enq.phone && (
                            <small style={{ color: "#64748b", fontSize: "0.68rem" }}>📞 {enq.phone}</small>
                          )}
                        </div>
                        <div>
                          <span
                            className="owner-seats-pill"
                            style={{ background: "#e0f2fe", color: "#0369a1", borderColor: "#bae6fd" }}
                          >
                            {enq.plan}
                          </span>
                        </div>
                        <div
                          style={{
                            color: "#334155",
                            fontSize: "0.75rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={enq.message}
                        >
                          {enq.message}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <a
                            href={`mailto:${enq.email}?subject=DexFora%20Practice%20Management%20%E2%80%94%20Connecting%20regarding%20your%20enquiry&body=Dear%20${encodeURIComponent(enq.name)},%0A%0AThank%20you%20for%20reaching%20out%20to%20DexFora.`}
                            className="owner-row-btn"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              textDecoration: "none",
                            }}
                          >
                            <Mail size={12} /> Reply
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Enquiry & Commercial Guide Note */}
              <article style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "1.2rem 1.4rem", borderRadius: "8px", fontSize: "0.82rem", color: "#475569" }}>
                <strong style={{ display: "block", color: "#071b49", marginBottom: "0.3rem", fontSize: "0.9rem" }}>
                  💡 How Subscriber Finance &amp; Manual Updates Work:
                </strong>
                <ul style={{ paddingLeft: "1.2rem", margin: "0.4rem 0 0", display: "grid", gap: "0.35rem" }}>
                  <li>
                    <strong>Enquiry &amp; Deal Confirmation:</strong> When an advocate or firm connects, agree on custom pricing and seats for their practice.
                  </li>
                  <li>
                    <strong>Direct Monthly Fee Adjustment:</strong> Click the <Pencil size={12} style={{ display: "inline" }} /> button anytime next to a firm's monthly rate to modify their negotiated price or allocated seats.
                  </li>
                  <li>
                    <strong>Offline Payment Recording:</strong> Once they transfer funds via UPI, Bank Transfer (NEFT/IMPS), or Cheque, click <strong>💵 Paid</strong> to log the transaction, save notes/UTR, and automatically advance their renewal date by 30, 90, 180, or 365 days.
                  </li>
                </ul>
              </article>
            </div>
          )}

          {/* ============================================================
              OTHER SECTIONS (ACCESS & SETTINGS)
             ============================================================ */}
          {section !== "billing" && (
            <section className="owner-action-grid">
              <article>
                <ShieldCheck size={19} />
                <h3>Owner controls are protected</h3>
                <p>Only authenticated Super Admin sessions can access this platform area.</p>
                <Link to="/owner">
                  Return to firms <ArrowUpRight size={15} />
                </Link>
              </article>
              {section === "access" && (
                <article>
                  <KeyRound size={19} />
                  <h3>Open the access manager</h3>
                  <p>Provision individual lawyer credentials inside the selected firm workspace.</p>
                  <Link to="/owner">
                    Manage lawyer access <ArrowUpRight size={15} />
                  </Link>
                </article>
              )}
              {section === "settings" && (
                <>
                  <article>
                    <Mail size={19} />
                    <h3>Gmail SMTP Dispatcher</h3>
                    <p>Sends subscription activation emails with temporary credentials and direct password setup links.</p>
                    <div style={{ marginTop: "10px", fontSize: "0.82rem", color: "#475569" }}>
                      <div>
                        <strong>Host:</strong> smtp.gmail.com:587
                      </div>
                      <div>
                        <strong>Sender:</strong> dexforaofficial@gmail.com
                      </div>
                    </div>
                    {smtpResult && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          background: smtpResult.connected ? "#ecfdf5" : "#fffbeb",
                          color: smtpResult.connected ? "#065f46" : "#92400e",
                          border: `1px solid ${smtpResult.connected ? "#a7f3d0" : "#fde68a"}`,
                        }}
                      >
                        {smtpResult.message}
                      </div>
                    )}
                    <button
                      className="owner-inline-action"
                      type="button"
                      onClick={testSmtp}
                      disabled={testingSmtp}
                      style={{ marginTop: "14px" }}
                    >
                      {testingSmtp ? "Verifying connection..." : "Test Gmail SMTP Connection"} <ArrowUpRight size={15} />
                    </button>
                  </article>
                  <article>
                    <Settings2 size={19} />
                    <h3>Platform defaults</h3>
                    <p>Settings storage is ready for firm-wide defaults and notification policies.</p>
                    <button
                      className="owner-inline-action"
                      type="button"
                      onClick={() => window.alert("Platform settings are saved centrally.")}
                    >
                      Save current defaults <ArrowUpRight size={15} />
                    </button>
                  </article>
                </>
              )}
            </section>
          )}
        </div>
      </section>

      {/* Record Manual Payment Modal in Billing Hub */}
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

      {/* Edit Pricing & Subscription Modal in Billing Hub */}
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
                onChange={(e) => setPricingForm({ ...pricingForm, plan: e.target.value })}
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
    </main>
  );
};
