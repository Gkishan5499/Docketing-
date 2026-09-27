import React, { useState } from 'react';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import { IprType } from '../types';
import { bSt, dCell } from '../utils/helpers';
import { Plus, Eye, Trash2, Filter, Award, Lightbulb, FileCheck2, Boxes, MapPin } from 'lucide-react';

interface IprMatterPageProps {
  type: IprType;
}

const IPR_CONFIG: Record<
  IprType,
  {
    title: string;
    subtitle: string;
    addLabel: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  TM: {
    title: 'Trademark Docket (TM)',
    subtitle: 'Applications, Examination, Examination Reports (FER), Hearings, Oppositions & Renewals',
    addLabel: 'Add Trademark',
    Icon: Award,
  },
  PAT: {
    title: 'Patent Portfolio (PAT)',
    subtitle: 'Provisional/Complete Specifications, FER Responses, Pre-grant Oppositions & Grants',
    addLabel: 'Add Patent',
    Icon: Lightbulb,
  },
  COPY: {
    title: 'Copyright Registry (CR)',
    subtitle: 'Literary, Artistic, Dramatic, Cinematograph, Software Works & Discrepancy Letters',
    addLabel: 'Add Copyright',
    Icon: FileCheck2,
  },
  DESIGN: {
    title: 'Industrial Design Docket',
    subtitle: 'Locarno Classification, Novelty Examination, Objections & Design Certifications',
    addLabel: 'Add Design',
    Icon: Boxes,
  },
  GI: {
    title: 'Geographical Indications (GI)',
    subtitle: 'Statutory Registration, Authorized User Filings & GI Registry (Chennai) Oppositions',
    addLabel: 'Add GI Tag',
    Icon: MapPin,
  },
};

