import React, { useState, useEffect } from 'react';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { CourtType, PriorityLevel } from '../../types';
import { X, Landmark, FolderOpen } from 'lucide-react';

const CRT_NAMES: Record<CourtType, string> = {
  SC: 'Supreme Court',
  HC: 'High Court',
  DC: 'District Court',
  CC: 'Consumer Forum',
  LC: 'Other (Labour Court etc.)',
  NGT: 'NGT',
  NCLT: 'NCLT / NCLAT',
  ITAT: 'ITAT',
  DRT: 'DRT / DRAT',
  CAT: 'CAT',
  ARB: 'Arbitration',
};

const LC_FORUMS = [
  'Central Govt Industrial Tribunal (CGIT)',
  'Labour Court - Rouse Avenue, Delhi',
  'Labour Court - Bandra, Mumbai',
  'State Industrial Tribunal',
  'Office of Labour Commissioner / Conciliation Officer',
  'Family Court',
  'Motor Accident Claims Tribunal (MACT)',
  'Revenue Court / SDM Court',
  'Special CBI / PMLA Court',
  'Armed Forces Tribunal (AFT)',
  'Real Estate Regulatory Authority (RERA)',
  'Other Specialized Court',
];

const LC_NATURE = [
  'Industrial Dispute / Termination',
  'Retrenchment & Layoff Dispute',
  'Gratuity & PF Payment Claim',
  'Workmen Compensation & Injury Claim',
  'Domestic Inquiry / Disciplinary Proceedings',
  'Unfair Labour Practice (ULP)',
  'Wages & Bonus Recovery Claim',
  'Matrimonial / Maintenance (Family Court)',
  'Motor Accident Compensation Claim (MACT)',
  'Revenue / Tenancy / Mutation Matter',
  'Other',
];

const SC_NATURE = [
  'SLP (Civil)',
  'SLP (Criminal)',
  'Civil Appeal',
  'Criminal Appeal',
  'Writ Petition (Civil)',
  'Writ Petition (Criminal)',
  'Review Petition',
  'Curative Petition',
  'Transfer Petition',
  'Contempt Petition',
  'Other',
];

const HC_COURTS = [
  'Delhi High Court',
  'Bombay High Court',
  'Madras High Court',
  'Calcutta High Court',
  'Allahabad High Court',
  'Karnataka High Court',
  'Gujarat High Court',
  'Rajasthan High Court',
  'Punjab & Haryana HC',
  'Kerala High Court',
  'Telangana High Court',
  'Andhra Pradesh HC',
  'Other',
];

const HC_NATURE = [
  'Writ Petition (Civil)',
  'Writ Petition (Criminal)',
  'Civil Appeal',
  'Criminal Appeal',
  'Regular First Appeal',
  'Letters Patent Appeal',
  'Revision Petition',
  'Contempt of Court',
  'IP Infringement Suit',
  'Commercial Suit',
  'Other',
];

