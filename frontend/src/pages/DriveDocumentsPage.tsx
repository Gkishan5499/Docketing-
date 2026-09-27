import React, { useState } from 'react';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import { downloadDocumentPdf } from '../utils/helpers';
import {
  FolderOpen,
  RefreshCw,
  Search,
  ExternalLink,
  Download,
  CheckCircle2,
  FileText,
  File,
  HardDrive,
  FolderGit2,
} from 'lucide-react';

export const DriveDocumentsPage: React.FC = () => {
  const { documents, syncDriveAndCalendar, showToast } = useLawyersDiary();
  const [filterType, setFilterType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDocs = documents.filter((d) => {
    if (filterType !== 'All' && d.folder !== filterType && d.type !== filterType.toLowerCase()) {
      return false;
    }
    if (searchTerm) {
      const match =
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.matterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.folder.toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="pg on">
      {/* Header */}
      <div className="ph">
        <div>
          <div className="flex items-center gap-2.5">
            <FolderOpen className="w-6 h-6 text-slate-800" />
            <h1>Document Vault</h1>
          </div>
          <p>Cloud document repository for pleadings, exhibits, certified orders, statutory powers, and evidence</p>
        </div>
        <div className="pa">
          <button className="btn btn-o btn-s" onClick={syncDriveAndCalendar}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Vault</span>
          </button>
          <button
            className="btn btn-p btn-s"
            onClick={() => showToast('Opening Document Vault: /LawyersDiary', 'in')}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open Root Vault</span>
          </button>
        </div>
      </div>

      {/* Storage Bar Card */}
      <div
        className="cd"
        style={{
          padding: '1rem 1.3rem',
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
            <span>Firm Encrypted Partition</span>
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
          <span>Active OAuth Link</span>
        </span>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* Left: Folder Tree */}
        <div className="cd">
          <div className="ch">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <FolderGit2 className="w-4 h-4 text-slate-700" />
              <span className="ct2">Folder Structure</span>
            </div>
            <span className="chip pr">Auto-Structured</span>
          </div>
          <div className="cb">
            <div className="ft" style={{ fontSize: '0.76rem' }}>
              <div>
                <span className="sym">📁 </span>
                <span className="dir">/LawyersDiary/</span>
              </div>
              <div style={{ paddingLeft: '1.1rem' }}>
                <span className="sym">├── 📁 </span>
                <span className="dir">Clients/</span>
              </div>
              <div style={{ paddingLeft: '2.2rem' }}>
                <span className="sym">├── 📁 </span>
                <span style={{ color: '#e2e8f0' }}>Rajan &amp; Sons Pvt. Ltd./</span>
              </div>
              <div style={{ paddingLeft: '3.3rem' }}>
                <span className="sym">├── 📁 </span>
                <span style={{ color: '#86efac' }}>IPR_Matters/</span>
              </div>
              <div style={{ paddingLeft: '3.3rem' }}>
                <span className="sym">├── 📁 </span>
                <span style={{ color: '#86efac' }}>Court_Matters/</span>
              </div>
              <div style={{ paddingLeft: '3.3rem' }}>
                <span className="sym">└── 📁 </span>
                <span style={{ color: '#86efac' }}>Tribunals/</span>
              </div>
              <div style={{ paddingLeft: '2.2rem' }}>
                <span className="sym">├── 📁 </span>
                <span style={{ color: '#e2e8f0' }}>Sunita Sharma/</span>
              </div>
              <div style={{ paddingLeft: '2.2rem' }}>
                <span className="sym">├── 📁 </span>
                <span style={{ color: '#e2e8f0' }}>GreenEarth Organics/</span>
              </div>
              <div style={{ paddingLeft: '2.2rem' }}>
                <span className="sym">└── 📁 </span>
                <span style={{ color: '#e2e8f0' }}>BioMed Solutions Ltd./</span>
              </div>
              <div style={{ paddingLeft: '1.1rem' }}>
                <span className="sym">├── 📁 </span>
                <span className="dir">Templates &amp; Drafts/</span>
              </div>
              <div style={{ paddingLeft: '1.1rem' }}>
                <span className="sym">└── 📁 </span>
                <span className="dir">Daily_Cause_Lists/</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Document List */}
        <div className="cd">
          <div className="ch">
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
            <div className="sw2" style={{ width: '200px' }}>
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="cb" style={{ padding: 0 }}>
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Related Docket Matter</th>
                    <th>Subfolder</th>
                    <th>File Size</th>
                    <th>Uploaded</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
                          onClick={() => {
                            downloadDocumentPdf(doc);
                            showToast(`Downloading "${doc.name}" as PDF...`, 'ok');
                          }}
                        >
                          <span
                            style={{
                              padding: '0.2rem 0.4rem',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              background: '#fef2f2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                            }}
                          >
                            {doc.type.toUpperCase()}
                          </span>
                          <span className="hover:underline hover:text-[var(--pr)]" style={{ fontWeight: 600, color: 'var(--tx)', fontSize: '0.84rem' }}>
                            {doc.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--tx2)' }}>{doc.matterName}</td>
                      <td>
                        <span className="chip pr">{doc.folder}</span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--tx2)' }}>{doc.size}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--tx2)' }}>{doc.uploadedAt}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="btn btn-p btn-s"
                            onClick={() => {
                              downloadDocumentPdf(doc);
                              showToast(`Downloading "${doc.name}" as PDF...`, 'ok');
                            }}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </button>
                          <button
                            className="btn btn-o btn-s"
                            onClick={() => {
                              downloadDocumentPdf(doc);
                              showToast(`Opening "${doc.name}" in PDF Viewer`, 'in');
                            }}
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredDocs.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ textAlign: 'center', padding: '3rem', color: 'var(--tx2)' }}
                      >
                        <File className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p>No documents found matching the selected filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
