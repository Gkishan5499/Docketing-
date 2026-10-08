import React, { useState, useEffect, useRef } from 'react';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { UploadCloud, X, FileText, Check, Plus, Folder, Trash2, Tag, ShieldCheck } from 'lucide-react';

interface UploadDocumentModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultFolder?: string;
  onSuccess?: () => void;
  onOpenCreateFolder?: (currentFolder: string) => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  defaultFolder: propFolder,
  onSuccess,
  onOpenCreateFolder,
}) => {
  const {
    modalState,
    closeModal,
    vaultFolders,
    uploadDocuments,
    iprMatters,
    courtMatters,
    showToast,
  } = useLawyersDiary();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isContextOpen = modalState.type === 'upload-doc';
  const isOpen = propIsOpen !== undefined ? propIsOpen : isContextOpen;

  const contextFolder = modalState.payload?.folderPath || modalState.payload?.folder;
  const initialFolder = propFolder || contextFolder || '/LawyersDiary';

  const [selectedFolder, setSelectedFolder] = useState(initialFolder);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [customName, setCustomName] = useState('');
  const [matterId, setMatterId] = useState('');
  const [categoryTag, setCategoryTag] = useState('Pleadings');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedFolder(propFolder || contextFolder || '/LawyersDiary');
      setSelectedFiles([]);
      setCustomName('');
      setMatterId('');
      setCategoryTag('Pleadings');
      setIsDragging(false);
    }
  }, [isOpen, propFolder, contextFolder]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (propOnClose) propOnClose();
    else closeModal();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
      if (!customName && files.length === 1) {
        setCustomName(files[0].name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...files]);
      if (!customName && files.length === 1) {
        setCustomName(files[0].name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      showToast('Please select at least one document to upload', 'er');
      return;
    }

    const tags = [categoryTag];
    if (customName && selectedFiles.length === 1) {
      // If user customized single file name, create renamed file or tag
      tags.push('Custom Title');
    }

    uploadDocuments(selectedFiles, selectedFolder, matterId, tags);
    if (onSuccess) onSuccess();
    handleClose();
  };

  const categories = [
    'Pleadings',
    'Orders',
    'Evidence',
    'Forms & Petitions',
    'Affidavits',
    'Vakalatnama & POA',
    'Legal Notices',
    'Drafts',
  ];

  return (
    <div className="ov op" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="mo md">
        <div className="mh">
          <div className="flex items-center gap-2.5">
            <UploadCloud className="w-5 h-5 text-indigo-600" />
            <h3 className="m-0 text-[1.15rem]">Upload Document to Vault</h3>
          </div>
          <button className="mc" onClick={handleClose} title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb">
          <form onSubmit={handleSubmit}>
            <div className="fg">
              {/* Destination Folder Selector */}
              <div className="fgp sp">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="fl">
                    Destination Folder <span className="req">*</span>
                  </label>
                  {onOpenCreateFolder && (
                    <button
                      type="button"
                      className="btn btn-g btn-s"
                      style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                      onClick={() => onOpenCreateFolder(selectedFolder)}
                    >
                      <Plus size={11} /> Create New Folder
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <select
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="w-full"
                    required
                  >
                    <option value="/LawyersDiary">📁 /LawyersDiary (Vault Root)</option>
                    {vaultFolders
                      .filter((f) => f.path !== '/LawyersDiary')
                      .map((f) => (
                        <option key={f.id} value={f.path}>
                          📁 {f.path.replace('/LawyersDiary/', '')}
                        </option>
                      ))}
                  </select>
                </div>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.73rem', color: 'var(--tx2)' }}>
                  Files will be encrypted and placed under <strong>{selectedFolder}</strong>
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div className="fgp sp">
                <label className="fl">
                  Select Document Files <span className="req">*</span>
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: isDragging ? '2px dashed var(--pr)' : '2px dashed var(--bd)',
                    background: isDragging ? 'rgba(30, 58, 138, 0.08)' : 'var(--bg2)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <UploadCloud className="w-9 h-9 text-indigo-500 mx-auto mb-2" />
                  <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: '0 0 0.25rem', color: 'var(--tx)' }}>
                    Drop legal documents here, or <span style={{ color: 'var(--pr)', textDecoration: 'underline' }}>browse</span>
                  </p>
                  <p style={{ fontSize: '0.74rem', color: 'var(--tx2)', margin: 0 }}>
                    Supports PDF, DOCX, DOC, XLSX, TXT, PNG, JPG (Up to 25 MB per file)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xlsx,.xls,.txt,.png,.jpg,.jpeg,.csv"
                  />
                </div>
              </div>

              {/* Selected Files List Preview */}
              {selectedFiles.length > 0 && (
                <div className="fgp sp">
                  <label className="fl">Attached Files ({selectedFiles.length})</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '150px', overflowY: 'auto' }}>
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'var(--bg)',
                          border: '1px solid var(--bd)',
                          borderRadius: '6px',
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.78rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                          <span
                            style={{
                              padding: '2px 5px',
                              borderRadius: '4px',
                              background: '#eff6ff',
                              color: '#1e40af',
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              border: '1px solid #bfdbfe',
                              textTransform: 'uppercase',
                            }}
                          >
                            {file.name.split('.').pop() || 'FILE'}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--tx)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {file.name}
                          </span>
                          <span style={{ color: 'var(--tx2)', fontSize: '0.72rem' }}>
                            ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-rose-500 hover:text-rose-700"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                          title="Remove file"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Docket Matter */}
              <div className="fgp">
                <label className="fl">Related Docket Matter</label>
                <select value={matterId} onChange={(e) => setMatterId(e.target.value)}>
                  <option value="">— General / Not Linked to Matter —</option>
                  <optgroup label="IPR Matters">
                    {iprMatters.map((m) => (
                      <option key={m.id} value={m.id}>
                        [{m.type}] {m.mark} ({m.clientName})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Courts & Tribunals">
                    {courtMatters.map((r) => (
                      <option key={r.id} value={r.id}>
                        [{r.type}] {r.caseTitle} ({r.clientName})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Category / Document Class */}
              <div className="fgp">
                <label className="fl">Category Classification</label>
                <select value={categoryTag} onChange={(e) => setCategoryTag(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mf" style={{ marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-g" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-p" disabled={selectedFiles.length === 0}>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload to {selectedFolder.split('/').pop() || 'Vault'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
