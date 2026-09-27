import React from 'react';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { bTy, bSt, dDiff } from '../../utils/helpers';
import { IprMatter, CourtMatter } from '../../types';
import {
  X,
  Calendar,
  Clock,
  StickyNote,
  FolderOpen,
  Trash2,
  Plus,
  FileText,
  Building,
  User,
  Scale,
  FolderGit2,
} from 'lucide-react';

export const MatterDetailModal: React.FC = () => {
  const {
    modalState,
    closeModal,
    openModal,
    iprMatters,
    courtMatters,
    deadlines,
    documents,
    workLogs,
    notes,
    deleteIprMatter,
    deleteCourtMatter,
    canDeleteRecords,
    showToast,
  } = useLawyersDiary();

  const isOpen = modalState.type === 'matter-detail';
  const matterId = modalState.payload;

  if (!isOpen || !matterId) return null;

  const ipr = iprMatters.find((m) => m.id === matterId);
  const court = courtMatters.find((r) => r.id === matterId);
  const isIpr = !!ipr;
  const matter: IprMatter | CourtMatter | undefined = ipr || court;

  if (!matter) return null;

  const matterDeadlines = deadlines.filter((d) => d.matterId === matter.id);
  const matterDocs = documents.filter((d) => d.matterId === matter.id);
  const matterLogs = workLogs.filter((l) => l.matterId === matter.id);
  const matterNotes = notes.filter((n) => n.matterId === matter.id);
  const totalHours = matterLogs.reduce((acc, l) => acc + (l.hours || 0), 0);

  const title = isIpr ? (matter as IprMatter).mark : (matter as CourtMatter).caseTitle;
  const subType = matter.type;

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this matter: "${title}"?`)) {
      if (isIpr) {
        deleteIprMatter(matter.id);
      } else {
        deleteCourtMatter(matter.id);
      }
      closeModal();
    }
  };

  const folderName = isIpr
    ? `${matter.type}_${(matter as IprMatter).appNo || 'App'}_${title.replace(/[^a-zA-Z0-9]/g, '_')}`
    : `${matter.type}_${((matter as CourtMatter).caseNo || 'Case').replace(/[^a-zA-Z0-9]/g, '_')}`;

  return (
    <div className="ov op" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="mo lg">
        {/* Header */}
        <div className="mh">
          <div>
            <h3 id="det-t" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span>{title}</span>
              <span className="mo-t" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--bd)', borderRadius: '4px' }}>
                {subType}
              </span>
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--tx2)', marginTop: '2px' }}>
              Client: <strong>{matter.clientName}</strong> · Filed: {matter.filingDate || '—'}
            </div>
          </div>
          <button className="mc" onClick={closeModal} title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="mb" id="det-b">
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
            {/* Left Column: Metadata, Stages, Actions */}
            <div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span className={`bg2 ${bTy(matter.type)}`}>{matter.type}</span>
                <span
                  className={`bg2 ${bSt(
                    isIpr ? (matter as IprMatter).status : (matter as CourtMatter).stage
                  )}`}
                >
                  {isIpr
                    ? (matter as IprMatter).status || 'Pending'
                    : (matter as CourtMatter).stage || 'Filed'}
                </span>
                {matter.priority && (
                  <span
                    className={`chip ${matter.priority === 'h' ? 'rd' : 'gd'}`}
                    style={{ fontWeight: 700 }}
                  >
                    {matter.priority === 'h' ? 'High Priority' : 'Normal Priority'}
                  </span>
                )}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {isIpr ? (
                    <>
                      <tr>
                        <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', width: '110px', fontSize: '0.82rem', fontWeight: 500 }}>
                          Application No.
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--tx)', fontSize: '0.82rem' }}>
                          {(matter as IprMatter).appNo}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', fontSize: '0.82rem', fontWeight: 500 }}>Client Entity</td>
                        <td style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tx)' }}>
                          {matter.clientName}
                        </td>
                      </tr>
                      {(matter as IprMatter).classes && (
                        <tr>
                          <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', fontSize: '0.82rem', fontWeight: 500 }}>Nice Classes</td>
                          <td style={{ fontSize: '0.82rem' }}>{(matter as IprMatter).classes}</td>
                        </tr>
                      )}
                      {(matter as IprMatter).nature && (
                        <tr>
                          <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', fontSize: '0.82rem', fontWeight: 500 }}>Nature / Goods</td>
                          <td style={{ fontSize: '0.82rem' }}>{(matter as IprMatter).nature}</td>
                        </tr>
                      )}
                      {(matter as IprMatter).area && (
                        <tr>
                          <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', fontSize: '0.82rem', fontWeight: 500 }}>Jurisdiction</td>
                          <td style={{ fontSize: '0.82rem' }}>{(matter as IprMatter).area}</td>
                        </tr>
                      )}
                    </>
                  ) : (
                    <>
                      <tr>
                        <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', width: '110px', fontSize: '0.82rem', fontWeight: 500 }}>
                          Case No.
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--tx)', fontSize: '0.82rem' }}>
                          {(matter as CourtMatter).caseNo}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', fontSize: '0.82rem', fontWeight: 500 }}>Client Entity</td>
                        <td style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tx)' }}>
                          {matter.clientName}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', fontSize: '0.82rem', fontWeight: 500 }}>Court / Forum</td>
                        <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>{(matter as CourtMatter).court}</td>
                      </tr>
                      {(matter as CourtMatter).bench && (
                        <tr>
                          <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', fontSize: '0.82rem', fontWeight: 500 }}>Bench / Judge</td>
                          <td style={{ fontSize: '0.82rem' }}>{(matter as CourtMatter).bench}</td>
                        </tr>
                      )}
                      {(matter as CourtMatter).nature && (
                        <tr>
                          <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', fontSize: '0.82rem', fontWeight: 500 }}>Case Nature</td>
                          <td style={{ fontSize: '0.82rem' }}>{(matter as CourtMatter).nature}</td>
                        </tr>
                      )}
                    </>
                  )}

                  <tr>
                    <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', fontSize: '0.82rem', fontWeight: 500 }}>Filing Date</td>
                    <td style={{ fontSize: '0.82rem' }}>{matter.filingDate || '—'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', fontSize: '0.82rem', fontWeight: 500 }}>Next Listing</td>
                    <td style={{ fontWeight: 700, color: 'var(--gd)', fontSize: '0.82rem' }}>
                      {matter.nextDate || '—'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', fontSize: '0.82rem', fontWeight: 500 }}>Lead Advocate</td>
                    <td style={{ fontSize: '0.82rem' }}>{matter.attorney || '—'}</td>
                  </tr>
                  {matter.notes && (
                    <tr>
                      <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', fontSize: '0.82rem', verticalAlign: 'top', fontWeight: 500 }}>
                        Brief Notes
                      </td>
                      <td style={{ fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--tx)' }}>{matter.notes}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Status History */}
              {matter.statusHistory && matter.statusHistory.length > 0 && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--tx2)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Procedural Stage Timeline
                  </div>
                  {matter.statusHistory.map((s, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', padding: '0.35rem 0' }}>
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'var(--gd)',
                          marginTop: '0.4rem',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tx)' }}>
                          {s.status}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--tx3)', marginLeft: '0.5rem' }}>
                          {s.date}
                        </span>
                        {s.note && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--tx2)', marginTop: '2px' }}>{s.note}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Work Log summary */}
              {matterLogs.length > 0 && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '0.85rem 1rem',
                    background: 'var(--gdlt)',
                    border: '1px solid #fef3c7',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gd)', marginBottom: '0.4rem' }}>
                    Advocate Work Sessions – {totalHours}h ({matterLogs.length} entries)
                  </div>
                  {matterLogs.slice(0, 2).map((l) => (
                    <div
                      key={l.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span
                        style={{
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          maxWidth: '200px',
                        }}
                      >
                        {l.task}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--gd)', flexShrink: 0, marginLeft: '0.5rem' }}>
                        {l.hours}h
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Action Buttons */}
              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-p btn-s"
                  onClick={() => openModal('add-docket', matter.id)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Hearing</span>
                </button>
                <button
                  className="btn btn-o btn-s"
                  onClick={() => showToast(`Opening Document Vault Folder: ${folderName}`, 'in')}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Document Vault</span>
                </button>
                <button
                  className="btn btn-g btn-s"
                  onClick={() => openModal('log-time', { matterId: matter.id, matterName: title })}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Log Time</span>
                </button>
                <button
                  className="btn btn-g btn-s"
                  onClick={() => openModal('note', { matterId: matter.id, matterName: title })}
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  <span>Add Note</span>
                </button>
              </div>
            </div>

            {/* Right Column: Document Vault Folders, Hearings, Documents */}
            <div>
              {/* Drive Folder Tree */}
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--tx2)',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FolderGit2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Document Vault Repository</span>
              </div>
              <div className="ft" style={{ marginBottom: '1rem', fontSize: '0.74rem' }}>
                <div>
                  <span className="sym">📁 </span>
                  <span className="dir">{folderName}</span>
                </div>
                <div style={{ paddingLeft: '1.2rem' }}>
                  <span className="sym">├── 📁 </span>
                  <span style={{ color: '#86efac' }}>Pleadings</span>
                </div>
                <div style={{ paddingLeft: '1.2rem' }}>
                  <span className="sym">├── 📁 </span>
                  <span style={{ color: '#86efac' }}>Orders_Judgments</span>
                </div>
                <div style={{ paddingLeft: '1.2rem' }}>
                  <span className="sym">├── 📁 </span>
                  <span style={{ color: '#86efac' }}>Evidence_Exhibits</span>
                </div>
                <div style={{ paddingLeft: '1.2rem' }}>
                  <span className="sym">├── 📁 </span>
                  <span style={{ color: '#86efac' }}>Written_Arguments</span>
                </div>
                <div style={{ paddingLeft: '1.2rem' }}>
                  <span className="sym">└── 📁 </span>
                  <span style={{ color: '#86efac' }}>Client_Communication</span>
                </div>
              </div>

              {/* Hearings & Deadlines */}
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--tx2)',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                <span>Scheduled Hearings &amp; Deadlines ({matterDeadlines.length})</span>
              </div>
              <div className="dl2" style={{ marginBottom: '1rem' }}>
                {matterDeadlines.map((d) => {
                  const diff = dDiff(d.date);
                  const lbl =
                    diff === 0
                      ? 'TODAY'
                      : diff === 1
                      ? 'Tomorrow'
                      : diff !== null && diff < 0
                      ? 'OVERDUE'
                      : `${diff}d left`;
                  const tagClass =
                    diff !== null && diff <= 3 ? 'du' : diff !== null && diff <= 14 ? 'dw' : 'dok';
                  return (
                    <div key={d.id} className={`di ${d.priority}`} style={{ padding: '0.5rem 0.75rem' }}>
                      <div className="dinfo">
                        <div className="dtitle" style={{ fontSize: '0.84rem' }}>{d.type}</div>
                        <div className="dsub" style={{ fontSize: '0.74rem' }}>
                          {d.date}
                          {d.venue ? ` · ${d.venue}` : ''}
                        </div>
                      </div>
                      <span className={`ddys ${tagClass}`}>{lbl}</span>
                    </div>
                  );
                })}
                {matterDeadlines.length === 0 && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--tx3)', padding: '0.5rem 0' }}>No hearings scheduled.</p>
                )}
              </div>

              {/* Documents */}
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--tx2)',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Matter Documents ({matterDocs.length})</span>
              </div>
              <div>
                {matterDocs.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.5rem 0.75rem',
                      background: '#fff',
                      border: '1px solid var(--bd)',
                      borderRadius: '6px',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <div
                      style={{
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        background: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                      }}
                    >
                      {doc.type.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: 'var(--tx)',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {doc.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--tx3)' }}>{doc.size}</div>
                    </div>
                  </div>
                ))}
                {matterDocs.length === 0 && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--tx3)', padding: '0.5rem 0' }}>No documents uploaded to this folder yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mf" id="det-f">
          {canDeleteRecords && <button className="btn btn-d btn-s" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Matter</span>
          </button>}
          <button className="btn btn-o" onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
