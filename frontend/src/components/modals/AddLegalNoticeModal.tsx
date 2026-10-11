import React, { useState, useEffect } from 'react';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import {
  NoticeDirection,
  NoticeCategory,
  NoticeStatus,
  DispatchMode,
  PriorityLevel,
} from '../../types';
import {
  X,
  MailCheck,
  SendHorizontal,
  Inbox,
  ArrowRight,
  Calendar,
  Building,
  User,
  ShieldAlert,
  Clock,
  DollarSign,
  FileText,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Truck,
  CheckCircle2,
} from 'lucide-react';

const CATEGORIES: NoticeCategory[] = [
  'Cheque Bounce (Sec 138 NI Act)',
  'Demand Notice (Sec 8 IBC)',
  'Eviction & Lease (Sec 106 TPA)',
  'Government Notice (Sec 80 CPC)',
  'Recovery of Dues / Money Demand',
  'Breach of Contract & Damages',
  'Consumer Deficiency & Refund',
  'IPR Cease & Desist (TM / Copyright / Patent)',
  'Employment & Salary / Non-Compete',
  'Defamation & Apology',
  'Arbitration Invocation (Sec 21)',
  'Family & Matrimonial Dispute',
  'Other Legal Notice',
];

const DISPATCH_MODES: DispatchMode[] = [
  'Speed Post (India Post)',
  'Registered Post AD (RPAD)',
  'Courier (Blue Dart / DTDC)',
  'Hand Delivery / Dasti',
  'Email / Electronic',
  'WhatsApp / Electronic',
];

const DEFAULT_CURE_PERIODS: Record<NoticeCategory, number> = {
  'Cheque Bounce (Sec 138 NI Act)': 15,
  'Demand Notice (Sec 8 IBC)': 10,
  'Eviction & Lease (Sec 106 TPA)': 15,
  'Government Notice (Sec 80 CPC)': 60,
  'Recovery of Dues / Money Demand': 15,
  'Breach of Contract & Damages': 15,
  'Consumer Deficiency & Refund': 30,
  'IPR Cease & Desist (TM / Copyright / Patent)': 7,
  'Employment & Salary / Non-Compete': 15,
  'Defamation & Apology': 15,
  'Arbitration Invocation (Sec 21)': 30,
  'Family & Matrimonial Dispute': 15,
  'Other Legal Notice': 15,
};

type FormStep = 'classification' | 'parties' | 'subject' | 'dispatch';

