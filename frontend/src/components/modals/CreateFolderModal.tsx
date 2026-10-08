import React, { useState, useEffect } from 'react';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { FolderPlus, X, Folder, Sparkles } from 'lucide-react';

interface CreateFolderModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultParentPath?: string;
  onSuccess?: (newPath: string) => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  defaultParentPath: propParentPath,
  onSuccess,
}) => {
  const { modalState, closeModal, vaultFolders, createVaultFolder, showToast } = useLawyersDiary();

  const isContextOpen = modalState.type === 'create-folder';
  const isOpen = propIsOpen !== undefined ? propIsOpen : isContextOpen;

  const contextParentPath = modalState.payload?.parentPath;
  const initialParent = propParentPath || contextParentPath || '/LawyersDiary';

  const [folderName, setFolderName] = useState('');
  const [parentPath, setParentPath] = useState(initialParent);
  const [color, setColor] = useState('#38bdf8');

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setParentPath(propParentPath || contextParentPath || '/LawyersDiary');
    }
  }, [isOpen, propParentPath, contextParentPath]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (propOnClose) propOnClose();
    else closeModal();
  };

  const previewPath = `${parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath}/${folderName.trim() || 'New_Folder'}`;

  const quickPillSuggestions = [
    'Orders & Decrees',
    'Evidence & Exhibits',
    'Pleadings & Petitions',
    'Vakalatnama & POA',
    'Legal Notices',
    'Written Arguments',
    'Invoices & Retainers',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) {
      showToast('Please provide a folder name', 'er');
      return;
    }

    const created = createVaultFolder(folderName.trim(), parentPath, color);
    if (created) {
      if (onSuccess) onSuccess(created.path);
      handleClose();
    }
  };

  return (
    <div className="ov op" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="mo sm">
        <div className="mh">
          <div className="flex items-center gap-2.5">
            <FolderPlus className="w-5 h-5 text-sky-600" />
            <h3 className="m-0 text-[1.15rem]">Create New Folder</h3>
          </div>
          <button className="mc" onClick={handleClose} title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb">
          <form onSubmit={handleSubmit}>
            <div className="fg">
              {/* Parent Folder */}
              <div className="fgp sp">
                <label className="fl">
                  Create Inside (Parent Directory) <span className="req">*</span>
                </label>
                <select
                  value={parentPath}
                  onChange={(e) => setParentPath(e.target.value)}
                  className="w-full"
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

              {/* Folder Name */}
              <div className="fgp sp">
                <label className="fl">
                  Folder Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Arbitration Documents, Case Briefs"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                />
              </div>

              {/* Quick Suggestions */}
              <div className="fgp sp">
                <label className="fl" style={{ fontSize: '0.72rem', color: 'var(--tx2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} className="text-amber-500" /> Quick Legal Suggestions:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.15rem' }}>
                  {quickPillSuggestions.map((pill) => (
                    <button
                      type="button"
                      key={pill}
                      className="btn btn-g btn-s"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}
                      onClick={() => setFolderName(pill)}
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Tag */}
              <div className="fgp sp">
                <label className="fl">Folder Color Tag</label>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.2rem' }}>
                  {[
                    { label: 'Cyan', hex: '#38bdf8' },
                    { label: 'Emerald', hex: '#34d399' },
                    { label: 'Gold', hex: '#fbbf24' },
                    { label: 'Purple', hex: '#c084fc' },
                    { label: 'Rose', hex: '#fb7185' },
                    { label: 'Slate', hex: '#94a3b8' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      title={c.label}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: c.hex,
                        border: color === c.hex ? '2px solid #0f172a' : '2px solid transparent',
                        outline: color === c.hex ? `2px solid ${c.hex}` : 'none',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Live Path Preview */}
              <div className="fgp sp">
                <div
                  style={{
                    background: '#0f172a',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    overflowX: 'auto',
                  }}
                >
                  <Folder size={14} style={{ color, flexShrink: 0 }} />
                  <span style={{ color: '#94a3b8' }}>Target:</span>
                  <span style={{ fontWeight: 600 }}>{previewPath}</span>
                </div>
              </div>
            </div>

            <div className="mf" style={{ marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-g" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-p">
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Create Folder</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
