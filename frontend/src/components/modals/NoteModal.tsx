import React, { useState, useEffect } from 'react';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { PriorityLevel } from '../../types';
import { X, StickyNote } from 'lucide-react';

export const NoteModal: React.FC = () => {
  const { modalState, closeModal, iprMatters, courtMatters, addNote, updateNote, showToast } =
    useLawyersDiary();

  const isOpen = modalState.type === 'note';
  const editNote = modalState.payload && typeof modalState.payload === 'object' && modalState.payload.id ? modalState.payload : null;
  const initialMatterId = modalState.payload && typeof modalState.payload === 'object' ? modalState.payload.matterId || '' : '';

  const [matterId, setMatterId] = useState(initialMatterId);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('m');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (editNote) {
      setMatterId(editNote.matterId || '');
      setTitle(editNote.title || '');
      setPriority(editNote.priority || 'm');
      setContent(editNote.content || '');
    } else if (modalState.payload && typeof modalState.payload === 'object') {
      if (modalState.payload.matterId) setMatterId(modalState.payload.matterId);
    }
  }, [editNote, modalState.payload]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Title and content are required', 'er');
      return;
    }

    const m = iprMatters.find((x) => x.id === matterId) || courtMatters.find((x) => x.id === matterId);
    const matterName = m
      ? 'mark' in m
        ? `${m.mark} (${m.clientName})`
        : `${m.caseTitle} (${m.clientName})`
      : '';

    if (editNote) {
      updateNote(editNote.id, {
        matterId,
        matterName,
        title: title.trim(),
        content: content.trim(),
        priority,
      });
    } else {
      addNote({
        matterId,
        matterName,
        title: title.trim(),
        content: content.trim(),
        priority,
        pinned: false,
      });
    }
  };

  return (
    <div className="ov op" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="mo sm">
        <div className="mh">
          <div className="flex items-center gap-2.5">
            <StickyNote className="w-5 h-5 text-amber-700" />
            <h3 id="mo-nt-t" className="m-0 text-[1.2rem]">
              {editNote ? 'Edit Case Strategy Note' : 'New Legal Strategy & Citations Note'}
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
                <label className="fl">Related Matter (Optional)</label>
                <select
                  value={matterId}
                  onChange={(e) => setMatterId(e.target.value)}
                >
                  <option value="">— General Firm Strategy Note —</option>
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
                  Note Subject / Proposition <span className="req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Interim Injunction Arguments & Precedents (AIR 2024 SC)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="fgp">
                <label className="fl">Priority Level</label>
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
                <label className="fl">
                  Substantive Legal Notes &amp; Citations <span className="req">*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Legal ratio, statutory provisions, precedent paragraphs, arguments to advance before the bench…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
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
            Save Strategy Note
          </button>
        </div>
      </div>
    </div>
  );
};
