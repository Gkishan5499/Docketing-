import React, { useState } from 'react';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import { exportToCsv } from '../utils/helpers';
import { Clock, Plus, Download, Edit3, Trash2, Filter } from 'lucide-react';

export const WorkLogPage: React.FC = () => {
  const { workLogs, openModal, deleteWorkLog } = useLawyersDiary();
  const [filterAttorney, setFilterAttorney] = useState('');

  const filteredLogs = filterAttorney
    ? workLogs.filter((l) => l.attorney === filterAttorney)
    : workLogs;

  const totalHours = workLogs.reduce((acc, l) => acc + (l.hours || 0), 0);
  const billableHours = workLogs.reduce(
    (acc, l) => (l.billable ? acc + (l.hours || 0) : acc),
    0
  );
  const nonBillableHours = totalHours - billableHours;

  const handleExport = () => {
    exportToCsv('LawyersDiary_Work_Logs.csv', workLogs);
  };

  return (
    <div className="pg on">
      {/* Header */}
      <div className="ph">
        <div>
          <div className="flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-slate-800" />
            <h1>Advocate Work Log &amp; Billable Hours</h1>
          </div>
          <p>Track professional time spent on court arguments, pleadings drafting, client conferences, research &amp; filings</p>
        </div>
        <div className="pa">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterAttorney}
              onChange={(e) => setFilterAttorney(e.target.value)}
              className="rounded-lg border border-[var(--bd2)] px-3 py-1.5 text-xs outline-none"
            >
              <option value="">All Counsel</option>
              <option>Senior Advocate</option>
              <option>Associate Counsel</option>
              <option>Junior Advocate</option>
              <option>Law Clerk</option>
            </select>
          </div>
          <button className="btn btn-o btn-s" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-p btn-s" onClick={() => openModal('log-time')}>
            <Plus className="w-3.5 h-3.5" />
            <span>Log Billable Hours</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="cd" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--tx2)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
            Total Logged
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--pr)', marginTop: '0.25rem', fontFamily: 'var(--serif)' }}>
            {totalHours.toFixed(1)} <span style={{ fontSize: '0.9rem', fontWeight: 500, fontFamily: 'var(--sans)', color: 'var(--tx2)' }}>hrs</span>
          </div>
        </div>
        <div className="cd" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--gd)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
            Billable Hours
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gd)', marginTop: '0.25rem', fontFamily: 'var(--serif)' }}>
            {billableHours.toFixed(1)} <span style={{ fontSize: '0.9rem', fontWeight: 500, fontFamily: 'var(--sans)' }}>hrs</span>
          </div>
        </div>
        <div className="cd" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--tx2)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
            Non-Billable
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--tx2)', marginTop: '0.25rem', fontFamily: 'var(--serif)' }}>
            {nonBillableHours.toFixed(1)} <span style={{ fontSize: '0.9rem', fontWeight: 500, fontFamily: 'var(--sans)' }}>hrs</span>
          </div>
        </div>
        <div className="cd" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--tx2)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
            Logged Entries
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--tx)', marginTop: '0.25rem', fontFamily: 'var(--serif)' }}>
            {workLogs.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Related Matter</th>
              <th>Task Performed &amp; Notes</th>
              <th>Advocate</th>
              <th>Duration</th>
              <th>Billing Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((l) => (
              <tr key={l.id}>
                <td style={{ fontSize: '0.8rem', color: 'var(--tx2)', whiteSpace: 'nowrap' }}>
                  {l.date}
                </td>
                <td>
                  <strong style={{ color: 'var(--tx)', fontSize: '0.85rem' }}>
                    {l.matterName || 'General Practice'}
                  </strong>
                </td>
                <td style={{ fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 500 }}>{l.task}</div>
                  {l.notes && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--tx2)', marginTop: '0.2rem' }}>
                      {l.notes}
                    </div>
                  )}
                </td>
                <td style={{ fontSize: '0.82rem', color: 'var(--tx2)' }}>{l.attorney}</td>
                <td style={{ fontWeight: 700, color: 'var(--gd)', fontSize: '0.9rem' }}>
                  {l.hours}h
                </td>
                <td>
                  <span className={`chip ${l.billable ? 'gn' : ''}`} style={{ fontWeight: 600 }}>
                    {l.billable ? 'Billable' : 'Pro Bono / Admin'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                    <button
                      className="btn btn-o btn-s"
                      onClick={() => openModal('log-time', l)}
                      title="Edit Entry"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="btn btn-d btn-s"
                      onClick={() => {
                        if (window.confirm('Delete this work log entry?')) {
                          deleteWorkLog(l.id);
                        }
                      }}
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredLogs.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: 'center', padding: '3rem', color: 'var(--tx2)' }}
                >
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p>No work logs found. Click &quot;Log Billable Hours&quot; to add time entries.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
