import React, { useState } from 'react';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import { StickyNote, Search, Plus, Pin, Edit3, Trash2, Folder } from 'lucide-react';

export const NotesPage: React.FC = () => {
  const { notes, openModal, deleteNote, togglePinNote } = useLawyersDiary();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotes = notes.filter((n) => {
    if (!searchTerm) return true;
    return (
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.matterName && n.matterName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="pg on">
      {/* Header */}
      <div className="ph">
        <div>
          <div className="flex items-center gap-2.5">
            <StickyNote className="w-6 h-6 text-amber-700" />
            <h1>Case Notes &amp; Legal Strategy</h1>
          </div>
          <p>Substantive case arguments, judicial precedents &amp; citations, witness strategy &amp; counsel notes</p>
        </div>
        <div className="pa">
          <div className="sw2 w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search citations & strategy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-p btn-s" onClick={() => openModal('note')}>
            <Plus className="w-3.5 h-3.5" />
            <span>Create Case Note</span>
          </button>
        </div>
      </div>

      {/* Grid of Note Cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5">
        {sortedNotes.map((note) => (
          <div
            key={note.id}
            className="cd"
            style={{
              display: 'flex',
              flexDirection: 'column',
              border: note.pinned ? '1.5px solid var(--gd)' : undefined,
              boxShadow: note.pinned ? 'var(--sh-md)' : undefined,
            }}
          >
            {/* Note Card Header */}
            <div
              className="ch"
              style={{
                alignItems: 'flex-start',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--bd)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                  {note.pinned && <Pin className="w-3.5 h-3.5 text-amber-700 fill-amber-700 shrink-0" />}
                  <span
                    className="ct2"
                    style={{
                      fontSize: '1rem',
                      lineHeight: 1.3,
                      fontWeight: 700,
                      color: 'var(--tx)',
                    }}
                  >
                    {note.title}
                  </span>
                </div>
                {note.matterName && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--pr)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                    <Folder className="w-3 h-3 text-slate-500" />
                    <span>{note.matterName}</span>
                  </div>
                )}
              </div>
              <span
                className={`chip ${note.priority === 'h' ? 'rd' : note.priority === 'm' ? 'gd' : 'gn'}`}
                style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}
              >
                {note.priority === 'h' ? 'High Priority' : note.priority === 'm' ? 'Normal' : 'Background'}
              </span>
            </div>

            {/* Note Content */}
            <div
              className="cb"
              style={{
                flex: 1,
                fontSize: '0.82rem',
                lineHeight: 1.65,
                color: 'var(--tx2)',
                whiteSpace: 'pre-wrap',
                padding: '1rem 1.25rem',
              }}
            >
              {note.content}
            </div>

            {/* Note Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.65rem 1.25rem',
                background: 'var(--bg)',
                borderTop: '1px solid var(--bd)',
                borderRadius: '0 0 var(--rd-card) var(--rd-card)',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--tx3)' }}>
                {note.updatedAt || note.createdAt}
              </span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  className="btn btn-g btn-s"
                  onClick={() => togglePinNote(note.id)}
                  title={note.pinned ? 'Unpin' : 'Pin to top'}
                >
                  <Pin className={`w-3 h-3 ${note.pinned ? 'text-amber-700 fill-amber-700' : ''}`} />
                  <span>{note.pinned ? 'Unpin' : 'Pin'}</span>
                </button>
                <button
                  className="btn btn-o btn-s"
                  onClick={() => openModal('note', note)}
                  title="Edit Note"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  className="btn btn-d btn-s"
                  onClick={() => {
                    if (window.confirm(`Delete note "${note.title}"?`)) {
                      deleteNote(note.id);
                    }
                  }}
                  title="Delete Note"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {sortedNotes.length === 0 && (
          <div
            className="cd"
            style={{
              gridColumn: '1 / -1',
              padding: '3.5rem',
              textAlign: 'center',
              color: 'var(--tx2)',
            }}
          >
            <StickyNote className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p>No strategy notes found. Click &quot;Create Case Note&quot; to write research notes and judicial citations.</p>
          </div>
        )}
      </div>
    </div>
  );
};
