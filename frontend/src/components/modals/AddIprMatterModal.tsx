import React, { useState, useEffect } from 'react';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { IprType, PriorityLevel } from '../../types';
import { X, Award, FolderOpen, Info } from 'lucide-react';

const TN: Record<IprType, string> = {
  TM: 'Trademark',
  PAT: 'Patent',
  COPY: 'Copyright',
  DESIGN: 'Design',
  GI: 'GI Tag',
};

export const AddIprMatterModal: React.FC = () => {
  const { modalState, closeModal, clients, addIprMatter, showToast } = useLawyersDiary();

  const isOpen = modalState.type === 'add-ipr';
  const initialType: IprType = modalState.payload || 'TM';

  const [activeType, setActiveType] = useState<IprType>(initialType);
  const [clientId, setClientId] = useState('');
  const [appNo, setAppNo] = useState('');
  const [mark, setMark] = useState('');
  const [classes, setClasses] = useState('');
  const [inventors, setInventors] = useState('');
  const [nature, setNature] = useState('Literary');
  const [designClass, setDesignClass] = useState('');
  const [goods, setGoods] = useState('');
  const [area, setArea] = useState('');
  const [filingDate, setFilingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Pending');
  const [nextDate, setNextDate] = useState('');
  const [attorney, setAttorney] = useState('Self');
  const [priority, setPriority] = useState<PriorityLevel>('m');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (modalState.payload && ['TM', 'PAT', 'COPY', 'DESIGN', 'GI'].includes(modalState.payload)) {
      setActiveType(modalState.payload);
    }
  }, [modalState.payload]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mark.trim()) {
      showToast('Please provide the Mark Name / Title', 'er');
      return;
    }
    const client = clients.find((c) => c.id === clientId);

    addIprMatter({
      type: activeType,
      clientId: client?.id || '',
      clientName: client?.name || (clientId ? 'Custom Client' : 'General Client'),
      appNo: appNo.trim() || `APP-${Date.now().toString().slice(-6)}`,
      mark: mark.trim(),
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
    });
  };

  const previewFolder =
    activeType === 'TM'
      ? `TM_${appNo || 'App'}_${(mark || 'Mark').replace(/\s+/g, '_')}_Class${classes || 'X'}`
      : `${activeType}_${appNo || 'App'}_${(mark || 'Title').replace(/\s+/g, '_')}`;

  return (
    <div className="ov op" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="mo lg">
        <div className="mh">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-700" />
            <h3 id="mo-m-t" className="m-0 text-[1.2rem]">
              New {TN[activeType]} Matter <span className="mo-t" style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', background: 'var(--bd)', borderRadius: '4px' }}>{activeType}</span>
            </h3>
          </div>
          <button className="mc" onClick={closeModal} title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb">
          {/* Type Tabs */}
          <div className="type-tabs">
            {(Object.keys(TN) as IprType[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`type-tab ${key === activeType ? 'on' : ''}`}
                onClick={() => setActiveType(key)}
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
                    <select defaultValue="Word Mark">
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
                <span>
                  Workspace Vault directory will be structured as: <strong>{previewFolder}</strong>
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
