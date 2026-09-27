import React, { useState, useEffect } from 'react';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { X, Clock } from 'lucide-react';

export const LogTimeModal: React.FC = () => {
  const { modalState, closeModal, iprMatters, courtMatters, addWorkLog, updateWorkLog, showToast } =
    useLawyersDiary();

  const isOpen = modalState.type === 'log-time';
  const editEntry = modalState.payload && typeof modalState.payload === 'object' && modalState.payload.id ? modalState.payload : null;
  const initialMatterId = modalState.payload && typeof modalState.payload === 'object' ? modalState.payload.matterId || '' : '';

  const [matterId, setMatterId] = useState(initialMatterId);
  const [task, setTask] = useState('');
  const [hours, setHours] = useState('2.0');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attorney, setAttorney] = useState('Self');
  const [billable, setBillable] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editEntry) {
      setMatterId(editEntry.matterId || '');
      setTask(editEntry.task || '');
      setHours(String(editEntry.hours || '2.0'));
      setDate(editEntry.date || new Date().toISOString().split('T')[0]);
      setAttorney(editEntry.attorney || 'Self');
      setBillable(editEntry.billable ?? true);
      setNotes(editEntry.notes || '');
    } else if (modalState.payload && typeof modalState.payload === 'object') {
      if (modalState.payload.matterId) setMatterId(modalState.payload.matterId);
    }
  }, [editEntry, modalState.payload]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numHours = parseFloat(hours);
    if (!task.trim() || isNaN(numHours) || numHours <= 0) {
      showToast('Please provide task description and valid hours', 'er');
      return;
    }

    const m = iprMatters.find((x) => x.id === matterId) || courtMatters.find((x) => x.id === matterId);
    const matterName = m
      ? 'mark' in m
        ? `${m.mark} (${m.clientName})`
        : `${m.caseTitle} (${m.clientName})`
      : 'General Practice';

    if (editEntry) {
      updateWorkLog(editEntry.id, {
        matterId,
        matterName,
        task: task.trim(),
        hours: numHours,
        date,
        attorney,
        billable,
        notes: notes.trim(),
      });
    } else {
      addWorkLog({
        matterId,
        matterName,
        task: task.trim(),
        hours: numHours,
        date,
        attorney,
        billable,
        notes: notes.trim(),
      });
    }
  };

  return (
    <div className="ov op" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="mo sm">
        <div className="mh">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-slate-800" />
            <h3 id="mo-wl-t" className="m-0 text-[1.2rem]">
              {editEntry ? 'Edit Billable Time Record' : 'Log Professional Time'}
            </h3>
          </div>
          <button className="mc" onClick={closeModal} title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb">
          <form onSubmit={handleSubmit}>
            <div className="fg">
              <div className="fgp sp">
                <label className="fl">Related Matter</label>
                <select
                  value={matterId}
                  onChange={(e) => setMatterId(e.target.value)}
                >
                  <option value="">— General Firm Administration / Research —</option>
                  <optgroup label="IPR Matters">
                    {iprMatters.map((m) => (
                      <option key={m.id} value={m.id}>
                        [{m.type}] {m.mark} ({m.clientName})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Courts &amp; Tribunals">
                    {courtMatters.map((r) => (
                      <option key={r.id} value={r.id}>
                        [{r.type}] {r.caseTitle.substring(0, 45)}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="fgp sp">
                <label className="fl">
                  Professional Task Description <span className="req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Oral argument before DB, Pleadings drafting, Cross-examination research…"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  required
                />
              </div>

              <div className="fgp">
                <label className="fl">
                  Time Spent (Hours) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  placeholder="e.g. 2.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  required
                />
              </div>

              <div className="fgp">
                <label className="fl">
                  Date of Performance <span className="req">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="fgp">
                <label className="fl">Operating Counsel</label>
                <select
                  value={attorney}
                  onChange={(e) => setAttorney(e.target.value)}
                >
                  <option>Self</option>
                  <option>Senior Advocate</option>
                  <option>Associate Counsel</option>
                  <option>Junior Advocate</option>
                  <option>Law Clerk</option>
                </select>
              </div>

              <div className="fgp">
                <label className="fl">Billing Tier</label>
                <select
                  value={billable ? '1' : '0'}
                  onChange={(e) => setBillable(e.target.value === '1')}
                >
                  <option value="1">Billable to Client</option>
                  <option value="0">Pro Bono / Non-Billable</option>
                </select>
              </div>

              <div className="fgp sp">
                <label className="fl">Invoice Item Notes</label>
                <textarea
                  rows={2}
                  placeholder="Specific notes for billing invoice or disbursement statement…"
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
          <button type="button" className="btn btn-p" onClick={handleSubmit}>
            Save Time Entry
          </button>
        </div>
      </div>
    </div>
  );
};
