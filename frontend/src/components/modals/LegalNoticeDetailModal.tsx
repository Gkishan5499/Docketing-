import React, { useState } from 'react';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { LegalNotice, NoticeStatus } from '../../types';
import { dDiff } from '../../utils/helpers';
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
  Truck,
  ExternalLink,
  MessageSquareQuote,
  CheckCircle2,
  AlertTriangle,
  Gavel,
  Trash2,
  Copy,
  Check,
  Send,
  Scale,
} from 'lucide-react';

export const LegalNoticeDetailModal: React.FC = () => {
  const {
    modalState,
    closeModal,
    legalNotices,
    updateLegalNotice,
    deleteLegalNotice,
    openModal,
    canDeleteRecords,
    showToast,
  } = useLawyersDiary();

  const isOpen = modalState.type === 'notice-detail';
  const noticeId = modalState.payload;
  const notice: LegalNotice | undefined = legalNotices.find((n) => n.id === noticeId);

  // Quick Reply Editor State
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyDate, setReplyDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [replyRefNo, setReplyRefNo] = useState('');
  const [replySummary, setReplySummary] = useState('');
  const [copiedTracking, setCopiedTracking] = useState(false);

  if (!isOpen || !notice) return null;

  const diff = notice.replyDueDate ? dDiff(notice.replyDueDate) : null;
  const isExpired = diff !== null && diff < 0;
  const isUrgent = diff !== null && diff >= 0 && diff <= 3;

  const handleStatusChange = (newStatus: NoticeStatus) => {
    updateLegalNotice(notice.id, { status: newStatus });
    showToast(`Notice status updated to "${newStatus}"`, 'ok');
  };

  const handleCopyTracking = () => {
    if (!notice.trackingNo) return;
    navigator.clipboard.writeText(notice.trackingNo);
    setCopiedTracking(true);
    showToast(`Tracking #${notice.trackingNo} copied to clipboard`, 'in');
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleSaveReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replySummary.trim()) {
      showToast('Please provide a brief summary of the reply', 'er');
      return;
    }

    const nextStatus: NoticeStatus =
      notice.direction === 'SENT' ? 'Reply Received' : 'Replied';

    updateLegalNotice(notice.id, {
      replyReceived: true,
      replyDate,
      replyRefNo: replyRefNo.trim(),
      replySummary: replySummary.trim(),
      status: nextStatus,
    });
    setShowReplyForm(false);
    showToast(`Reply recorded for notice ${notice.noticeNo}`, 'ok');
  };

  const handleEscalateToCourt = () => {
    closeModal();
    // Open add-court modal preselected to District Court (or relevant forum)
    openModal('add-court', 'DC');
    showToast(
      `Notice ${notice.noticeNo} escalated — Proceed to create Court Suit / Petition`,
      'in'
    );
  };

  const handleDelete = () => {
    if (!canDeleteRecords) return;
    if (window.confirm(`Are you sure you want to delete notice ${notice.noticeNo}? This action cannot be undone.`)) {
      deleteLegalNotice(notice.id);
      closeModal();
      showToast(`Notice ${notice.noticeNo} deleted`, 'ok');
    }
  };

  return (
    <div className="ov op" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="mo lg" style={{ maxWidth: '980px', width: '96vw', maxHeight: '92vh' }}>
        
        {/* Navy High-Contrast Header */}
        <div className="mh">
          <div className="flex items-center gap-3">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                padding: '8px',
                borderRadius: '8px',
                display: 'inline-flex',
                color: '#fef08a',
              }}
            >
              <MailCheck className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="m-0 text-[1.25rem] text-white font-serif flex items-center gap-2">
                  <span>{notice.noticeNo}</span>
                </h3>

                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: notice.direction === 'SENT' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                    color: notice.direction === 'SENT' ? '#93c5fd' : '#fde68a',
                    border: notice.direction === 'SENT' ? '1px solid rgba(147, 197, 253, 0.4)' : '1px solid rgba(253, 230, 138, 0.4)',
                  }}
                >
                  {notice.direction === 'SENT' ? (
                    <>
                      <SendHorizontal className="w-3 h-3" /> Outward (Sent)
                    </>
                  ) : (
                    <>
                      <Inbox className="w-3 h-3" /> Inward (Received)
                    </>
                  )}
                </span>

                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {notice.category}
                </span>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '3px' }}>
                Client Entity: <strong className="text-white">{notice.clientName}</strong> · Attorney: <span className="text-white">{notice.attorney}</span>
              </div>
            </div>
          </div>

          <button className="mc" onClick={closeModal} title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="mb" style={{ padding: '1.4rem 1.6rem', overflowY: 'auto' }}>
          
          {/* Executive Ribbon / Fast Summary Bar */}
          <div
            style={{
              background: 'var(--sl-light)',
              border: '1px solid var(--bd2)',
              borderRadius: '10px',
              padding: '0.9rem 1.2rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--tx2)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Current Status
                </div>
                <div style={{ marginTop: '2px' }}>
                  <span
                    style={{
                      padding: '3px 9px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'inline-block',
                      background:
                        notice.status === 'Delivered / Served'
                          ? '#dcfce7'
                          : notice.status === 'Reply Received' || notice.status === 'Replied'
                          ? '#ede9fe'
                          : notice.status === 'Settled / Complied'
                          ? '#e0f2fe'
                          : notice.status === 'Expired / Actionable'
                          ? '#ffe4e6'
                          : '#f1f5f9',
                      color:
                        notice.status === 'Delivered / Served'
                          ? '#15803d'
                          : notice.status === 'Reply Received' || notice.status === 'Replied'
                          ? '#6d28d9'
                          : notice.status === 'Settled / Complied'
                          ? '#0369a1'
                          : notice.status === 'Expired / Actionable'
                          ? '#be123c'
                          : '#475569',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    {notice.status}
                  </span>
                </div>
              </div>

              {notice.claimAmount && (
                <div>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--tx2)', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Monetary Claim Demand
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16a34a', marginTop: '1px' }}>
                    {notice.claimAmount}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--tx2)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Limitation / Cure Period
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '2px' }}>
                  {diff === null ? (
                    <span style={{ color: 'var(--tx2)' }}>—</span>
                  ) : diff === 0 ? (
                    <span style={{ color: '#dc2626' }}>Cure Expires TODAY</span>
                  ) : diff > 0 ? (
                    <span style={{ color: isUrgent ? '#d97706' : 'var(--tx)' }}>
                      {diff} days remaining ({notice.curePeriodDays || 15}d cure)
                    </span>
                  ) : (
                    <span style={{ color: '#dc2626' }}>
                      Cure Period Expired ({Math.abs(diff)}d ago)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-p btn-s"
                onClick={() => setShowReplyForm(!showReplyForm)}
                style={{ fontSize: '0.76rem', fontWeight: 600 }}
              >
                <MessageSquareQuote className="w-3.5 h-3.5 mr-1 inline" />
                {notice.replyReceived || notice.status === 'Replied'
                  ? 'Update Notice Reply'
                  : 'Record Notice Reply'}
              </button>

              <button
                type="button"
                className="btn btn-o btn-s"
                onClick={handleEscalateToCourt}
                style={{ fontSize: '0.76rem', fontWeight: 600 }}
              >
                <Gavel className="w-3.5 h-3.5 mr-1 inline" />
                Escalate to Litigation
              </button>
            </div>
          </div>

          {/* Quick Reply Form (Expandable) */}
          {showReplyForm && (
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid var(--pr)',
                borderRadius: '10px',
                padding: '1.2rem',
                marginBottom: '1.25rem',
                boxShadow: 'var(--sh-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--pr)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquareQuote className="w-4 h-4 text-indigo-600" />
                  <span>Log Formal Notice Reply / Compliance</span>
                </div>
                <button
                  type="button"
                  className="btn btn-g btn-s"
                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                  onClick={() => setShowReplyForm(false)}
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveReply}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div className="fgp" style={{ marginBottom: 0 }}>
                    <label className="fl">
                      Reply Date <span className="req">*</span>
                    </label>
                    <input
                      type="date"
                      value={replyDate}
                      onChange={(e) => setReplyDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="fgp" style={{ marginBottom: 0 }}>
                    <label className="fl">Reply Reference / Dispatch No.</label>
                    <input
                      type="text"
                      value={replyRefNo}
                      onChange={(e) => setReplyRefNo(e.target.value)}
                      placeholder="e.g. REP/2026/041 or Speed Post ID"
                    />
                  </div>
                </div>

                <div className="fgp" style={{ marginBottom: '0.85rem' }}>
                  <label className="fl">
                    Gist / Substance of Reply <span className="req">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={replySummary}
                    onChange={(e) => setReplySummary(e.target.value)}
                    placeholder="Summary of defence raised, counter-allegations, settlement offer, or denial of statutory liability..."
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-g btn-s"
                    onClick={() => setShowReplyForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-p btn-s" style={{ fontWeight: 600 }}>
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                    Save Reply Record
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Subject Line & Core Cause of Action Banner */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--bd)',
              borderRadius: '10px',
              padding: '1.1rem 1.25rem',
              marginBottom: '1.25rem',
              boxShadow: 'var(--sh-sm)',
            }}
          >
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--tx2)', fontWeight: 700 }}>
              Subject Line &amp; Statutory Grievance
            </div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '1.12rem',
                fontWeight: 700,
                color: 'var(--pr)',
                marginTop: '4px',
                lineHeight: 1.45,
              }}
            >
              {notice.subject}
            </div>

            {notice.summary && (
              <div style={{ fontSize: '0.84rem', color: 'var(--tx)', marginTop: '0.75rem', lineHeight: 1.55 }}>
                {notice.summary}
              </div>
            )}

            {notice.demands && (
              <div
                style={{
                  marginTop: '0.85rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg)',
                  borderRadius: '6px',
                  border: '1px solid var(--bd)',
                  fontSize: '0.82rem',
                  color: 'var(--tx)',
                }}
              >
                <strong className="text-slate-800">Requisitions &amp; Demanded Relief:</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--tx)' }}>{notice.demands}</p>
              </div>
            )}
          </div>

          {/* "WHOM TO WHOM" SIDE-BY-SIDE CARDS */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.65rem',
              }}
            >
              <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--tx2)', fontWeight: 700 }}>
                Party Particulars ("Whom to Whom")
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--tx2)' }}>
                {notice.direction === 'SENT' ? (
                  <span className="font-semibold text-blue-700">Client Issued ➔ Opponent Addressee</span>
                ) : (
                  <span className="font-semibold text-amber-700">Opponent Issued ➔ Client Addressee</span>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '1.15rem',
              }}
            >
              {/* SENDER CARD */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--bd)',
                  borderTop: '3px solid #2563eb',
                  borderRadius: '10px',
                  padding: '1.15rem 1.25rem',
                  boxShadow: 'var(--sh-sm)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                    borderBottom: '1px solid var(--bd)',
                    paddingBottom: '0.5rem',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        borderRadius: '4px',
                        padding: '2px 7px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                      }}
                    >
                      FROM
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--tx)' }}>
                      Sender (Issuing Party)
                    </span>
                  </div>

                  {notice.direction === 'SENT' && (
                    <span style={{ fontSize: '0.68rem', background: '#eff6ff', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      Our Client
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--tx)' }}>
                  {notice.senderName}
                </div>

                {notice.senderDesignation && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--tx2)', marginTop: '2px' }}>
                    Capacity: <strong>{notice.senderDesignation}</strong>
                  </div>
                )}

                {notice.senderAddress && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--tx)', marginTop: '8px', lineHeight: 1.45, background: 'var(--bg)', padding: '6px 10px', borderRadius: '6px' }}>
                    {notice.senderAddress}
                  </div>
                )}

                {(notice.senderPhone || notice.senderEmail) && (
                  <div style={{ fontSize: '0.76rem', color: 'var(--tx2)', marginTop: '8px' }}>
                    {notice.senderPhone && <span>Phone: <strong className="text-slate-800">{notice.senderPhone}</strong></span>}
                    {notice.senderPhone && notice.senderEmail && <span> · </span>}
                    {notice.senderEmail && <span>Email: <strong className="text-slate-800">{notice.senderEmail}</strong></span>}
                  </div>
                )}

                {notice.senderAdvocate && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--bd)', fontSize: '0.78rem', color: 'var(--tx2)' }}>
                    <div>
                      Issuing Advocate: <strong className="text-slate-900">{notice.senderAdvocate}</strong>
                    </div>
                    {notice.senderAdvocateDetails && (
                      <div style={{ fontSize: '0.73rem', color: 'var(--tx3)', marginTop: '1px' }}>
                        {notice.senderAdvocateDetails}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RECIPIENT CARD */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--bd)',
                  borderTop: '3px solid #ec4899',
                  borderRadius: '10px',
                  padding: '1.15rem 1.25rem',
                  boxShadow: 'var(--sh-sm)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                    borderBottom: '1px solid var(--bd)',
                    paddingBottom: '0.5rem',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        background: '#ec4899',
                        color: '#ffffff',
                        borderRadius: '4px',
                        padding: '2px 7px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                      }}
                    >
                      TO
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--tx)' }}>
                      Recipient (Noticee / Addressee)
                    </span>
                  </div>

                  {notice.direction === 'RECEIVED' && (
                    <span style={{ fontSize: '0.68rem', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      Our Client
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--tx)' }}>
                  {notice.recipientName}
                </div>

                {notice.recipientDesignation && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--tx2)', marginTop: '2px' }}>
                    Capacity: <strong>{notice.recipientDesignation}</strong>
                  </div>
                )}

                {notice.recipientAddress && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--tx)', marginTop: '8px', lineHeight: 1.45, background: 'var(--bg)', padding: '6px 10px', borderRadius: '6px' }}>
                    {notice.recipientAddress}
                  </div>
                )}

                {(notice.recipientPhone || notice.recipientEmail) && (
                  <div style={{ fontSize: '0.76rem', color: 'var(--tx2)', marginTop: '8px' }}>
                    {notice.recipientPhone && <span>Phone: <strong className="text-slate-800">{notice.recipientPhone}</strong></span>}
                    {notice.recipientPhone && notice.recipientEmail && <span> · </span>}
                    {notice.recipientEmail && <span>Email: <strong className="text-slate-800">{notice.recipientEmail}</strong></span>}
                  </div>
                )}

                {notice.recipientAdvocate && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--bd)', fontSize: '0.78rem', color: 'var(--tx2)' }}>
                    Opposite Party Counsel: <strong className="text-slate-900">{notice.recipientAdvocate}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SERVICE TRACKING & STATUTORY LIMITATION */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--bd)',
              borderRadius: '10px',
              padding: '1.15rem 1.25rem',
              marginBottom: '1.25rem',
              boxShadow: 'var(--sh-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--tx)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck className="w-4 h-4 text-slate-700" />
                <span>Postal Dispatch &amp; Statutory Service Milestones</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    background: notice.postalStatus === 'Delivered / Served' ? '#dcfce7' : '#f1f5f9',
                    color: notice.postalStatus === 'Delivered / Served' ? '#15803d' : '#475569',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  {notice.postalStatus || 'Dispatched'}
                </span>

                {notice.trackingUrl && (
                  <a
                    href={notice.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-g btn-s"
                    style={{ fontSize: '0.72rem', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>India Post Track</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: 'var(--bg)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--bd)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--tx2)', textTransform: 'uppercase', fontWeight: 600 }}>Notice Date</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx)', marginTop: '2px' }}>
                  {notice.noticeDate || '—'}
                </div>
              </div>

              <div style={{ background: 'var(--bg)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--bd)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--tx2)', textTransform: 'uppercase', fontWeight: 600 }}>Dispatch Date</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx)', marginTop: '2px' }}>
                  {notice.dispatchDate || '—'}
                </div>
              </div>

              <div style={{ background: 'var(--bg)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--bd)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--tx2)', textTransform: 'uppercase', fontWeight: 600 }}>Service / Delivery Date</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: notice.serviceDate ? '#16a34a' : 'var(--tx2)', marginTop: '2px' }}>
                  {notice.serviceDate || 'Awaiting Confirmation'}
                </div>
              </div>

              <div style={{ background: 'var(--bg)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--bd)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--tx2)', textTransform: 'uppercase', fontWeight: 600 }}>Cure Limitation Period</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx)', marginTop: '2px' }}>
                  {notice.curePeriodDays || 15} Calendar Days
                </div>
              </div>

              <div
                style={{
                  background: isExpired ? '#fef2f2' : isUrgent ? '#fffbeb' : 'var(--bg)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  border: isExpired ? '1px solid #fecaca' : isUrgent ? '1px solid #fde68a' : '1px solid var(--bd)',
                }}
              >
                <div style={{ fontSize: '0.68rem', color: isExpired ? '#b91c1c' : isUrgent ? '#b45309' : 'var(--tx2)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Reply / Cause of Action Due
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    color: isExpired ? '#b91c1c' : isUrgent ? '#b45309' : 'var(--tx)',
                    marginTop: '2px',
                  }}
                >
                  {notice.replyDueDate || '—'}
                </div>
              </div>
            </div>

            {/* Consignment Tracking Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginTop: '0.85rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--bd)',
                fontSize: '0.82rem',
              }}
            >
              <div>
                Mode: <strong className="text-slate-900">{notice.dispatchMode || 'Speed Post (India Post)'}</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--tx2)' }}>Consignment Tracking:</span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    background: 'var(--bg)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--bd2)',
                    color: 'var(--tx)',
                  }}
                >
                  {notice.trackingNo || 'No tracking ID recorded'}
                </span>

                {notice.trackingNo && (
                  <button
                    type="button"
                    className="btn btn-g btn-s"
                    onClick={handleCopyTracking}
                    title="Copy Tracking Number"
                    style={{ padding: '3px 7px' }}
                  >
                    {copiedTracking ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RESPONSE / REPLY RECORD TIMELINE */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--bd)',
              borderRadius: '10px',
              padding: '1.15rem 1.25rem',
              marginBottom: '1.25rem',
              boxShadow: 'var(--sh-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--tx)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Notice Reply &amp; Counter-Claim History</span>
              </div>

              {!showReplyForm && (
                <button
                  type="button"
                  className="btn btn-p btn-s"
                  style={{ fontSize: '0.74rem' }}
                  onClick={() => setShowReplyForm(true)}
                >
                  {notice.replySummary ? 'Edit Reply Details' : '+ Log Reply'}
                </button>
              )}
            </div>

            {notice.replySummary ? (
              <div
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--bd)',
                  borderRadius: '8px',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--tx2)', marginBottom: '6px', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span>
                    Reply Received / Issued on: <strong className="text-slate-800">{notice.replyDate || '—'}</strong>
                  </span>
                  <span>
                    Reply Ref No: <strong className="text-slate-800">{notice.replyRefNo || '—'}</strong>
                  </span>
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--tx)', lineHeight: 1.5 }}>
                  {notice.replySummary}
                </div>
              </div>
            ) : !showReplyForm ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--tx2)', fontStyle: 'italic', padding: '0.75rem 0' }}>
                No formal reply has been recorded for this legal notice yet.
              </div>
            ) : null}
          </div>

          {/* NOTES & AUDIT TRAIL */}
          {notice.notes && (
            <div
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--bd)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                fontSize: '0.8rem',
                color: 'var(--tx2)',
              }}
            >
              <strong className="text-slate-700">Internal Advocate Notes:</strong> {notice.notes}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mf">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginRight: 'auto' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tx2)' }}>
              Change Status:
            </span>
            <select
              value={notice.status}
              onChange={(e) => handleStatusChange(e.target.value as NoticeStatus)}
              style={{ fontSize: '0.78rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--bd2)' }}
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

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-o btn-s"
              onClick={handleEscalateToCourt}
              title="Escalate to Court Matter"
              style={{ fontWeight: 600 }}
            >
              <Gavel className="w-3.5 h-3.5 inline mr-1" />
              Escalate to Court
            </button>

            {canDeleteRecords && (
              <button
                type="button"
                className="btn btn-r btn-s"
                onClick={handleDelete}
                title="Delete this record"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button className="btn btn-g btn-s" type="button" onClick={closeModal} style={{ fontWeight: 600 }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

