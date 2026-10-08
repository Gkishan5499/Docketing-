import React, { useState, useMemo, useRef } from 'react';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import { downloadDocumentFile, openDocumentFile } from '../utils/helpers';
import { CreateFolderModal } from '../components/modals/CreateFolderModal';
import { UploadDocumentModal } from '../components/modals/UploadDocumentModal';
import { VaultFolder, DocumentFile } from '../types';
import {
  FolderOpen,
  FolderPlus,
  UploadCloud,
  RefreshCw,
  Search,
  ExternalLink,
  Download,
  CheckCircle2,
  File,
  HardDrive,
  FolderGit2,
  ChevronRight,
  ChevronDown,
  Trash2,
  Folder,
  Plus,
  ArrowRight,
  FolderInput,
  FolderSymlink,
  Layers,
} from 'lucide-react';

export const DriveDocumentsPage: React.FC = () => {
  const {
    documents,
    vaultFolders,
    createVaultFolder,
    deleteVaultFolder,
    uploadDocuments,
    deleteDocument,
    moveDocument,
    syncDriveAndCalendar,
    showToast,
  } = useLawyersDiary();

  const [selectedFolder, setSelectedFolder] = useState<string>('/LawyersDiary');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '/LawyersDiary': true,
    '/LawyersDiary/Clients': true,
    '/LawyersDiary/Clients/Rajan & Sons Pvt. Ltd.': true,
  });
  const [filterType, setFilterType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [createFolderParent, setCreateFolderParent] = useState('/LawyersDiary');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTargetFolder, setUploadTargetFolder] = useState('/LawyersDiary');
  const [movingDoc, setMovingDoc] = useState<DocumentFile | null>(null);
  const [moveDestination, setMoveDestination] = useState('/LawyersDiary');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const dragFileInputRef = useRef<HTMLInputElement>(null);

  // Toggle tree expansion
  const toggleExpand = (path: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // Build folder hierarchy
  type FolderNode = {
    folder: VaultFolder;
    children: FolderNode[];
    fileCount: number;
    directCount: number;
  };

  const folderTree = useMemo(() => {
    const nodeMap = new Map<string, FolderNode>();

    // Initialize all nodes
    vaultFolders.forEach((f) => {
      nodeMap.set(f.path, {
        folder: f,
        children: [],
        fileCount: 0,
        directCount: 0,
      });
    });

    // Count direct documents
    documents.forEach((doc) => {
      const docFolder = doc.folder || '/LawyersDiary';
      // Match by full path or by folder name
      let matchedNode = nodeMap.get(docFolder);
      if (!matchedNode) {
        // Fallback: search by folder name
        const found = vaultFolders.find((vf) => vf.name.toLowerCase() === docFolder.toLowerCase());
        if (found) matchedNode = nodeMap.get(found.path);
      }
      if (matchedNode) {
        matchedNode.directCount += 1;
      }
    });

    // Build hierarchy and calculate recursive counts
    const rootNodes: FolderNode[] = [];

    vaultFolders.forEach((f) => {
      const node = nodeMap.get(f.path);
      if (!node) return;

      if (!f.parentPath || f.path === '/LawyersDiary' || !nodeMap.has(f.parentPath)) {
        if (f.path === '/LawyersDiary') rootNodes.unshift(node);
        else rootNodes.push(node);
      } else {
        const parent = nodeMap.get(f.parentPath);
        if (parent) {
          parent.children.push(node);
        } else {
          rootNodes.push(node);
        }
      }
    });

    // Calculate total recursive counts
    const computeTotal = (node: FolderNode): number => {
      let total = node.directCount;
      node.children.forEach((c) => {
        total += computeTotal(c);
      });
      node.fileCount = total;
      return total;
    };

    rootNodes.forEach(computeTotal);

    return rootNodes;
  }, [vaultFolders, documents]);

  // Open modals with targeted paths
  const handleOpenCreateFolder = (parentPath: string = selectedFolder) => {
    setCreateFolderParent(parentPath);
    setIsCreateFolderOpen(true);
  };

  const handleOpenUpload = (targetFolder: string = selectedFolder) => {
    setUploadTargetFolder(targetFolder);
    setIsUploadOpen(true);
  };

  // Filter documents for the active view
  const currentFolderObj = vaultFolders.find((f) => f.path === selectedFolder);

  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      const docFolder = d.folder || '/LawyersDiary';

      // Folder filtering
      if (selectedFolder !== '/LawyersDiary') {
        const matchesExactPath = docFolder === selectedFolder;
        const matchesSubpath = docFolder.startsWith(selectedFolder + '/');
        const matchesName = currentFolderObj && docFolder.toLowerCase() === currentFolderObj.name.toLowerCase();

        if (!matchesExactPath && !matchesSubpath && !matchesName) {
          return false;
        }
      }

      // Category tab filtering
      if (filterType !== 'All') {
        const matchesCategory =
          d.folder?.toLowerCase().includes(filterType.toLowerCase()) ||
          d.type?.toLowerCase() === filterType.toLowerCase() ||
          d.tags?.some((t) => t.toLowerCase().includes(filterType.toLowerCase()));
        if (!matchesCategory) return false;
      }

      // Search term filtering
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match =
          d.name.toLowerCase().includes(term) ||
          (d.matterName && d.matterName.toLowerCase().includes(term)) ||
          (d.folder && d.folder.toLowerCase().includes(term)) ||
          (d.tags && d.tags.some((t) => t.toLowerCase().includes(term)));
        if (!match) return false;
      }

      return true;
    });
  }, [documents, selectedFolder, currentFolderObj, filterType, searchTerm]);

  // Handle drag and drop files onto the right pane
  const handleDragDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadDocuments(e.dataTransfer.files, selectedFolder);
    }
  };

  // Breadcrumbs calculation
  const breadcrumbSegments = useMemo(() => {
    if (selectedFolder === '/LawyersDiary') {
      return [{ name: 'Vault Root', path: '/LawyersDiary' }];
    }
    const parts = selectedFolder.replace('/LawyersDiary/', '').split('/');
    const segments = [{ name: 'Vault Root', path: '/LawyersDiary' }];
    let acc = '/LawyersDiary';
    parts.forEach((p) => {
      acc = `${acc}/${p}`;
      segments.push({ name: p, path: acc });
    });
    return segments;
  }, [selectedFolder]);

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: FolderNode, level: number = 0) => {
    const { folder, children, fileCount } = node;
    const isExpanded = !!expandedFolders[folder.path];
    const isSelected = selectedFolder === folder.path;
    const hasChildren = children.length > 0;
    const isRoot = folder.path === '/LawyersDiary';

    return (
      <div key={folder.id} style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          className={`ft-node ${isSelected ? 'active' : ''}`}
          style={{
            paddingLeft: `${Math.max(0.4, level * 1.1)}rem`,
          }}
          onClick={() => {
            setSelectedFolder(folder.path);
            if (hasChildren && !isExpanded) {
              setExpandedFolders((prev) => ({ ...prev, [folder.path]: true }));
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
            {hasChildren ? (
              <span
                onClick={(e) => toggleExpand(folder.path, e)}
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', color: '#64748b' }}
              >
                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </span>
            ) : (
              <span style={{ width: '13px' }} />
            )}

            {isExpanded ? (
              <FolderOpen size={14} style={{ color: folder.color || '#38bdf8', flexShrink: 0 }} />
            ) : (
              <Folder size={14} style={{ color: folder.color || '#38bdf8', flexShrink: 0 }} />
            )}

            <span
              style={{
                color: isSelected ? '#38bdf8' : isRoot ? '#38bdf8' : '#e2e8f0',
                fontWeight: isSelected ? 700 : isRoot ? 600 : 500,
                fontSize: '0.78rem',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {isRoot ? '/LawyersDiary/' : folder.name}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {fileCount > 0 && <span className="ft-badge">{fileCount}</span>}

            <div className="ft-actions" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="ft-action-btn"
                title={`Upload document into ${folder.name}`}
                onClick={() => handleOpenUpload(folder.path)}
              >
                <UploadCloud size={11} />
              </button>
              <button
                type="button"
                className="ft-action-btn"
                title={`Create subfolder inside ${folder.name}`}
                onClick={() => handleOpenCreateFolder(folder.path)}
              >
                <Plus size={11} />
              </button>
              {!folder.isSystem && (
                <button
                  type="button"
                  className="ft-action-btn del"
                  title="Delete this folder"
                  onClick={() => {
                    if (window.confirm(`Delete folder "${folder.name}" and move its documents to parent?`)) {
                      deleteVaultFolder(folder.path);
                      if (selectedFolder === folder.path) {
                        setSelectedFolder(folder.parentPath || '/LawyersDiary');
                      }
                    }
                  }}
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {children.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pg on">
      {/* Header */}
      <div className="ph">
        <div>
          <div className="flex items-center gap-2.5">
            <FolderOpen className="w-6 h-6 text-slate-800" />
            <h1>Document Vault</h1>
          </div>
          <p>Firm document repository for pleadings, exhibits, certified orders, statutory powers, and evidence</p>
        </div>
        <div className="pa flex items-center gap-2">
          <button
            className="btn btn-p btn-s flex items-center gap-1.5"
            onClick={() => handleOpenUpload(selectedFolder)}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
          <button
            className="btn btn-o btn-s flex items-center gap-1.5"
            onClick={() => handleOpenCreateFolder(selectedFolder)}
          >
            <FolderPlus className="w-3.5 h-3.5 text-sky-600" />
            <span>Create Folder</span>
          </button>
          <button className="btn btn-o btn-s" onClick={syncDriveAndCalendar}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Vault</span>
          </button>
          <button
            className="btn btn-g btn-s"
            onClick={() => {
              setSelectedFolder('/LawyersDiary');
              showToast('Reset to Root Vault (/LawyersDiary)', 'in');
            }}
          >
            <span>Root Vault</span>
          </button>
        </div>
      </div>

      {/* Storage Bar Card */}
      <div
        className="cd"
        style={{
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <HardDrive className="w-5 h-5 text-slate-700" />
          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--tx)' }}>
            Document Vault Storage
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.76rem',
              fontWeight: 500,
              color: 'var(--tx2)',
              marginBottom: '0.35rem',
            }}
          >
            <span>Firm Encrypted Partition • {documents.length} Files in {vaultFolders.length} Folders</span>
            <span>1.2 GB of 15.0 GB Allocated (8%)</span>
          </div>
          <div
            style={{
              height: '6px',
              borderRadius: '999px',
              background: 'var(--bd)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '8%',
                height: '100%',
                background: 'linear-gradient(90deg, var(--gd), var(--pr))',
                borderRadius: '999px',
              }}
            />
          </div>
        </div>
        <span className="chip gn" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          <span>Active Vault Synced</span>
        </span>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
        {/* Left: Interactive Folder Tree */}
        <div className="cd" style={{ height: 'fit-content' }}>
          <div className="ch" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <FolderGit2 className="w-4 h-4 text-slate-700" />
              <span className="ct2">Folder Structure</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                className="btn btn-o btn-s"
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                onClick={() => handleOpenCreateFolder(selectedFolder)}
                title="Create a new folder"
              >
                <FolderPlus size={12} className="text-sky-600" />
                <span>+ New Folder</span>
              </button>
            </div>
          </div>

          <div className="cb" style={{ padding: '0.75rem' }}>
            <div className="ft" style={{ padding: '0.65rem 0.5rem', maxHeight: '520px', overflowY: 'auto' }}>
              <div className="ft-tree">
                {folderTree.map((rootNode) => renderTreeNode(rootNode, 0))}
              </div>
            </div>

            <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.73rem', color: 'var(--tx2)' }}>
              <span>Click folder to open &amp; filter</span>
              <button
                type="button"
                className="hover:underline text-sky-600"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => setSelectedFolder('/LawyersDiary')}
              >
                View all files
              </button>
            </div>
          </div>
        </div>

        {/* Right: Document List & Action Container */}
        <div
          className="cd"
          onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDragDrop}
          style={{
            border: isDraggingOver ? '2px dashed var(--pr)' : undefined,
            background: isDraggingOver ? 'rgba(30, 58, 138, 0.03)' : undefined,
            transition: 'border 0.15s ease',
          }}
        >
          {/* Breadcrumb Path Banner */}
          <div
            style={{
              padding: '0.75rem 1.15rem',
              borderBottom: '1px solid var(--bd)',
              background: 'var(--bg2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--tx2)', overflowX: 'auto' }}>
              <Folder size={14} className="text-sky-600 flex-shrink-0" />
              {breadcrumbSegments.map((seg, i) => (
                <React.Fragment key={seg.path}>
                  {i > 0 && <span style={{ color: 'var(--tx3)' }}>/</span>}
                  <button
                    type="button"
                    onClick={() => setSelectedFolder(seg.path)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      color: i === breadcrumbSegments.length - 1 ? 'var(--tx)' : 'var(--tx2)',
                      fontWeight: i === breadcrumbSegments.length - 1 ? 700 : 500,
                      transition: 'color 0.1s ease',
                    }}
                    className="hover:underline hover:text-[var(--pr)]"
                  >
                    {seg.name}
                  </button>
                </React.Fragment>
              ))}
              <span className="chip sl" style={{ fontSize: '0.7rem', marginLeft: '0.35rem' }}>
                {filteredDocs.length} {filteredDocs.length === 1 ? 'document' : 'documents'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-o btn-s flex items-center gap-1"
                style={{ fontSize: '0.75rem' }}
                onClick={() => handleOpenCreateFolder(selectedFolder)}
              >
                <FolderPlus size={13} className="text-sky-600" />
                <span>+ Subfolder</span>
              </button>
              <button
                type="button"
                className="btn btn-p btn-s flex items-center gap-1"
                style={{ fontSize: '0.75rem' }}
                onClick={() => handleOpenUpload(selectedFolder)}
              >
                <UploadCloud size={13} />
                <span>+ Upload Here</span>
              </button>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="ch" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {['All', 'Pleadings', 'Orders', 'Evidence', 'Pleadings & Forms'].map((f) => (
                <button
                  key={f}
                  className={`btn btn-s ${filterType === f ? 'btn-p' : 'btn-g'}`}
                  onClick={() => setFilterType(f)}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="sw2" style={{ width: '220px' }}>
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search files or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="cb" style={{ padding: 0 }}>
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Related Docket Matter</th>
                    <th>Folder Location</th>
                    <th>File Size</th>
                    <th>Uploaded</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc) => {
                    const folderDisplay = doc.folder ? doc.folder.replace('/LawyersDiary/', '') : 'Root';
                    return (
                      <tr key={doc.id}>
                        <td>
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
                            onClick={() => {
                              openDocumentFile(doc);
                              showToast(`Opening "${doc.name}"...`, 'in');
                            }}
                          >
                            <span
                              style={{
                                padding: '0.2rem 0.4rem',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                background: doc.type === 'pdf' ? '#fef2f2' : '#eff6ff',
                                color: doc.type === 'pdf' ? '#b91c1c' : '#1e40af',
                                border: doc.type === 'pdf' ? '1px solid #fecaca' : '1px solid #bfdbfe',
                              }}
                            >
                              {doc.type.toUpperCase()}
                            </span>
                            <div>
                              <span className="hover:underline hover:text-[var(--pr)]" style={{ fontWeight: 600, color: 'var(--tx)', fontSize: '0.84rem' }}>
                                {doc.name}
                              </span>
                              {doc.tags && doc.tags.length > 0 && (
                                <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
                                  {doc.tags.slice(0, 2).map((t, idx) => (
                                    <span key={idx} style={{ fontSize: '0.65rem', color: 'var(--tx3)', background: 'var(--bg2)', padding: '1px 4px', borderRadius: '3px' }}>
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--tx2)' }}>{doc.matterName || '—'}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              if (doc.folder) setSelectedFolder(doc.folder);
                            }}
                            title={`Jump to folder: ${doc.folder || 'Vault'}`}
                            className="chip pr hover:underline hover:opacity-85"
                            style={{ cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Folder size={11} />
                            <span>{folderDisplay}</span>
                          </button>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--tx2)' }}>{doc.size}</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--tx2)' }}>{doc.uploadedAt || doc.date}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              className="btn btn-p btn-s"
                              onClick={() => {
                                downloadDocumentFile(doc);
                                showToast(`Downloading "${doc.name}"...`, 'ok');
                              }}
                              title={`Download ${doc.name}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{doc.type === 'pdf' ? 'Download PDF' : 'Download File'}</span>
                            </button>
                            <button
                              className="btn btn-o btn-s"
                              onClick={() => {
                                openDocumentFile(doc);
                                showToast(`Opening "${doc.name}" in viewer`, 'in');
                              }}
                              title="Open document"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                            <button
                              className="btn btn-g btn-s"
                              onClick={() => {
                                setMovingDoc(doc);
                                setMoveDestination(doc.folder || '/LawyersDiary');
                              }}
                              title="Move document to another folder"
                            >
                              <FolderSymlink size={13} />
                            </button>
                            <button
                              className="btn btn-g btn-s text-rose-500 hover:text-rose-700"
                              onClick={() => {
                                if (window.confirm(`Delete "${doc.name}" from document vault?`)) {
                                  deleteDocument(doc.id);
                                }
                              }}
                              title="Delete document"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredDocs.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--tx2)' }}>
                        <div
                          style={{
                            maxWidth: '380px',
                            margin: '0 auto',
                            border: '2px dashed var(--bd)',
                            borderRadius: '12px',
                            padding: '2rem 1.5rem',
                            background: 'var(--bg2)',
                          }}
                        >
                          <FolderOpen className="w-10 h-10 text-slate-400 mx-auto mb-2.5 text-sky-500" />
                          <h4 style={{ margin: '0 0 0.35rem', color: 'var(--tx)', fontSize: '0.95rem' }}>
                            {selectedFolder === '/LawyersDiary' ? 'No documents in vault' : `Folder "${selectedFolder.split('/').pop()}" is empty`}
                          </h4>
                          <p style={{ margin: '0 0 1.25rem', fontSize: '0.78rem', color: 'var(--tx2)' }}>
                            Upload pleadings, exhibits, orders, or create subfolders to organize this case directory.
                          </p>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-p btn-s"
                              onClick={() => handleOpenUpload(selectedFolder)}
                            >
                              <UploadCloud size={14} />
                              <span>Upload Document Here</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-o btn-s"
                              onClick={() => handleOpenCreateFolder(selectedFolder)}
                            >
                              <FolderPlus size={14} className="text-sky-600" />
                              <span>New Subfolder</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input for drag and drop */}
      <input
        ref={dragFileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) uploadDocuments(e.target.files, selectedFolder);
        }}
      />

      {/* Direct Modals for Create Folder & Upload */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        defaultParentPath={createFolderParent}
        onSuccess={(newPath) => {
          setSelectedFolder(newPath);
          setExpandedFolders((prev) => ({ ...prev, [newPath]: true, [createFolderParent]: true }));
        }}
      />

      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultFolder={uploadTargetFolder}
        onOpenCreateFolder={(curFolder) => {
          setIsUploadOpen(false);
          handleOpenCreateFolder(curFolder);
        }}
      />

      {/* Move Document Modal Dialog */}
      {movingDoc && (
        <div className="ov op" onClick={(e) => e.target === e.currentTarget && setMovingDoc(null)}>
          <div className="mo sm">
            <div className="mh">
              <div className="flex items-center gap-2">
                <FolderSymlink className="w-5 h-5 text-indigo-600" />
                <h3 className="m-0 text-[1.15rem]">Move Document</h3>
              </div>
              <button className="mc" onClick={() => setMovingDoc(null)}>
                ×
              </button>
            </div>
            <div className="mb">
              <p style={{ fontSize: '0.82rem', color: 'var(--tx2)', marginBottom: '1rem' }}>
                Move <strong>{movingDoc.name}</strong> to another vault folder:
              </p>
              <div className="fg">
                <div className="fgp sp">
                  <label className="fl">Destination Folder</label>
                  <select
                    value={moveDestination}
                    onChange={(e) => setMoveDestination(e.target.value)}
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
              </div>
              <div className="mf" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-g" onClick={() => setMovingDoc(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-p"
                  onClick={() => {
                    moveDocument(movingDoc.id, moveDestination);
                    setMovingDoc(null);
                  }}
                >
                  <FolderSymlink size={14} />
                  <span>Move File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
