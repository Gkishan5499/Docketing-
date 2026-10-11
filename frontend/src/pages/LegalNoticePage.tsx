import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import { LegalNotice, NoticeDirection, NoticeCategory, NoticeStatus } from '../types';
import { dDiff, exportCSV } from '../utils/helpers';
import {
  MailCheck,
  Plus,
  Search,
  Filter,
  SendHorizontal,
  Inbox,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Trash2,
  Building,
  User,
  ExternalLink,
  ShieldAlert,
  Download,
  RotateCcw,
  X,
  FileText,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const LegalNoticePage: React.FC = () => {
  const location = useLocation();
  const {
    legalNotices,
    openModal,
    deleteLegalNotice,
    canDeleteRecords,
    showToast,
  } = useLawyersDiary();

  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | NoticeDirection>(() => {
    if (location.pathname.endsWith('/outward')) return 'SENT';
    if (location.pathname.endsWith('/inward')) return 'RECEIVED';
    return 'ALL';
  });
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (location.pathname.endsWith('/outward')) {
      setDirectionFilter('SENT');
    } else if (location.pathname.endsWith('/inward')) {
      setDirectionFilter('RECEIVED');
    } else if (location.pathname === '/ln') {
      setDirectionFilter('ALL');
    }
  }, [location.pathname]);

  // Filtered Notices
  const filteredNotices = useMemo(() => {
    return legalNotices.filter((n) => {
      // Direction
      if (directionFilter !== 'ALL' && n.direction !== directionFilter) return false;

      // Category
      if (categoryFilter !== 'ALL' && n.category !== categoryFilter) return false;

      // Status
      if (statusFilter !== 'ALL' && n.status !== statusFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          n.noticeNo.toLowerCase().includes(q) ||
          n.subject.toLowerCase().includes(q) ||
          n.senderName.toLowerCase().includes(q) ||
          n.recipientName.toLowerCase().includes(q) ||
          n.clientName.toLowerCase().includes(q) ||
          (n.trackingNo && n.trackingNo.toLowerCase().includes(q)) ||
          (n.claimAmount && n.claimAmount.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [legalNotices, directionFilter, categoryFilter, statusFilter, searchQuery]);

  // Metric KPIs
  const totalCount = legalNotices.length;
  const sentCount = legalNotices.filter((n) => n.direction === 'SENT').length;
  const receivedCount = legalNotices.filter((n) => n.direction === 'RECEIVED').length;
  const actionableCount = legalNotices.filter(
    (n) => n.status === 'Dispatched' || n.status === 'Delivered / Served'
  ).length;
  const repliedCount = legalNotices.filter(
    (n) => n.status === 'Reply Received' || n.status === 'Replied' || n.status === 'Settled / Complied'
  ).length;

  const isFiltered =
    directionFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setDirectionFilter('ALL');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
  };

  const handleExportCSV = () => {
    if (filteredNotices.length === 0) {
      showToast('No legal notice records to export', 'er');
      return;
    }
    const headers = [
      'Notice No',
      'Flow Direction',
      'Client Entity',
      'Category',
      'Sender (From)',
      'Sender Designation',
      'Recipient (To)',
      'Recipient Designation',
      'Subject Line',
      'Monetary Claim',
      'Notice Date',
      'Dispatch Date',
      'Delivery/Service Date',
      'Cure Days',
      'Reply Due Date',
      'Dispatch Mode',
      'Tracking Number',
      'Lifecycle Status',
    ];
    const rows = filteredNotices.map((n) => [
      n.noticeNo,
      n.direction === 'SENT' ? 'Outward (Sent)' : 'Inward (Received)',
      n.clientName,
      n.category,
      n.senderName,
      n.senderDesignation || '',
      n.recipientName,
      n.recipientDesignation || '',
      n.subject,
      n.claimAmount || '',
      n.noticeDate,
      n.dispatchDate || '',
      n.serviceDate || '',
      n.curePeriodDays || 15,
      n.replyDueDate || '',
      n.dispatchMode || '',
      n.trackingNo || '',
      n.status,
    ]);
    exportCSV(`legal_notices_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    showToast(`Exported ${filteredNotices.length} notice records to CSV`, 'ok');
  };

  return (
    <div className="pg on">
      {/* Header Bar */}
      <div className="ph" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #1e3a8a, #0f172a)',
                color: '#fef08a',
                padding: '8px',
                borderRadius: '8px',
                display: 'inline-flex',
                boxShadow: 'var(--sh-sm)',
              }}
            >
              <MailCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--tx)' }}>
                Legal Notices &amp; Statutory Demands
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--tx2)', marginTop: '2px' }}>
                Section 138 NI Act, Section 80 CPC, Section 106 TPA, IBC Demand Notices &amp; Pre-Litigation Communications
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="btn btn-g btn-s"
            onClick={handleExportCSV}
            title="Export filtered notices to CSV"
            style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            className="btn btn-p"
            onClick={() => openModal('add-notice')}
            style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus className="w-4 h-4" />
            <span>New Legal Notice</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid (Application Standard .sg / .st System) */}
      <div className="sg" style={{ marginBottom: '1.25rem' }}>
        {/* Card 1: Total */}
        <div
          className={`st sl clickable ${directionFilter === 'ALL' ? 'ring-2 ring-indigo-500/20' : ''}`}
          onClick={() => setDirectionFilter('ALL')}
          title="Filter: All Legal Notices"
        >
          <div>
            <div className="st-top">
              <div className="sl">Total Notices</div>
              <div className="si">
                <MailCheck className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="sv">{totalCount}</div>
          </div>

          <div>
            <div className="ss">
              <span>All pre-litigation files</span>
              <span className="st-trd" style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}>
                All Files
              </span>
            </div>
            <div className="st-pbar">
              <div className="st-pbar-fill" style={{ width: '100%', background: 'var(--sl)' }} />
            </div>
          </div>
        </div>

        {/* Card 2: Outward */}
        <div
          className={`st pr clickable ${directionFilter === 'SENT' ? 'ring-2 ring-blue-500/30' : ''}`}
          onClick={() => setDirectionFilter('SENT')}
          title="Filter: Outward (Sent by Us)"
        >
          <div>
            <div className="st-top">
              <div className="sl">Outward (Sent)</div>
              <div className="si">
                <SendHorizontal className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="sv" style={{ color: '#1e40af' }}>{sentCount}</div>
          </div>

          <div>
            <div className="ss">
              <span>Issued on client's behalf</span>
              <span className="st-trd" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
                Outward
              </span>
            </div>
            <div className="st-pbar">
              <div
                className="st-pbar-fill"
                style={{
                  width: `${totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0}%`,
                  background: '#2563eb',
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Inward */}
        <div
          className={`st gd clickable ${directionFilter === 'RECEIVED' ? 'ring-2 ring-amber-500/30' : ''}`}
          onClick={() => setDirectionFilter('RECEIVED')}
          title="Filter: Inward (Served on Us)"
        >
          <div>
            <div className="st-top">
              <div className="sl">Inward (Received)</div>
              <div className="si">
                <Inbox className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="sv" style={{ color: '#b45309' }}>{receivedCount}</div>
          </div>

          <div>
            <div className="ss">
              <span>Served upon our clients</span>
              <span className="st-trd" style={{ background: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }}>
                Inward
              </span>
            </div>
            <div className="st-pbar">
              <div
                className="st-pbar-fill"
                style={{
                  width: `${totalCount > 0 ? Math.round((receivedCount / totalCount) * 100) : 0}%`,
                  background: 'var(--gd)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Limitation Active */}
        <div className="st rd">
          <div>
            <div className="st-top">
              <div className="sl">Limitation Active</div>
              <div className="si">
                <Clock className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="sv" style={{ color: '#b91c1c' }}>{actionableCount}</div>
          </div>

          <div>
            <div className="ss">
              <span>Active cure / reply period</span>
              <span className="st-trd" style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' }}>
                Actionable
              </span>
            </div>
            <div className="st-pbar">
              <div
                className="st-pbar-fill"
                style={{
                  width: `${totalCount > 0 ? Math.round((actionableCount / totalCount) * 100) : 0}%`,
                  background: '#dc2626',
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 5: Replied / Resolved */}
        <div className="st gn">
          <div>
            <div className="st-top">
              <div className="sl">Replied / Settled</div>
              <div className="si">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="sv" style={{ color: '#166534' }}>{repliedCount}</div>
          </div>

          <div>
            <div className="ss">
              <span>Reply sent or complied</span>
              <span className="st-trd" style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}>
                Resolved
              </span>
            </div>
            <div className="st-pbar">
              <div
                className="st-pbar-fill"
                style={{
                  width: `${totalCount > 0 ? Math.round((repliedCount / totalCount) * 100) : 0}%`,
                  background: '#16a34a',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid var(--bd)',
          padding: '0.8rem 1.15rem',
          marginBottom: '1.15rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--sh-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          {/* Segmented Direction Tabs */}
          <div
            style={{
              display: 'inline-flex',
              background: '#f1f5f9',
              borderRadius: '8px',
              padding: '3px',
              border: '1px solid var(--bd)',
            }}
          >
            <button
              type="button"
              onClick={() => setDirectionFilter('ALL')}
              style={{
                padding: '5px 12px',
                fontSize: '0.76rem',
                fontWeight: directionFilter === 'ALL' ? 700 : 500,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: directionFilter === 'ALL' ? '#ffffff' : 'transparent',
                color: directionFilter === 'ALL' ? 'var(--pr)' : 'var(--tx2)',
                boxShadow: directionFilter === 'ALL' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setDirectionFilter('SENT')}
              style={{
                padding: '5px 12px',
                fontSize: '0.76rem',
                fontWeight: directionFilter === 'SENT' ? 700 : 500,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: directionFilter === 'SENT' ? '#ffffff' : 'transparent',
                color: directionFilter === 'SENT' ? '#2563eb' : 'var(--tx2)',
                boxShadow: directionFilter === 'SENT' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <SendHorizontal className="w-3 h-3" />
              Outward ({sentCount})
            </button>
            <button
              type="button"
              onClick={() => setDirectionFilter('RECEIVED')}
              style={{
                padding: '5px 12px',
                fontSize: '0.76rem',
                fontWeight: directionFilter === 'RECEIVED' ? 700 : 500,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: directionFilter === 'RECEIVED' ? '#ffffff' : 'transparent',
                color: directionFilter === 'RECEIVED' ? '#d97706' : 'var(--tx2)',
                boxShadow: directionFilter === 'RECEIVED' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <Inbox className="w-3 h-3" />
              Inward ({receivedCount})
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '380px' }}>
            <Search
              className="w-3.5 h-3.5"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx2)' }}
            />
            <input
              type="text"
              placeholder="Search by notice no, party, subject, tracking..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '32px',
                paddingRight: searchQuery ? '30px' : '10px',
                fontSize: '0.8rem',
                height: '36px',
                width: '100%',
                borderRadius: '8px',
                border: '1px solid var(--bd2)',
                background: '#ffffff',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--tx2)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              fontSize: '0.78rem',
              height: '36px',
              padding: '0 8px',
              borderRadius: '8px',
              border: '1px solid var(--bd2)',
              background: '#ffffff',
            }}
          >
            <option value="ALL">All Statutory Categories</option>
            <option value="Cheque Bounce (Sec 138 NI Act)">Sec 138 NI Act (Cheque Bounce)</option>
            <option value="Demand Notice (Sec 8 IBC)">Sec 8 IBC Demand Notice</option>
            <option value="Eviction & Lease (Sec 106 TPA)">Sec 106 TPA (Eviction)</option>
            <option value="Government Notice (Sec 80 CPC)">Sec 80 CPC (Govt Notice)</option>
            <option value="Recovery of Dues / Money Demand">Recovery of Dues</option>
            <option value="IPR Cease & Desist (TM / Copyright / Patent)">IPR Cease &amp; Desist</option>
            <option value="Breach of Contract & Damages">Breach of Contract</option>
            <option value="Consumer Deficiency & Refund">Consumer Protection</option>
            <option value="Employment & Salary / Non-Compete">Employment &amp; Salary</option>
            <option value="Defamation & Apology">Defamation &amp; Apology</option>
            <option value="Arbitration Invocation (Sec 21)">Arbitration Invocation (Sec 21)</option>
            <option value="Other Legal Notice">Other Legal Notices</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              fontSize: '0.78rem',
              height: '36px',
              padding: '0 8px',
              borderRadius: '8px',
              border: '1px solid var(--bd2)',
              background: '#ffffff',
            }}
          >
            <option value="ALL">All Lifecycle Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered / Served">Delivered / Served</option>
            <option value="Reply Received">Reply Received</option>
            <option value="Replied">Replied</option>
            <option value="Settled / Complied">Settled / Complied</option>
            <option value="Escalated to Litigation">Escalated</option>
            <option value="Expired / Actionable">Expired / Actionable</option>
            <option value="Closed">Closed</option>
          </select>

          {isFiltered && (
            <button
              type="button"
              className="btn btn-g btn-s"
              onClick={handleResetFilters}
              title="Reset all active filters"
              style={{ fontSize: '0.74rem', height: '36px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <div style={{ fontSize: '0.76rem', color: 'var(--tx2)', whiteSpace: 'nowrap', marginLeft: '4px' }}>
            Showing <strong>{filteredNotices.length}</strong> of {totalCount}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="tw" style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid var(--bd)', overflow: 'hidden', boxShadow: 'var(--sh-sm)' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '150px' }}>Notice Ref &amp; Flow</th>
              <th style={{ minWidth: '240px' }}>Parties ("Whom to Whom")</th>
              <th style={{ minWidth: '260px' }}>Subject Line &amp; Category</th>
              <th style={{ width: '145px' }}>Notice / Service</th>
              <th style={{ width: '160px' }}>Cure &amp; Reply Deadline</th>
              <th style={{ width: '135px' }}>Status</th>
              <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotices.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--tx2)' }}>
                  <div
                    style={{
                      background: 'var(--bg)',
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem auto',
                      border: '1px solid var(--bd)',
                    }}
                  >
                    <MailCheck className="w-7 h-7 text-slate-400" />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--tx)' }}>No legal notice records found</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '4px', maxWidth: '380px', margin: '4px auto 1.25rem auto' }}>
                    {isFiltered
                      ? 'No notices match your current filters. Try resetting the search or category filters.'
                      : 'Record your first statutory demand, Section 138 cheque bounce notice, or cease & desist notice.'}
                  </div>
                  {isFiltered ? (
                    <button className="btn btn-g btn-s" onClick={handleResetFilters}>
                      Reset Filters
                    </button>
                  ) : (
                    <button className="btn btn-p btn-s" onClick={() => openModal('add-notice')}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Record New Legal Notice
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredNotices.map((n) => {
                const diff = n.replyDueDate ? dDiff(n.replyDueDate) : null;
                const isExpired = diff !== null && diff < 0;
                const isUrgent = diff !== null && diff >= 0 && diff <= 3;

                return (
                  <tr
                    key={n.id}
                    onClick={() => openModal('notice-detail', n.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Notice Ref & Flow */}
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--pr)', fontFamily: 'var(--sans)' }}>
                        {n.noticeNo}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: n.direction === 'SENT' ? '#eff6ff' : '#fef3c7',
                            color: n.direction === 'SENT' ? '#1d4ed8' : '#92400e',
                            border: n.direction === 'SENT' ? '1px solid #bfdbfe' : '1px solid #fde68a',
                          }}
                        >
                          {n.direction === 'SENT' ? (
                            <>
                              <SendHorizontal className="w-2.5 h-2.5" /> Outward
                            </>
                          ) : (
                            <>
                              <Inbox className="w-2.5 h-2.5" /> Inward
                            </>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Parties (Whom to Whom) */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ fontSize: '0.83rem', color: 'var(--tx)' }}>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              background: '#2563eb',
                              color: '#ffffff',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              marginRight: '6px',
                            }}
                          >
                            FROM
                          </span>
                          <strong>{n.senderName}</strong>
                          {n.senderDesignation && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--tx2)', marginLeft: '4px' }}>
                              ({n.senderDesignation})
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.83rem', color: 'var(--tx)' }}>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              background: '#ec4899',
                              color: '#ffffff',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              marginRight: '6px',
                            }}
                          >
                            TO
                          </span>
                          <strong>{n.recipientName}</strong>
                          {n.recipientDesignation && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--tx2)', marginLeft: '4px' }}>
                              ({n.recipientDesignation})
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.73rem', color: 'var(--tx2)', marginTop: '2px' }}>
                          Client: <strong className="text-slate-800">{n.clientName}</strong>
                        </div>
                      </div>
                    </td>

                    {/* Subject Line & Category */}
                    <td>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.86rem',
                          color: 'var(--tx)',
                          lineHeight: 1.4,
                        }}
                      >
                        {n.subject}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '5px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: '#f1f5f9',
                            color: '#334155',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            border: '1px solid var(--bd)',
                          }}
                        >
                          {n.category}
                        </span>

                        {n.claimAmount && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: '#15803d',
                              background: '#f0fdf4',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              border: '1px solid #bbf7d0',
                            }}
                          >
                            {n.claimAmount}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Notice / Service Dates */}
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tx)' }}>
                        {n.noticeDate}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--tx2)', marginTop: '2px' }}>
                        {n.postalStatus === 'Delivered / Served' ? (
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>
                            Served {n.serviceDate || ''}
                          </span>
                        ) : (
                          <span>{n.dispatchMode?.split(' ')[0] || 'Dispatched'}</span>
                        )}
                      </div>
                      {n.trackingNo && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--tx2)', fontFamily: 'monospace', marginTop: '1px' }}>
                          {n.trackingNo}
                        </div>
                      )}
                    </td>

                    {/* Cure & Reply Due */}
                    <td>
                      <div
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          color: isExpired ? '#b91c1c' : isUrgent ? '#b45309' : 'var(--tx)',
                        }}
                      >
                        {n.replyDueDate || '—'}
                      </div>
                      <div style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                        {diff === null ? (
                          <span style={{ color: 'var(--tx2)' }}>—</span>
                        ) : diff === 0 ? (
                          <span style={{ color: '#b91c1c', fontWeight: 800 }}>DUE TODAY</span>
                        ) : diff > 0 ? (
                          <span style={{ color: isUrgent ? '#b45309' : 'var(--tx2)', fontWeight: isUrgent ? 700 : 500 }}>
                            {diff} days left ({n.curePeriodDays || 15}d cure)
                          </span>
                        ) : (
                          <span style={{ color: '#b91c1c', fontWeight: 700 }}>
                            Expired ({Math.abs(diff)}d ago)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          display: 'inline-block',
                          background:
                            n.status === 'Delivered / Served'
                              ? '#dcfce7'
                              : n.status === 'Reply Received' || n.status === 'Replied'
                              ? '#ede9fe'
                              : n.status === 'Settled / Complied'
                              ? '#e0f2fe'
                              : n.status === 'Expired / Actionable'
                              ? '#ffe4e6'
                              : '#f1f5f9',
                          color:
                            n.status === 'Delivered / Served'
                              ? '#15803d'
                              : n.status === 'Reply Received' || n.status === 'Replied'
                              ? '#6d28d9'
                              : n.status === 'Settled / Complied'
                              ? '#0369a1'
                              : n.status === 'Expired / Actionable'
                              ? '#be123c'
                              : '#475569',
                          border: '1px solid rgba(0,0,0,0.06)',
                        }}
                      >
                        {n.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-o btn-s"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal('notice-detail', n.id);
                          }}
                          title="View Details"
                          style={{ padding: '3px 7px' }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {canDeleteRecords && (
                          <button
                            className="btn btn-r btn-s"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete notice ${n.noticeNo}?`)) {
                                deleteLegalNotice(n.id);
                                showToast(`Notice ${n.noticeNo} deleted`, 'ok');
                              }
                            }}
                            title="Delete"
                            style={{ padding: '3px 7px' }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