export const AddCourtMatterModal: React.FC = () => {
  const { modalState, closeModal, clients, addCourtMatter, showToast } = useLawyersDiary();

  const isOpen = modalState.type === 'add-court';
  const courtType: CourtType = modalState.payload || 'HC';

  const [clientId, setClientId] = useState('');
  const [caseNo, setCaseNo] = useState('');
  const [caseTitle, setCaseTitle] = useState('');
  const [court, setCourt] = useState('');
  const [bench, setBench] = useState('Single Bench');
  const [nature, setNature] = useState('Writ Petition (Civil)');
  const [customNature, setCustomNature] = useState('');
  const [courtNo, setCourtNo] = useState('');
  const [judgeName, setJudgeName] = useState('');
  const [vcLink, setVcLink] = useState('');
  const [filingDate, setFilingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [nextDate, setNextDate] = useState('');
  const [stage, setStage] = useState('Filed');
  const [attorney, setAttorney] = useState('Self');
  const [priority, setPriority] = useState<PriorityLevel>('m');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (modalState.payload) {
      const ty: CourtType = modalState.payload;
      setCustomNature('');
      setCourtNo('');
      setJudgeName('');
      setVcLink('');

      if (ty === 'SC') {
        setCourt('Supreme Court of India');
        setBench('Division Bench');
        setNature('SLP (Civil)');
        setStage('Filed');
      } else if (ty === 'HC') {
        setCourt('Delhi High Court');
        setBench('Single Bench');
        setNature('Writ Petition (Civil)');
        setStage('Admission');
      } else if (ty === 'DC') {
        setCourt('Saket District Court, Delhi');
        setNature('Civil Suit');
        setStage('Filing');
      } else if (ty === 'CC') {
        setCourt('NCDRC (National)');
        setNature('Consumer Complaint');
        setStage('Notice to OP');
      } else if (ty === 'LC') {
        setCourt('Central Govt Industrial Tribunal (CGIT)');
        setBench('Presiding Officer');
        setNature('Industrial Dispute / Termination');
        setStage('Conciliation / Pleadings');
      } else if (ty === 'NGT') {
        setCourt('Principal Bench (Delhi)');
        setNature('Original Application');
        setStage('Hearing');
      } else if (ty === 'NCLT') {
        setCourt('NCLT Delhi');
        setNature('Insolvency (CIRP)');
        setStage('Admission');
      } else if (ty === 'ITAT') {
        setCourt('Delhi Bench');
        setNature('Income Tax Appeal');
        setStage('Hearing');
      } else if (ty === 'DRT') {
        setCourt('DRT-I Delhi');
        setNature('OA for Recovery (Banks)');
        setStage('Written Statement');
      } else if (ty === 'CAT') {
        setCourt('Principal Bench (Delhi)');
        setNature('Original Application');
        setStage('Notice');
      } else if (ty === 'ARB') {
        setCourt('Ad-hoc Arbitration');
        setNature('Commercial Arbitration');
        setStage('Pleadings');
      }
    }
  }, [modalState.payload]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNo.trim() || !caseTitle.trim()) {
      showToast('Please provide both Case Number and Case Title', 'er');
      return;
    }

    let finalNature = nature;
    if (nature === 'Other') {
      if (!customNature.trim()) {
        showToast('Please specify the custom substantive nature', 'er');
        return;
      }
      finalNature = customNature.trim();
    }

    const client = clients.find((c) => c.id === clientId);

    addCourtMatter({
      type: courtType,
      clientId: client?.id || '',
      clientName: client?.name || (clientId ? 'Custom Client' : 'General Client'),
      caseNo: caseNo.trim(),
      caseTitle: caseTitle.trim(),
      court: court || CRT_NAMES[courtType],
      courtNo: courtNo.trim() || undefined,
      judgeName: judgeName.trim() || undefined,
      vcLink: vcLink.trim() || undefined,
      bench: bench.trim(),
      nature: finalNature.trim(),
      filingDate,
      nextDate: nextDate || undefined,
      stage,
      attorney,
      priority,
      notes: notes.trim(),
    });
  };

  return (
    <div className="ov op" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="mo lg">
        <div className="mh">
          <div className="flex items-center gap-2.5">
            <Landmark className="w-5 h-5 text-slate-800" />
            <h3 id="mo-crt-t" className="m-0 text-[1.2rem]">
              New {CRT_NAMES[courtType]} Litigation <span className="mo-t" style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', background: 'var(--bd)', borderRadius: '4px' }}>{courtType}</span>
            </h3>
          </div>
          <button className="mc" onClick={closeModal} title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb">
          <form id="court-form" onSubmit={handleSave}>
            <div className="fg">
              {/* Client Selection */}
              <div className="fgp sp">
                <label className="fl">
                  Registered Client Entity <span className="req">*</span>
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

              <div className="fss">{CRT_NAMES[courtType]} Case Particulars</div>

              {/* Case No & Title */}
              <div className="fgp">
                <label className="fl">
                  Case Number / Petition No. <span className="req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. SLP(C) 4521/2025 or W.P.(C) 8821/2025"
                  value={caseNo}
                  onChange={(e) => setCaseNo(e.target.value)}
                  required
                />
              </div>

              <div className="fgp">
                <label className="fl">
                  Court / Tribunal Forum <span className="req">*</span>
                </label>
                {courtType === 'SC' ? (
                  <input type="text" value="Supreme Court of India" readOnly />
                ) : courtType === 'HC' ? (
                  <select value={court} onChange={(e) => setCourt(e.target.value)}>
                    {HC_COURTS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                ) : courtType === 'CC' ? (
                  <select value={court} onChange={(e) => setCourt(e.target.value)}>
                    <option>NCDRC (National)</option>
                    <option>SCDRC (State)</option>
                    <option>DCDRC (District)</option>
                  </select>
                ) : courtType === 'LC' ? (
                  <select value={court} onChange={(e) => setCourt(e.target.value)}>
                    {LC_FORUMS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                ) : courtType === 'NGT' ? (
                  <select value={court} onChange={(e) => setCourt(e.target.value)}>
                    <option>Principal Bench (Delhi)</option>
                    <option>Pune Bench</option>
                    <option>Bhopal Bench</option>
                    <option>Chennai Bench</option>
                    <option>Kolkata Bench</option>
                  </select>
                ) : courtType === 'NCLT' ? (
                  <select value={court} onChange={(e) => setCourt(e.target.value)}>
                    <option>NCLT Delhi</option>
                    <option>NCLT Mumbai</option>
                    <option>NCLT Chennai</option>
                    <option>NCLT Kolkata</option>
                    <option>NCLT Bangalore</option>
                    <option>NCLAT Delhi</option>
                    <option>NCLAT Chennai</option>
                  </select>
                ) : courtType === 'ITAT' ? (
                  <select value={court} onChange={(e) => setCourt(e.target.value)}>
                    <option>Delhi Bench</option>
                    <option>Mumbai Bench</option>
                    <option>Bangalore Bench</option>
                    <option>Chennai Bench</option>
                    <option>Kolkata Bench</option>
                    <option>Ahmedabad Bench</option>
                    <option>Pune Bench</option>
                  </select>
                ) : courtType === 'DRT' ? (
                  <select value={court} onChange={(e) => setCourt(e.target.value)}>
                    <option>DRT-I Delhi</option>
                    <option>DRT-II Delhi</option>
                    <option>DRT Mumbai</option>
                    <option>DRT Bangalore</option>
                    <option>DRT Chennai</option>
                    <option>DRAT Delhi</option>
                    <option>DRAT Mumbai</option>
                  </select>
                ) : courtType === 'CAT' ? (
                  <select value={court} onChange={(e) => setCourt(e.target.value)}>
                    <option>Principal Bench (Delhi)</option>
                    <option>Mumbai Bench</option>
                    <option>Chennai Bench</option>
                    <option>Kolkata Bench</option>
                    <option>Bangalore Bench</option>
                    <option>Chandigarh Bench</option>
                  </select>
                ) : courtType === 'ARB' ? (
                  <select value={court} onChange={(e) => setCourt(e.target.value)}>
                    <option>Ad-hoc Arbitration</option>
                    <option>ICC (Paris)</option>
                    <option>SIAC (Singapore)</option>
                    <option>DIAC (Dubai)</option>
                    <option>LCIA (London)</option>
                    <option>MCIA (Mumbai)</option>
                    <option>ICA (India)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Saket District Court, Delhi"
                    value={court}
                    onChange={(e) => setCourt(e.target.value)}
                    required
                  />
                )}
              </div>

              <div className="fgp sp">
                <label className="fl">
                  Case Cause Title (Parties) <span className="req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Petitioner/Applicant vs Respondent & Anr."
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  required
                />
              </div>

              {/* Bench & Nature */}
              <div className="fgp">
                <label className="fl">Bench Composition</label>
                <select value={bench} onChange={(e) => setBench(e.target.value)}>
                  <option>Single Bench</option>
                  <option>Division Bench</option>
                  <option>Full Bench</option>
                  <option>Constitution Bench</option>
                  <option>Presiding Officer</option>
                  <option>Sole Arbitrator</option>
                  <option>3-Member Tribunal</option>
                </select>
              </div>

              <div className="fgp">
                <label className="fl">Substantive Nature</label>
                {courtType === 'SC' ? (
                  <select value={nature} onChange={(e) => setNature(e.target.value)}>
                    {SC_NATURE.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                ) : courtType === 'HC' ? (
                  <select value={nature} onChange={(e) => setNature(e.target.value)}>
                    {HC_NATURE.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                ) : courtType === 'LC' ? (
                  <select value={nature} onChange={(e) => setNature(e.target.value)}>
                    {LC_NATURE.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={nature}
                    onChange={(e) => setNature(e.target.value)}
                    placeholder="Nature of matter"
                  />
                )}
              </div>

              {/* Custom Substantive Nature (when Other is selected) */}
              {nature === 'Other' && (
                <div className="fgp sp">
                  <label className="fl">
                    Custom Substantive Nature <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Special Civil Application, Contempt Petition, Election Petition"
                    value={customNature}
                    onChange={(e) => setCustomNature(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              )}

              {/* Court Number, Judge Name & VC Link */}
              <div className="fgp">
                <label className="fl">Court Number</label>
                <input
                  type="text"
                  placeholder="e.g. Court No. 14 / Room 204"
                  value={courtNo}
                  onChange={(e) => setCourtNo(e.target.value)}
                />
              </div>

              <div className="fgp">
                <label className="fl">Judge Name</label>
                <input
                  type="text"
                  placeholder="e.g. Hon'ble Justice D.Y. Chandrachud"
                  value={judgeName}
                  onChange={(e) => setJudgeName(e.target.value)}
                />
              </div>

              <div className="fgp sp">
                <label className="fl">Virtual link ( VC Link )</label>
                <input
                  type="url"
                  placeholder="e.g. https://meet.google.com/xyz or Cisco Webex URL"
                  value={vcLink}
                  onChange={(e) => setVcLink(e.target.value)}
                />
              </div>

              {/* Dates */}
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
                <label className="fl">Next Listing / Hearing Date</label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                />
              </div>

              {/* Stage */}
              <div className="fgp sp">
                <label className="fl">Procedural Stage</label>
                <select value={stage} onChange={(e) => setStage(e.target.value)}>
                  <option>Filed</option>
                  <option>Notice Issued</option>
                  <option>Admission Hearing</option>
                  <option>Written Statement / Reply</option>
                  <option>Rejoinder</option>
                  <option>Framing of Issues</option>
                  <option>Plaintiff Evidence</option>
                  <option>Defendant Evidence</option>
                  <option>Final Arguments</option>
                  <option>Reserved for Orders</option>
                  <option>Disposed / Decided</option>
                </select>
              </div>

              {/* Attorney & Priority */}
              <div className="fgp">
                <label className="fl">Lead Counsel</label>
                <select value={attorney} onChange={(e) => setAttorney(e.target.value)}>
                  <option>Self</option>
                  <option>Senior Advocate</option>
                  <option>Associate Counsel</option>
                  <option>Junior Advocate</option>
                  <option>Clerk</option>
                </select>
              </div>

              <div className="fgp">
                <label className="fl">Priority Tier</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                >
                  <option value="h">High Priority</option>
                  <option value="m">Normal Priority</option>
                  <option value="l">Low Priority</option>
                </select>
              </div>

              {/* Notes */}
              <div className="fgp sp">
                <label className="fl">Bench Details &amp; Oral Instructions</label>
                <textarea
                  placeholder="Court room number, items in cause list, arguing counsel instructions…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="mf">
          <button type="button" className="btn btn-o" onClick={closeModal}>
            Cancel
          </button>
          <button type="button" className="btn btn-p" onClick={handleSave}>
            Save Matter &amp; Create Drive Repository
          </button>
        </div>
      </div>
    </div>
  );
};
