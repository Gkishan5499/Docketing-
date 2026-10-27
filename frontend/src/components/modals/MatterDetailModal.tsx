import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { bTy, bSt, dDiff, downloadDocumentFile, openDocumentFile } from '../../utils/helpers';
import { IprMatter, CourtMatter } from '../../types';
import { CreateFolderModal } from './CreateFolderModal';
import { UploadDocumentModal } from './UploadDocumentModal';
import {
  X,
  Calendar,
  Clock,
  StickyNote,
  FolderOpen,
  Trash2,
  Plus,
  Pencil,
  FileText,
  Building,
  User,
  Scale,
  FolderGit2,
  UploadCloud,
  FolderPlus,
  Download,
  Eye,
  ExternalLink,
  ChevronDown,
  Folder,
  Award,
  Image as ImageIcon,
} from 'lucide-react';

export const MatterDetailModal: React.FC = () => {
  const navigate = useNavigate();
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
    vaultFolders,
    ensureMatterFolders,
    uploadDocuments,
    deleteDocument,
    deleteIprMatter,
    updateIprMatter,
    deleteCourtMatter,
    canDeleteRecords,
    showToast,
  } = useLawyersDiary();

  const isOpen = modalState.type === 'matter-detail';
  const matterId = modalState.payload;

  const ipr = iprMatters.find((m) => m.id === matterId);
  const court = courtMatters.find((r) => r.id === matterId);
  const isIpr = !!ipr;
  const matter: IprMatter | CourtMatter | undefined = ipr || court;

  const title = matter ? (isIpr ? (matter as IprMatter).mark : (matter as CourtMatter).caseTitle) : '';
  const subType = matter?.type || '';

  const folderName = useMemo(() => {
    if (!matter) return '';
    return isIpr
      ? `${matter.type}_${(matter as IprMatter).appNo || 'App'}_${title.replace(/[^a-zA-Z0-9]/g, '_')}`
      : `${matter.type}_${((matter as CourtMatter).caseNo || 'Case').replace(/[^a-zA-Z0-9]/g, '_')}`;
  }, [matter, isIpr, title]);

  // Ensure matter folders exist in vault
  useEffect(() => {
    if (isOpen && matter && folderName) {
      ensureMatterFolders(matter.clientName, folderName);
    }
  }, [isOpen, matter?.id, matter?.clientName, folderName, ensureMatterFolders]);

  const matterClientPath = `/LawyersDiary/Clients/${(matter?.clientName || '').trim().replace(/[\\/:*?"<>|]/g, '_')}`;
  const existingMatterRoot = vaultFolders.find(
    (f) =>
      f.path.toLowerCase() === `${matterClientPath}/${folderName}`.toLowerCase() ||
      f.path.toLowerCase() === `/lawyersdiary/${folderName}`.toLowerCase() ||
      f.name.toLowerCase() === folderName.toLowerCase()
  );
  const matterRootPath = existingMatterRoot ? existingMatterRoot.path : `${matterClientPath}/${folderName}`;

  // Find subfolders under this matter
  const matterSubfolders = useMemo(() => {
    return vaultFolders.filter(
      (f) => f.parentPath === matterRootPath || (f.path.startsWith(matterRootPath + '/') && f.path !== matterRootPath)
    );
  }, [vaultFolders, matterRootPath]);

  // Documents matching this matter
  const matterDocs = useMemo(() => {
    if (!matter) return [];
    return documents.filter((d) => {
      if (d.matterId && d.matterId === matter.id) return true;
      if (d.folder && (d.folder === matterRootPath || d.folder.startsWith(matterRootPath + '/'))) return true;
      return false;
    });
  }, [documents, matter?.id, matterRootPath]);

  // UI States
  const [selectedVaultFolder, setSelectedVaultFolder] = useState<string>('');
  const [isLocalCreateFolderOpen, setIsLocalCreateFolderOpen] = useState(false);
  const [isLocalUploadOpen, setIsLocalUploadOpen] = useState(false);
  const [targetParentFolder, setTargetParentFolder] = useState<string>(matterRootPath);
  const [targetUploadFolder, setTargetUploadFolder] = useState<string>(matterRootPath);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const directFileInputRef = useRef<HTMLInputElement>(null);

  // Filtered documents by selected folder
  const filteredDocs = useMemo(() => {
    if (!selectedVaultFolder) return matterDocs;
    return matterDocs.filter(
      (d) => d.folder === selectedVaultFolder || (d.folder && d.folder.startsWith(selectedVaultFolder + '/'))
    );
  }, [matterDocs, selectedVaultFolder]);

  const countDocsInFolder = (path: string) => {
    return matterDocs.filter(
      (d) => d.folder === path || (d.folder && d.folder.startsWith(path + '/'))
    ).length;
  };

  const handleOpenCreateFolder = (parentPath?: string) => {
    setTargetParentFolder(parentPath || selectedVaultFolder || matterRootPath);
    setIsLocalCreateFolderOpen(true);
  };

  const handleOpenUpload = (targetFolder?: string) => {
    setTargetUploadFolder(targetFolder || selectedVaultFolder || matterRootPath);
    setIsLocalUploadOpen(true);
  };

  const handleOpenInFullVault = () => {
    closeModal();
    navigate(`/drv?folder=${encodeURIComponent(selectedVaultFolder || matterRootPath)}`);
  };

  const handleDirectDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (!matter) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dest = selectedVaultFolder || matterRootPath;
      uploadDocuments(e.dataTransfer.files, dest, matter.id, ['Matter Upload']);
      showToast(`${e.dataTransfer.files.length} document(s) uploaded to vault!`, 'ok');
    }
  };

  const handleDirectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!matter) return;
    if (e.target.files && e.target.files.length > 0) {
      const dest = selectedVaultFolder || matterRootPath;
      uploadDocuments(e.target.files, dest, matter.id, ['Matter Upload']);
      showToast(`${e.target.files.length} document(s) uploaded to vault!`, 'ok');
      e.target.value = '';
    }
  };

  if (!isOpen || !matterId || !matter) return null;

  const matterDeadlines = deadlines.filter((d) => d.matterId === matter.id);
  const matterLogs = workLogs.filter((l) => l.matterId === matter.id);
  const matterNotes = notes.filter((n) => n.matterId === matter.id);
  const totalHours = matterLogs.reduce((acc, l) => acc + (l.hours || 0), 0);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              type="button"
              className="btn btn-o btn-s"
              onClick={() => {
                closeModal();
                if (isIpr) {
                  openModal('edit-ipr', matter);
                } else {
                  openModal('edit-court', matter);
                }
              }}
              title="Edit Matter"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button className="mc" onClick={closeModal} title="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
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
                {isIpr && (matter as IprMatter).typeOfMark && (
                  <span className="chip" style={{ fontWeight: 600 }}>
                    {(matter as IprMatter).typeOfMark}
                  </span>
                )}
              </div>

              {isIpr && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      padding: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    {(matter as IprMatter).markImage ? (
                      <img
                        src={(matter as IprMatter).markImage}
                        alt={(matter as IprMatter).mark}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <Award className="w-7 h-7 text-amber-700/50" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                        {(matter as IprMatter).mark}
                      </span>
                      {(matter as IprMatter).typeOfMark && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: '#e0e7ff',
                            color: '#3730a3',
                          }}
                        >
                          {(matter as IprMatter).typeOfMark}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                      {(matter as IprMatter).markFileName ? (
                        <span>Specimen: <strong>{(matter as IprMatter).markFileName}</strong></span>
                      ) : (matter as IprMatter).markImage ? (
                        <span>Mark representation loaded</span>
                      ) : (
                        <span style={{ fontStyle: 'italic' }}>No mark image / representation uploaded yet</span>
                      )}
                    </div>
                    <div style={{ marginTop: '0.4rem' }}>
                      <label
                        style={{
                          fontSize: '0.72rem',
                          color: '#4f46e5',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'underline',
                        }}
                      >
                        <ImageIcon size={13} />
                        {(matter as IprMatter).markImage ? 'Change Mark Logo' : 'Attach Mark Logo / Artwork'}
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.svg,.webp,.pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const dest = selectedVaultFolder || matterRootPath;
                              uploadDocuments([file], dest, matter.id, [(matter as IprMatter).type, 'Representation']);
                              if (file.type.startsWith('image/')) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  updateIprMatter(matter.id, {
                                    markImage: ev.target?.result as string,
                                    markFileName: file.name,
                                  });
                                };
                                reader.readAsDataURL(file);
                              } else {
                                updateIprMatter(matter.id, {
                                  markFileName: file.name,
                                });
                              }
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

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
                          <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', fontSize: '0.82rem', fontWeight: 500 }}>Bench / Coram</td>
                          <td style={{ fontSize: '0.82rem' }}>{(matter as CourtMatter).bench}</td>
                        </tr>
                      )}
                      {(matter as CourtMatter).courtNo && (
                        <tr>
                          <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', fontSize: '0.82rem', fontWeight: 500 }}>Court Number</td>
                          <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>{(matter as CourtMatter).courtNo}</td>
                        </tr>
                      )}
                      {(matter as CourtMatter).judgeName && (
                        <tr>
                          <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', fontSize: '0.82rem', fontWeight: 500 }}>Judge Name</td>
                          <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>{(matter as CourtMatter).judgeName}</td>
                        </tr>
                      )}
                      {(matter as CourtMatter).vcLink && (
                        <tr>
                          <td style={{ color: 'var(--tx2)', padding: '0.35rem 0', fontSize: '0.82rem', fontWeight: 500 }}>Virtual Link (VC)</td>
                          <td style={{ fontSize: '0.82rem' }}>
                            <a
                              href={(matter as CourtMatter).vcLink?.startsWith('http') ? (matter as CourtMatter).vcLink : `https://${(matter as CourtMatter).vcLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'underline' }}
                            >
                              <span>Join VC Hearing</span>
                              <ExternalLink size={12} />
                            </a>
                          </td>
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
              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  className="btn btn-p btn-s"
                  onClick={() => openModal('add-docket', matter.id)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Hearing</span>
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
              {/* Drive Folder Tree Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--tx2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Document Vault Repository</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-g btn-s"
                    style={{ fontSize: '0.7rem', padding: '0.18rem 0.45rem', display: 'flex', alignItems: 'center', gap: '3px', borderRadius: '4px' }}
                    title="Create New Folder"
                    onClick={() => handleOpenCreateFolder()}
                  >
                    <FolderPlus size={12} className="text-sky-600" />
                    <span>+ Folder</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Interactive Folder Tree */}
              <div className="ft" style={{ marginBottom: '1rem', fontSize: '0.74rem', padding: '0.75rem 0.9rem' }}>
                <div className="ft-tree">
                  {/* Root matter folder */}
                  <div
                    className={`ft-node ${selectedVaultFolder === matterRootPath ? 'active' : ''}`}
                    onClick={() => setSelectedVaultFolder(selectedVaultFolder === matterRootPath ? '' : matterRootPath)}
                    title={`Click to filter by ${folderName}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <span className="sym">📁</span>
                      <span className="dir" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {folderName}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="ft-badge">{countDocsInFolder(matterRootPath)}</span>
                      <div className="ft-actions">
                        <button
                          type="button"
                          className="ft-action-btn"
                          title="Upload into this folder"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenUpload(matterRootPath);
                          }}
                        >
                          <UploadCloud size={11} />
                        </button>
                        <button
                          type="button"
                          className="ft-action-btn"
                          title="Create subfolder"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCreateFolder(matterRootPath);
                          }}
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Subfolders */}
                  {matterSubfolders.map((folder, idx) => {
                    const isLast = idx === matterSubfolders.length - 1;
                    const isSelected = selectedVaultFolder === folder.path;
                    const count = countDocsInFolder(folder.path);
                    return (
                      <div
                        key={folder.id}
                        className={`ft-node ${isSelected ? 'active' : ''}`}
                        style={{ paddingLeft: '1.2rem' }}
                        onClick={() => setSelectedVaultFolder(isSelected ? '' : folder.path)}
                        title={`Click to filter documents by ${folder.name}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                          <span className="sym">{isLast ? '└── 📁 ' : '├── 📁 '}</span>
                          <span style={{ color: folder.color || '#86efac', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {folder.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {count > 0 && <span className="ft-badge">{count}</span>}
                          <div className="ft-actions">
                            <button
                              type="button"
                              className="ft-action-btn"
                              title={`Upload to ${folder.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenUpload(folder.path);
                              }}
                            >
                              <UploadCloud size={11} />
                            </button>
                            <button
                              type="button"
                              className="ft-action-btn"
                              title={`Create subfolder in ${folder.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCreateFolder(folder.path);
                              }}
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedVaultFolder && (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px dashed #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ color: '#38bdf8' }}>
                      Filtered: <strong>{selectedVaultFolder.split('/').pop()}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedVaultFolder('')}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.7rem' }}
                    >
                      Show all matter files
                    </button>
                  </div>
                )}
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

              {/* Documents Header with Upload Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--tx2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Matter Documents ({filteredDocs.length})</span>
                </div>
                <button
                  type="button"
                  className="btn btn-p btn-s"
                  style={{ fontSize: '0.72rem', padding: '0.22rem 0.6rem', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '5px' }}
                  onClick={() => handleOpenUpload()}
                  title="Upload legal documents, petitions, orders or evidence"
                >
                  <UploadCloud size={13} />
                  <span>+ Upload File</span>
                </button>
              </div>

              {/* Document List & Dropzone */}
              <div>
                {filteredDocs.map((doc) => {
                  const docFolderName = doc.folder ? doc.folder.split('/').pop() : '';
                  return (
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
                        transition: 'border-color 0.15s ease',
                      }}
                      className="hover:border-slate-300"
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
                          title={doc.name}
                        >
                          {doc.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--tx3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{doc.size}</span>
                          {docFolderName && (
                            <span style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px', color: '#475569' }}>
                              📁 {docFolderName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-g btn-s"
                          style={{ padding: '0.25rem 0.4rem' }}
                          title="Preview Document"
                          onClick={() => openDocumentFile(doc)}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-g btn-s"
                          style={{ padding: '0.25rem 0.4rem' }}
                          title="Download Document"
                          onClick={() => downloadDocumentFile(doc)}
                        >
                          <Download size={13} />
                        </button>
                        {canDeleteRecords && (
                          <button
                            type="button"
                            className="btn btn-g btn-s text-rose-500 hover:text-rose-700"
                            style={{ padding: '0.25rem 0.4rem' }}
                            title="Delete Document"
                            onClick={() => {
                              if (window.confirm(`Delete document "${doc.name}"?`)) {
                                deleteDocument(doc.id);
                              }
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredDocs.length === 0 && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleDirectDrop}
                    onClick={() => directFileInputRef.current?.click()}
                    style={{
                      border: isDraggingFile ? '2px dashed var(--pr)' : '1px dashed var(--bd)',
                      background: isDraggingFile ? 'rgba(30, 58, 138, 0.05)' : '#f8fafc',
                      borderRadius: '8px',
                      padding: '1.5rem 1rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      marginBottom: '0.5rem',
                    }}
                    className="hover:bg-slate-100 transition-colors"
                  >
                    <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tx)', margin: '0 0 3px' }}>
                      No documents {selectedVaultFolder ? `in ${selectedVaultFolder.split('/').pop()}` : 'uploaded yet'}
                    </p>
                    <p style={{ fontSize: '0.74rem', color: 'var(--tx2)', margin: 0 }}>
                      Drag &amp; drop files here, or <span style={{ color: 'var(--pr)', fontWeight: 600, textDecoration: 'underline' }}>click to browse</span>
                    </p>
                  </div>
                )}

                <input
                  ref={directFileInputRef}
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleDirectFileChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mf" id="det-f">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-p btn-s"
              onClick={() => {
                closeModal();
                if (isIpr) {
                  openModal('edit-ipr', matter);
                } else {
                  openModal('edit-court', matter);
                }
              }}
              title="Edit Matter Details"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Matter</span>
            </button>
            {canDeleteRecords && (
              <button className="btn btn-d btn-s" onClick={handleDelete}>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Matter</span>
              </button>
            )}
          </div>
          <button className="btn btn-o" onClick={closeModal}>
            Close
          </button>
        </div>
      </div>

      {/* Local Sub-modals for Create Folder & Upload Document */}
      <CreateFolderModal
        isOpen={isLocalCreateFolderOpen}
        onClose={() => setIsLocalCreateFolderOpen(false)}
        defaultParentPath={targetParentFolder}
        onSuccess={(newPath) => {
          setSelectedVaultFolder(newPath);
          setIsLocalCreateFolderOpen(false);
        }}
      />

      <UploadDocumentModal
        isOpen={isLocalUploadOpen}
        onClose={() => setIsLocalUploadOpen(false)}
        defaultFolder={targetUploadFolder}
        defaultMatterId={matter.id}
        onSuccess={() => {
          setIsLocalUploadOpen(false);
        }}
        onOpenCreateFolder={(curFolder) => {
          setIsLocalUploadOpen(false);
          handleOpenCreateFolder(curFolder);
        }}
      />
    </div>
  );
};
