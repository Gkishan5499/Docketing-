import React, { useState } from 'react';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import { CourtType } from '../types';
import { bSt, dCell } from '../utils/helpers';
import {
  Landmark,
  Building2,
  Scale,
  ShieldAlert,
  Trees,
  Briefcase,
  ReceiptText,
  Layers,
  Gavel,
  Plus,
  Eye,
  Trash2,
  Filter,
} from 'lucide-react';

interface CourtMatterPageProps {
  type: CourtType;
}

interface CourtPageConfig {
  title: string;
  subtitle: string;
  addLabel: string;
  Icon: React.ComponentType<{ className?: string }>;
  filterOptions?: string[];
  filterPlaceholder?: string;
  headers: string[];
  cols: string[];
}

const FORUM_CONFIG: Record<CourtType, CourtPageConfig> = {
  SC: {
    title: 'Supreme Court of India',
    subtitle: 'Special Leave Petitions (SLP), Civil/Criminal Appeals, Writ Petitions, Review & Curative Petitions',
    addLabel: 'Add SC Petition',
    Icon: Landmark,
    headers: ['Case Number', 'Case Title & Parties', 'Nature of Matter', 'Bench / Coram', 'Filing Date', 'Next Hearing Date', 'Procedural Stage'],
    cols: ['caseNo', 'caseTitle', 'nature', 'bench', 'filingDate', 'nextDate', 'stage'],
  },
  HC: {
    title: 'High Court of Judicature',
    subtitle: 'Writ Petitions (Art 226), First/Second Appeals, Commercial IP Suits, Contempt & LPA',
    addLabel: 'Add HC Matter',
    Icon: Building2,
    filterPlaceholder: 'All High Courts',
    filterOptions: [
      'Delhi High Court',
      'Bombay High Court',
      'Madras High Court',
      'Calcutta High Court',
      'Allahabad High Court',
      'Karnataka High Court',
      'Gujarat High Court',
      'Rajasthan High Court',
      'Other',
    ],
    headers: ['Case Number', 'Case Title & Parties', 'High Court', 'Bench / Court', 'Nature', 'Filing Date', 'Next Hearing', 'Stage'],
    cols: ['caseNo', 'caseTitle', 'court', 'bench', 'nature', 'filingDate', 'nextDate', 'stage'],
  },
  DC: {
    title: 'District & Sessions Court',
    subtitle: 'Original Civil Suits, Commercial Injunctions, Summary Suits, Execution Petitions & Trials',
    addLabel: 'Add District Suit',
    Icon: Scale,
    headers: ['Case Number', 'Case Title & Parties', 'Court Complex', 'Nature of Suit', 'Filing Date', 'Next Date', 'Stage'],
    cols: ['caseNo', 'caseTitle', 'court', 'nature', 'filingDate', 'nextDate', 'stage'],
  },
  CC: {
    title: 'Consumer Disputes Forum',
    subtitle: 'NCDRC (National) · SCDRC (State) · DCDRC (District) — Consumer Protection Disputes',
    addLabel: 'Add Consumer Complaint',
    Icon: ShieldAlert,
    filterPlaceholder: 'All Consumer Forums',
    filterOptions: ['NCDRC', 'SCDRC', 'DCDRC'],
    headers: ['Case Number', 'Complaint Title', 'Forum Tier', 'Nature of Grievance', 'Filing Date', 'Next Date', 'Stage'],
    cols: ['caseNo', 'caseTitle', 'court', 'nature', 'filingDate', 'nextDate', 'stage'],
  },
  NGT: {
    title: 'National Green Tribunal (NGT)',
    subtitle: 'Environmental & Pollution Disputes, Forest Clearance, Wildlife Protection & Biodiversity',
    addLabel: 'Add NGT Application',
    Icon: Trees,
    filterPlaceholder: 'All NGT Benches',
    filterOptions: [
      'Principal Bench (Delhi)',
      'Pune Bench (Western)',
      'Bhopal Bench (Central)',
      'Chennai Bench (Southern)',
      'Kolkata Bench (Eastern)',
    ],
    headers: ['OA / Appeal No.', 'Matter Title', 'Zonal Bench', 'Statute / Nature', 'Filing Date', 'Next Date', 'Stage'],
    cols: ['caseNo', 'caseTitle', 'court', 'nature', 'filingDate', 'nextDate', 'stage'],
  },
  NCLT: {
    title: 'NCLT & NCLAT',
    subtitle: 'Insolvency & Bankruptcy Code (IBC 2016), Companies Act, Mergers & Oppression/Mismanagement',
    addLabel: 'Add NCLT Petition',
    Icon: Briefcase,
    filterPlaceholder: 'All NCLT / NCLAT Benches',
    filterOptions: [
      'NCLT Delhi (PB)',
      'NCLT Mumbai',
      'NCLT Chennai',
      'NCLT Kolkata',
      'NCLAT Delhi (Appellate)',
      'NCLAT Chennai',
    ],
    headers: ['CP / CA Number', 'Company & Parties', 'Tribunal Bench', 'Section / Nature', 'Filing Date', 'Next Date', 'Stage'],
    cols: ['caseNo', 'caseTitle', 'court', 'nature', 'filingDate', 'nextDate', 'stage'],
  },
  ITAT: {
    title: 'Income Tax Appellate Tribunal (ITAT)',
    subtitle: 'Direct Tax Appeals, CIT(Appeals) Orders, Transfer Pricing & Assessment Disputes',
    addLabel: 'Add ITAT Appeal',
    Icon: ReceiptText,
    filterPlaceholder: 'All ITAT Benches',
    filterOptions: [
      'Delhi Bench',
      'Mumbai Bench',
      'Bangalore Bench',
      'Chennai Bench',
      'Kolkata Bench',
      'Ahmedabad Bench',
    ],
    headers: ['ITA Number', 'Assessee vs Revenue', 'Bench Division', 'Assessment Year', 'Filing Date', 'Next Date', 'Stage'],
    cols: ['caseNo', 'caseTitle', 'court', 'nature', 'filingDate', 'nextDate', 'stage'],
  },
  DRT: {
    title: 'Debt Recovery Tribunal (DRT / DRAT)',
    subtitle: 'SARFAESI Proceedings, Recovery Certificates, Securitization Applications & Bank Disputes',
    addLabel: 'Add DRT Application',
    Icon: Landmark,
    filterPlaceholder: 'All DRT / DRAT Forums',
    filterOptions: [
      'DRT Delhi (I, II, III)',
      'DRT Mumbai',
      'DRT Bangalore',
      'DRT Chennai',
      'DRAT Delhi (Appellate)',
      'DRAT Mumbai',
    ],
    headers: ['OA / SA Number', 'Borrower vs Bank', 'Tribunal Bench', 'Loan / Claim Nature', 'Filing Date', 'Next Date', 'Stage'],
    cols: ['caseNo', 'caseTitle', 'court', 'nature', 'filingDate', 'nextDate', 'stage'],
  },
  CAT: {
    title: 'Central Administrative Tribunal (CAT)',
    subtitle: 'Service Jurisprudence, Disciplinary Inquiries, Seniority, Promotions & Pay Scale Disputes',
    addLabel: 'Add CAT Application',
    Icon: Layers,
    filterPlaceholder: 'All CAT Benches',
    filterOptions: [
      'Principal Bench (Delhi)',
      'Mumbai Bench',
      'Chennai Bench',
      'Kolkata Bench',
      'Bangalore Bench',
      'Chandigarh Bench',
    ],
    headers: ['OA Number', 'Applicant vs Union of India', 'Bench Location', 'Ministry / Department', 'Filing Date', 'Next Date', 'Stage'],
    cols: ['caseNo', 'caseTitle', 'court', 'nature', 'filingDate', 'nextDate', 'stage'],
  },
  ARB: {
    title: 'Arbitration & Conciliation',
    subtitle: 'Commercial Arbitration — DIAC, SIAC, ICC, LCIA, MCIA & Ad-hoc Arbitration Proceedings',
    addLabel: 'Add Arbitration Claim',
    Icon: Gavel,
    filterPlaceholder: 'All Arbitration Institutions',
    filterOptions: [
      'Ad-hoc Arbitration',
      'DIAC (Delhi Int. Arb. Centre)',
      'MCIA (Mumbai)',
      'SIAC (Singapore)',
      'ICC (Paris)',
      'LCIA (London)',
      'ICA (Indian Council of Arb.)',
    ],
    headers: ['Arb Case Number', 'Claimant vs Respondent', 'Arbitral Institution', 'Contract / Dispute Nature', 'Filing Date', 'Next Hearing', 'Stage'],
    cols: ['caseNo', 'caseTitle', 'court', 'nature', 'filingDate', 'nextDate', 'stage'],
  },
};