export const AddLegalNoticeModal: React.FC = () => {
  const {
    modalState,
    closeModal,
    clients,
    courtMatters,
    addLegalNotice,
    showToast,
  } = useLawyersDiary();

  const isOpen = modalState.type === 'add-notice';
  const [activeStep, setActiveStep] = useState<FormStep>('classification');

  // Form Fields
  const [direction, setDirection] = useState<NoticeDirection>('SENT');
  const [clientId, setClientId] = useState('');
  const [noticeNo, setNoticeNo] = useState('');
  const [category, setCategory] = useState<NoticeCategory>(
    'Cheque Bounce (Sec 138 NI Act)'
  );
  const [subject, setSubject] = useState('');

  // Sender details
  const [senderName, setSenderName] = useState('');
  const [senderDesignation, setSenderDesignation] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderAdvocate, setSenderAdvocate] = useState('Advocate Kishan & Associates');
  const [senderAdvocateDetails, setSenderAdvocateDetails] = useState(
    'Enrolment No. D/1420/2012, High Court of Delhi'
  );

  // Recipient details
  const [recipientName, setRecipientName] = useState('');
  const [recipientDesignation, setRecipientDesignation] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientAdvocate, setRecipientAdvocate] = useState('');

  // Content
  const [summary, setSummary] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [demands, setDemands] = useState('');

  // Dates & Timelines
  const [noticeDate, setNoticeDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [dispatchDate, setDispatchDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [serviceDate, setServiceDate] = useState('');
  const [curePeriodDays, setCurePeriodDays] = useState<number>(15);
  const [replyDueDate, setReplyDueDate] = useState('');

  // Dispatch details
  const [dispatchMode, setDispatchMode] = useState<DispatchMode>(
    'Speed Post (India Post)'
  );
  const [trackingNo, setTrackingNo] = useState('');
  const [postalStatus, setPostalStatus] = useState('Dispatched');

  // Status & Priority
  const [status, setStatus] = useState<NoticeStatus>('Dispatched');
  const [priority, setPriority] = useState<PriorityLevel>('h');
  const [attorney, setAttorney] = useState('Self');
  const [notes, setNotes] = useState('');
  const [connectedMatterId, setConnectedMatterId] = useState('');

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveStep('classification');
      const today = new Date().toISOString().split('T')[0];
      const randomSeq = Math.floor(100 + Math.random() * 900);
      const monthNames = [
        'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
      ];
      const curMonth = monthNames[new Date().getMonth()];
      const year = new Date().getFullYear();

      setNoticeNo(`LN/${year}/${curMonth}/${randomSeq}`);
      setNoticeDate(today);
      setDispatchDate(today);
      setServiceDate('');
      setStatus('Dispatched');
      setPostalStatus('Dispatched');
      setDirection('SENT');
      setCategory('Cheque Bounce (Sec 138 NI Act)');
      setCurePeriodDays(15);
      setSubject(
        'Statutory Demand Notice under Section 138 Negotiable Instruments Act for dishonour of Cheque'
      );
      setClaimAmount('');
      setSummary('');
      setDemands('');
      setTrackingNo('');
      setNotes('');
      setConnectedMatterId('');
      setClientId('');
      setSenderName('');
      setRecipientName('');
      setRecipientAddress('');
      setRecipientDesignation('Drawer / Accused');
      setSenderDesignation('Payee / Creditor');
    }
  }, [isOpen]);

  // Adjust default cure period & suggested subject when category changes
  const handleCategoryChange = (newCat: NoticeCategory) => {
    setCategory(newCat);
    const defaultDays = DEFAULT_CURE_PERIODS[newCat] || 15;
    setCurePeriodDays(defaultDays);

    if (newCat === 'Cheque Bounce (Sec 138 NI Act)') {
      setSubject('Statutory Demand Notice under Section 138 Negotiable Instruments Act for dishonour of Cheque');
      setSenderDesignation('Payee / Complainant');
      setRecipientDesignation('Drawer / Accused');
    } else if (newCat === 'Government Notice (Sec 80 CPC)') {
      setSubject('Statutory Notice under Section 80 of the Code of Civil Procedure, 1908 prior to institution of suit');
      setSenderDesignation('Claimant / Aggrieved Citizen');
      setRecipientDesignation('Union of India / Government Department');
    } else if (newCat === 'Eviction & Lease (Sec 106 TPA)') {
      setSubject('Legal Notice under Section 106 of Transfer of Property Act, 1882 for Termination of Tenancy & Vacant Possession');
      setSenderDesignation('Lessor / Landlord');
      setRecipientDesignation('Lessee / Tenant');
    } else if (newCat === 'Demand Notice (Sec 8 IBC)') {
      setSubject('Form 3 Demand Notice under Section 8 of Insolvency and Bankruptcy Code, 2016 for unpaid Operational Debt');
      setSenderDesignation('Operational Creditor');
      setRecipientDesignation('Corporate Debtor');
    } else if (newCat === 'IPR Cease & Desist (TM / Copyright / Patent)') {
      setSubject('Cease and Desist Notice against Trademark Infringement and Passing Off');
      setSenderDesignation('Registered Trademark Proprietor');
      setRecipientDesignation('Infringer / Unauthorized User');
    } else if (newCat === 'Recovery of Dues / Money Demand') {
      setSubject('Legal Demand Notice for Outstanding Commercial Dues and Invoices with Interest');
      setSenderDesignation('Creditor / Claimant');
      setRecipientDesignation('Defaulter / Debtor');
    }
  };

  // Auto-calculate Reply Due Date when Service Date or Cure Period changes
  useEffect(() => {
    const baseDateStr = serviceDate || dispatchDate || noticeDate;
    if (baseDateStr && curePeriodDays > 0) {
      const base = new Date(baseDateStr);
      if (!isNaN(base.getTime())) {
        base.setDate(base.getDate() + Number(curePeriodDays));
        setReplyDueDate(base.toISOString().split('T')[0]);
      }
    }
  }, [serviceDate, dispatchDate, noticeDate, curePeriodDays]);

  // When client changes, auto-fill client details based on Direction
  const handleClientChange = (cId: string) => {
    setClientId(cId);
    const client = clients.find((c) => c.id === cId);
    if (!client) return;

    if (direction === 'SENT') {
      setSenderName(client.name);
      setSenderPhone(client.phone || '');
      setSenderEmail(client.email || '');
      setSenderAddress(client.country ? `${client.name}, ${client.country}` : client.name);
    } else {
      setRecipientName(client.name);
      setRecipientPhone(client.phone || '');
      setRecipientEmail(client.email || '');
      setRecipientAddress(client.country ? `${client.name}, ${client.country}` : client.name);
    }
  };

  // When Direction toggles, swap client assignment
  const handleDirectionToggle = (newDir: NoticeDirection) => {
    setDirection(newDir);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      if (newDir === 'SENT') {
        setSenderName(client.name);
        setSenderPhone(client.phone || '');
        setSenderEmail(client.email || '');
        setRecipientName('');
        setRecipientPhone('');
        setRecipientEmail('');
      } else {
        setRecipientName(client.name);
        setRecipientPhone(client.phone || '');
        setRecipientEmail(client.email || '');
        setSenderName('');
        setSenderPhone('');
        setSenderEmail('');
      }
    }
  };

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeNo.trim() || !subject.trim()) {
      showToast('Please provide both Notice Reference Number and Subject Line', 'er');
      setActiveStep('classification');
      return;
    }
    if (!senderName.trim() || !recipientName.trim()) {
      showToast('Please provide both Sender (From) and Recipient (To) names', 'er');
      setActiveStep('parties');
      return;
    }

    const client = clients.find((c) => c.id === clientId);
    const clientName = client
      ? client.name
      : direction === 'SENT'
      ? senderName.trim()
      : recipientName.trim();

    const connectedMatter = courtMatters.find((m) => m.id === connectedMatterId);

    addLegalNotice({
      noticeNo: noticeNo.trim(),
      direction,
      category,
      subject: subject.trim(),
      clientId: clientId || undefined,
      clientName,
      senderName: senderName.trim(),
      senderDesignation: senderDesignation.trim(),
      senderAddress: senderAddress.trim(),
      senderPhone: senderPhone.trim(),
      senderEmail: senderEmail.trim(),
      senderAdvocate: senderAdvocate.trim(),
      senderAdvocateDetails: senderAdvocateDetails.trim(),
      recipientName: recipientName.trim(),
      recipientDesignation: recipientDesignation.trim(),
      recipientAddress: recipientAddress.trim(),
      recipientPhone: recipientPhone.trim(),
      recipientEmail: recipientEmail.trim(),
      recipientAdvocate: recipientAdvocate.trim(),
      summary: summary.trim(),
      claimAmount: claimAmount.trim(),
      demands: demands.trim(),
      noticeDate,
      dispatchDate: dispatchDate || undefined,
      serviceDate: serviceDate || undefined,
      curePeriodDays: Number(curePeriodDays) || 15,
      replyDueDate: replyDueDate || undefined,
      dispatchMode,
      trackingNo: trackingNo.trim(),
      postalStatus,
      status,
      priority,
      attorney,
      connectedMatterId: connectedMatterId || undefined,
      connectedMatterTitle: connectedMatter?.caseTitle,
      notes: notes.trim(),
      replyReceived: false,
    });
  };

  return (
    <div className="ov op" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="mo lg" style={{ maxWidth: '1000px', width: '96vw', maxHeight: '92vh' }}>
        
        {/* Crisp Navy Header */}
        <div className="mh">
          <div className="flex items-center gap-3">
            <div style={{ background: 'rgba(255,255,255,0.12)', padding: '7px', borderRadius: '8px', display: 'flex' }}>
              <MailCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="m-0 text-[1.25rem] text-white flex items-center gap-2">
                <span>New Legal Notice Entry</span>
                <span className="mo-t" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', background: 'rgba(255,255,255,0.18)', borderRadius: '4px' }}>
                  PRE-LITIGATION
                </span>
              </h3>
              <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
                Statutory Demand Notices (Sec 138 NI Act, Sec 80 CPC, Sec 106 TPA), Cease &amp; Desist, and Party-to-Party Notices
              </div>
            </div>
          </div>
          <button className="mc" onClick={closeModal} title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Navigation Bar */}
        <div
          style={{
            background: 'var(--bg)',
            borderBottom: '1px solid var(--bd)',
            display: 'flex',
            padding: '0.4rem 1.25rem',
            gap: '0.5rem',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveStep('classification')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: activeStep === 'classification' ? 'var(--pr)' : 'transparent',
              color: activeStep === 'classification' ? '#ffffff' : 'var(--tx2)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>1. Notice &amp; Client</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('parties')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: activeStep === 'parties' ? 'var(--pr)' : 'transparent',
              color: activeStep === 'parties' ? '#ffffff' : 'var(--tx2)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>2. Parties ("Whom to Whom")</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('subject')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: activeStep === 'subject' ? 'var(--pr)' : 'transparent',
              color: activeStep === 'subject' ? '#ffffff' : 'var(--tx2)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>3. Subject &amp; Demands</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('dispatch')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: activeStep === 'dispatch' ? 'var(--pr)' : 'transparent',
              color: activeStep === 'dispatch' ? '#ffffff' : 'var(--tx2)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>4. Service &amp; Limitation</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="mb" style={{ padding: '1.4rem 1.6rem', overflowY: 'auto' }}>
            
            {/* STEP 1: CLASSIFICATION & CLIENT */}
            {activeStep === 'classification' && (
              <div>
                {/* Notice Direction Switcher */}
                <div
                  style={{
                    background: 'var(--sl-light)',
                    border: '1px solid var(--bd2)',
                    borderRadius: '10px',
                    padding: '1.1rem 1.25rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
                    <div>
                      <label className="fl" style={{ marginBottom: '8px' }}>
                        Notice Flow Direction <span className="req">*</span>
                      </label>
                      <div style={{ display: 'inline-flex', background: '#ffffff', borderRadius: '8px', padding: '4px', border: '1px solid var(--bd2)', width: '100%', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}>
                        <button
                          type="button"
                          style={{
                            flex: 1,
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            background: direction === 'SENT' ? 'var(--pr)' : 'transparent',
                            color: direction === 'SENT' ? '#ffffff' : 'var(--tx2)',
                            boxShadow: direction === 'SENT' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                          }}
                          onClick={() => handleDirectionToggle('SENT')}
                        >
                          <SendHorizontal className="w-3.5 h-3.5" />
                          Outward (Issued by Us)
                        </button>
                        <button
                          type="button"
                          style={{
                            flex: 1,
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            background: direction === 'RECEIVED' ? '#d97706' : 'transparent',
                            color: direction === 'RECEIVED' ? '#ffffff' : 'var(--tx2)',
                            boxShadow: direction === 'RECEIVED' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                          }}
                          onClick={() => handleDirectionToggle('RECEIVED')}
                        >
                          <Inbox className="w-3.5 h-3.5" />
                          Inward (Served on Client)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="fl">
                        Registered Client Entity <span className="req">*</span>
                      </label>
                      <select
                        value={clientId}
                        onChange={(e) => handleClientChange(e.target.value)}
                        required
                        style={{ height: '42px', fontWeight: 500 }}
                      >
                        <option value="">— Select Registered Client Entity —</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="fss">Statutory Details &amp; Reference</div>
                <div className="fg">
                  <div className="fgp">
                    <label className="fl">
                      Notice Reference Number <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      value={noticeNo}
                      onChange={(e) => setNoticeNo(e.target.value)}
                      placeholder="e.g. LN/2026/OCT/042"
                      required
                      style={{ fontWeight: 600 }}
                    />
                  </div>

                  <div className="fgp">
                    <label className="fl">
                      Statute / Notice Category <span className="req">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value as NoticeCategory)}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="fgp">
                    <label className="fl">Date of Notice Document</label>
                    <input
                      type="date"
                      value={noticeDate}
                      onChange={(e) => setNoticeDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="fgp">
                    <label className="fl">Monetary Claim Amount (₹)</label>
                    <input
                      type="text"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                      placeholder="e.g. ₹ 18,50,000"
                    />
                  </div>

                  <div className="fgp sp">
                    <label className="fl">Connected Court Litigation (If any)</label>
                    <select
                      value={connectedMatterId}
                      onChange={(e) => setConnectedMatterId(e.target.value)}
                    >
                      <option value="">— Not connected to any court matter yet —</option>
                      {courtMatters.map((m) => (
                        <option key={m.id} value={m.id}>
                          [{m.type}] {m.caseNo} — {m.caseTitle}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: WHOM TO WHOM PARTIES */}
            {activeStep === 'parties' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--bd)', paddingBottom: '0.5rem' }}>
                  <div className="fss" style={{ margin: 0, padding: 0, border: 'none' }}>
                    Party Particulars ("Whom to Whom")
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--tx2)', fontWeight: 500 }}>
                    {direction === 'SENT' ? (
                      <span className="text-blue-600 font-semibold">Client (Sender) ➔ Opponent (Recipient)</span>
                    ) : (
                      <span className="text-amber-600 font-semibold">Opponent (Sender) ➔ Client (Recipient)</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
                  
                  {/* SENDER CARD */}
                  <div
                    style={{
                      background: 'var(--sl-light)',
                      border: '1px solid var(--bd2)',
                      borderRadius: '10px',
                      padding: '1.2rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        color: 'var(--tx)',
                        marginBottom: '0.85rem',
                        borderBottom: '1px solid var(--bd2)',
                        paddingBottom: '0.5rem',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ background: '#2563eb', color: '#ffffff', borderRadius: '4px', padding: '2px 7px', fontSize: '0.68rem', fontWeight: 800 }}>
                          FROM
                        </span>
                        <span>Sender (Issuing Party)</span>
                      </div>
                      {direction === 'SENT' && clientId && (
                        <span style={{ fontSize: '0.68rem', background: '#eff6ff', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Our Client
                        </span>
                      )}
                    </div>

                    <div className="fg" style={{ gridTemplateColumns: '1fr', gap: '0.8rem' }}>
                      <div className="fgp" style={{ marginBottom: 0 }}>
                        <label className="fl">
                          Sender Full Name / Entity <span className="req">*</span>
                        </label>
                        <input
                          type="text"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="e.g. Sharma Industries Ltd. or Complainant Name"
                          required
                        />
                      </div>

                      <div className="fgp" style={{ marginBottom: 0 }}>
                        <label className="fl">Sender Capacity / Role</label>
                        <input
                          type="text"
                          value={senderDesignation}
                          onChange={(e) => setSenderDesignation(e.target.value)}
                          placeholder="e.g. Payee / Creditor / Landlord / Aggrieved"
                        />
                      </div>

                      <div className="fgp" style={{ marginBottom: 0 }}>
                        <label className="fl">Registered / Postal Address</label>
                        <textarea
                          rows={2}
                          value={senderAddress}
                          onChange={(e) => setSenderAddress(e.target.value)}
                          placeholder="Complete registered or residential address..."
                          style={{ minHeight: '65px' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                        <div className="fgp" style={{ marginBottom: 0 }}>
                          <label className="fl">Phone Number</label>
                          <input
                            type="text"
                            value={senderPhone}
                            onChange={(e) => setSenderPhone(e.target.value)}
                            placeholder="+91..."
                          />
                        </div>
                        <div className="fgp" style={{ marginBottom: 0 }}>
                          <label className="fl">Email Address</label>
                          <input
                            type="email"
                            value={senderEmail}
                            onChange={(e) => setSenderEmail(e.target.value)}
                            placeholder="sender@domain.com"
                          />
                        </div>
                      </div>

                      <div className="fgp" style={{ marginBottom: 0 }}>
                        <label className="fl">Sender's Legal Counsel / Advocate</label>
                        <input
                          type="text"
                          value={senderAdvocate}
                          onChange={(e) => setSenderAdvocate(e.target.value)}
                          placeholder="e.g. Advocate Kishan & Associates"
                        />
                      </div>
                    </div>
                  </div>

                  {/* RECIPIENT CARD */}
                  <div
                    style={{
                      background: 'var(--sl-light)',
                      border: '1px solid var(--bd2)',
                      borderRadius: '10px',
                      padding: '1.2rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        color: 'var(--tx)',
                        marginBottom: '0.85rem',
                        borderBottom: '1px solid var(--bd2)',
                        paddingBottom: '0.5rem',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ background: '#7c3aed', color: '#ffffff', borderRadius: '4px', padding: '2px 7px', fontSize: '0.68rem', fontWeight: 800 }}>
                          TO
                        </span>
                        <span>Recipient (Noticee / Addressee)</span>
                      </div>
                      {direction === 'RECEIVED' && clientId && (
                        <span style={{ fontSize: '0.68rem', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Our Client
                        </span>
                      )}
                    </div>

                    <div className="fg" style={{ gridTemplateColumns: '1fr', gap: '0.8rem' }}>
                      <div className="fgp" style={{ marginBottom: 0 }}>
                        <label className="fl">
                          Recipient Full Name / Entity <span className="req">*</span>
                        </label>
                        <input
                          type="text"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="e.g. Apex Logistics Pvt. Ltd. / Accused Name"
                          required
                        />
                      </div>

                      <div className="fgp" style={{ marginBottom: 0 }}>
                        <label className="fl">Recipient Capacity / Role</label>
                        <input
                          type="text"
                          value={recipientDesignation}
                          onChange={(e) => setRecipientDesignation(e.target.value)}
                          placeholder="e.g. Drawer / Accused / Tenant / Infringer"
                        />
                      </div>

                      <div className="fgp" style={{ marginBottom: 0 }}>
                        <label className="fl">Registered / Postal Address</label>
                        <textarea
                          rows={2}
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                          placeholder="Complete registered or residential address..."
                          style={{ minHeight: '65px' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                        <div className="fgp" style={{ marginBottom: 0 }}>
                          <label className="fl">Phone Number</label>
                          <input
                            type="text"
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            placeholder="+91..."
                          />
                        </div>
                        <div className="fgp" style={{ marginBottom: 0 }}>
                          <label className="fl">Email Address</label>
                          <input
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            placeholder="recipient@domain.com"
                          />
                        </div>
                      </div>

                      <div className="fgp" style={{ marginBottom: 0 }}>
                        <label className="fl">Opposite Counsel (If known / replied)</label>
                        <input
                          type="text"
                          value={recipientAdvocate}
                          onChange={(e) => setRecipientAdvocate(e.target.value)}
                          placeholder="Opposite legal counsel / law firm name"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: SUBJECT & DEMANDS */}
            {activeStep === 'subject' && (
              <div>
                <div className="fss">Formal Notice Subject Line</div>
                
                {/* Subject Suggestions */}
                <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--tx2)', fontWeight: 600 }}>Quick Templates:</span>
                  <button
                    type="button"
                    className="btn btn-g btn-s"
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    onClick={() => setSubject('Statutory Demand Notice under Section 138 of Negotiable Instruments Act, 1881 for dishonour of Cheque')}
                  >
                    Sec 138 NI Act
                  </button>
                  <button
                    type="button"
                    className="btn btn-g btn-s"
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    onClick={() => setSubject('Notice under Section 80 of the Code of Civil Procedure, 1908 prior to institution of suit against Public Authority')}
                  >
                    Sec 80 CPC (Govt)
                  </button>
                  <button
                    type="button"
                    className="btn btn-g btn-s"
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    onClick={() => setSubject('Legal Notice under Section 106 of Transfer of Property Act, 1882 for Termination of Tenancy and Vacant Possession')}
                  >
                    Sec 106 TPA (Lease)
                  </button>
                  <button
                    type="button"
                    className="btn btn-g btn-s"
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    onClick={() => setSubject('Form 3 Demand Notice under Section 8 of Insolvency and Bankruptcy Code, 2016')}
                  >
                    Sec 8 IBC Demand
                  </button>
                  <button
                    type="button"
                    className="btn btn-g btn-s"
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    onClick={() => setSubject('Cease and Desist Notice against Trademark Infringement, Passing Off and Damages')}
                  >
                    IPR Cease &amp; Desist
                  </button>
                </div>

                <div className="fgp sp">
                  <label className="fl">
                    Full Subject Line <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter complete formal subject line..."
                    required
                    style={{ fontWeight: 600, fontSize: '0.92rem' }}
                  />
                </div>

                <div className="fss" style={{ marginTop: '1.25rem' }}>Cause of Action &amp; Specific Relief</div>
                <div className="fg">
                  <div className="fgp sp">
                    <label className="fl">Brief Facts &amp; Statement of Dispute</label>
                    <textarea
                      rows={3}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Summary of transaction, loan/invoices, date of dishonour/breach, and factual grounds..."
                    />
                  </div>

                  <div className="fgp sp">
                    <label className="fl">Specific Demands &amp; Legal Consequences</label>
                    <textarea
                      rows={3}
                      value={demands}
                      onChange={(e) => setDemands(e.target.value)}
                      placeholder="e.g. Clear Rs. 18,50,000 within 15 days, fail which civil suit and criminal proceedings under Sec 138 will be instituted at your risk and cost..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: SERVICE, POSTAL & LIMITATION */}
            {activeStep === 'dispatch' && (
              <div>
                <div className="fss">Postal Service &amp; Statutory Cure Limitation</div>
                
                <div className="fg">
                  <div className="fgp">
                    <label className="fl">Mode of Dispatch</label>
                    <select
                      value={dispatchMode}
                      onChange={(e) => setDispatchMode(e.target.value as DispatchMode)}
                    >
                      {DISPATCH_MODES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="fgp">
                    <label className="fl">Postal Consignment / Tracking No.</label>
                    <input
                      type="text"
                      value={trackingNo}
                      onChange={(e) => setTrackingNo(e.target.value)}
                      placeholder="e.g. ED984210452IN (Speed Post No.)"
                      style={{ fontFamily: 'monospace', fontWeight: 600 }}
                    />
                  </div>

                  <div className="fgp">
                    <label className="fl">Date of Dispatch</label>
                    <input
                      type="date"
                      value={dispatchDate}
                      onChange={(e) => setDispatchDate(e.target.value)}
                    />
                  </div>

                  <div className="fgp">
                    <label className="fl">Date of Delivery / Service on Recipient</label>
                    <input
                      type="date"
                      value={serviceDate}
                      onChange={(e) => setServiceDate(e.target.value)}
                    />
                  </div>

                  <div className="fgp">
                    <label className="fl">Statutory Cure Window</label>
                    <select
                      value={curePeriodDays}
                      onChange={(e) => setCurePeriodDays(Number(e.target.value))}
                    >
                      <option value={7}>7 Days (Urgent Cease &amp; Desist)</option>
                      <option value={10}>10 Days (Sec 8 IBC Demand)</option>
                      <option value={15}>15 Days (Sec 138 NI Act / Sec 106 TPA)</option>
                      <option value={21}>21 Days (Commercial Dispute)</option>
                      <option value={30}>30 Days (Consumer / Contract Cure)</option>
                      <option value={60}>60 Days (Sec 80 CPC Govt Notice)</option>
                    </select>
                  </div>

                  <div className="fgp">
                    <label className="fl">Reply / Compliance Due Date</label>
                    <input
                      type="date"
                      value={replyDueDate}
                      onChange={(e) => setReplyDueDate(e.target.value)}
                      style={{ fontWeight: 700, color: 'var(--pr)' }}
                    />
                  </div>

                  <div className="fgp">
                    <label className="fl">Postal Delivery Status</label>
                    <select
                      value={postalStatus}
                      onChange={(e) => setPostalStatus(e.target.value)}
                    >
                      <option>Dispatched</option>
                      <option>In Transit</option>
                      <option>Delivered / Served</option>
                      <option>Refused / Unclaimed (Deemed Service)</option>
                      <option>Returned Unserved</option>
                      <option>Delivery Awaited</option>
                    </select>
                  </div>

                  <div className="fgp">
                    <label className="fl">Lifecycle Notice Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as NoticeStatus)}
                    >
                      <option>Draft</option>
                      <option>Dispatched</option>
                      <option>Delivered / Served</option>
                      <option>Reply Received</option>
                      <option>Replied</option>
                      <option>Settled / Complied</option>
                      <option>Escalated to Litigation</option>
                      <option>Expired / Actionable</option>
                      <option>Closed</option>
                    </select>
                  </div>

                  <div className="fgp">
                    <label className="fl">Priority Level</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    >
                      <option value="h">High Priority (Urgent Cure / Limitation)</option>
                      <option value="m">Medium Priority</option>
                      <option value="l">Low Priority</option>
                    </select>
                  </div>

                  <div className="fgp">
                    <label className="fl">Handling Advocate</label>
                    <input
                      type="text"
                      value={attorney}
                      onChange={(e) => setAttorney(e.target.value)}
                      placeholder="Self"
                    />
                  </div>

                  <div className="fgp sp">
                    <label className="fl">Internal Advocate Strategy Notes</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Next steps, draft complaint ready, postal tracking remarks..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clean Modal Footer */}
          <div className="mf">
            <button className="btn btn-g btn-s" type="button" onClick={closeModal}>
              Cancel
            </button>

            {activeStep !== 'classification' && (
              <button
                type="button"
                className="btn btn-o btn-s"
                onClick={() => {
                  if (activeStep === 'parties') setActiveStep('classification');
                  if (activeStep === 'subject') setActiveStep('parties');
                  if (activeStep === 'dispatch') setActiveStep('subject');
                }}
              >
                <ChevronLeft className="w-3.5 h-3.5 inline mr-1" />
                Previous Step
              </button>
            )}

            {activeStep !== 'dispatch' ? (
              <button
                type="button"
                className="btn btn-p btn-s"
                onClick={() => {
                  if (activeStep === 'classification') setActiveStep('parties');
                  if (activeStep === 'parties') setActiveStep('subject');
                  if (activeStep === 'subject') setActiveStep('dispatch');
                }}
              >
                <span>Continue</span>
                <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
            ) : (
              <button className="btn btn-p btn-s" type="submit" style={{ fontWeight: 700 }}>
                Save Legal Notice Entry
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