export const IprMatterPage: React.FC<IprMatterPageProps> = ({ type }) => {
  const { iprMatters, openModal, deleteIprMatter, canDeleteRecords } = useLawyersDiary();
  const [statusFilter, setStatusFilter] = useState('');

  const config = IPR_CONFIG[type];

  const matters = iprMatters.filter(
    (m) => m.type === type && (!statusFilter || m.status === statusFilter)
  );

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteIprMatter(id);
    }
  };

  return (
    <div className="pg on">
      {/* Header */}
      <div className="ph">
        <div>
          <div className="flex items-center gap-2.5">
            <config.Icon className="w-6 h-6 text-amber-700" />
            <h1>{config.title}</h1>
          </div>
          <p>{config.subtitle}</p>
        </div>
        <div className="pa">
          {type === 'TM' && (
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '0.42rem 0.75rem',
                  fontSize: '0.78rem',
                  border: '1px solid var(--bd2)',
                  borderRadius: '8px',
                  outline: 'none',
                  fontFamily: 'var(--sans)',
                }}
              >
                <option value="">All Statuses</option>
                <option>Pending</option>
                <option>Under Examination</option>
                <option>FER Issued</option>
                <option>Hearing Fixed</option>
                <option>Opposed</option>
                <option>Registered</option>
                <option>Renewal Due</option>
              </select>
            </div>
          )}
          <button
            className="btn btn-p btn-s"
            onClick={() => openModal('add-ipr', type)}
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
            {type === 'TM' && (
              <tr>
                <th>App Number</th>
                <th>Wordmark / Device</th>
                <th>Client Entity</th>
                <th>Class</th>
                <th>Filing Date</th>
                <th>Next Statutory Date</th>
                <th>Current Status</th>
                <th>Pri</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            )}
            {type === 'PAT' && (
              <tr>
                <th>App Number</th>
                <th>Title / Invention</th>
                <th>Applicant / Client</th>
                <th>Inventors</th>
                <th>Filing Date</th>
                <th>Next Action Date</th>
                <th>Current Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            )}
            {type === 'COPY' && (
              <tr>
                <th>Diary / ROC No.</th>
                <th>Title of Work</th>
                <th>Work Category</th>
                <th>Author / Applicant</th>
                <th>Filing Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            )}
            {type === 'DESIGN' && (
              <tr>
                <th>App Number</th>
                <th>Article Name</th>
                <th>Design Class</th>
                <th>Proprietor</th>
                <th>Filing Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            )}
            {type === 'GI' && (
              <tr>
                <th>GI App Number</th>
                <th>Geographical Indication</th>
                <th>Goods Category</th>
                <th>Origin Area</th>
                <th>Applicant Society</th>
                <th>Filing Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            )}
          </thead>
          <tbody>
            {matters.map((m) => (
              <tr
                key={m.id}
                onClick={() => openModal('matter-detail', m.id)}
              >
                {type === 'TM' && (
                  <>
                    <td className="tm">{m.appNo}</td>
                    <td>
                      <strong style={{ color: 'var(--tx)', fontSize: '0.88rem' }}>{m.mark}</strong>
                    </td>
                    <td style={{ fontWeight: 500 }}>{m.clientName}</td>
                    <td>
                      <span className="chip" style={{ fontWeight: 700 }}>
                        Cl {m.classes || '—'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--tx2)' }}>{m.filingDate}</td>
                    <td dangerouslySetInnerHTML={{ __html: dCell(m.nextDate) }} />
                    <td>
                      <span className={`bg2 ${bSt(m.status)}`}>{m.status}</span>
                    </td>
                    <td>
                      <span
                        className={`pd ${
                          m.priority === 'h' ? 'pdh' : m.priority === 'm' ? 'pdm' : 'pdl'
                        }`}
                        title={m.priority === 'h' ? 'High' : m.priority === 'm' ? 'Medium' : 'Normal'}
                      />
                    </td>
                  </>
                )}

                {type === 'PAT' && (
                  <>
                    <td className="tm">{m.appNo}</td>
                    <td>
                      <strong style={{ color: 'var(--tx)', fontSize: '0.88rem' }}>{m.mark}</strong>
                    </td>
                    <td style={{ fontWeight: 500 }}>{m.clientName}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--tx2)' }}>{m.inventors || '—'}</td>
                    <td style={{ color: 'var(--tx2)' }}>{m.filingDate}</td>
                    <td dangerouslySetInnerHTML={{ __html: dCell(m.nextDate) }} />
                    <td>
                      <span className={`bg2 ${bSt(m.status)}`}>{m.status}</span>
                    </td>
                  </>
                )}

                {type === 'COPY' && (
                  <>
                    <td className="tm">{m.appNo}</td>
                    <td>
                      <strong style={{ color: 'var(--tx)', fontSize: '0.88rem' }}>{m.mark}</strong>
                    </td>
                    <td>
                      <span className="chip">{m.nature || '—'}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{m.clientName}</td>
                    <td style={{ color: 'var(--tx2)' }}>{m.filingDate}</td>
                    <td>
                      <span className={`bg2 ${bSt(m.status)}`}>{m.status}</span>
                    </td>
                  </>
                )}

                {type === 'DESIGN' && (
                  <>
                    <td className="tm">{m.appNo}</td>
                    <td>
                      <strong style={{ color: 'var(--tx)', fontSize: '0.88rem' }}>{m.mark}</strong>
                    </td>
                    <td>
                      <span className="chip">Class {m.designClass || '—'}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{m.clientName}</td>
                    <td style={{ color: 'var(--tx2)' }}>{m.filingDate}</td>
                    <td>
                      <span className={`bg2 ${bSt(m.status)}`}>{m.status}</span>
                    </td>
                  </>
                )}

                {type === 'GI' && (
                  <>
                    <td className="tm">{m.appNo}</td>
                    <td>
                      <strong style={{ color: 'var(--tx)', fontSize: '0.88rem' }}>{m.mark}</strong>
                    </td>
                    <td>
                      <span className="chip">{m.goods || '—'}</span>
                    </td>
                    <td style={{ color: 'var(--tx2)' }}>{m.area || '—'}</td>
                    <td style={{ fontWeight: 500 }}>{m.clientName}</td>
                    <td style={{ color: 'var(--tx2)' }}>{m.filingDate}</td>
                    <td>
                      <span className={`bg2 ${bSt(m.status)}`}>{m.status}</span>
                    </td>
                  </>
                )}

                {/* Actions */}
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                    <button
                      className="btn btn-o btn-s"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal('matter-detail', m.id);
                      }}
                      title="Inspect File"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                    {canDeleteRecords && <button
                      className="btn btn-d btn-s"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(m.id, m.mark);
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
                  colSpan={10}
                  style={{ textAlign: 'center', padding: '3rem', color: 'var(--tx2)' }}
                >
                  <config.Icon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p>No active {config.title} records found. Click &quot;{config.addLabel}&quot; to create a new docket file.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
