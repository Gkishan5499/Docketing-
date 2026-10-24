import React, { useState, useEffect, useRef } from 'react';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { IprType, PriorityLevel } from '../../types';
import {
  X,
  Award,
  FolderOpen,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  FileCheck2,
  Lightbulb,
  Boxes,
  MapPin,
  Paperclip,
} from 'lucide-react';

const TN: Record<IprType, string> = {
  TM: 'Trademark',
  PAT: 'Patent',
  COPY: 'Copyright',
  DESIGN: 'Design',
  GI: 'GI Tag',
};

const TYPE_ICONS: Record<IprType, React.ComponentType<{ className?: string }>> = {
  TM: Award,
  PAT: Lightbulb,
  COPY: FileCheck2,
  DESIGN: Boxes,
  GI: MapPin,
};

export const AddIprMatterModal: React.FC = () => {
  const { modalState, closeModal, clients, addIprMatter, showToast } = useLawyersDiary();

  const isOpen = modalState.type === 'add-ipr';
  const initialType: IprType = modalState.payload || 'TM';

  const [activeType, setActiveType] = useState<IprType>(initialType);
  const [clientId, setClientId] = useState('');
  const [appNo, setAppNo] = useState('');
  const [mark, setMark] = useState('');
  const [typeOfMark, setTypeOfMark] = useState('Device / Logo Mark');
  const [classes, setClasses] = useState('');
  const [inventors, setInventors] = useState('');
  const [nature, setNature] = useState('Literary / Dramatic');
  const [designClass, setDesignClass] = useState('');
  const [goods, setGoods] = useState('');
  const [area, setArea] = useState('');
  const [filingDate, setFilingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Pending');
  const [nextDate, setNextDate] = useState('');
  const [attorney, setAttorney] = useState('Self');
  const [priority, setPriority] = useState<PriorityLevel>('m');
  const [notes, setNotes] = useState('');

  // Upload state
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [markImagePreview, setMarkImagePreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modalState.payload && ['TM', 'PAT', 'COPY', 'DESIGN', 'GI'].includes(modalState.payload)) {
      setActiveType(modalState.payload);
    }
  }, [modalState.payload]);

  if (!isOpen) return null;

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);

    // Look for image to preview mark representation
    const imgFile = incoming.find((f) => f.type.startsWith('image/'));
    if (imgFile) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setMarkImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(imgFile);
    }

    setAttachedFiles((prev) => [...prev, ...incoming]);
    showToast(`${incoming.length} file(s) attached to matter`, 'ok');
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (removed && removed.type.startsWith('image/')) {
        const remainingImg = next.find((f) => f.type.startsWith('image/'));
        if (remainingImg) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setMarkImagePreview(ev.target?.result as string);
          };
          reader.readAsDataURL(remainingImg);
        } else {
          setMarkImagePreview('');
        }
      }
      return next;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getUploadConfig = () => {
    switch (activeType) {
      case 'TM':
        if (['Device / Logo Mark', 'Combined Mark', '3D Shape Mark', 'Colour Combination'].includes(typeOfMark)) {
          return {
            title: 'Mark Representation / Logo Artwork',
            badge: 'Required for Device & Combined Marks',
            badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
            desc: 'Upload high-resolution mark logo, emblem, label, or 3D view (PNG, JPG, SVG, PDF up to 25 MB). Required for official Trademark Journal advertisement under Rule 26.',
            accept: '.png,.jpg,.jpeg,.svg,.webp,.pdf',
            fileTag: 'Logo Representation',
          };
        } else if (typeOfMark === 'Sound Mark') {
          return {
            title: 'Sound Mark Audio & Musical Score',
            badge: 'Sound Recording Specimen',
            badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
            desc: 'Upload sound recording MP3/WAV audio clip or graphical musical staff notation (PDF) under Trade Marks Rule 26(5).',
            accept: '.mp3,.wav,.ogg,.pdf',
            fileTag: 'Sound Mark Recording',
          };
        } else {
          return {
            title: 'Trademark Application Documents & POA',
            badge: 'Supporting Filing Documents',
            badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
            desc: 'Attach Form TM-A receipt, Power of Attorney (TM-48), or User Affidavit with prior commercial use specimen (PDF, DOCX, Images).',
            accept: '.pdf,.doc,.docx,.png,.jpg,.jpeg',
            fileTag: 'TM Filing Document',
          };
        }
      case 'COPY':
        return {
          title: 'Deposit Work Copy & Specimen File',
          badge: 'Statutory Deposit Copy',
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          desc: `Upload deposit copy for "${nature}" work (PDF, DOCX, Source Code ZIP/TXT, Image, or Audio) to accompany the Form XIV Copyright application.`,
          accept: '.pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.txt,.mp3,.wav,.mp4',
          fileTag: `${nature} Specimen`,
        };
      case 'PAT':
        return {
          title: 'Patent Specification, Drawings & Claims',
          badge: 'Patent Disclosure Sheets',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
          desc: 'Upload Complete/Provisional Specification (Form 2), formal drawing sheets, claims, and abstract (PDF, DOCX).',
          accept: '.pdf,.doc,.docx,.png,.jpg,.jpeg',
          fileTag: 'Patent Specification',
        };
      case 'DESIGN':
        return {
          title: 'Industrial Design Novelty Representations',
          badge: 'Design Representation Sheets',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          desc: 'Upload representation sheets showing front, top, side, perspective, and isometric views or photographs of the article (PNG, JPG, PDF).',
          accept: '.png,.jpg,.jpeg,.pdf',
          fileTag: 'Design Representation',
        };
      case 'GI':
        return {
          title: 'GI Logo, Origin Map & Specifications',
          badge: 'Geographical Evidence',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
          desc: 'Upload official GI emblem, demarcated territory boundary map, and proof of origin or historical specification (PNG, JPG, PDF).',
          accept: '.pdf,.png,.jpg,.jpeg',
          fileTag: 'GI Origin Proof',
        };
    }
  };

  const uploadConfig = getUploadConfig();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mark.trim()) {
      showToast('Please provide the Mark Name / Title', 'er');
      return;
    }
    const client = clients.find((c) => c.id === clientId);

    addIprMatter(
      {
        type: activeType,
        clientId: client?.id || '',
        clientName: client?.name || (clientId ? 'Custom Client' : 'General Client'),
        appNo: appNo.trim() || `APP-${Date.now().toString().slice(-6)}`,
        mark: mark.trim(),
        typeOfMark: activeType === 'TM' ? typeOfMark : undefined,
        markImage: markImagePreview || undefined,
        markFileName: attachedFiles[0]?.name || undefined,
        classes: classes.trim(),
        inventors: inventors.trim(),
        nature,
        designClass: designClass.trim(),
        goods: goods.trim(),
        area: area.trim(),
        filingDate,
        status,
        nextDate: nextDate || undefined,
        attorney,
        priority,
        notes: notes.trim(),
      },
      attachedFiles
    );
  };

  const previewFolder =
    activeType === 'TM'
      ? `TM_${appNo || 'App'}_${(mark || 'Mark').replace(/\s+/g, '_')}_Class${classes || 'X'}`
      : `${activeType}_${appNo || 'App'}_${(mark || 'Title').replace(/\s+/g, '_')}`;

  const ActiveIcon = TYPE_ICONS[activeType] || Award;

  return (
    <div className="ov op" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="mo lg" style={{ maxWidth: '820px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="mh">
          <div className="flex items-center gap-2.5">
            <ActiveIcon className="w-5 h-5 text-amber-700" />
            <h3 id="mo-m-t" className="m-0 text-[1.2rem] font-bold text-slate-900">
              New {TN[activeType]} Matter{' '}
              <span className="mo-t" style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', background: 'var(--bd)', borderRadius: '4px' }}>
                {activeType}
              </span>
            </h3>
          </div>
          <button className="mc" onClick={closeModal} title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb" style={{ overflowY: 'auto', flex: 1, paddingRight: '0.75rem' }}>
          {/* Type Tabs */}
          <div className="type-tabs" style={{ marginBottom: '1.25rem' }}>
            {(Object.keys(TN) as IprType[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`type-tab ${key === activeType ? 'on' : ''}`}
                onClick={() => {
                  setActiveType(key);
                }}
              >
                {TN[key]}
              </button>
            ))}
          </div>

          <form id="ipr-form" onSubmit={handleSave}>
            <div className="fg">
              {/* Client Selection */}
              <div className="fgp sp">
                <label className="fl">
                  Registered Client <span className="req">*</span>
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                >
                  <option value="">— Select Registered Client Entity —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Trademark Form */}
              {activeType === 'TM' && (
                <>
                  <div className="fss">Trademark Registration Details</div>
                  <div className="fgp">
                    <label className="fl">
                      Application No. <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5896321"
                      value={appNo}
                      onChange={(e) => setAppNo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="fgp">
                    <label className="fl">
                      Mark / Brand Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LEXICON"
                      value={mark}
                      onChange={(e) => setMark(e.target.value)}
                      required
                    />
                  </div>
                  <div className="fgp">
                    <label className="fl">Nice Class(es)</label>
                    <input
                      type="text"
                      placeholder="e.g. 35, 42"
                      value={classes}
                      onChange={(e) => setClasses(e.target.value)}
                    />
                  </div>
                  <div className="fgp">
                    <label className="fl">Type of Mark</label>
                    <select
                      value={typeOfMark}
                      onChange={(e) => setTypeOfMark(e.target.value)}
                    >
                      <option>Word Mark</option>
                      <option>Device / Logo Mark</option>
                      <option>Combined Mark</option>
                      <option>3D Shape Mark</option>
                      <option>Sound Mark</option>
                      <option>Colour Combination</option>
                    </select>
                  </div>
                </>
              )}

              {/* Patent Form */}
              {activeType === 'PAT' && (
                <>
                  <div className="fss">Patent Application Details</div>
                  <div className="fgp">
                    <label className="fl">
                      Application No. <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. IN202441002234"
                      value={appNo}
                      onChange={(e) => setAppNo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="fgp">
                    <label className="fl">Patent Application Type</label>
                    <select defaultValue="Ordinary">
                      <option>Ordinary</option>
                      <option>PCT National Phase</option>
                      <option>Convention</option>
                      <option>Divisional</option>
                      <option>Patent of Addition</option>
                    </select>
                  </div>
                  <div className="fgp sp">
                    <label className="fl">
                      Title of Invention <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. High-throughput bio-filtration apparatus"
                      value={mark}
                      onChange={(e) => setMark(e.target.value)}
                      required
                    />
                  </div>
                  <div className="fgp sp">
                    <label className="fl">Named Inventors</label>
                    <input
                      type="text"
                      placeholder="Dr. Anand Verma, S. Krishnan…"
                      value={inventors}
                      onChange={(e) => setInventors(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Copyright Form */}
              {activeType === 'COPY' && (
                <>
                  <div className="fss">Copyright Record Details</div>
                  <div className="fgp">
                    <label className="fl">Diary / App No.</label>
                    <input
                      type="text"
                      placeholder="e.g. SW/2025/00456"
                      value={appNo}
                      onChange={(e) => setAppNo(e.target.value)}
                    />
                  </div>
                  <div className="fgp">
                    <label className="fl">Category of Work</label>
                    <select
                      value={nature}
                      onChange={(e) => setNature(e.target.value)}
                    >
                      <option>Literary / Dramatic</option>
                      <option>Artistic</option>
                      <option>Musical</option>
                      <option>Sound Recording</option>
                      <option>Cinematograph Film</option>
                      <option>Computer Software / Source Code</option>
                    </select>
                  </div>
                  <div className="fgp sp">
                    <label className="fl">
                      Work Title <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Enterprise Legal Knowledge Base Engine"
                      value={mark}
                      onChange={(e) => setMark(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {/* Design Form */}
              {activeType === 'DESIGN' && (
                <>
                  <div className="fss">Design Registration Details</div>
                  <div className="fgp">
                    <label className="fl">
                      Application No. <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. D/2025/12345"
                      value={appNo}
                      onChange={(e) => setAppNo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="fgp">
                    <label className="fl">Locarno Classification</label>
                    <input
                      type="text"
                      placeholder="e.g. Class 09-03"
                      value={designClass}
                      onChange={(e) => setDesignClass(e.target.value)}
                    />
                  </div>
                  <div className="fgp sp">
                    <label className="fl">
                      Article Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Modular Luminaire Enclosure"
                      value={mark}
                      onChange={(e) => setMark(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {/* GI Tag Form */}
              {activeType === 'GI' && (
                <>
                  <div className="fss">Geographical Indication Details</div>
                  <div className="fgp">
                    <label className="fl">
                      GI Application No. <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. GI/2/2025/00123"
                      value={appNo}
                      onChange={(e) => setAppNo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="fgp">
                    <label className="fl">
                      GI Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Malabar Robusta"
                      value={mark}
                      onChange={(e) => setMark(e.target.value)}
                      required
                    />
                  </div>
                  <div className="fgp">
                    <label className="fl">Goods Specification</label>
                    <input
                      type="text"
                      placeholder="e.g. Agricultural Produce, Coffee Beans"
                      value={goods}
                      onChange={(e) => setGoods(e.target.value)}
                    />
                  </div>
                  <div className="fgp">
                    <label className="fl">
                      Territory / Geographical Area <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Wayanad, Kerala"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {/* DEDICATED FILE UPLOAD & SPECIMEN REPRESENTATION SECTION */}
              <div className="fgp sp" style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Paperclip className="w-4 h-4 text-indigo-600" />
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                        {uploadConfig.title}
                      </span>
                    </div>
                    <span
                      className={`text-[0.68rem] px-2 py-0.5 rounded-full border font-semibold ${uploadConfig.badgeColor}`}
                    >
                      {uploadConfig.badge}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.85rem', lineHeight: '1.4' }}>
                    {uploadConfig.desc}
                  </p>

                  {/* Immediate Image Preview (for Trademark Logo, Design View, Artwork) */}
                  {markImagePreview && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        padding: '0.75rem',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          padding: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                      >
                        <img
                          src={markImagePreview}
                          alt="Mark preview"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                            {activeType === 'TM' ? 'Trademark Logo Preview' : 'Work Specimen Preview'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0',
                              fontWeight: 600,
                            }}
                          >
                            Ready for Docket &amp; Journal
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {attachedFiles.find((f) => f.type.startsWith('image/'))?.name || 'representation.png'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                          This thumbnail will be displayed in the matter docket and client reports.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMarkImagePreview('');
                          setAttachedFiles((prev) => prev.filter((f) => !f.type.startsWith('image/')));
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#e11d48',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        }}
                        title="Remove image representation"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Interactive Dropzone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFileSelect(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: isDragging ? '2px dashed #6366f1' : '2px dashed #cbd5e1',
                      borderRadius: '8px',
                      padding: '1.25rem 1rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: isDragging ? '#eef2ff' : '#ffffff',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-1.5" />
                    <p style={{ fontWeight: 600, fontSize: '0.84rem', color: '#0f172a', margin: '0 0 0.2rem' }}>
                      Drag &amp; drop {activeType === 'TM' ? 'logo image or PDF' : 'files'} here, or{' '}
                      <span style={{ color: '#4f46e5', textDecoration: 'underline' }}>browse from device</span>
                    </p>
                    <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>
                      Supports Images (PNG, JPG, SVG), Documents (PDF, DOCX) &amp; Specimen Files up to 25 MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={uploadConfig.accept}
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        handleFileSelect(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {/* Attached Files List */}
                  {attachedFiles.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155' }}>
                          Files Attached ({attachedFiles.length})
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 500 }}>
                          <CheckCircle2 size={11} /> Ready to provision in Vault
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '130px', overflowY: 'auto' }}>
                        {attachedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '0.4rem 0.65rem',
                              fontSize: '0.76rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                              <span
                                style={{
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: file.type.startsWith('image/') ? '#ecfdf5' : '#eff6ff',
                                  color: file.type.startsWith('image/') ? '#047857' : '#1e40af',
                                  fontWeight: 700,
                                  fontSize: '0.64rem',
                                  border: file.type.startsWith('image/') ? '1px solid #a7f3d0' : '1px solid #bfdbfe',
                                  textTransform: 'uppercase',
                                  flexShrink: 0,
                                }}
                              >
                                {file.name.split('.').pop() || 'FILE'}
                              </span>
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: '#0f172a',
                                  whiteSpace: 'nowrap',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                }}
                                title={file.name}
                              >
                                {file.name}
                              </span>
                              <span style={{ color: '#94a3b8', fontSize: '0.7rem', flexShrink: 0 }}>
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              className="hover:text-rose-600 transition-colors"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shared Metadata */}
              <div className="fgp">
                <label className="fl">
                  Filing Date <span className="req">*</span>
                </label>
                <input
                  type="date"
                  value={filingDate}
                  onChange={(e) => setFilingDate(e.target.value)}
                  required
                />
              </div>
              <div className="fgp">
                <label className="fl">Registry Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option>Pending</option>
                  <option>Under Examination</option>
                  <option>FER Issued</option>
                  <option>Hearing Fixed</option>
                  <option>Advertised in Journal</option>
                  <option>Opposed</option>
                  <option>Registered</option>
                  <option>Renewal Due</option>
                </select>
              </div>
              <div className="fgp">
                <label className="fl">Next Statutory Deadline</label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                />
              </div>
              <div className="fgp">
                <label className="fl">Lead Attorney</label>
                <select
                  value={attorney}
                  onChange={(e) => setAttorney(e.target.value)}
                >
                  <option>Self</option>
                  <option>Junior Advocate</option>
                  <option>Associate Counsel</option>
                  <option>IP Clerk</option>
                </select>
              </div>
              <div className="fgp">
                <label className="fl">Matter Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                >
                  <option value="h">High Priority</option>
                  <option value="m">Normal Priority</option>
                  <option value="l">Low Priority</option>
                </select>
              </div>
              <div className="fgp sp">
                <label className="fl">Prosecution Notes / Strategy</label>
                <textarea
                  placeholder="Citation cross-references, prior art considerations, filing instructions…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="ib pr sp flex items-center gap-2.5">
                <FolderOpen className="w-4 h-4 text-slate-700 shrink-0" />
                <span style={{ fontSize: '0.78rem' }}>
                  Workspace Vault directory will be structured as: <strong>{previewFolder}</strong>
                  {attachedFiles.length > 0 && (
                    <span style={{ display: 'block', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                      ✓ {attachedFiles.length} file(s) will be automatically uploaded into this folder upon saving.
                    </span>
                  )}
                </span>
              </div>
            </div>
          </form>
        </div>

        <div className="mf">
          <button type="button" className="btn btn-o" onClick={closeModal}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-p"
            onClick={handleSave}
          >
            Save Matter &amp; Provision Vault
          </button>
        </div>
      </div>
    </div>
  );
};