export const CourtMatterPage: React.FC<CourtMatterPageProps> = ({ type }) => {
  const { courtMatters, openModal, deleteCourtMatter, canDeleteRecords } = useLawyersDiary();
  const [filterVal, setFilterVal] = useState('');

  const config = FORUM_CONFIG[type];

  const matters = courtMatters.filter((r) => {
    if (r.type !== type) return false;
    if (!filterVal) return true;
    return (
      (r.court && r.court.toLowerCase().includes(filterVal.toLowerCase())) ||
      (r.bench && r.bench.toLowerCase().includes(filterVal.toLowerCase())) ||
      (r.stage && r.stage.toLowerCase().includes(filterVal.toLowerCase()))
    );
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete case "${title}"?`)) {
      deleteCourtMatter(id);
    }
  };

  return (
    <div className="pg on">
      {/* Header */}
      <div className="ph">
        <div>
          <div className="flex items-center gap-2.5">
            <config.Icon className="w-6 h-6 text-slate-800" />
            <h1>{config.title}</h1>
          </div>
          <p>{config.subtitle}</p>
        </div>
        <div className="pa">
          {config.filterOptions && (
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterVal}
                onChange={(e) => setFilterVal(e.target.value)}
                style={{
                  padding: '0.42rem 0.75rem',
                  fontSize: '0.78rem',
                  border: '1px solid var(--bd2)',
                  borderRadius: '8px',
                  outline: 'none',
                  fontFamily: 'var(--sans)',
                }}
              >
                <option value="">{config.filterPlaceholder || 'All Benches'}</option>
                {config.filterOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="btn btn-p btn-s"
            onClick={() => openModal('add-court', type)}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{config.addLabel}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="tw">
        <table>
          <thead>
            <tr>
              {config.headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {matters.map((r) => (
              <tr
                key={r.id}
                onClick={() => openModal('matter-detail', r.id)}
              >
                {config.cols.map((colKey, colIdx) => {
                  if (colKey === 'caseNo') {
                    return (
                      <td key={colIdx} className="tm">
                        {r.caseNo}
                      </td>
                    );
                  }
                  if (colKey === 'caseTitle') {
                    return (
                      <td key={colIdx}>
                        <div style={{ fontWeight: 600, color: 'var(--tx)', fontSize: '0.88rem' }}>
                          {r.caseTitle}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--tx2)', marginTop: '2px' }}>
                          Client: <strong>{r.clientName}</strong>
                        </div>
                      </td>
                    );
                  }
                  if (colKey === 'stage') {
                    return (
                      <td key={colIdx}>
                        <span className={`bg2 ${bSt(r.stage)}`}>{r.stage || 'Pending'}</span>
                      </td>
                    );
                  }
                  if (colKey === 'nextDate') {
                    return (
                      <td
                        key={colIdx}
                        dangerouslySetInnerHTML={{ __html: dCell(r.nextDate) }}
                      />
                    );
                  }
                  return (
                    <td key={colIdx} style={{ fontSize: '0.82rem', color: 'var(--tx2)' }}>
                      {(r as any)[colKey] || '—'}
                    </td>
                  );
                })}

                {/* Actions */}
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                    <button
                      className="btn btn-o btn-s"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal('matter-detail', r.id);
                      }}
                      title="Inspect Case Docket"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                    {canDeleteRecords && <button
                      className="btn btn-d btn-s"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(r.id, r.caseTitle);
                      }}
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>}
                  </div>
                </td>
              </tr>
            ))}

            {matters.length === 0 && (
              <tr>
                <td
                  colSpan={config.headers.length + 1}
                  style={{ textAlign: 'center', padding: '3rem', color: 'var(--tx2)' }}
                >
                  <config.Icon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p>No {config.title} matters found. Click &quot;{config.addLabel}&quot; to enroll a new case.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
