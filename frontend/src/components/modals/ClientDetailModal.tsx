import React from 'react';
import {
  Calendar,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Phone,
  StickyNote,
  UserRound,
  X,
} from 'lucide-react';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';

export const ClientDetailModal: React.FC = () => {
  const {
    modalState,
    closeModal,
    openModal,
    clients,
    iprMatters,
    courtMatters,
    deadlines,
    documents,
    notes,
    workLogs,
  } = useLawyersDiary();

  if (modalState.type !== 'client-detail' || !modalState.payload) return null;

  const client = clients.find((item) => item.id === modalState.payload);
  if (!client) return null;

  const clientIpr = iprMatters.filter((matter) => matter.clientId === client.id);
  const clientCourt = courtMatters.filter((matter) => matter.clientId === client.id);
  const matterIds = new Set([...clientIpr, ...clientCourt].map((matter) => matter.id));
  const clientDeadlines = deadlines
    .filter((deadline) => matterIds.has(deadline.matterId))
    .sort((a, b) => a.date.localeCompare(b.date));
  const clientDocuments = documents.filter((document) => matterIds.has(document.matterId));
  const clientNotes = notes.filter((note) => matterIds.has(note.matterId));
  const clientLogs = workLogs.filter((log) => matterIds.has(log.matterId));
  const totalHours = clientLogs.reduce((total, log) => total + (log.hours || 0), 0);

  return (
    <div className="ov op" onClick={(event) => event.target === event.currentTarget && closeModal()}>
      <div className="mo lg client-detail-modal">
        <div className="mh">
          <div>
            <div className="client-detail-kicker">Client workspace</div>
            <h3>{client.name}</h3>
            <p className="client-detail-subtitle">{client.type} · {client.country} · Lead counsel: {client.attorney}</p>
          </div>
          <button className="mc" onClick={closeModal} title="Close" aria-label="Close client details">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb client-detail-body">
          <div className="client-detail-contact">
            <div><UserRound size={15} /><span>{client.contact || 'No primary contact recorded'}</span></div>
            <div><Mail size={15} /><span>{client.email || 'No email recorded'}</span></div>
            <div><Phone size={15} /><span>{client.phone || 'No phone recorded'}</span></div>
          </div>

          <div className="client-detail-metrics">
            <div><strong>{clientIpr.length + clientCourt.length}</strong><span>Total matters</span></div>
            <div><strong>{clientDeadlines.length}</strong><span>Deadlines</span></div>
            <div><strong>{clientDocuments.length}</strong><span>Documents</span></div>
            <div><strong>{totalHours}h</strong><span>Logged time</span></div>
          </div>

          <section className="client-detail-section">
            <div className="client-detail-section-head"><h4>Matters</h4><span>{clientIpr.length} IPR · {clientCourt.length} court / tribunal</span></div>
            <div className="client-detail-list">
              {[...clientIpr, ...clientCourt].map((matter) => (
                <button className="client-detail-list-item" key={matter.id} type="button" onClick={() => openModal('matter-detail', matter.id)}>
                  <FileText size={16} />
                  <span><strong>{'mark' in matter ? matter.mark : matter.caseTitle}</strong><small>{matter.type} · {'appNo' in matter ? matter.appNo : matter.caseNo}</small></span>
                  <span className="client-detail-status">{'status' in matter ? matter.status : matter.stage}</span>
                </button>
              ))}
              {!clientIpr.length && !clientCourt.length && <p className="client-detail-empty">No matters have been linked to this client.</p>}
            </div>
          </section>

          <div className="client-detail-columns">
            <section className="client-detail-section">
              <div className="client-detail-section-head"><h4>Next deadlines</h4><Calendar size={15} /></div>
              {clientDeadlines.slice(0, 5).map((deadline) => <div className="client-detail-mini-row" key={deadline.id}><Calendar size={14} /><span><strong>{deadline.type}</strong><small>{deadline.date} · {deadline.matterName}</small></span></div>)}
              {!clientDeadlines.length && <p className="client-detail-empty">No deadlines recorded.</p>}
            </section>
            <section className="client-detail-section">
              <div className="client-detail-section-head"><h4>Documents & notes</h4><StickyNote size={15} /></div>
              <div className="client-detail-count-row"><span><FileText size={14} /> Documents</span><strong>{clientDocuments.length}</strong></div>
              <div className="client-detail-count-row"><span><StickyNote size={14} /> Case notes</span><strong>{clientNotes.length}</strong></div>
              <div className="client-detail-count-row"><span><Clock3 size={14} /> Work entries</span><strong>{clientLogs.length}</strong></div>
            </section>
          </div>
        </div>
        <div className="mf">
          <button type="button" className="btn btn-o" onClick={() => closeModal()}>Close</button>
          <button type="button" className="btn btn-p" onClick={() => window.alert(`Document Vault: /LawyersDiary/${client.name}`)}><MapPin className="w-3.5 h-3.5" /> Open client vault</button>
        </div>
      </div>
    </div>
  );
};
