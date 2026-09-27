import React, { useState } from 'react';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import { aDot, exportToCsv } from '../utils/helpers';
import { ShieldCheck, Download, Filter, CheckCircle2 } from 'lucide-react';

export const HistoryAuditPage: React.FC = () => {
  const { auditLogs } = useLawyersDiary();
  const [filterAction, setFilterAction] = useState('');

  const filteredLogs = filterAction
    ? auditLogs.filter((a) => a.action.toLowerCase().includes(filterAction.toLowerCase()))
    : auditLogs;

  const handleExport = () => {
    exportToCsv('LawyersDiary_Audit_Trail.csv', auditLogs);
  };

  return (
    <div className="pg on">
      {/* Header */}
      <div className="ph">
        <div>
            <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-slate-800" />
            <h1>Compliance &amp; Audit Trail</h1>
          </div>
          <p>Immutable operational logging of all matter lifecycle changes, procedural filings, hearings, and Drive records</p>
        </div>
        <div className="pa">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
                className="rounded-lg border border-[var(--bd2)] px-3 py-1.5 text-xs outline-none"
            >
              <option value="">All Action Types</option>
              <option>CREATE_MATTER</option>
              <option>UPDATE_STAGE</option>
              <option>ADD_HEARING</option>
              <option>CREATE_CLIENT</option>
              <option>UPLOAD_DOC</option>
            </select>
          </div>
          <button className="btn btn-o btn-s" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* Audit List Card */}
      <div className="cd">
        <div className="ch">
          <div className="flex items-center gap-1.5">
            <span className="ct2">Activity Ledger ({filteredLogs.length} entries)</span>
          </div>
          <span className="chip gn inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Tamper-Resistant</span>
          </span>
        </div>
        <div className="cb" style={{ padding: 0 }}>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Event</th>
                  <th>Operating Counsel</th>
                  <th>Audit Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap text-xs text-[var(--tx2)]">
                      {log.timestamp}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: aDot(
                              log.action.includes('CREATE')
                                ? 'gn'
                                : log.action.includes('UPDATE')
                                ? 'gd'
                                : 'pr'
                            ),
                          }}
                        />
                        <span className="chip pr">{log.action}</span>
                      </div>
                    </td>
                    <td className="text-[0.82rem] font-semibold text-[var(--tx)]">
                      {log.user}
                    </td>
                    <td className="text-[0.82rem] text-[var(--tx2)]">{log.detail}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-12 text-center text-[var(--tx2)]"
                    >
                      <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p>No audit trail records found matching the criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
