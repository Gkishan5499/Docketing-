import React, { useState } from 'react';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import { Plus, Search, FolderOpen, Trash2, Users, Building, Mail, Phone } from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const {
    clients,
    iprMatters,
    courtMatters,
    openModal,
    deleteClient,
    canDeleteRecords,
    showToast,
  } = useLawyersDiary();

  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = searchTerm
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.contact.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : clients;

  return (
    <div className="pg on">
      {/* Header */}
      <div className="ph">
        <div>
          <h1>Client Directory &amp; Accounts</h1>
          <p>Comprehensive roster of corporate entities, organizations, and retained individual clients</p>
        </div>
        <div className="pa">
          <div className="sw2 w-55">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-p btn-s" onClick={() => openModal('add-client')}>
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Client / Entity Name</th>
              <th>Category</th>
              <th>Jurisdiction</th>
              <th>IPR Matters</th>
              <th>Courts</th>
              <th>Tribunals</th>
              <th>Assigned Counsel</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((c) => {
              const iprCount = iprMatters.filter((m) => m.clientId === c.id).length;
              const crtCount = courtMatters.filter(
                (r) => r.clientId === c.id && ['SC', 'HC', 'DC', 'CC'].includes(r.type)
              ).length;
              const triCount = courtMatters.filter(
                (r) =>
                  r.clientId === c.id &&
                  ['NGT', 'NCLT', 'ITAT', 'DRT', 'CAT', 'ARB'].includes(r.type)
              ).length;

              return (
                <tr key={c.id} onClick={() => openModal('client-detail', c.id)} className="cursor-pointer">
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--tx)', fontSize: '0.88rem' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--tx2)', display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '2px' }}>
                      {c.email && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{c.email}</span>
                        </span>
                      )}
                      {c.contact && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.contact}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="chip">{c.type}</span>
                  </td>
                  <td style={{ color: 'var(--tx2)', fontWeight: 500 }}>{c.country}</td>
                  <td>
                    <span className="chip gd" style={{ fontWeight: 700 }}>
                      {iprCount} IPR
                    </span>
                  </td>
                  <td>
                    <span className="chip pr" style={{ fontWeight: 700 }}>
                      {crtCount} Cases
                    </span>
                  </td>
                  <td>
                    <span className="chip cy" style={{ fontWeight: 700 }}>
                      {triCount} Tribunals
                    </span>
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--tx)' }}>{c.attorney}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      {canDeleteRecords && <button
                        className="btn btn-o btn-s"
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast(`Document Vault: /LawyersDiary/${c.name}`, 'in');
                        }}
                        title="Open Cloud Vault"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                      </button>}
                      <button
                        className="btn btn-d btn-s"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete client record "${c.name}"?`)) {
                            deleteClient(c.id);
                          }
                        }}
                        title="Delete Client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--tx2)' }}>
                  <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p>No clients match your filter. Click "+ Add Client" to enroll a new client.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
