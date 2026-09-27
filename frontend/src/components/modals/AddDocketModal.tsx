import React, { useState, useEffect } from 'react';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { DocketPriority } from '../../types';
import { X, Calendar, CheckCircle2 } from 'lucide-react';

export const AddDocketModal: React.FC = () => {
  const { modalState, closeModal, iprMatters, courtMatters, addDocketEvent, showToast } =
    useLawyersDiary();

  const isOpen = modalState.type === 'add-docket';
  const initialMatterId = modalState.payload || '';

  const [type, setType] = useState('Hearing');
  const [priority, setPriority] = useState<DocketPriority>('wa');
  const [matterId, setMatterId] = useState(initialMatterId);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:30');
  const [venue, setVenue] = useState('');
  const [attorney, setAttorney] = useState('Self');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (modalState.payload) {
      setMatterId(modalState.payload);
    }
  }, [modalState.payload]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      showToast('Event Date is required', 'er');
      return;
    }

    const m = iprMatters.find((x) => x.id === matterId) || courtMatters.find((x) => x.id === matterId);
    const matterName = m
      ? 'mark' in m
        ? `${m.mark} (${m.clientName})`
        : `${m.caseTitle} (${m.clientName})`
      : 'General Matter';

    addDocketEvent({
      type,
      priority,
      matterId,
      matterName,
      date,
      time,
      venue: venue.trim(),
      attorney,
      notes: notes.trim(),
    });
  };

  return (
    <div className="ov op" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="mo sm">
        <div className="mh">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-slate-800" />
            <h3 className="m-0 text-[1.2rem]">Schedule Docket Event</h3>
          </div>
          <button className="mc" onClick={closeModal} title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb">
          <form onSubmit={handleSubmit}>
            <div className="fg">
              <div className="fgp">
                <label className="fl">
                  Event / Appearance Type <span className="req">*</span>
                </label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option>Court Hearing</option>
                  <option>Filing Deadline</option>
                  <option>FER Response Deadline</option>
                  <option>Opposition Hearing</option>
                  <option>Renewal Due</option>
                  <option>Evidence Deadline</option>
                  <option>Written Arguments Submission</option>
                  <option>Arbitration Sitting</option>
                  <option>Mediation Conference</option>
                  <option>Client Strategy Consultation</option>
                  <option>Other Legal Deadline</option>
                </select>
              </div>

              <div className="fgp">
                <label className="fl">Priority Tier</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as DocketPriority)}
                >
                  <option value="ug">Urgent / Strict Limitation</option>
                  <option value="wa">Normal Schedule</option>
                  <option value="ok">Low Priority / Routine</option>
                </select>
              </div>

              <div className="fgp sp">
                <label className="fl">Related Docket Matter</label>
                <select
                  value={matterId}
                  onChange={(e) => setMatterId(e.target.value)}
                >
                  <option value="">— Select Matter (Optional) —</option>
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
                        [{r.type}] {r.caseTitle.substring(0, 40)}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="fgp">
                <label className="fl">
                  Appearance Date <span className="req">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="fgp">
                <label className="fl">Scheduled Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <div className="fgp">
                <label className="fl">Court Room / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. DHC Court No. 5, Item 23"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
              </div>

              <div className="fgp">
                <label className="fl">Assigned Counsel</label>
                <select
                  value={attorney}
                  onChange={(e) => setAttorney(e.target.value)}
                >
                  <option>Self</option>
                  <option>Senior Advocate</option>
                  <option>Associate Counsel</option>
                  <option>Junior Advocate</option>
                  <option>Clerk</option>
                </select>
              </div>

              <div className="fgp sp">
                <label className="fl">Hearing Instructions &amp; Briefs</label>
                <textarea
                  placeholder="Bench details, pass-over instructions, senior arguing counsel notes…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ minHeight: '60px' }}
                />
              </div>

              <div className="ib gn sp flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Synchronizes directly with Google Calendar with automated 7-day and 1-day statutory alerts.
                </span>
              </div>
            </div>
          </form>
        </div>

        <div className="mf">
          <button type="button" className="btn btn-o" onClick={closeModal}>
            Cancel
          </button>
          <button type="button" className="btn btn-p" onClick={handleSubmit}>
            Schedule Event &amp; Sync Calendar
          </button>
        </div>
      </div>
    </div>
  );
};
